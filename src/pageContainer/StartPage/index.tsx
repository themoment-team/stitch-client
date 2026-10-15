import { StepButton, StepCard } from "@/components";
import { STEPS } from "@/constants";

interface StartPageProps {
  onStart: () => void;
}

const StartPage = ({ onStart }: StartPageProps) => {
  return (
    <StepCard>
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)] sm:h-20 sm:w-20">
          <div className="grid grid-cols-2 gap-1.5">
            <span className="size-3 rounded-[3px] bg-(--accent-dark) motion-safe:animate-pixel-blink sm:size-3.5" />
            <span className="size-3 rounded-[3px] bg-ink/10 sm:size-3.5" />
            <span className="size-3 rounded-[3px] bg-ink/10 sm:size-3.5" />
            <span className="size-3 rounded-[3px] bg-(--accent-dark) motion-safe:animate-pixel-blink motion-safe:[animation-delay:1.2s] sm:size-3.5" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-ink sm:text-5xl">Stitch</h1>
          <p className="text-base font-medium text-muted sm:text-lg">
            픽셀 그림을 그리고, AI로 다듬어
            <br />
            나만의 스티커로 만들어보세요.
          </p>
        </div>
      </div>

      {/* 그리기 전에 전체 진행 단계를 한 번 안내 */}
      <ol className="flex w-full flex-col gap-3 text-left">
        {STEPS.map(({ title, description }, index) => (
          <li
            key={title}
            className="flex items-center gap-4 rounded-2xl bg-background px-4 py-3 shadow-[3px_3px_6px_var(--neu-dark),-3px_-3px_6px_var(--neu-light)]"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-base font-bold text-ink">
              {index + 1}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-ink sm:text-base">{title}</span>
              <span className="text-xs font-medium text-muted sm:text-sm">{description}</span>
            </div>
          </li>
        ))}
      </ol>

      <StepButton variant="next" onClick={onStart}>
        시작하기
      </StepButton>
    </StepCard>
  );
};

export default StartPage;
