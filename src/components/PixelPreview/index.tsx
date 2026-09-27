import { useEffect, useRef } from "react";
import type { Drawing } from "@/types";

interface PixelPreviewProps {
  drawing: Drawing;
  label: string;
}

/** 16·32 모두 정수 배율로 나눠떨어져 칸 경계가 번지지 않는 해상도 */
const RESOLUTION = 320;

/** 픽셀 그림을 보여주기만 하는 읽기 전용 캔버스 */
const PixelPreview = ({ drawing, label }: PixelPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { size, pixels } = drawing;

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    const cellSize = RESOLUTION / size;
    context.clearRect(0, 0, RESOLUTION, RESOLUTION);
    pixels.forEach((color, index) => {
      if (!color) return;
      context.fillStyle = color;
      context.fillRect((index % size) * cellSize, Math.floor(index / size) * cellSize, cellSize, cellSize);
    });
  }, [size, pixels]);

  return (
    <canvas
      ref={canvasRef}
      width={RESOLUTION}
      height={RESOLUTION}
      role="img"
      aria-label={label}
      className="aspect-square w-full rounded-2xl bg-white [image-rendering:pixelated]"
    />
  );
};

export default PixelPreview;
