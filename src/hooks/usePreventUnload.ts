import { useEffect } from "react";

/** enabled인 동안 새로고침·탭 닫기·주소 이동 전에 브라우저의 "페이지를 나가시겠습니까?" 확인 창을 띄움 */
export const usePreventUnload = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // 일부 브라우저는 returnValue를 설정해야 확인 창을 띄움 (문구는 브라우저 기본 문구로 표시됨)
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);
};
