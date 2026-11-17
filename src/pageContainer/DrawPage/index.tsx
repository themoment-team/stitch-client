import { useCallback, useMemo, useRef, useState } from "react";
import {
  AIBlockedError,
  convertImageToPixels,
  DraftLimitError,
  generateDraft,
  ImageTooLargeError,
  type ImageSource,
  ImageUnsupportedError,
  RateLimitError,
} from "@/apis";
import {
  ColorPalette,
  Icon,
  PixelCanvas,
  StepButton,
  StepCard,
  StepHeader,
  Timer,
  TimerModal,
  ToolButton,
} from "@/components";
import {
  AI_DRAFT_LIMIT,
  DRAFT_KEYWORD_MAX_LENGTH,
  DRAW_TIME_LIMIT,
  DRAW_TIME_WARNING,
  DRAW_TIME_WARNING_MODAL_MS,
  getStepNumber,
  GUIDE_COLOR_LIMIT,
  getImageSearchUrl,
  IMAGE_SEARCH_KEYWORD_MAX_LENGTH,
  PALETTE,
  PRIMARY_BUTTON_STYLES,
  SMALL_PRIMARY_BUTTON_STYLES,
  SMALL_SECONDARY_BUTTON_STYLES,
} from "@/constants";
import { useCountdown, useDrawingHistory, useImageDrop } from "@/hooks";
import { DRAW_TOOL, type Drawing, type DrawTool, STEP } from "@/types";
import { getMainColors, isEmptyPixels } from "@/utils";

interface DrawPageProps {
  /** 제한 시간이 끝나는 시각(타임스탬프). 이전으로 갔다 와도 이어서 흐름. 시작 전이면 null */
  endAt: number | null;
  /** 타이머 시작 버튼을 눌렀을 때 */
  onTimerStart: () => void;
  /** 그릴 그림. 크기 고르기에서 고른 크기의 빈 그림이거나, 이전으로 갔다 돌아왔을 때 이어서 그릴 그림 */
  initialDrawing: Drawing;
  /** 이전으로 갔다 돌아왔을 때 다시 깔아 둘 도안 */
  initialGuide: Drawing | null;
  /** 남은 AI 도안 생성 횟수. 이전으로 갔다 와도 유지되도록 페이지에서 관리 */
  aiDraftRemaining: number;
  onAIDraftUsed: () => void;
  onBack: (drawing: Drawing, guide: Drawing | null) => void;
  onNext: (drawing: Drawing, guide: Drawing | null) => void;
}

type DraftStatus = "idle" | "loading" | "blocked" | "limit" | "dailyLimit" | "error";
type ImageStatus = "idle" | "loading" | "unsupported" | "tooLarge" | "dailyLimit" | "error";

/** 이미지 검색 창이 화면에서 차지하는 너비 비율. 나머지 자리에 stitch 화면이 보여야 이미지를 끌어올 수 있음 */
const SEARCH_WINDOW_WIDTH_RATIO = 0.4;
/** 검색할 때마다 창이 쌓이지 않도록 같은 이름의 창을 다시 씀 */
const SEARCH_WINDOW_NAME = "stitch-image-search";

const inputStyles =
  "min-w-0 flex-1 rounded-2xl bg-background px-4 py-3 text-sm font-medium text-ink shadow-[3px_3px_6px_var(--neu-dark),-3px_-3px_6px_var(--neu-light)] outline-none placeholder:font-normal placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-(--accent-dark) disabled:opacity-40";

