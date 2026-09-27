import { createHash } from "node:crypto";
import { RATE_LIMIT, type RateLimitScope } from "@/constants";
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
