import { useReducer } from "react";
import { HISTORY_LIMIT } from "@/constants";
import type { Drawing, GridSize } from "@/types";
import { createEmptyPixels, isEmptyPixels } from "@/utils";

interface DrawingState {
  current: Drawing;
  history: Drawing[];
  /** 진행 중인 획이 시작되기 직전의 그림 */
  strokeBase: Drawing | null;
}

type DrawingAction =
  | { type: "STROKE_START" }
  | { type: "PAINT"; indices: number[]; color: string | null }
  | { type: "STROKE_END" }
  | { type: "UNDO" }
  | { type: "RESET" }
  | { type: "RESIZE"; size: GridSize };

const pushHistory = (history: Drawing[], drawing: Drawing) =>
  [...history, drawing].slice(-HISTORY_LIMIT);

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

    case "UNDO": {
      const previous = state.history.at(-1);
      if (!previous) return state;
      return { current: previous, history: state.history.slice(0, -1), strokeBase: null };
    }

    case "RESET":
      if (isEmptyPixels(state.current.pixels)) return state;
      return {
        current: { ...state.current, pixels: createEmptyPixels(state.current.size) },
        history: pushHistory(state.history, state.current),
        strokeBase: null,
      };

    case "RESIZE":
      if (action.size === state.current.size) return state;
      return {
        current: { size: action.size, pixels: createEmptyPixels(action.size) },
        history: pushHistory(state.history, state.current),
        strokeBase: null,
      };
  }
};

const createInitialState = (drawing: Drawing): DrawingState => ({
  current: drawing,
  history: [],
  strokeBase: null,
});

export const useDrawingHistory = (initialDrawing: Drawing) => {
  const [state, dispatch] = useReducer(drawingReducer, initialDrawing, createInitialState);

  return {
    drawing: state.current,
    canUndo: state.history.length > 0,
    startStroke: () => dispatch({ type: "STROKE_START" }),
    paint: (indices: number[], color: string | null) => dispatch({ type: "PAINT", indices, color }),
    endStroke: () => dispatch({ type: "STROKE_END" }),
    undo: () => dispatch({ type: "UNDO" }),
    reset: () => dispatch({ type: "RESET" }),
    resize: (size: GridSize) => dispatch({ type: "RESIZE", size }),
  };
};
