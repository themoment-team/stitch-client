import { StepButton, StepCard, StepLabel } from "@/components";
import { DRAW_TIME_LIMIT } from "@/constants";

interface StartPageProps {
  onStart: () => void;
}

const StartPage = ({ onStart }: StartPageProps) => {
  const heart = ["01100110", "11111111", "11111111", "11111111", "01111110", "00111100", "00011000"];

  return (
    <StepCard size="wide" className="desktop-fit-card">
      <div className="grid w-full items-center gap-8 text-left md:grid-cols-[1fr_0.85fr] md:gap-12">
        <div className="flex flex-col items-start gap-7 py-3 sm:gap-9 sm:py-6">
          <StepLabel current={1} />
          <div className="space-y-5">
            <p className="text-sm font-bold tracking-[0.2em] text-accent uppercase">Pixel sticker studio</p>
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.12] font-black tracking-[-0.07em] text-ink">
              작은 한 칸,<br />
              <span className="text-accent">나만의 스티커.</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed font-medium text-muted sm:text-lg">
              마음 가는 대로 픽셀을 그리고, 원하는 모습으로 다듬어 바로 인쇄해 보세요.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <StepButton variant="next" onClick={onStart}>그리기 시작하기</StepButton>
            <span className="text-sm font-medium text-muted">{DRAW_TIME_LIMIT / 60}분 동안 자유롭게 그려요</span>
          </div>
        </div>
        <div className="surface-inset flex min-h-72 flex-col items-center justify-center gap-5 rounded-[2rem] px-5 py-8 sm:min-h-96">
          <div className="rounded-[1.75rem] border border-white bg-white p-6 shadow-[4px_4px_12px_var(--neu-dark)] lg:p-10" aria-hidden="true">
            <div className="grid grid-cols-8 gap-0.5">
              {heart.join("").split("").map((cell, index) => (
                <span key={index} className={`size-5 lg:size-7 ${cell === "1" ? "bg-accent" : "bg-transparent"}`} />
              ))}
            </div>
          </div>
          <p className="text-sm font-semibold text-muted">그림 한 장에서 시작되는 작은 선물</p>
        </div>
      </div>
    </StepCard>
  );
};

export default StartPage;
