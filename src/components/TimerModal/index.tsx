import { useEffect, useId, useRef } from "react";
import { PRIMARY_BUTTON_STYLES, SECONDARY_BUTTON_STYLES } from "@/constants";
import { formatSeconds } from "@/utils";
import Icon from "../Icon";

interface TimerModalAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface TimerModalProps {
  title: string;
  description: string;
  /** 크게 보여줄 남은 시간(초) */
  remaining: number;
  urgent?: boolean;
  /** 닫기 버튼. 배경을 누르거나 Esc를 눌러도 같은 동작 */
  onClose: () => void;
  closeLabel: string;
  /** 닫기 옆에 둘 주요 동작 버튼 */
  action?: TimerModalAction;
  /** 지정하면 이 시간(ms)이 지난 뒤 저절로 닫힘 */
  autoCloseMs?: number;
}

/**
 * 남은 시간을 알려주는 모달
 * 브라우저 기본 dialog의 showModal을 써서 최상위 레이어에 띄우고, 열려 있는 동안 배경은 포커스·클릭·스크린 리더에서 제외됨
 */
const TimerModal = ({
  title,
  description,
  remaining,
  urgent = false,
  onClose,
  closeLabel,
  action,
  autoCloseMs,
}: TimerModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // 패널 안에서 누르기 시작해 배경에서 놓은 경우는 닫지 않도록, 누르기 시작한 곳도 배경인지 기억
  const isPressStartedOnBackdropRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const isActionEnabled = action !== undefined && !action.disabled;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (autoCloseMs === undefined) return;
    const timerId = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(timerId);
  }, [autoCloseMs, onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      // 패널이 dialog를 꽉 채우므로 target이 dialog 자신이면 배경(::backdrop)을 누른 것
      onPointerDown={(event) => {
        isPressStartedOnBackdropRef.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (isPressStartedOnBackdropRef.current && event.target === event.currentTarget) onClose();
      }}
      // Esc로 닫힐 때도 브라우저가 직접 닫지 않고 부모 상태로 닫히게 함
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-4xl bg-background p-0 text-center shadow-[12px_12px_24px_var(--neu-dark),-12px_-12px_24px_var(--neu-light)] backdrop:bg-black/30 backdrop:backdrop-blur-[2px] motion-safe:animate-pop"
    >
      <div className="flex flex-col items-center gap-5 px-6 py-8 sm:px-8">
        <div
          className={`flex items-center gap-2 text-4xl font-bold tabular-nums ${urgent ? "text-danger" : "text-ink"}`}
        >
          <Icon name="clock" className="size-8" />
          {formatSeconds(remaining)}
        </div>
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="text-xl font-bold text-ink">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm font-medium text-muted sm:text-base">
            {description}
          </p>
        </div>
        <div className="flex w-full flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={action ? SECONDARY_BUTTON_STYLES : PRIMARY_BUTTON_STYLES}
            // 주요 동작이 잠겨 있으면 닫기 버튼이 포커스를 받아 키보드로도 항상 모달을 다룰 수 있게 함
            autoFocus={!isActionEnabled}
          >
            {closeLabel}
          </button>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={PRIMARY_BUTTON_STYLES}
              autoFocus={isActionEnabled}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
};

export default TimerModal;
