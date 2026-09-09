import { StepButton, StepCard } from "@/components";

interface StartPageProps {
  onStart: () => void;
}

const StartPage = ({ onStart }: StartPageProps) => {
  return (
    <StepCard>
      <div className="flex flex-col items-center gap-6 pt-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-[inset_5px_5px_10px_var(--neu-dark),inset_-5px_-5px_10px_var(--neu-light)] sm:h-20 sm:w-20">
          <div className="grid grid-cols-2 gap-1.5">
            <span className="size-3 rounded-[3px] bg-(--accent-dark) sm:size-3.5" />
            <span className="size-3 rounded-[3px] bg-ink/10 sm:size-3.5" />
            <span className="size-3 rounded-[3px] bg-ink/10 sm:size-3.5" />
            <span className="size-3 rounded-[3px] bg-(--accent-dark) sm:size-3.5" />
          </div>
        </div>

        <span className="text-xs font-bold tracking-[0.3em] text-subtle uppercase">
          Pixel Sticker Studio
        </span>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black text-ink sm:text-5xl">Stitch</h1>
          <p className="text-base font-medium text-muted sm:text-lg">
            픽셀 그림을 그리고, AI로 다듬어
            <br />
            나만의 스티커로 만들어보세요.
          </p>
        </div>
      </div>

      <StepButton variant="next" onClick={onStart}>
        시작하기
      </StepButton>
    </StepCard>
  );
};

export default StartPage;
