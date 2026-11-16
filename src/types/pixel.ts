/** 고를 수 있는 캔버스 크기(한 변의 칸 수) */
export const GRID_SIZES = [16, 20, 32, 40, 60, 64] as const;

export type GridSize = (typeof GRID_SIZES)[number];

/** 그림판을 처음 열 때의 캔버스 크기 */
export const DEFAULT_GRID_SIZE: GridSize = 16;

export const DRAW_TOOL = {
  PEN: "PEN",
  ERASER: "ERASER",
  FILL: "FILL",
} as const;

export type DrawTool = (typeof DRAW_TOOL)[keyof typeof DRAW_TOOL];

/** 칸마다 색상(hex)을 담고, 비어 있는 칸은 null */
export type Pixels = (string | null)[];

export interface Drawing {
  size: GridSize;
  pixels: Pixels;
}
