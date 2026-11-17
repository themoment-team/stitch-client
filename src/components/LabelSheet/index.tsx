import { createPortal } from "react-dom";
import { LABEL_DRAWING_SIZE, LABEL_QR_SIZE, LABEL_SHEET, PAPER_SIZE } from "@/constants";
import type { LabelLayout } from "@/types";
import { getLabelPositions } from "@/utils";

interface LabelSheetProps {
  /** 라벨마다 찍을 그림 (PNG data URL) */
  drawingImage: string;
  /** 다운로드 페이지 QR 코드 (PNG data URL) */
  qrCode: string;
  layout: LabelLayout;
}

const { labelWidth, labelHeight } = LABEL_SHEET;

/**
 * A4 한 장에 여러 개 찍히는 스티커 시트 (인쇄할 때만 보임)
 * 마지막 칸에는 그림 대신 다운로드 QR 코드를 넣고, 나머지 칸에는 그림을 하나씩 찍음
 * 가운데 열 간격만 따로 맞출 수 있도록 칸마다 위치를 mm로 계산해 놓음
 * 화면 내용과 상관없이 늘 같은 위치에 찍히도록 body 바로 아래에 그리고, 인쇄할 때 나머지를 globals.css에서 아예 뺌
 */
const LabelSheet = ({ drawingImage, qrCode, layout }: LabelSheetProps) => {
  const positions = getLabelPositions(layout);

  return createPortal(
    <div
      className="print-target hidden overflow-hidden bg-white print:block"
      style={{ width: `${PAPER_SIZE.width}mm`, height: `${PAPER_SIZE.height}mm` }}
    >
      {positions.map(({ left, top }, index) => (
        <div
          key={index}
          className="absolute"
          style={{ left: `${left}mm`, top: `${top}mm`, width: `${labelWidth}mm`, height: `${labelHeight}mm` }}
        >
          {index === positions.length - 1 ? (
            <div className="flex size-full flex-col items-center justify-center gap-[1mm]">
              {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님 */}
              <img
                src={qrCode}
                alt=""
                className="[image-rendering:pixelated]"
                style={{ width: `${LABEL_QR_SIZE}mm`, height: `${LABEL_QR_SIZE}mm` }}
              />
              <div className="flex flex-col items-center gap-[0.5mm] text-center text-ink">
                <span className="text-[7pt] leading-none font-black">Stitch</span>
                <span className="text-[5pt] leading-tight font-medium">QR 코드를 찍으면 내 그림을 저장할 수 있어요</span>
              </div>
            </div>
          ) : (
            <div className="flex size-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님 */}
              <img
                src={drawingImage}
                alt=""
                className="[image-rendering:pixelated]"
                style={{ width: `${LABEL_DRAWING_SIZE}mm`, height: `${LABEL_DRAWING_SIZE}mm` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
};

export default LabelSheet;
