import Icon from "../Icon";

interface StepButtonProps {
  variant: "back" | "next";
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const StepButton = ({ variant, onClick, children, disabled = false }: StepButtonProps) => {
  const baseStyles = "font-medium transition-all duration-300 ease-out";

  const variantStyles = {
    back: "flex items-center gap-1 rounded-full bg-background py-2 pr-4 pl-2.5 text-sm font-semibold whitespace-nowrap text-muted max-[359px]:px-2 sm:text-base",
    next: "rounded-2xl bg-accent px-6 py-3 text-base font-semibold text-ink sm:px-8 sm:py-4 sm:text-lg",
  };

  const stateStyles = {
    back: disabled
      ? "opacity-40 shadow-none"
      : "shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)] hover:text-ink active:shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]",
    next: disabled
      ? "opacity-40 shadow-none"
      : "shadow-[6px_6px_14px_var(--accent-dark),-6px_-6px_14px_var(--accent-light)] hover:shadow-[3px_3px_8px_var(--accent-dark),-3px_-3px_8px_var(--accent-light)] active:shadow-[inset_4px_4px_10px_var(--accent-dark),inset_-4px_-4px_10px_var(--accent-light)]",
  };

  const cursorStyle = disabled ? "cursor-not-allowed" : "cursor-pointer";

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      className={`${baseStyles} ${cursorStyle} ${variantStyles[variant]} ${stateStyles[variant]}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {variant === "back" && <Icon name="chevronLeft" className="size-4 sm:size-5" />}
      {/* 아주 좁은 화면에서는 뒤로가기 화살표만 표시 */}
      <span className={variant === "back" ? "max-[359px]:sr-only" : undefined}>{children}</span>
    </button>
  );
};

export default StepButton;
