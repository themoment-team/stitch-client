import { useEffect } from "react";
import { PRIMARY_BUTTON_STYLES, SECONDARY_BUTTON_STYLES } from "@/constants";
import Icon from "../Icon";

interface TimerModalAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface TimerModalProps {
  title: string;
  description: string;
  /** 강조할 남은 시간 문구 (예: "1:00") */
  time: string;
  urgent?: boolean;
  /** 닫기 버튼. 배경을 누르거나 Esc를 눌러도 같은 동작 */
  onClose: () => void;
  closeLabel: string;
  /** 닫기 옆에 둘 주요 동작 버튼 */
  action?: TimerModalAction;
}

const TimerModal = ({ title, description, time, urgent = false, onClose, closeLabel, action }: TimerModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="timer-modal-title"
        aria-describedby="timer-modal-description"
        className="flex w-full max-w-sm animate-pop flex-col items-center gap-5 rounded-4xl bg-background px-6 py-8 text-center shadow-[12px_12px_24px_var(--neu-dark),-12px_-12px_24px_var(--neu-light)] sm:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex items-center gap-2 text-4xl font-bold tabular-nums ${urgent ? "text-danger" : "text-ink"}`}
        >
          <Icon name="clock" className="size-8" />
          {time}
        </div>
        <div className="flex flex-col gap-2">
          <h2 id="timer-modal-title" className="text-xl font-bold text-ink">
            {title}
          </h2>
          <p id="timer-modal-description" className="text-sm font-medium text-muted sm:text-base">
            {description}
          </p>
        </div>
        <div className="flex w-full flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={action ? SECONDARY_BUTTON_STYLES : PRIMARY_BUTTON_STYLES}
            autoFocus={!action}
          >
            {closeLabel}
          </button>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={PRIMARY_BUTTON_STYLES}
              autoFocus
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimerModal;
