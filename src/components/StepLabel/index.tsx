import { TOTAL_STEPS } from "@/constants";

interface StepLabelProps {
  current: number;
}

const StepLabel = ({ current }: StepLabelProps) => {
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${TOTAL_STEPS}단계 중 ${current}단계`}>
      {Array.from({ length: TOTAL_STEPS }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`grid size-7 place-items-center rounded-full text-xs font-bold tabular-nums transition-colors sm:size-8 ${
            index + 1 === current
              ? "bg-accent text-ink shadow-[3px_3px_8px_var(--accent-dark)]"
              : index + 1 < current
                ? "bg-mint text-ink"
                : "surface-inset text-muted"
          }`}
        >
          {index + 1}
        </span>
      ))}
    </div>
  );
};

export default StepLabel;
