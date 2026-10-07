export const GRID_SIZE = {
  SMALL: 16,
  LARGE: 32,
} as const;

export type GridSize = (typeof GRID_SIZE)[keyof typeof GRID_SIZE];

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
