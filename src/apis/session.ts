/**
 * 새 이용 흐름의 세션을 서버에서 발급받음 (쿠키로 저장되어 AI 요청에 함께 전송됨)
 * 서버가 AI 도안·변환 횟수를 이 세션 단위로 셈
 */
export const startSession = async () => {
  const response = await fetch("/api/session", { method: "POST" });
  if (!response.ok) throw new Error(`세션 시작 실패: ${response.status}`);
};
