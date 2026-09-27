import { AIBlockedError, RateLimitError } from "./errors";

interface ImageResponse {
  image: string;
}

/** AI 이미지 API 응답에서 이미지(data URL)를 꺼냄. 거절되면 AIBlockedError, 한도를 넘으면 RateLimitError */
export const readImageResponse = async (response: Response) => {
  if (response.status === 422) throw new AIBlockedError();
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) throw new Error(`AI 이미지 요청 실패: ${response.status}`);

  const { image }: ImageResponse = await response.json();
  return image;
};
