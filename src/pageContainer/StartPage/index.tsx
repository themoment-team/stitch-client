import { StepButton } from "@/components";

interface StartPageProps {
  onStart: () => void;
}

const StartPage = ({ onStart }: StartPageProps) => {
  return (
    <div className="flex w-full max-w-[50rem] flex-col gap-16 rounded-3xl border-0 bg-white px-12 py-20 shadow-[0_2px_6px_0_rgba(214,214,214,0.25)] sm:px-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-black text-ink sm:text-6xl">Stitch</h1>
        <p className="text-lg font-medium text-muted sm:text-xl">
          픽셀 그림을 그리고, AI로 다듬고, 스티커로 출력해보세요.
          <br />
          누구나 쉽게 나만의 픽셀 스티커를 만들 수 있는 서비스입니다.
        </p>
      </div>

      <div className="flex justify-end">
        <StepButton variant="next" onClick={onStart}>
          시작하기
        </StepButton>
      </div>
    </div>
  );
};

export default StartPage;
