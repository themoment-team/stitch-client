import { formatSeconds } from "@/utils";
import Icon from "../Icon";

interface TimerProps {
  remaining: number;
  /** 아직 시작 전이라 시간이 흐르지 않는 상태 */
  paused?: boolean;
}

const URGENT_SECONDS = 10;

const Timer = ({ remaining, paused = false }: TimerProps) => {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = !paused && remaining <= URGENT_SECONDS;
  const colorStyles = paused ? "text-subtle" : isUrgent ? "animate-pulse text-danger" : "text-ink";

  return (
    <div
      role="timer"
      aria-label={`${paused ? "시작 전, 제한 시간" : "남은 시간"} ${minutes}분 ${seconds}초`}
      className={`flex items-center gap-1.5 rounded-full bg-background px-3 py-2 text-sm font-bold whitespace-nowrap tabular-nums shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)] max-[359px]:px-2.5 max-[359px]:text-xs sm:px-4 sm:text-base ${colorStyles}`}
    >
      <Icon name="clock" className="size-4 sm:size-5" />
      {formatSeconds(remaining)}
    </div>
  );
};

export default Timer;
