import { STEPS } from "@/constants";

interface StepIndicatorProps {
  /** 1부터 시작하는 현재 단계 */
  current: number;
}

/** 진행 단계를 한 줄로 보여주는 표시. 좁은 화면에서는 현재 단계 이름만 보임 */
const StepIndicator = ({ current }: StepIndicatorProps) => {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label={`${STEPS.length}단계 중 ${current}단계`}>
      {STEPS.map(({ title }, index) => {
        const step = index + 1;
        const isCurrent = step === current;
        const isPassed = step <= current;

        return (
          <li key={title} className="flex items-center gap-2 sm:gap-3" aria-current={isCurrent ? "step" : undefined}>
            {index > 0 && (
              <span aria-hidden className="relative h-0.5 w-6 overflow-hidden rounded-full bg-ink/10 sm:w-14">
                {isPassed && (
                  <span
                    className={`absolute inset-0 origin-left bg-ink/40 ${
                      isCurrent ? "motion-safe:animate-line-fill" : ""
                    }`}
                  />
                )}
              </span>
            )}
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold sm:size-8 sm:text-base ${
                isCurrent
                  ? "border-ink bg-ink text-background"
                  : isPassed
                    ? "border-ink/40 text-muted"
                    : "border-ink/15 text-subtle"
              }`}
            >
              {step}
            </span>
            <span
              className={`text-sm whitespace-nowrap sm:text-base ${
                isCurrent ? "font-bold text-ink" : "font-medium text-subtle max-sm:hidden"
              }`}
            >
              {title}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export default StepIndicator;
