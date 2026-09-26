import type { GridSize, Pixels } from "@/types";
import { findDraftByKeyword, imageToPixels, templateToPixels } from "@/utils";

export interface DraftRequest {
  keyword: string;
  size: GridSize;
  /** AI 생성 횟수가 남아 있는지. 없으면 미리 그려 둔 도안만 사용 */
  canUseAI: boolean;
}

export interface DraftResult {
  pixels: Pixels;
  /** AI가 새로 그렸는지 (생성 횟수 차감 여부) */
  usedAI: boolean;
}

interface DraftResponse {
  image: string;
}

/** 부적절한 키워드라 AI가 그리기를 거절한 경우 */
export class DraftBlockedError extends Error {}

/** AI 생성 횟수를 모두 써서 새로 그릴 수 없는 경우 */
export class DraftLimitError extends Error {}

const requestAIDraft = async (keyword: string, size: GridSize) => {
  const response = await fetch("/api/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, size }),
  });

  if (response.status === 422) throw new DraftBlockedError();
  if (!response.ok) throw new Error(`AI 도안 생성 실패: ${response.status}`);

  const { image }: DraftResponse = await response.json();
  return imageToPixels(image, size);
};

/**
 * 키워드에 맞는 도안을 캔버스 크기의 픽셀로 반환
 * 미리 그려 둔 도안 이름이 키워드에 있으면 바로 쓰고(무료·즉시), 없으면 AI가 새로 그림
 */
export const generateDraft = async ({ keyword, size, canUseAI }: DraftRequest): Promise<DraftResult> => {
  const template = findDraftByKeyword(keyword);
  if (template) return { pixels: templateToPixels(template, size), usedAI: false };
  if (!canUseAI) throw new DraftLimitError();

  return { pixels: await requestAIDraft(keyword, size), usedAI: true };
};
