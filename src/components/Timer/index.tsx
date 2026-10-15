import Icon from "../Icon";

interface TimerProps {
  remaining: number;
}

const URGENT_SECONDS = 10;

const Timer = ({ remaining }: TimerProps) => {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining <= URGENT_SECONDS;

  return (
    <div
      role="timer"
      aria-label={`남은 시간 ${minutes}분 ${seconds}초`}
      className={`flex items-center gap-1.5 rounded-full bg-background px-3 py-2 text-sm font-bold whitespace-nowrap tabular-nums shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)] max-[359px]:px-2.5 max-[359px]:text-xs sm:px-4 sm:text-base ${isUrgent ? "animate-pulse text-danger" : "text-ink"}`}
    >
      <Icon name="clock" className="size-4 sm:size-5" />
      {minutes}:{String(seconds).padStart(2, "0")}
    </div>
  );
};

export default Timer;
