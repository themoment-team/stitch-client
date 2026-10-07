import { createHash } from "node:crypto";
import {
  AI_CONVERT_LIMIT,
  AI_DRAFT_LIMIT,
  AI_TRUSTED_IP_LIMIT,
  RATE_LIMIT,
  type RateLimitScope,
} from "@/constants";
import { getAISessionId } from "./aiSession";
import { getSupabase } from "./supabase";

/**
 * 요청한 사람의 IP. Vercel은 이 헤더를 직접 덮어써서 클라이언트가 조작할 수 없음
 * 로컬 개발처럼 헤더가 없으면 모두 한 사람으로 셈
 */
const getClientIP = (request: Request) =>
  request.headers.get("x-real-ip") ??
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
  "unknown";

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

export type AIRequestKind = "draft" | "convert";

/** 화면에 보여주는 이용자 한 명(세션)의 AI 횟수와 같게 서버에서도 제한 */
const AI_SESSION_LIMIT: Record<AIRequestKind, number> = {
  draft: AI_DRAFT_LIMIT,
  convert: AI_CONVERT_LIMIT,
};

/** consume_ai_quota 결과. ok가 아니면 어느 한도에 걸렸는지 */
type AIQuotaResult = "ok" | "session" | "ip" | "total";

const getSessionKey = (kind: AIRequestKind, sessionId: string) => `${sessionId}:${kind}`;

/** 부스처럼 여러 이용자가 함께 쓰는 공인 IP 목록 (환경변수 AI_TRUSTED_IPS, 쉼표로 구분) */
const getTrustedIPs = () =>
  new Set(
    (process.env.AI_TRUSTED_IPS ?? "")
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean),
  );

/** 등록한 부스 IP면 높은 한도, 아니면 기본 IP별 한도 */
const getAIIPLimit = (ip: string) =>
  getTrustedIPs().has(ip) ? AI_TRUSTED_IP_LIMIT : RATE_LIMIT.ai.perIP;

/** 세션별·IP별·전체 한도를 한 번에 확인하고, 모두 남아 있을 때만 1회씩 차감 */
const consumeAIQuota = async (
  kind: AIRequestKind,
  sessionId: string,
  request: Request,
): Promise<AIQuotaResult | null> => {
  const ip = getClientIP(request);
  try {
    const { data, error } = await getSupabase().rpc("consume_ai_quota", {
      p_session_key: getSessionKey(kind, sessionId),
      p_session_limit: AI_SESSION_LIMIT[kind],
      p_ip_key: hashIP(ip),
      p_ip_limit: getAIIPLimit(ip),
      p_total_limit: RATE_LIMIT.ai.total,
    });
    if (error) throw error;
    return data as AIQuotaResult;
  } catch (error) {
    console.error("AI 요청 한도를 확인하지 못했습니다.", error);
    return null;
  }
};

/**
 * 화면은 AI 요청이 성공했을 때만 횟수를 줄이므로, 실패하면 세션 횟수만 되돌려 화면과 맞춤
 * IP별·전체 횟수는 실패한 요청을 반복해 부하를 주지 못하도록 되돌리지 않음
 */
const refundAISessionQuota = async (kind: AIRequestKind, sessionId: string) => {
  // 되돌리기에 실패해도 원래 실패 응답(422·502)이 그대로 나가야 화면이 알맞은 안내를 보여줌
  try {
    const { error } = await getSupabase().rpc("refund_ai_session_quota", {
      p_session_key: getSessionKey(kind, sessionId),
    });
    if (error) throw error;
  } catch (error) {
    console.error("AI 세션 횟수를 되돌리지 못했습니다.", error);
  }
};

/**
 * AI 이미지 요청을 한도 안에서만 실행
 * - 시작하기에서 발급한 세션이 없거나 만료되면 401
 * - 세션별·IP별·전체 한도 중 하나라도 찼거나 횟수를 확인할 수 없으면 429
 */
export const runWithAIQuota = async (
  kind: AIRequestKind,
  request: Request,
  run: () => Promise<Response>,
): Promise<Response> => {
  const sessionId = await getAISessionId();
  if (!sessionId) {
    return Response.json({ message: "처음 화면에서 다시 시작해주세요." }, { status: 401 });
  }

  const result = await consumeAIQuota(kind, sessionId, request);
  // 전체 한도가 차면 모든 이용자가 AI를 쓸 수 없으므로 로그로 남겨 운영자가 확인할 수 있게 함
  if (result === "total") console.warn(`AI 전체 하루 한도(${RATE_LIMIT.ai.total}회)를 모두 썼습니다.`);
  if (result !== "ok") return tooManyRequests();

  const response = await run();
  if (!response.ok) await refundAISessionQuota(kind, sessionId);
  return response;
};
