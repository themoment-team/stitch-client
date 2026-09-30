import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { RateLimitError, saveDrawing } from "@/apis";
import { Icon, LabelSheet, PixelPreview, StepButton, StepCard, StepLabel } from "@/components";
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

type SaveStatus = "saving" | "saved" | "limit" | "error";

const QR_OPTIONS = { margin: 1, width: 512 };

/**
 * QR에 넣을 사이트 주소. 없거나 빈 값이면 지금 접속한 주소를 씀
 * localhost로 띄운 PC에서 인쇄하면 폰이 열 수 없는 주소가 되므로, 로컬 테스트 때는 PC의 IP 주소를 넣음
 * 빈 값을 그대로 쓰면 QR에 경로만 담겨 휴대폰이 주소로 인식하지 못하므로 빈 문자열도 없는 것으로 처리
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || undefined;

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
      .catch((error) => setStatus(error instanceof RateLimitError ? "limit" : "error"))
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
    const shareUrl = `${SITE_URL || window.location.origin}/share/${id}`;
    QRCode.toDataURL(shareUrl, QR_OPTIONS)
      .then(setQRCode)
      .catch(() => setStatus("error"));
  }, [id]);

  const canPrint = status === "saved" && qrCode !== null;

  return (
    <>
      <StepCard size="wide" className="desktop-fit-card desktop-fit-print">
        <header className="flex w-full flex-col gap-5 text-left">
          <div className="flex w-full items-center justify-between gap-3">
            <StepButton variant="back" onClick={onBack} disabled={status === "saving"}>
              이전
            </StepButton>
            <StepLabel current={4} />
          </div>
          <div>
            <h1 className="page-heading">스티커가 완성됐어요</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              그림을 인쇄하고, 함께 찍힌 QR 코드로 휴대폰에 저장하세요.
            </p>
          </div>
        </header>

        <div className="print-grid grid w-full max-w-4xl items-stretch gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)]">
          <div className="surface-inset flex flex-col gap-4 rounded-[2rem] p-5 sm:p-7">
            <p className="section-label text-left">완성한 그림</p>
            <div className="print-preview mx-auto w-full max-w-80 overflow-hidden rounded-2xl bg-white">
              <PixelPreview drawing={drawing} label="완성한 그림" />
            </div>
          </div>

          <div className="surface-inset flex w-full flex-col items-center justify-center gap-4 rounded-[2rem] p-5 sm:p-7">
            <p className="section-label self-start">내 그림을 가져가는 QR</p>
            <div className="flex aspect-square w-full max-w-56 items-center justify-center rounded-2xl bg-white p-4">
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님
                <img src={qrCode} alt="그림 다운로드 QR 코드" className="size-full [image-rendering:pixelated]" />
              ) : (
                <span
                  role={status === "saving" ? "status" : undefined}
                  className="px-2 text-center text-sm leading-relaxed font-medium text-muted"
                >
                  {status === "saving"
                    ? "그림을 저장하는 중이에요"
                    : status === "limit"
                      ? "오늘의 저장 한도에 도달했어요"
                      : "QR 코드를 만들지 못했어요"}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-muted">
              {qrCode ? "카메라로 찍어 이미지를 저장하세요" : "저장되면 QR 코드가 나타나요"}
            </span>
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
            <p className="status-note" role="alert">
              그림을 저장하지 못했어요. 다시 시도해주세요.
            </p>
          )}
          {status === "limit" && (
            <p className="status-note" role="alert">
              오늘 저장할 수 있는 횟수가 모두 찼어요. 내일 다시 이용해주세요.
            </p>
          )}
        </div>
      </StepCard>

      {/* 인쇄할 때만 보이는 라벨지 출력물. 화면의 나머지는 globals.css의 인쇄 스타일에서 숨김 */}
      {canPrint && <LabelSheet drawingImage={drawingImage} qrCode={qrCode} />}
    </>
  );
};

export default PrintPage;