const DrawPage = ({
  endAt,
  onTimerStart,
  initialDrawing,
  initialGuide,
  aiDraftRemaining,
  onAIDraftUsed,
  onBack,
  onNext,
}: DrawPageProps) => {
  const { drawing, canUndo, startStroke, paint, endStroke, fill, undo, reset } = useDrawingHistory(initialDrawing);
  const { remaining, isOver } = useCountdown(endAt, DRAW_TIME_LIMIT);
  const [tool, setTool] = useState<DrawTool>(DRAW_TOOL.PEN);
  const [color, setColor] = useState(PALETTE[0]);
  const [keyword, setKeyword] = useState("");
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("idle");
  // 도안은 그림과 별도로 연하게 깔아 두고 따라 그리는 밑그림. 최종 그림에는 포함되지 않음
  const [guide, setGuide] = useState<Drawing | null>(initialGuide);
  const [isGuideVisible, setIsGuideVisible] = useState(true);
  // 화면에 들어온 순간의 남은 시간. 이미 지난 알림(이전으로 갔다 왔을 때 등)은 다시 띄우지 않기 위해 씀
  const [enteredRemaining] = useState(remaining);
  const [isWarningClosed, setIsWarningClosed] = useState(false);
  const [isOverModalClosed, setIsOverModalClosed] = useState(false);
  // 화면이 갱신되기 전에 생성 버튼을 연달아 눌러도 요청이 한 번만 가도록 막음 (비용·횟수 중복 방지)
  const isRequestingDraftRef = useRef(false);
  const [imageKeyword, setImageKeyword] = useState("");
  const [imageStatus, setImageStatus] = useState<ImageStatus>("idle");
  // 변환이 끝나기 전에 다른 이미지를 또 넣으면 늦게 끝난 쪽이 덮어쓰므로 한 번에 하나만 변환
  const isConvertingImageRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEmpty = isEmptyPixels(drawing.pixels);
  const isStarted = endAt !== null;
  // 타이머를 시작하기 전과 시간이 끝난 뒤에는 그리기 도구를 모두 잠금
  // AI가 도안을 그리는 동안에도 캔버스는 계속 쓸 수 있고, 도안 입력만 잠금
  const isLocked = !isStarted || isOver;
  const isDraftLoading = draftStatus === "loading";
  const isImageLoading = imageStatus === "loading";
  // 이 화면에서는 크기를 바꿀 수 없고, 크기 고르기에서 다른 크기를 고르면 페이지가 도안을 지우므로 도안은 늘 캔버스와 같은 크기
  const visibleGuide = isGuideVisible && guide ? guide.pixels : null;
  // 도안에 쓰인 주요 색을 팔레트 아래에 따로 보여줘 따라 그릴 때 바로 고를 수 있게 함 (기본 팔레트에 있는 색은 뺌)
  const guideColors = useMemo(
    () =>
      guide
        ? getMainColors(guide.pixels, GUIDE_COLOR_LIMIT + PALETTE.length)
            .filter((guideColor) => !PALETTE.includes(guideColor))
            .slice(0, GUIDE_COLOR_LIMIT)
        : [],
    [guide],
  );
  // AI 도안을 기다리는 중에 화면을 떠나면 결과가 버려지고 횟수만 차감되므로 이전·다음 모두 잠금
  // 요청은 서버 타임아웃이 있어 반드시 끝나므로, 시간이 끝난 뒤에도 완료될 때까지 기다림
  // 시간이 끝나면 이전으로 돌아가 다시 그릴 수 없고, 빈 그림이어도 다음으로만 진행
  const canGoNext = !isDraftLoading && (isOver || !isEmpty);
  const canGoBack = !isOver && !isDraftLoading;

  const isWarningOpen =
    !isWarningClosed && !isOver && enteredRemaining > DRAW_TIME_WARNING && remaining <= DRAW_TIME_WARNING;
  const isOverModalOpen = !isOverModalClosed && isOver && enteredRemaining > 0;
  const closeWarning = useCallback(() => setIsWarningClosed(true), []);
  const closeOverModal = useCallback(() => setIsOverModalClosed(true), []);

  const handlePaint = (indices: number[]) => {
    paint(indices, tool === DRAW_TOOL.PEN ? color : null);
  };

  const handleFill = (index: number) => {
    fill(index, color);
  };

  const handleColorChange = (nextColor: string) => {
    setColor(nextColor);
    // 채우기 중에는 도구를 유지하고, 지우개일 때만 펜으로 바꿈
    if (tool === DRAW_TOOL.ERASER) setTool(DRAW_TOOL.PEN);
  };

  const handleImportImage = async (source: ImageSource) => {
    // 도안은 하나만 깔리므로, 돌고 있는 AI 도안을 나중에 끝난 이미지가 덮어쓰지 않도록 함께 막음 (반대도 마찬가지)
    if (isLocked || isConvertingImageRef.current || isRequestingDraftRef.current) return;

    const { size } = drawing;
    isConvertingImageRef.current = true;
    setImageStatus("loading");
    try {
      const pixels = await convertImageToPixels(source, size);
      if (isEmptyPixels(pixels)) {
        setImageStatus("unsupported");
        return;
      }
      // 그림에 바로 칠하지 않고 AI 도안처럼 연하게 깔아 두어, 따라 그리며 내 그림으로 만들게 함
      setGuide({ size, pixels });
      setIsGuideVisible(true);
      setImageStatus("idle");
    } catch (error) {
      if (error instanceof ImageUnsupportedError) setImageStatus("unsupported");
      else if (error instanceof ImageTooLargeError) setImageStatus("tooLarge");
      else if (error instanceof RateLimitError) setImageStatus("dailyLimit");
      else setImageStatus("error");
    } finally {
      isConvertingImageRef.current = false;
    }
  };

  const { isDragging } = useImageDrop({
    disabled: isLocked || isDraftLoading || isImageLoading,
    onImage: handleImportImage,
  });

  const handleSearchImage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKeyword = imageKeyword.trim();
    if (!trimmedKeyword || isLocked) return;

    // 검색 결과의 이미지를 stitch 화면으로 끌어올 수 있도록 화면 오른쪽에 작은 창으로 띄움
    const width = Math.round(window.screen.availWidth * SEARCH_WINDOW_WIDTH_RATIO);
    const height = window.screen.availHeight;
    const left = window.screen.availWidth - width;
    // opener를 끊으면(noopener, opener = null) 브라우저가 이 창을 이름으로 다시 찾지도, 주소를 옮기거나 닫지도 못해
    // 검색할 때마다 창이 쌓이므로 opener를 남겨 같은 창을 다시 씀
    // 검색 결과에서 연 사이트는 구글이 새 탭(noopener)으로 열어, 이 화면에 닿을 수 있는 건 검색 창의 구글 페이지뿐임
    window
      .open(getImageSearchUrl(trimmedKeyword), SEARCH_WINDOW_NAME, `popup,width=${width},height=${height},left=${left},top=0`)
      ?.focus();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 일어나도록 비움
    event.target.value = "";
    if (file) handleImportImage(file);
  };

  const handleGenerateDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword || isLocked || isRequestingDraftRef.current || isConvertingImageRef.current) return;

    const { size } = drawing;
    isRequestingDraftRef.current = true;
    setDraftStatus("loading");
    try {
      const { pixels, usedAI } = await generateDraft({
        keyword: trimmedKeyword,
        size,
        canUseAI: aiDraftRemaining > 0,
      });
      // 실패한 요청은 차감하지 않고, 성공해서 비용이 든 경우에만 횟수를 씀
      if (usedAI) onAIDraftUsed();
      setGuide({ size, pixels });
      setIsGuideVisible(true);
      setDraftStatus("idle");
    } catch (error) {
      if (error instanceof AIBlockedError) setDraftStatus("blocked");
      else if (error instanceof DraftLimitError) setDraftStatus("limit");
      else if (error instanceof RateLimitError) setDraftStatus("dailyLimit");
      else setDraftStatus("error");
    } finally {
      isRequestingDraftRef.current = false;
    }
  };

  return (
    <StepCard size="wide">
      <StepHeader
        current={getStepNumber(STEP.DRAW)}
        title="자유롭게 그려보세요"
        onBack={() => onBack(drawing, guide)}
        backDisabled={!canGoBack}
        aside={<Timer remaining={remaining} paused={!isStarted} />}
      />

      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex flex-col items-center gap-3">
          <div className="relative w-full max-w-[min(34rem,60dvh)] rounded-3xl bg-background p-3 shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)]">
            <PixelCanvas
              drawing={drawing}
              guide={visibleGuide}
              disabled={isLocked}
              onStrokeStart={startStroke}
              onPaint={handlePaint}
              onStrokeEnd={endStroke}
              onFill={tool === DRAW_TOOL.FILL ? handleFill : undefined}
            />
            {/* 이미지를 끌어오는 중이거나 변환하는 중에는 캔버스 위에 안내를 띄움 */}
            {(isDragging || isImageLoading) && (
              <div
                role={isImageLoading ? "status" : undefined}
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-accent/85 text-ink"
              >
                <Icon name="image" className={`size-8 ${isImageLoading ? "animate-pulse" : ""}`} />
                <span className="text-sm font-semibold">
                  {isImageLoading ? "이미지를 도안으로 바꾸는 중이에요" : "여기에 놓으면 도안으로 깔려요"}
                </span>
              </div>
            )}
            {!isStarted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl bg-background/70 p-6 text-center backdrop-blur-[2px]">
                <p className="text-sm font-medium text-muted sm:text-base">
                  아직 시간은 흐르지 않아요.
                  <br />
                  시작을 누르면 {DRAW_TIME_LIMIT / 60}분 타이머가 시작돼요.
                </p>
                <button type="button" onClick={onTimerStart} className={`${PRIMARY_BUTTON_STYLES} min-w-32`}>
                  <Icon name="clock" className="size-5" />
                  타이머 시작
                </button>
              </div>
            )}
          </div>
          {isOver && (
            <p className="text-sm font-medium text-danger" role="status">
              {isDraftLoading
                ? "시간이 끝났어요. AI 도안이 완성되면 다음 단계로 넘어갈 수 있어요."
                : "시간이 끝났어요. 다음 단계로 넘어가주세요."}
            </p>
          )}
        </section>

        <aside className="mx-auto flex w-full max-w-[34rem] flex-col gap-6 text-left">
          {!isStarted && (
            <p className="text-sm font-medium text-muted" role="status">
              타이머를 시작하면 도안·도구를 쓸 수 있어요.
            </p>
          )}
          <form className="flex flex-col gap-3" onSubmit={handleGenerateDraft}>
            <div className="flex items-center justify-between">
              <label htmlFor="draft-keyword" className="text-sm font-semibold text-muted">
                AI 도안
              </label>
              <span className="text-xs font-medium text-subtle">
                AI 생성 {aiDraftRemaining}/{AI_DRAFT_LIMIT}회 남음
              </span>
            </div>
            <div className="flex gap-3">
              <input
                id="draft-keyword"
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="예) 웃는 고양이"
                maxLength={DRAFT_KEYWORD_MAX_LENGTH}
                disabled={isLocked || isDraftLoading}
                className={inputStyles}
              />
              <button
                type="submit"
                disabled={isLocked || isDraftLoading || isImageLoading || !keyword.trim()}
                className={`${SMALL_PRIMARY_BUTTON_STYLES} shrink-0`}
              >
                <Icon name="sparkles" className="size-4" />
                {isDraftLoading ? "그리는 중" : "생성"}
              </button>
            </div>
            {isDraftLoading && (
              <p className="text-xs font-medium text-muted" role="status">
                AI가 도안을 그리고 있어요. 10~15초 정도 걸리고, 완성되면 캔버스에 연하게 깔려요.
              </p>
            )}
            {guide && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsGuideVisible((prev) => !prev)}
                  className={SMALL_SECONDARY_BUTTON_STYLES}
                >
                  {isGuideVisible ? "도안 숨기기" : "도안 보이기"}
                </button>
                <button type="button" onClick={() => setGuide(null)} className={SMALL_SECONDARY_BUTTON_STYLES}>
                  도안 지우기
                </button>
              </div>
            )}
            {draftStatus === "blocked" && (
              <p className="text-xs font-medium text-danger" role="alert">
                이 키워드로는 도안을 만들 수 없어요. 다른 키워드를 입력해주세요.
              </p>
            )}
            {draftStatus === "limit" && (
              <p className="text-xs font-medium text-danger" role="alert">
                AI 생성은 {AI_DRAFT_LIMIT}번까지 할 수 있어요. 고양이, 하트처럼 준비된 도안은 계속 쓸 수 있어요.
              </p>
            )}
            {draftStatus === "dailyLimit" && (
              <p className="text-xs font-medium text-danger" role="alert">
                오늘 AI를 쓸 수 있는 횟수가 모두 찼어요. 고양이, 하트처럼 준비된 도안은 계속 쓸 수 있어요.
              </p>
            )}
            {draftStatus === "error" && (
              <p className="text-xs font-medium text-danger" role="alert">
                도안을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
              </p>
            )}
          </form>

          <form className="flex flex-col gap-3" onSubmit={handleSearchImage}>
            <label htmlFor="image-keyword" className="text-sm font-semibold text-muted">
              이미지로 그리기
            </label>
            <div className="flex gap-3">
              <input
                id="image-keyword"
                type="text"
                value={imageKeyword}
                onChange={(event) => setImageKeyword(event.target.value)}
                placeholder="예) 피카츄"
                maxLength={IMAGE_SEARCH_KEYWORD_MAX_LENGTH}
                disabled={isLocked}
                className={inputStyles}
              />
              <button
                type="submit"
                disabled={isLocked || !imageKeyword.trim()}
                className={`${SMALL_PRIMARY_BUTTON_STYLES} shrink-0`}
              >
                <Icon name="search" className="size-4" />
                검색
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLocked || isDraftLoading || isImageLoading}
                className={SMALL_SECONDARY_BUTTON_STYLES}
              >
                <Icon name="image" className="size-4" />
                파일 올리기
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
            </div>
            <p className="text-xs text-subtle">
              검색 창의 이미지를 캔버스로 끌어오거나, 복사해서 Ctrl+V로 붙여넣으면 도안으로 깔려요.
            </p>
            {imageStatus === "unsupported" && (
              <p className="text-xs font-medium text-danger" role="alert">
                이 이미지는 불러올 수 없어요. 다른 이미지를 골라주세요.
              </p>
            )}
            {imageStatus === "tooLarge" && (
              <p className="text-xs font-medium text-danger" role="alert">
                이미지가 너무 커요. 다른 이미지를 골라주세요.
              </p>
            )}
            {imageStatus === "dailyLimit" && (
              <p className="text-xs font-medium text-danger" role="alert">
                오늘 이미지를 불러올 수 있는 횟수가 모두 찼어요. 파일로 올리거나 복사해서 붙여넣어주세요.
              </p>
            )}
            {imageStatus === "error" && (
              <p className="text-xs font-medium text-danger" role="alert">
                이미지를 불러오지 못했어요. 다른 이미지를 고르거나, 복사해서 붙여넣어주세요.
              </p>
            )}
          </form>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold text-muted">도구</legend>
            <div className="grid grid-cols-3 gap-3">
              <ToolButton
                label="펜"
                icon="pen"
                onClick={() => setTool(DRAW_TOOL.PEN)}
                active={tool === DRAW_TOOL.PEN}
                disabled={isLocked}
              />
              <ToolButton
                label="지우개"
                icon="eraser"
                onClick={() => setTool(DRAW_TOOL.ERASER)}
                active={tool === DRAW_TOOL.ERASER}
                disabled={isLocked}
              />
              <ToolButton
                label="채우기"
                icon="fill"
                onClick={() => setTool(DRAW_TOOL.FILL)}
                active={tool === DRAW_TOOL.FILL}
                disabled={isLocked}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ToolButton label="되돌리기" icon="undo" onClick={undo} disabled={isLocked || !canUndo} />
              <ToolButton label="초기화" icon="reset" onClick={reset} disabled={isLocked || isEmpty} />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold text-muted">색상</legend>
            <ColorPalette
              value={color}
              onChange={handleColorChange}
              suggestedColors={guideColors}
              suggestedLabel="도안 색상"
              disabled={isLocked}
            />
          </fieldset>
        </aside>
      </div>

      <StepButton variant="next" onClick={() => onNext(drawing, guide)} disabled={!canGoNext}>
        다음
      </StepButton>

      {isWarningOpen && (
        <TimerModal
          title={`${DRAW_TIME_WARNING / 60}분 남았어요`}
          description="남은 시간 안에 그림을 마무리해주세요."
          remaining={remaining}
          urgent
          onClose={closeWarning}
          closeLabel="계속 그리기"
          // 알림을 확인하는 동안에도 시간이 흐르므로 누르지 않아도 잠시 뒤 닫혀 그리기로 돌아가게 함
          autoCloseMs={DRAW_TIME_WARNING_MODAL_MS}
        />
      )}
      {isOverModalOpen && (
        <TimerModal
          title="시간이 끝났어요"
          description={
            isDraftLoading
              ? "AI 도안이 완성되면 다음 단계로 넘어갈 수 있어요."
              : "그린 그림으로 다음 단계를 진행해주세요."
          }
          remaining={0}
          urgent
          onClose={closeOverModal}
          closeLabel="그림 보기"
          action={{ label: "다음 단계로", onClick: () => onNext(drawing, guide), disabled: !canGoNext }}
        />
      )}
    </StepCard>
  );
};

export default DrawPage;
