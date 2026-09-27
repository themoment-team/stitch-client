import { useRef, useState } from "react";
import { AIBlockedError, convertDrawing } from "@/apis";
import { Icon, PixelPreview, StepButton, StepCard, StepLabel } from "@/components";
import { AI_CONVERT_LIMIT } from "@/constants";
import type { ConvertChoice, ConvertSnapshot, Drawing, Pixels } from "@/types";
import { isEmptyPixels } from "@/utils";

interface ConvertPageProps {
  /** 그림판에서 그린 그림 */
  drawing: Drawing;
  /** 남은 AI 변환 횟수. 이전으로 갔다 와도 유지되도록 페이지에서 관리 */
  convertRemaining: number;
  /** 이전에 변환해 둔 결과 (같은 그림일 때만 전달) */
  initialSnapshot: ConvertSnapshot | null;
  onConverted: () => void;
  onBack: (snapshot: ConvertSnapshot) => void;
  /** 선택한 그림(내 그림 또는 AI 변환)으로 다음 단계 진행 */
  onNext: (drawing: Drawing) => void;
}

type ConvertStatus = "idle" | "loading" | "blocked" | "error";

const primaryButtonStyles =
  "flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-ink shadow-[5px_5px_10px_var(--accent-dark),-5px_-5px_10px_var(--accent-light)] transition-all duration-200 enabled:active:shadow-[inset_3px_3px_6px_var(--accent-dark),inset_-3px_-3px_6px_var(--accent-light)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

const secondaryButtonStyles =
  "flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-background px-5 py-3 text-sm font-semibold text-muted shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)] transition-all duration-200 enabled:hover:text-ink enabled:active:shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)] disabled:cursor-not-allowed disabled:opacity-40";

const cardStyles = "flex w-full flex-col gap-3 rounded-3xl p-3 text-left sm:p-4";
const cardShadow = "shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)]";

interface ChoiceCardProps {
  title: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}

/** 비교해서 고를 수 있는 그림 카드. 선택되면 브랜드 포인트 색으로 표시 */
const ChoiceCard = ({ title, selected, disabled = false, onSelect, children }: ChoiceCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    aria-pressed={selected}
    className={`${cardStyles} cursor-pointer transition-all duration-200 disabled:cursor-default ${
      selected
        ? "bg-accent shadow-[5px_5px_10px_var(--accent-dark),-5px_-5px_10px_var(--accent-light)]"
        : `bg-background ${cardShadow}`
    }`}
  >
    <span className="flex items-center justify-between gap-2 px-1">
      <span
        className={`truncate text-sm ${selected ? "font-bold text-ink" : "font-semibold text-muted"}`}
      >
        {title}
      </span>
      {/* 좁은 화면에서는 제목과 겹치지 않게 숨기고, 선택 상태는 배경색으로 구분 */}
      {selected && (
        <span className="hidden shrink-0 text-xs font-semibold text-ink sm:inline">선택됨</span>
      )}
    </span>
    {children}
  </button>
);

