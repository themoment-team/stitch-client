import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveDrawing } from "@/apis";
import { Icon, PixelPreview, StepButton, StepCard, StepLabel } from "@/components";
import { PRIMARY_BUTTON_STYLES, SECONDARY_BUTTON_STYLES } from "@/constants";
import type { Drawing } from "@/types";
import { drawingToPngDataUrl } from "@/utils";

interface PrintPageProps {
  /** AI 변환 단계에서 고른 최종 그림 */
  drawing: Drawing;
  /** 이미 저장해 둔 같은 그림의 id. 이전으로 갔다 와도 다시 저장하지 않도록 페이지에서 관리 */
  savedId: string | null;
  onSaved: (id: string) => void;
  onBack: () => void;
  /** 다음 사람이 처음부터 시작할 수 있도록 모든 상태를 초기화 */
  onRestart: () => void;
}

type SaveStatus = "saving" | "saved" | "error";

const QR_OPTIONS = { margin: 1, width: 512 };

const PrintPage = ({ drawing, savedId, onSaved, onBack, onRestart }: PrintPageProps) => {
  const [id, setId] = useState(savedId);
  const [status, setStatus] = useState<SaveStatus>(savedId ? "saved" : "saving");
  const [qrCode, setQRCode] = useState<string | null>(null);
  // 개발 모드에서 effect가 두 번 실행되거나 다시 시도를 연달아 눌러도 한 번만 저장되도록 막음
  const isSavingRef = useRef(false);

  // 인쇄물에는 캔버스 대신 이미지로 넣어야 브라우저마다 픽셀이 번지지 않고 그대로 찍힘
  const drawingImage = useMemo(() => drawingToPngDataUrl(drawing), [drawing]);

  const save = () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    saveDrawing(drawing)
      .then((newId) => {
        setId(newId);
        onSaved(newId);
        setStatus("saved");
      })
      .catch(() => setStatus("error"))
      .finally(() => {
        isSavingRef.current = false;
      });
  };

  const handleRetry = () => {
    setStatus("saving");
    save();
  };

  useEffect(() => {
    if (!savedId) save();
    // 처음 들어왔을 때 한 번만 저장
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!id) return;
    const shareUrl = `${window.location.origin}/share/${id}`;
    QRCode.toDataURL(shareUrl, QR_OPTIONS)
      .then(setQRCode)
      .catch(() => setStatus("error"));
  }, [id]);

  const canPrint = status === "saved" && qrCode !== null;

  return (
    <>
      <StepCard size="wide">
        <header className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className="justify-self-start">
            <StepButton variant="back" onClick={onBack} disabled={status === "saving"}>
              이전
            </StepButton>
          </div>
          <div className="flex flex-col items-center gap-1">
            <StepLabel current={4} />
            <h1 className="text-lg font-bold tracking-tight whitespace-nowrap text-ink max-[359px]:text-[0.9375rem] sm:text-2xl">
              스티커가 완성됐어요
            </h1>
          </div>
          <div />
        </header>

        <p className="text-sm font-medium text-muted sm:text-base">
          인쇄물의 QR 코드를 찍으면 그림을 휴대폰에 저장할 수 있어요.
        </p>

        <div className="grid w-full max-w-3xl items-center gap-6 sm:grid-cols-[minmax(0,1fr)_14rem] sm:gap-8">
          <div className="rounded-3xl bg-background p-3 shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)] sm:p-4">
            <PixelPreview drawing={drawing} label="완성한 그림" />
          </div>

          <div className="mx-auto flex w-full max-w-56 flex-col items-center gap-3">
            <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-white p-3 shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]">
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님
                <img src={qrCode} alt="그림 다운로드 QR 코드" className="size-full [image-rendering:pixelated]" />
              ) : (
                <span
                  role={status === "saving" ? "status" : undefined}
                  className="px-2 text-center text-xs font-medium text-subtle sm:text-sm"
                >
                  {status === "error" ? "QR 코드를 만들지 못했어요" : "QR 코드를 만드는 중이에요"}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-subtle">다운로드 QR 코드</span>
          </div>
        </div>

        <div className="flex w-full max-w-3xl flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => window.print()} disabled={!canPrint} className={PRIMARY_BUTTON_STYLES}>
              <Icon name="printer" className="size-4" />
              인쇄하기
            </button>
            {status === "error" && (
              <button type="button" onClick={handleRetry} className={SECONDARY_BUTTON_STYLES}>
                <Icon name="reset" className="size-4" />
                다시 시도
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              disabled={status === "saving"}
              className={SECONDARY_BUTTON_STYLES}
            >
              처음으로
            </button>
          </div>
          {status === "error" && (
            <p className="text-xs font-medium text-danger" role="alert">
              그림을 저장하지 못했어요. 다시 시도해주세요.
            </p>
          )}
        </div>
      </StepCard>

      {/* 인쇄할 때만 보이는 출력물. 화면의 나머지는 globals.css의 인쇄 스타일에서 숨김 */}
      {canPrint && (
        <div className="print-target hidden flex-col items-center gap-[12mm] pt-[30mm] print:flex">
          {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님 */}
          <img src={drawingImage} alt="" className="size-[120mm] [image-rendering:pixelated]" />
          <div className="flex items-center gap-[6mm]">
            {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님 */}
            <img src={qrCode} alt="" className="size-[32mm] [image-rendering:pixelated]" />
            <div className="flex flex-col gap-[2mm] text-left text-ink">
              <span className="text-[16pt] font-black">Stitch</span>
              <span className="text-[10pt] font-medium">QR 코드를 찍으면 내 그림을 저장할 수 있어요</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrintPage;
