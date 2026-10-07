import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 이용 흐름(시작하기 ~ 처음으로) 한 번을 나타내는 세션
 * 화면의 AI 도안·변환 횟수를 서버에서도 세려면 같은 이용자의 요청을 묶을 값이 필요한데,
 * 부스처럼 여러 사람이 같은 기기·와이파이를 쓰면 IP로는 구분할 수 없어 서버가 서명한 쿠키로 구분함
 */
const COOKIE_NAME = "stitch_ai_session";
/** 한 번 이용하는 데 10분 안팎이라 넉넉히 1시간. 지나면 AI 요청을 받지 않음 */
const MAX_AGE_SECONDS = 60 * 60;

const getSecret = () => {
  const secret = process.env.AI_SESSION_SECRET;
  if (!secret) throw new Error("AI_SESSION_SECRET이 설정되지 않았습니다.");
  return secret;
};

const sign = (payload: string) => createHmac("sha256", getSecret()).update(payload).digest("base64url");

/** 새 세션을 만들어 쿠키에 담음. 이전 세션 쿠키가 있으면 덮어써서 횟수를 새로 셈 */
export const startAISession = async () => {
  const payload = `${randomUUID()}.${Date.now()}`;
  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api",
    maxAge: MAX_AGE_SECONDS,
  });
};

/** 서명이 맞고 만료되지 않은 세션의 id. 없거나 조작됐거나 만료됐으면 null */
export const getAISessionId = async (): Promise<string | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const [id, issuedAt, signature] = token?.split(".") ?? [];
  if (!id || !issuedAt || !signature) return null;

  try {
    const expected = Buffer.from(sign(`${id}.${issuedAt}`));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  } catch (error) {
    console.error("AI 세션을 확인하지 못했습니다.", error);
    return null;
  }

  const age = Date.now() - Number(issuedAt);
  if (!(age >= 0 && age <= MAX_AGE_SECONDS * 1000)) return null;
  return id;
};
