import { TOTAL_STEPS } from "@/constants";

interface StepLabelProps {
  current: number;
}

const StepLabel = ({ current }: StepLabelProps) => {
  return (
    <span
      className="text-[0.6875rem] font-bold tracking-[0.3em] text-subtle uppercase sm:text-xs"
      aria-label={`${TOTAL_STEPS}단계 중 ${current}단계`}
    >
      Step <span className="text-ink">{current}</span> / {TOTAL_STEPS}
    </span>
  );
};

export default StepLabel;
