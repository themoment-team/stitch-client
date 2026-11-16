import { useEffect } from "react";

/**
 * enabled인 동안 새로고침·탭 닫기·주소 이동 전에 브라우저의 "페이지를 나가시겠습니까?" 확인 창을 요청함
 * beforeunload는 브라우저가 최선을 다해 처리하는 이벤트라 이탈을 확실히 막지는 못함
 * (사용자가 페이지와 상호작용하기 전이거나 일부 모바일 브라우저에서는 확인 창이 뜨지 않을 수 있음)
 * 따라서 이 훅만으로 작업이 보존되지는 않음
 */
export const useConfirmBeforeUnload = (enabled: boolean) => {
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
