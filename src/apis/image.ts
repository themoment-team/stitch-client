import type { GridSize, Pixels } from "@/types";
import { photoToPixels } from "@/utils";
import { ImageTooLargeError, ImageUnsupportedError, RateLimitError } from "./errors";

/** 업로드·붙여넣기한 파일이나, 검색 창에서 끌어다 놓은 이미지 주소 */
export type ImageSource = Blob | string;

const DATA_IMAGE_PREFIX = "data:image/";

/** 다른 사이트의 이미지는 캔버스에서 읽을 수 없으므로 서버를 거쳐 받아옴 */
const fetchRemoteImage = async (url: string) => {
  const response = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (response.status === 413) throw new ImageTooLargeError();
  if (response.status === 429) throw new RateLimitError();
  if (response.status === 400 || response.status === 415) throw new ImageUnsupportedError();
  if (!response.ok) throw new Error(`이미지 요청 실패: ${response.status}`);
  return response.blob();
};

const toPixels = async (src: string, size: GridSize) => {
  try {
    return await photoToPixels(src, size);
  } catch {
    // 이미지라고 해도 깨졌거나 브라우저가 읽지 못하는 형식이면 그릴 수 없음
    throw new ImageUnsupportedError();
  }
};

/** 이미지를 캔버스 크기의 도트 그림으로 변환. 서버를 거쳐야 하는 주소만 요청 한도를 씀 */
export const convertImageToPixels = async (source: ImageSource, size: GridSize): Promise<Pixels> => {
  // 구글 이미지 검색 결과의 앞쪽 썸네일은 주소가 아니라 data URL로 들어 있어 바로 그림
  if (typeof source === "string" && source.startsWith(DATA_IMAGE_PREFIX)) return toPixels(source, size);

  const blob = typeof source === "string" ? await fetchRemoteImage(source) : source;
  if (!blob.type.startsWith("image/")) throw new ImageUnsupportedError();

  const objectUrl = URL.createObjectURL(blob);
  try {
    return await toPixels(objectUrl, size);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
