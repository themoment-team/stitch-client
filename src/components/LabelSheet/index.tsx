import { LABEL_DRAWING_SIZE, LABEL_QR_SIZE, LABEL_SHEET } from "@/constants";

interface LabelSheetProps {
  /** 라벨마다 찍을 그림 (PNG data URL) */
  drawingImage: string;
  /** 다운로드 페이지 QR 코드 (PNG data URL) */
  qrCode: string;
}

const {
  columns,
  rows,
  labelWidth,
  labelHeight,
  marginTop,
  marginLeft,
  columnGap,
  rowGap,
} = LABEL_SHEET;

const LABEL_COUNT = columns * rows;

/**
 * A4 라벨지에 맞춰 인쇄되는 스티커 시트 (인쇄할 때만 보임)
 * 마지막 칸에는 그림 대신 다운로드 QR 코드를 넣고, 나머지 칸에는 그림을 하나씩 찍음
 */
const LabelSheet = ({ drawingImage, qrCode }: LabelSheetProps) => (
  <div
    className="print-target hidden bg-white print:grid"
    style={{
      width: "210mm",
      height: "297mm",
      paddingTop: `${marginTop}mm`,
      paddingLeft: `${marginLeft}mm`,
      gridTemplateColumns: `repeat(${columns}, ${labelWidth}mm)`,
      gridTemplateRows: `repeat(${rows}, ${labelHeight}mm)`,
      columnGap: `${columnGap}mm`,
      rowGap: `${rowGap}mm`,
      alignContent: "start",
    }}
  >
    {Array.from({ length: LABEL_COUNT }, (_, index) =>
      index === LABEL_COUNT - 1 ? (
        <div key={index} className="flex items-center justify-center gap-[4mm]">
          {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님 */}
          <img
            src={qrCode}
            alt=""
            className="[image-rendering:pixelated]"
            style={{ width: `${LABEL_QR_SIZE}mm`, height: `${LABEL_QR_SIZE}mm` }}
          />
          <div className="flex flex-col gap-[1.5mm] text-left text-ink">
            <span className="text-[14pt] font-black">Stitch</span>
            <span className="text-[8pt] leading-snug font-medium">
              QR 코드를 찍으면
              <br />내 그림을 저장할 수 있어요
            </span>
          </div>
        </div>
      ) : (
        <div key={index} className="flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님 */}
          <img
            src={drawingImage}
            alt=""
            className="[image-rendering:pixelated]"
            style={{ width: `${LABEL_DRAWING_SIZE}mm`, height: `${LABEL_DRAWING_SIZE}mm` }}
          />
        </div>
      ),
    )}
  </div>
);

export default LabelSheet;
