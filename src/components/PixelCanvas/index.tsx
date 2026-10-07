import { useEffect, useRef, useState } from "react";
import type { Drawing, Pixels } from "@/types";
import { type Cell, getLineCells } from "@/utils";

interface PixelCanvasProps {
  drawing: Drawing;
  /** 따라 그릴 수 있게 연하게 깔아 두는 도안. 그림(drawing)에는 포함되지 않음 */
  guide?: Pixels | null;
  disabled?: boolean;
  onStrokeStart: () => void;
  onPaint: (indices: number[]) => void;
  onStrokeEnd: () => void;
  /** 지정하면 획 대신 누른 칸에서 채우기만 함 */
  onFill?: (index: number) => void;
}

const DEFAULT_RESOLUTION = 640;
const GRID_LINE_COLOR = "rgba(34, 34, 34, 0.08)";
const GUIDE_OPACITY = 0.3;

const PixelCanvas = ({
  drawing,
  guide = null,
  disabled = false,
  onStrokeStart,
  onPaint,
  onStrokeEnd,
  onFill,
}: PixelCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 그리는 중인 포인터. 펜슬로 그리는 중 손바닥 터치 같은 다른 입력은 무시
  const activePointerIdRef = useRef<number | null>(null);
  const lastCellRef = useRef<Cell | null>(null);
  // 캔버스 해상도를 실제 표시 크기 × 기기 픽셀 비율에 맞춰 격자선이 선명하게 보이도록 함
  const [resolution, setResolution] = useState(DEFAULT_RESOLUTION);
  const { size, pixels } = drawing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      setResolution(Math.round(entry.contentRect.width * window.devicePixelRatio));
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    // 칸 경계를 정수 픽셀로 맞춰 칸 사이 틈이나 번짐이 없도록 함
    const edge = (line: number) => Math.round((line * resolution) / size);
    const fillCells = (cells: Pixels) =>
      cells.forEach((color, index) => {
        if (!color) return;
        const x = index % size;
        const y = Math.floor(index / size);
        context.fillStyle = color;
        context.fillRect(edge(x), edge(y), edge(x + 1) - edge(x), edge(y + 1) - edge(y));
      });

    context.clearRect(0, 0, resolution, resolution);

    // 도안은 연하게 먼저 깔고, 그 위에 사용자가 그린 픽셀을 진하게 덮음
    if (guide) {
      context.globalAlpha = GUIDE_OPACITY;
      fillCells(guide);
      context.globalAlpha = 1;
    }
    fillCells(pixels);

    const lineWidth = Math.max(1, Math.floor(window.devicePixelRatio));
    context.fillStyle = GRID_LINE_COLOR;
    for (let line = 1; line < size; line++) {
      context.fillRect(edge(line), 0, lineWidth, resolution);
      context.fillRect(0, edge(line), resolution, lineWidth);
    }
  }, [size, pixels, guide, resolution]);

  const toIndex = ({ x, y }: Cell) => y * size + x;

  /** 포인터 위치의 칸. 캔버스 밖이면 null */
  const getCell = (event: React.PointerEvent<HTMLCanvasElement>): Cell | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * size);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * size);
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    return { x, y };
  };

  const endStroke = () => {
    if (activePointerIdRef.current === null) return;
    activePointerIdRef.current = null;
    lastCellRef.current = null;
    onStrokeEnd();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const cell = getCell(event);
    if (disabled || !cell || activePointerIdRef.current !== null) return;

    if (onFill) {
      onFill(toIndex(cell));
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerIdRef.current = event.pointerId;
    lastCellRef.current = cell;
    onStrokeStart();
    onPaint([toIndex(cell)]);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerId !== activePointerIdRef.current) return;
    if (disabled) {
      endStroke();
      return;
    }

    const cell = getCell(event);
    const lastCell = lastCellRef.current;
    lastCellRef.current = cell;
    if (!cell) return;

    // 캔버스 밖에 나갔다 들어온 경우 들어온 칸부터 다시 칠함
    const cells = lastCell ? getLineCells(lastCell, cell) : [cell];
    onPaint(cells.map(toIndex));
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerId === activePointerIdRef.current) endStroke();
  };

  return (
    <canvas
      ref={canvasRef}
      width={resolution}
      height={resolution}
      className={`aspect-square w-full touch-none rounded-2xl bg-white select-none [-webkit-touch-callout:none] ${disabled ? "cursor-not-allowed" : onFill ? "cursor-cell" : "cursor-crosshair"}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      aria-label={`${size}×${size} 픽셀 그림판`}
    />
  );
};

export default PixelCanvas;
