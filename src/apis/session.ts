/**
 * 새 이용 흐름의 세션을 서버에서 발급받음 (쿠키로 저장되어 AI 요청에 함께 전송됨)
 * 서버가 AI 도안·변환 횟수를 이 세션 단위로 셈
 */
export const startSession = async () => {
  const response = await fetch("/api/session", { method: "POST" });
  if (!response.ok) throw new Error(`세션 시작 실패: ${response.status}`);
};

/**
 * AI 요청을 보내고, 세션이 없거나 만료돼 401을 받으면 세션을 새로 받아 한 번만 다시 보냄
 * 시작할 때 세션을 받지 못했거나 1시간이 지난 경우에도 처음부터 다시 하지 않고 AI를 쓸 수 있게 함
 * (세션은 원래 누구나 새로 받을 수 있어 우회 경로가 늘지 않고, 남용은 IP별·전체 한도가 막음)
 */
export const fetchWithSession = async (input: string, init: RequestInit) => {
  const response = await fetch(input, init);
  if (response.status !== 401) return response;

  try {
    await startSession();
  } catch {
    return response;
  }
  return fetch(input, init);
};
