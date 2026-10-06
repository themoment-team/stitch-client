import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { RateLimitError, saveDrawing } from "@/apis";
import { Icon, LabelSheet, PixelPreview, StepCard, StepHeader } from "@/components";
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

const cardStyles =
  "flex w-full flex-col gap-3 rounded-3xl bg-background p-3 text-left shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)] sm:p-4";

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
      <StepCard size="wide">
        <StepHeader
          current={3}
          title="스티커가 완성됐어요"
          description="인쇄물의 QR 코드를 찍으면 그림을 휴대폰에 저장할 수 있어요."
          onBack={onBack}
          backDisabled={status === "saving"}
        />

        {/* 3단계 비교 카드와 같은 크기·모양으로 그림과 QR 코드를 나란히 보여줌 */}
        <div className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:gap-6">
          <div className={cardStyles}>
            <span className="truncate px-1 text-sm font-semibold text-muted">완성한 그림</span>
            <PixelPreview drawing={drawing} label="완성한 그림" />
          </div>

          <div className={cardStyles}>
            <span className="truncate px-1 text-sm font-semibold text-muted">다운로드 QR 코드</span>
            <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-white p-3 sm:p-5">
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님
                <img src={qrCode} alt="그림 다운로드 QR 코드" className="size-full [image-rendering:pixelated]" />
              ) : (
                <span
                  role={status === "saving" ? "status" : undefined}
                  className="px-2 text-center text-xs font-medium text-subtle sm:text-sm"
                >
                  {status === "saving" ? "QR 코드를 만드는 중이에요" : "QR 코드를 만들지 못했어요"}
                </span>
              )}
            </div>
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
          {status === "limit" && (
            <p className="text-xs font-medium text-danger" role="alert">
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