const ConvertPage = ({
  drawing,
  convertRemaining,
  initialSnapshot,
  onConverted,
  onBack,
  onNext,
}: ConvertPageProps) => {
  // AI가 다듬은 결과. 다시 다듬을 때마다 쌓이고, 사용자는 내 그림을 포함해 그중 하나를 고름
  const [results, setResults] = useState<Pixels[]>(initialSnapshot?.results ?? []);
  const [choice, setChoice] = useState<ConvertChoice>(initialSnapshot?.choice ?? "original");
  const [status, setStatus] = useState<ConvertStatus>("idle");
  // 화면이 갱신되기 전에 버튼을 연달아 눌러도 요청이 한 번만 가도록 막음 (비용·횟수 중복 방지)
  const isRequestingRef = useRef(false);

  const hasResult = results.length > 0;
  const isLoading = status === "loading";
  // 시간이 끝나 빈 그림으로 넘어온 경우 다듬을 게 없으므로 비용이 들지 않게 막음
  const isEmptyDrawing = isEmptyPixels(drawing.pixels);
  const canConvert = convertRemaining > 0 && !isLoading && !isEmptyDrawing;
  // 아직 결과가 없거나 다듬는 중이면 빈 카드 자리를 하나 더 보여줌
  const showPendingCard = !hasResult || isLoading;
  const cardCount = 1 + results.length + (showPendingCard ? 1 : 0);

  const handleConvert = async () => {
    if (!canConvert || isRequestingRef.current) return;

    isRequestingRef.current = true;
    setStatus("loading");
    try {
      const pixels = await convertDrawing(drawing);
      // 실패한 요청은 차감하지 않고, 성공해서 비용이 든 경우에만 횟수를 씀
      onConverted();
      // 새 결과를 바로 선택해 보여줌 (다듬는 중에는 결과가 바뀌지 않으므로 현재 개수가 새 순번)
      setChoice(results.length);
      setResults((prev) => [...prev, pixels]);
      setStatus("idle");
    } catch (error) {
      setStatus(error instanceof AIBlockedError ? "blocked" : "error");
    } finally {
      isRequestingRef.current = false;
    }
  };

  const handleNext = () => {
    const pixels = choice === "original" ? drawing.pixels : (results[choice] ?? drawing.pixels);
    onNext({ size: drawing.size, pixels });
  };

  return (
    <StepCard size="wide">
      <header className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <div className="justify-self-start">
          <StepButton variant="back" onClick={() => onBack({ results, choice })} disabled={isLoading}>
            이전
          </StepButton>
        </div>
        <div className="flex flex-col items-center gap-1">
          <StepLabel current={3} />
          <h1 className="text-lg font-bold tracking-tight whitespace-nowrap text-ink max-[359px]:text-[0.9375rem] sm:text-2xl">
            AI로 다듬으실 건가요?
          </h1>
        </div>
        <div />
      </header>

      <p className="text-sm font-medium text-muted sm:text-base">
        {hasResult
          ? "내 그림과 AI가 다듬은 그림을 비교하고 마음에 드는 걸 골라주세요."
          : "원하면 AI가 내 그림을 더 깔끔하게 다듬어줘요."}
      </p>

      <div
        className={`grid w-full grid-cols-2 gap-4 sm:gap-6 ${
          cardCount > 2 ? "max-w-4xl sm:grid-cols-3" : "max-w-3xl"
        }`}
      >
        <ChoiceCard title="내 그림" selected={choice === "original"} onSelect={() => setChoice("original")}>
          <PixelPreview drawing={drawing} label="내가 그린 그림" />
        </ChoiceCard>

        {results.map((pixels, index) => (
          <ChoiceCard
            key={index}
            title={`AI 다듬기 ${index + 1}`}
            selected={choice === index}
            disabled={isLoading}
            onSelect={() => setChoice(index)}
          >
            <PixelPreview drawing={{ size: drawing.size, pixels }} label={`AI가 다듬은 그림 ${index + 1}`} />
          </ChoiceCard>
        ))}

        {/* 아직 결과가 없거나 다듬는 중인 자리. 고를 수 없으므로 버튼이 아닌 카드로 표시 */}
        {showPendingCard && (
          <div className={`${cardStyles} bg-background ${cardShadow}`}>
            <span className="truncate px-1 text-sm font-semibold text-muted">
              AI 다듬기 {results.length + 1}
            </span>
            <div
              role={isLoading ? "status" : undefined}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-white/60 text-subtle"
            >
              <Icon name="sparkles" className={`size-8 ${isLoading ? "animate-pulse" : ""}`} />
              <span className="px-2 text-center text-xs font-medium sm:text-sm">
                {isLoading ? (
                  <>
                    AI가 다듬는 중이에요
                    <br />
                    10~20초 정도 걸려요
                  </>
                ) : (
                  "아직 다듬지 않았어요"
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex w-full max-w-3xl flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={handleConvert} disabled={!canConvert} className={primaryButtonStyles}>
            <Icon name="sparkles" className="size-4" />
            {hasResult ? "한 번 더 다듬기" : "AI로 다듬기"}
          </button>
          {!hasResult && (
            <button type="button" onClick={handleNext} disabled={isLoading} className={secondaryButtonStyles}>
              괜찮아요, 그대로 할게요
            </button>
          )}
          {hasResult && (
            <button
              type="button"
              onClick={() => setChoice("original")}
              disabled={isLoading || choice === "original"}
              className={secondaryButtonStyles}
            >
              <Icon name="undo" className="size-4" />
              되돌리기
            </button>
          )}
        </div>
        <span className="text-xs font-medium text-subtle">
          AI로 다듬기 {convertRemaining}/{AI_CONVERT_LIMIT}회 남음
        </span>
        {isEmptyDrawing && (
          <p className="text-xs font-medium text-muted" role="status">
            그린 그림이 없어서 AI로 다듬을 수 없어요.
          </p>
        )}
        {status === "blocked" && (
          <p className="text-xs font-medium text-danger" role="alert">
            이 그림은 AI로 다듬을 수 없어요. 내 그림 그대로 진행해주세요.
          </p>
        )}
        {status === "error" && (
          <p className="text-xs font-medium text-danger" role="alert">
            다듬지 못했어요. 잠시 후 다시 시도하거나 그대로 진행해주세요.
          </p>
        )}
      </div>

      {hasResult && (
        <StepButton variant="next" onClick={handleNext} disabled={isLoading}>
          다음
        </StepButton>
      )}
    </StepCard>
  );
};

export default ConvertPage;
