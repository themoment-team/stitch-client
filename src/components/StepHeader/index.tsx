import StepButton from "../StepButton";
import StepIndicator from "../StepIndicator";

interface StepHeaderProps {
  /** 1부터 시작하는 현재 단계 */
  current: number;
  title: string;
  description?: string;
  onBack: () => void;
  backDisabled?: boolean;
  /** 헤더 오른쪽에 둘 요소 (타이머 등) */
  aside?: React.ReactNode;
}

const StepHeader = ({ current, title, description, onBack, backDisabled = false, aside }: StepHeaderProps) => {
  return (
    <header className="flex w-full flex-col items-center gap-5">
      <StepIndicator current={current} />
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-1 sm:gap-x-4">
        <div className="justify-self-start">
          <StepButton variant="back" onClick={onBack} disabled={backDisabled}>
            이전
          </StepButton>
        </div>
        <h1 className="text-lg font-bold tracking-tight whitespace-nowrap text-ink max-[359px]:text-[0.9375rem] sm:text-2xl">
          {title}
        </h1>
        <div className="justify-self-end">{aside}</div>
        {/* 제목 바로 아래 붙여 하나의 제목처럼 읽히게 함 */}
        {description && (
          <p className="col-span-3 text-sm font-medium text-muted sm:text-base">{description}</p>
        )}
      </div>
    </header>
  );
};

export default StepHeader;
