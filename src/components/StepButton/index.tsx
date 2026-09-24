interface StepButtonProps {
  variant: "back" | "next";
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const StepButton = ({ variant, onClick, children, disabled = false }: StepButtonProps) => {
  const baseStyles = "font-medium transition-all duration-300 ease-out";

  const variantStyles = {
    back: "decoration-skip-ink-none text-base text-muted underline duration-100 [text-underline-position:from-font] hover:text-ink sm:text-[1.25rem]/[1.875rem]",
    next: "rounded-2xl bg-accent px-6 py-3 text-base font-semibold text-ink sm:px-8 sm:py-4 sm:text-lg",
  };

  const nextStateStyles = disabled
    ? "opacity-40 shadow-none"
    : "shadow-[6px_6px_14px_var(--accent-dark),-6px_-6px_14px_var(--accent-light)] hover:shadow-[3px_3px_8px_var(--accent-dark),-3px_-3px_8px_var(--accent-light)] active:shadow-[inset_4px_4px_10px_var(--accent-dark),inset_-4px_-4px_10px_var(--accent-light)]";

  const cursorStyle = disabled ? "cursor-not-allowed" : "cursor-pointer";

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      className={`${baseStyles} ${cursorStyle} ${variantStyles[variant]} ${variant === "next" ? nextStateStyles : ""}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default StepButton;
