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
    ? "bg-accent font-semibold text-ink shadow-[5px_5px_10px_var(--accent-dark),-5px_-5px_10px_var(--accent-light)]"
    : "bg-background font-medium text-muted shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)] enabled:hover:text-ink enabled:active:shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]";

  return (
    <button
      type="button"
      className={`flex flex-col items-center justify-center gap-1.5 cursor-pointer rounded-2xl py-3 text-[0.8125rem] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${stateStyles}`}
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
