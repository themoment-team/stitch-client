import Icon, { type IconName } from "../Icon";

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  icon?: IconName;
  /** 토글 버튼의 선택 여부. 지정하지 않으면 일반 버튼 */
  active?: boolean;
  disabled?: boolean;
}

const ToolButton = ({ label, onClick, icon, active, disabled = false }: ToolButtonProps) => {
  const stateStyles = active
    ? "bg-accent-tint font-bold text-accent-ink ring-2 ring-accent-ink shadow-[inset_3px_3px_7px_var(--accent-dark),inset_-3px_-3px_7px_white]"
    : "bg-background font-semibold text-muted shadow-[4px_4px_10px_var(--neu-dark),-4px_-4px_10px_var(--neu-light)] enabled:hover:text-ink enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 enabled:active:shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]";

  return (
    <button
      type="button"
      className={`tool-button flex min-h-14 flex-col items-center justify-center gap-1.5 cursor-pointer rounded-2xl px-1 py-3 text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${stateStyles}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      {icon && <Icon name={icon} />}
      {label}
    </button>
  );
};

export default ToolButton;
