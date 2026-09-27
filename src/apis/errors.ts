/** 부적절한 내용이라 AI가 이미지 생성을 거절한 경우 */
export class AIBlockedError extends Error {}

/** 서버의 하루 요청 한도를 모두 쓴 경우 */
export class RateLimitError extends Error {}
