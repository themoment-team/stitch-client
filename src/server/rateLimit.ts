import { createHash } from "node:crypto";
import { RATE_LIMIT, type RateLimitScope } from "@/constants";
import { getSupabase } from "./supabase";

/** IP를 알 수 없는 요청은 모두 한 사람으로 셈. 한도가 빡빡해질 뿐 우회되지는 않음 */
const UNKNOWN_IP = "unknown";

/**
 * 요청한 사람의 IP. 신뢰할 프록시가 직접 채운 헤더만 쓰고, 클라이언트가 보낸 헤더는 믿지 않음
 * - Vercel: x-vercel-forwarded-for를 Vercel이 직접 덮어써서 조작할 수 없음
 *   (x-forwarded-for·x-real-ip는 Vercel 앞에 다른 프록시를 두면 바뀔 수 있어 쓰지 않음)
 * - 그 밖의 배포: TRUSTED_IP_HEADER에 앞단 프록시가 채우는 헤더 이름을 넣음
 *   프록시는 받은 값 뒤에 IP를 덧붙이므로, 클라이언트가 앞에 끼워 넣은 값을 피하려고 마지막 값을 씀
 * - 둘 다 아니면(로컬 개발, 프록시 없이 서버 직접 노출) 헤더를 무시하고 모두 한 사람으로 셈
 *   Next 서버는 x-forwarded-for가 이미 있으면 소켓 IP로 덮어쓰지 않아 클라이언트가 값을 정할 수 있기 때문
 */
const getClientIP = (request: Request) => {
  if (process.env.VERCEL) {
    return request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || UNKNOWN_IP;
  }

  const trustedHeader = process.env.TRUSTED_IP_HEADER?.trim();
  if (trustedHeader) {
    return request.headers.get(trustedHeader)?.split(",").at(-1)?.trim() || UNKNOWN_IP;
  }

  return UNKNOWN_IP;
};

// IP를 그대로 저장하지 않도록 해시값만 기록
const hashIP = (ip: string) => createHash("sha256").update(ip).digest("hex").slice(0, 32);

/**
 * 오늘 한도가 남아 있으면 1회 차감하고 true, IP별 또는 전체 한도가 찼으면 false
 * 횟수를 확인할 수 없으면 비용이 무제한으로 나가지 않도록 막는 쪽(false)으로 처리
 */
export const consumeQuota = async (scope: RateLimitScope, request: Request): Promise<boolean> => {
  const { perIP, total } = RATE_LIMIT[scope];
  try {
    const { data, error } = await getSupabase().rpc("consume_api_quota", {
      p_scope: scope,
      p_key: hashIP(getClientIP(request)),
      p_key_limit: perIP,
      p_total_limit: total,
    });
    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error("API 요청 한도를 확인하지 못했습니다.", error);
    return false;
  }
};

export const tooManyRequests = () =>
  Response.json({ message: "오늘 사용할 수 있는 횟수를 모두 썼습니다." }, { status: 429 });
