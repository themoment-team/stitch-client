import { StepButton } from "@/components";

interface StartPageProps {
  onStart: () => void;
}

const StartPage = ({ onStart }: StartPageProps) => {
  return (
    <div className="flex w-full max-w-[50rem] flex-col gap-12 rounded-[2rem] bg-background px-6 py-14 shadow-[12px_12px_24px_var(--neu-dark),-12px_-12px_24px_var(--neu-light)] sm:gap-16 sm:px-16 sm:py-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-black text-ink sm:text-6xl">Stitch</h1>
        <p className="text-base font-medium text-muted sm:text-xl">
          픽셀 그림을 그리고, AI로 다듬고, 스티커로 출력해보세요.
          <br className="hidden sm:block" />
          누구나 쉽게 나만의 픽셀 스티커를 만들 수 있는 서비스입니다.
        </p>
      </div>

      <div className="flex justify-center sm:justify-end">
        <StepButton variant="next" onClick={onStart}>
          시작하기
        </StepButton>
      </div>
    </div>
  );
};

export default StartPage;
