import { useRef, useState } from "react";
import { AIBlockedError, DraftLimitError, generateDraft, RateLimitError } from "@/apis";
import {
  ColorPalette,
  Icon,
  PixelCanvas,
  StepButton,
  StepCard,
  StepHeader,
  Timer,
  ToolButton,
} from "@/components";
import {
  AI_DRAFT_LIMIT,
  DRAFT_KEYWORD_MAX_LENGTH,
  PALETTE,
  SMALL_PRIMARY_BUTTON_STYLES,
  SMALL_SECONDARY_BUTTON_STYLES,
} from "@/constants";
import { useCountdown, useDrawingHistory } from "@/hooks";
import { DRAW_TOOL, type Drawing, type DrawTool, GRID_SIZE } from "@/types";
import { createEmptyPixels, isEmptyPixels } from "@/utils";

interface DrawPageProps {
  /** 제한 시간이 끝나는 시각(타임스탬프). 이전으로 갔다 와도 이어서 흐름 */
  endAt: number;
  /** 이전으로 갔다 돌아왔을 때 이어서 그릴 그림 */
  initialDrawing: Drawing | null;
  /** 이전으로 갔다 돌아왔을 때 다시 깔아 둘 도안 */
  initialGuide: Drawing | null;
  /** 남은 AI 도안 생성 횟수. 이전으로 갔다 와도 유지되도록 페이지에서 관리 */
  aiDraftRemaining: number;
  onAIDraftUsed: () => void;
  onBack: (drawing: Drawing, guide: Drawing | null) => void;
  onNext: (drawing: Drawing, guide: Drawing | null) => void;
}

const EMPTY_DRAWING: Drawing = {
  size: GRID_SIZE.SMALL,
  pixels: createEmptyPixels(GRID_SIZE.SMALL),
};

type DraftStatus = "idle" | "loading" | "blocked" | "limit" | "dailyLimit" | "error";

const DrawPage = ({
  endAt,
  initialDrawing,
  initialGuide,
  aiDraftRemaining,
  onAIDraftUsed,
  onBack,
  onNext,
}: DrawPageProps) => {
  const { drawing, canUndo, startStroke, paint, endStroke, fill, undo, reset, resize } =
    useDrawingHistory(initialDrawing ?? EMPTY_DRAWING);
  const { remaining, isOver } = useCountdown(endAt);
  const [tool, setTool] = useState<DrawTool>(DRAW_TOOL.PEN);
  const [color, setColor] = useState(PALETTE[0]);
  const [keyword, setKeyword] = useState("");
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("idle");
  // 도안은 그림과 별도로 연하게 깔아 두고 따라 그리는 밑그림. 최종 그림에는 포함되지 않음
  const [guide, setGuide] = useState<Drawing | null>(initialGuide);
  const [isGuideVisible, setIsGuideVisible] = useState(true);
  // 화면이 갱신되기 전에 생성 버튼을 연달아 눌러도 요청이 한 번만 가도록 막음 (비용·횟수 중복 방지)
  const isRequestingDraftRef = useRef(false);

  const isEmpty = isEmptyPixels(drawing.pixels);
  // AI가 도안을 그리는 동안에도 캔버스는 계속 쓸 수 있고, 도안 입력과 캔버스 크기만 잠금
  const isLocked = isOver;
  const isDraftLoading = draftStatus === "loading";
  // 도안은 만든 캔버스 크기에서만 보여줌 (크기를 바꿨다 되돌리면 다시 보임)
  const visibleGuide = isGuideVisible && guide?.size === drawing.size ? guide.pixels : null;
  // AI 도안을 기다리는 중에 화면을 떠나면 결과가 버려지고 횟수만 차감되므로 이전·다음 모두 잠금
  // 요청은 서버 타임아웃이 있어 반드시 끝나므로, 시간이 끝난 뒤에도 완료될 때까지 기다림
  // 시간이 끝나면 이전으로 돌아가 다시 그릴 수 없고, 빈 그림이어도 다음으로만 진행
  const canGoNext = !isDraftLoading && (isOver || !isEmpty);
  const canGoBack = !isOver && !isDraftLoading;

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

  const handleGenerateDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword || isLocked || isRequestingDraftRef.current) return;

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
        current={1}
        title="자유롭게 그려보세요"
        onBack={() => onBack(drawing, guide)}
        backDisabled={!canGoBack}
        aside={<Timer remaining={remaining} />}
      />

      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex flex-col items-center gap-3">
          <div className="w-full max-w-[min(34rem,60dvh)] rounded-3xl bg-background p-3 shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)]">
            <PixelCanvas
              drawing={drawing}
              guide={visibleGuide}
              disabled={isLocked}
              onStrokeStart={startStroke}
              onPaint={handlePaint}
              onStrokeEnd={endStroke}
              onFill={tool === DRAW_TOOL.FILL ? handleFill : undefined}
            />
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
                className="min-w-0 flex-1 rounded-2xl bg-background px-4 py-3 text-sm font-medium text-ink shadow-[3px_3px_6px_var(--neu-dark),-3px_-3px_6px_var(--neu-light)] outline-none placeholder:font-normal placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-(--accent-dark) disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={isLocked || isDraftLoading || !keyword.trim()}
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
                {guide.size !== drawing.size && (
                  <span className="text-xs text-subtle">
                    도안은 {guide.size}×{guide.size} 캔버스에서 보여요
                  </span>
                )}
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

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold text-muted">캔버스 크기</legend>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(GRID_SIZE).map((size) => (
                <ToolButton
                  key={size}
                  label={`${size} × ${size}`}
                  onClick={() => resize(size)}
                  active={drawing.size === size}
                  disabled={isLocked || isDraftLoading}
                />
              ))}
            </div>
          </fieldset>

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
            <ColorPalette value={color} onChange={handleColorChange} disabled={isLocked} />
          </fieldset>
        </aside>
      </div>

      <StepButton variant="next" onClick={() => onNext(drawing, guide)} disabled={!canGoNext}>
        다음
      </StepButton>
    </StepCard>
  );
};

export default DrawPage;
