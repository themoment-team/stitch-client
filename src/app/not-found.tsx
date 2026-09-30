import Link from "next/link";
import StepCard from "@/components/StepCard";
import { PRIMARY_BUTTON_STYLES } from "@/constants/button";

export default function NotFound() {
  return (
    <div className="page-shell flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
      <StepCard>
        <div className="surface-inset grid size-24 place-items-center rounded-[2rem] text-3xl font-black tabular-nums text-accent" aria-hidden="true">
          404
        </div>
        <div className="space-y-3">
          <h1 className="page-heading">이 페이지를 찾을 수 없어요</h1>
          <p className="text-[15px] leading-relaxed text-muted">
            주소가 잘못되었거나 공유된 그림을 찾을 수 없어요.
          </p>
        </div>
        <Link href="/" className={PRIMARY_BUTTON_STYLES}>처음으로 돌아가기</Link>
      </StepCard>
    </div>
  );
}
