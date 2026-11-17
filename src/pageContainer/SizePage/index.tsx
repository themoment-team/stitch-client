import { PixelCanvas, StepButton, StepCard, StepHeader, Timer, ToolButton } from "@/components";
import { DRAW_TIME_LIMIT, getStepNumber, PALETTE } from "@/constants";
import { useCountdown, useDrawingHistory } from "@/hooks";
import { GRID_SIZES, type GridSize, STEP } from "@/types";
import { createEmptyPixels } from "@/utils";

interface SizePageProps {
  /** 처음 골라 둘 크기. 그리기에서 이전으로 돌아왔다면 그리던 크기 */
  initialSize: GridSize;
  /** 그리기 제한 시간이 끝나는 시각. 아직 그리기를 시작하지 않았으면 null */
  endAt: number | null;
  /** 그리던 그림이나 도안이 있는지. 다른 크기로 바꾸면 지워지므로 미리 알려줌 */
  hasWork: boolean;
  onBack: () => void;
  onNext: (size: GridSize) => void;
}

/** 선을 그어보는 연습용 펜 색 (팔레트의 검은색) */
const TEST_PEN_COLOR = PALETTE[0];

/**
 * 그리기 전에 캔버스 크기를 고르는 단계
 * 크기마다 칸이 얼마나 촘촘한지 직접 선을 그어 확인해 볼 수 있고, 연습한 선은 그리기 단계로 가져가지 않음
 */
const SizePage = ({ initialSize, endAt, hasWork, onBack, onNext }: SizePageProps) => {
  // 크기별로 그어 본 선을 보관해 두므로 크기를 오가며 비교할 수 있음
  const { drawing, startStroke, paint, endStroke, resetAll, resize } = useDrawingHistory({
    size: initialSize,
    pixels: createEmptyPixels(initialSize),
  });
  // 고른 크기는 연습 캔버스의 크기를 그대로 따라감 (따로 두면 훅이 크기를 되돌릴 때 어긋남)
  const { size } = drawing;
  // 이 단계에서는 시간이 흐르지 않음. 그리기에서 타이머를 시작한 뒤 이전으로 돌아온 경우에만 남은 시간이 흐름
  const { remaining, isOver } = useCountdown(endAt, DRAW_TIME_LIMIT);
  const isStarted = endAt !== null;
  const willDiscardWork = hasWork && size !== initialSize;
  // 이전으로 돌아와 있는 사이 시간이 끝났다면, 다시 그릴 수 없으므로 그리던 그림을 지우는 크기 변경은 막음
  // (그린 것이 없으면 지울 것도 없으므로 막지 않음. 페이지에서도 같은 조건으로 그림을 지우지 않음)
  const isSizeLocked = isOver && hasWork;

  return (
    <StepCard size="wide">
      <StepHeader
        current={getStepNumber(STEP.SIZE)}
        title="캔버스 크기를 골라주세요"
        description="크기를 바꿔가며 선을 그어보고, 마음에 드는 크기로 시작하세요."
        onBack={onBack}
        aside={<Timer remaining={remaining} paused={!isStarted} />}
      />

      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex flex-col items-center gap-3">
          <div className="w-full max-w-[min(34rem,60dvh)] rounded-3xl bg-background p-3 shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)]">
            <PixelCanvas
              drawing={drawing}
              onStrokeStart={startStroke}
              onPaint={(indices) => paint(indices, TEST_PEN_COLOR)}
              onStrokeEnd={endStroke}
            />
          </div>
        </section>

        <aside className="mx-auto flex w-full max-w-[34rem] flex-col gap-6 text-left">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold text-muted">캔버스 크기</legend>
            <div className="grid grid-cols-3 gap-3">
              {GRID_SIZES.map((gridSize) => (
                <ToolButton
                  key={gridSize}
                  label={`${gridSize}×${gridSize}`}
                  onClick={() => resize(gridSize)}
                  active={size === gridSize}
                  disabled={isSizeLocked && gridSize !== initialSize}
                />
              ))}
            </div>
            <p className="text-xs text-subtle">칸이 많을수록 세밀하게 그릴 수 있지만, 채워야 할 칸도 많아져요.</p>
          </fieldset>

          <div className="flex flex-col gap-3">
            <ToolButton label="선 모두 지우기" icon="reset" onClick={resetAll} />
            <p className="text-xs text-subtle">
              검은색 펜으로 자유롭게 그어보세요. 크기마다 그은 선은 따로 남고, 모두 지우기를 누르면 전부 지워져요.
              여기서 그은 선은 연습용이라 그림에 남지 않아요.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm font-medium" role="status">
            {isSizeLocked ? (
              <p className="text-danger">
                시간이 끝났어요. 그리던 {initialSize}×{initialSize} 크기로 다음 단계로 넘어가주세요.
              </p>
            ) : isOver ? (
              <p className="text-danger">시간이 끝났어요. 다음 단계로 넘어가주세요.</p>
            ) : isStarted ? (
              <p className="text-muted">그리기 시간은 계속 흐르고 있어요.</p>
            ) : (
              <p className="text-muted">
                이 단계에서는 시간이 흐르지 않아요. 그리기 단계에서 타이머를 시작하면 {DRAW_TIME_LIMIT / 60}분이 흘러요.
              </p>
            )}
            {willDiscardWork && <p className="text-danger">크기를 바꾸면 그리던 그림과 도안이 지워져요.</p>}
          </div>
        </aside>
      </div>

      {/* 그리던 그림이 지워지는 경우엔 버튼 문구로도 한 번 더 알림 (좁은 화면에서도 이 문구는 보임) */}
      <StepButton variant="next" onClick={() => onNext(size)} disabled={isSizeLocked && size !== initialSize}>
        {willDiscardWork ? `${size}×${size}로 새로 그리기` : `${size}×${size}로 그리기`}
      </StepButton>
    </StepCard>
  );
};

export default SizePage;
