import { lookup } from "node:dns";
import http, { type IncomingMessage } from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { IMAGE_MAX_BYTES } from "@/constants";

const TIMEOUT_MS = 10_000;
/** 이미지 호스팅은 단축 주소·CDN을 거쳐 한두 번 옮겨가기도 해서 몇 번까지는 따라감 */
const MAX_REDIRECTS = 3;
/** 브라우저가 그릴 수 있는 비트맵 형식만 받음 (SVG·HTML 등은 이미지라고 해도 거절) */
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif", "image/bmp"]);

/**
 * 서버가 대신 받아오는 기능이 내부망(사설 IP, 클라우드 메타데이터 주소 등)을 들여다보는 통로가 되지 않도록
 * 공개 인터넷이 아닌 주소 대역을 막음
 */
const BLOCKED_ADDRESSES = new BlockList();
(
  [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["224.0.0.0", 3],
  ] as const
).forEach(([address, prefix]) => BLOCKED_ADDRESSES.addSubnet(address, prefix, "ipv4"));
(
  [
    ["::", 128],
    ["::1", 128],
    // ::ffff:127.0.0.1처럼 IPv4를 감싼 주소는 BlockList가 위 IPv4 대역으로 함께 확인함
    // NAT64(64:ff9b::)는 IPv4 대역으로 확인되지 않아 내부 IPv4로 나가는 통로가 될 수 있으므로 통째로 막음
    ["64:ff9b::", 96],
    ["fc00::", 7],
    ["fe80::", 10],
    ["ff00::", 8],
  ] as const
).forEach(([address, prefix]) => BLOCKED_ADDRESSES.addSubnet(address, prefix, "ipv6"));

const isBlockedAddress = (address: string) => {
  const family = isIP(address);
  if (family === 0) return true;
  return BLOCKED_ADDRESSES.check(address, family === 4 ? "ipv4" : "ipv6");
};

/** 받아올 수 없는 이미지. status는 클라이언트에 그대로 돌려줄 HTTP 상태 */
export class RemoteImageError extends Error {
  constructor(
    readonly status: 400 | 413 | 415 | 502,
    message: string,
  ) {
    super(message);
  }
}

/**
 * 실제로 접속할 IP를 확인한 뒤 연결함
 * 미리 한 번 조회해 확인하고 따로 접속하면, 그 사이 DNS 응답을 내부 IP로 바꿔치기하는 공격(DNS rebinding)을 막을 수 없음
 */
const safeLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { family: options.family, hints: options.hints, all: true }, (error, addresses) => {
    if (error) return callback(error, "");
    if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
      return callback(new RemoteImageError(400, "접근할 수 없는 주소입니다."), "");
    }
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
};

const parseUrl = (value: string, base?: URL) => {
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    throw new RemoteImageError(400, "이미지 주소가 올바르지 않습니다.");
  }

  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
    throw new RemoteImageError(400, "이미지 주소가 올바르지 않습니다.");
  }
  // 웹 서버가 아닌 내부 서비스(DB, 관리 포트 등)에 접속하지 못하도록 기본 포트만 허용
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new RemoteImageError(400, "접근할 수 없는 주소입니다.");
  }
  // IP를 직접 적은 주소는 DNS 조회(safeLookup)를 거치지 않으므로 여기서 확인
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && isBlockedAddress(host)) {
    throw new RemoteImageError(400, "접근할 수 없는 주소입니다.");
  }
  return url;
};

/** User-Agent가 없는 요청은 위키미디어처럼 거절하는 이미지 호스팅이 많아서 붙임 */
const REQUEST_HEADERS = {
  Accept: [...ALLOWED_TYPES].join(", "),
  "User-Agent": "Mozilla/5.0 (compatible; StitchImageFetcher/1.0)",
};

const request = (url: URL, signal: AbortSignal) =>
  new Promise<IncomingMessage>((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    client.get(url, { lookup: safeLookup, signal, headers: REQUEST_HEADERS }, resolve).on("error", reject);
  });

const readBody = async (response: IncomingMessage) => {
  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  for await (const chunk of response as AsyncIterable<Buffer>) {
    receivedBytes += chunk.byteLength;
    // Content-Length는 생략하거나 속일 수 있으므로 실제로 받은 바이트로도 확인하고, 넘으면 바로 끊음
    if (receivedBytes > IMAGE_MAX_BYTES) {
      response.destroy();
      throw new RemoteImageError(413, "이미지가 너무 큽니다.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

/** 외부 주소의 이미지를 받아 형식과 내용을 반환. 받아올 수 없으면 RemoteImageError */
export const fetchRemoteImage = async (value: string): Promise<{ type: string; body: Buffer }> => {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let url = parseUrl(value);

  try {
    for (let redirects = 0; ; redirects++) {
      const response = await request(url, signal);
      const { statusCode = 0, headers } = response;

      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        response.resume();
        if (redirects >= MAX_REDIRECTS) throw new RemoteImageError(502, "이미지를 받아오지 못했습니다.");
        // 옮겨간 주소도 처음 주소와 똑같이 확인
        url = parseUrl(headers.location, url);
        continue;
      }
      if (statusCode !== 200) {
        response.resume();
        throw new RemoteImageError(502, "이미지를 받아오지 못했습니다.");
      }

      const type = headers["content-type"]?.split(";")[0].trim().toLowerCase() ?? "";
      if (!ALLOWED_TYPES.has(type)) {
        response.resume();
        throw new RemoteImageError(415, "이미지가 아닌 주소입니다.");
      }
      if (Number(headers["content-length"]) > IMAGE_MAX_BYTES) {
        response.destroy();
        throw new RemoteImageError(413, "이미지가 너무 큽니다.");
      }

      return { type, body: await readBody(response) };
    }
  } catch (error) {
    if (error instanceof RemoteImageError) throw error;
    console.error("외부 이미지를 받아오지 못했습니다.", error);
    throw new RemoteImageError(502, "이미지를 받아오지 못했습니다.");
  }
};
