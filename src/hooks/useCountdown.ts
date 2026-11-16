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
    // 시작 전에는 흐르지 않음
    if (endAt === null) return;
    const tick = () => {
      const left = getRemainingSeconds(endAt);
      setRemaining(left);
      if (left === 0) clearInterval(timerId);
    };
    // 시작하자마자 endAt 기준으로 맞춰, 이미 흐른 endAt이 넘어와도 첫 주기 동안 duration이 보이지 않게 함
    const syncId = setTimeout(tick, 0);
    const timerId = setInterval(tick, 250);

    return () => {
      clearTimeout(syncId);
      clearInterval(timerId);
    };
  }, [endAt]);

  return { remaining, isOver: endAt !== null && remaining === 0 };
};
