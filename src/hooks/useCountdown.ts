import { useEffect, useState } from "react";

const getRemainingSeconds = (endAt: number) => Math.max(0, Math.ceil((endAt - Date.now()) / 1000));

/**
 * endAt(타임스탬프)까지 남은 초. 화면을 벗어났다 돌아와도 같은 endAt이면 이어서 흐름
 * endAt이 null이면 아직 시작 전이라 duration(초)을 그대로 보여주고 흐르지 않음
 */
export const useCountdown = (endAt: number | null, duration: number) => {
  const [remaining, setRemaining] = useState(() =>
    endAt === null ? duration : getRemainingSeconds(endAt),
  );

  useEffect(() => {
    // 시작 전에는 흐르지 않음. 시작 직후 남은 시간은 duration과 같아 첫 갱신까지 그대로 보여도 됨
    if (endAt === null) return;
    const timerId = setInterval(() => {
      const left = getRemainingSeconds(endAt);
      setRemaining(left);
      if (left === 0) clearInterval(timerId);
    }, 250);

    return () => clearInterval(timerId);
  }, [endAt]);

  return { remaining, isOver: endAt !== null && remaining === 0 };
};
