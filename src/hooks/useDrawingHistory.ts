import { useReducer } from "react";
import { HISTORY_LIMIT } from "@/constants";
import type { Drawing, GridSize, Pixels } from "@/types";
import { createEmptyPixels, getFillIndices, isEmptyPixels } from "@/utils";

interface DrawingState {
  current: Drawing;
  history: Drawing[];
  /** 진행 중인 획이 시작되기 직전의 그림 */
  strokeBase: Drawing | null;
  /** 지금 보고 있지 않은 크기의 캔버스에 그려 둔 그림. 크기를 다시 바꾸면 이어서 그릴 수 있도록 보관 */
  stashed: Partial<Record<GridSize, Pixels>>;
}

type DrawingAction =
  | { type: "STROKE_START" }
  | { type: "PAINT"; indices: number[]; color: string | null }
  | { type: "STROKE_END" }
  | { type: "FILL"; index: number; color: string }
  | { type: "UNDO" }
  | { type: "RESET" }
  | { type: "RESIZE"; size: GridSize };

const pushHistory = (history: Drawing[], drawing: Drawing) =>
  [...history, drawing].slice(-HISTORY_LIMIT);

/** 다른 크기로 넘어가기 전에 지금 그림을 보관 */
const stashCurrent = (state: DrawingState) => ({
  ...state.stashed,
  [state.current.size]: state.current.pixels,
});

const drawingReducer = (state: DrawingState, action: DrawingAction): DrawingState => {
  switch (action.type) {
    case "STROKE_START":
      return { ...state, strokeBase: state.current };

    case "PAINT": {
      const { pixels } = state.current;
      if (action.indices.every((index) => pixels[index] === action.color)) return state;

      const nextPixels = [...pixels];
      action.indices.forEach((index) => {
        nextPixels[index] = action.color;
      });
      return { ...state, current: { ...state.current, pixels: nextPixels } };
    }

    case "STROKE_END": {
      const { strokeBase } = state;
      // 칠해진 칸이 없는 획은 되돌리기 기록에 남기지 않음
      if (!strokeBase || strokeBase === state.current) return { ...state, strokeBase: null };
      return { ...state, history: pushHistory(state.history, strokeBase), strokeBase: null };
    }

    case "FILL": {
      const { size, pixels } = state.current;
      // 이미 같은 색인 영역은 그림도 되돌리기 기록도 바꾸지 않음
      if (pixels[action.index] === action.color) return state;

      const nextPixels = [...pixels];
      getFillIndices(pixels, size, action.index).forEach((index) => {
        nextPixels[index] = action.color;
      });
      return {
        ...state,
        current: { ...state.current, pixels: nextPixels },
        history: pushHistory(state.history, state.current),
        strokeBase: null,
      };
    }

    case "UNDO": {
      const previous = state.history.at(-1);
      if (!previous) return state;
      return {
        current: previous,
        history: state.history.slice(0, -1),
        strokeBase: null,
        // 크기 변경을 되돌릴 때도 바뀐 크기에서 그린 그림을 보관해 둠
        stashed: previous.size === state.current.size ? state.stashed : stashCurrent(state),
      };
    }

    case "RESET":
      if (isEmptyPixels(state.current.pixels)) return state;
      return {
        ...state,
        current: { ...state.current, pixels: createEmptyPixels(state.current.size) },
        history: pushHistory(state.history, state.current),
        strokeBase: null,
      };

    case "RESIZE":
      if (action.size === state.current.size) return state;
      return {
        // 이 크기에서 그려 둔 그림이 있으면 다시 꺼내 보여줌
        current: {
          size: action.size,
          pixels: state.stashed[action.size] ?? createEmptyPixels(action.size),
        },
        history: pushHistory(state.history, state.current),
        strokeBase: null,
        stashed: stashCurrent(state),
      };
  }
};

const createInitialState = (drawing: Drawing): DrawingState => ({
  current: drawing,
  history: [],
  strokeBase: null,
  stashed: {},
});

export const useDrawingHistory = (initialDrawing: Drawing) => {
  const [state, dispatch] = useReducer(drawingReducer, initialDrawing, createInitialState);

  return {
    drawing: state.current,
    canUndo: state.history.length > 0,
    startStroke: () => dispatch({ type: "STROKE_START" }),
    paint: (indices: number[], color: string | null) => dispatch({ type: "PAINT", indices, color }),
    endStroke: () => dispatch({ type: "STROKE_END" }),
    fill: (index: number, color: string) => dispatch({ type: "FILL", index, color }),
    undo: () => dispatch({ type: "UNDO" }),
    reset: () => dispatch({ type: "RESET" }),
    resize: (size: GridSize) => dispatch({ type: "RESIZE", size }),
  };
};
