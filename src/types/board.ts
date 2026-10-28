import type { Drawing } from "./pixel";

/** 보드에 띄우는 저장된 그림. 새 그림만 이어 받을 때 createdAt(ISO 문자열)을 기준으로 씀 */
export interface BoardDrawing extends Drawing {
  id: string;
  createdAt: string;
}
