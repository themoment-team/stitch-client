interface StepButtonProps {
  variant: "back" | "next";
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const StepButton = ({ variant, onClick, children, disabled = false }: StepButtonProps) => {
  const baseStyles = "font-medium transition-all ease-out";

  const variantStyles = {
    back: "decoration-skip-ink-none text-[1.25rem]/[1.875rem] text-muted underline duration-100 [text-underline-position:from-font] hover:text-ink",
    next: "rounded-xl border border-ink px-[1.25rem] py-[1rem] text-[1.25rem]/[1.25rem] text-ink duration-300",
  };

  const nextStateStyles = disabled
    ? "opacity-30"
    : "hover:bg-ink hover:font-[600] hover:text-white";

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
