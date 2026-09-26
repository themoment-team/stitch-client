import { useEffect, useState } from "react";

const getRemainingSeconds = (endAt: number) => Math.max(0, Math.ceil((endAt - Date.now()) / 1000));

/** endAt(타임스탬프)까지 남은 초. 화면을 벗어났다 돌아와도 같은 endAt이면 이어서 흐름 */
export const useCountdown = (endAt: number) => {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(endAt));

  useEffect(() => {
    const timerId = setInterval(() => {
      const left = getRemainingSeconds(endAt);
      setRemaining(left);
      if (left === 0) clearInterval(timerId);
    }, 250);

    return () => clearInterval(timerId);
  }, [endAt]);

  return { remaining, isOver: remaining === 0 };
};
