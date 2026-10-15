import { PRIMARY_BUTTON_STYLES, SMALL_SECONDARY_BUTTON_STYLES } from "@/constants";
import Icon from "../Icon";

interface StepButtonProps {
  variant: "back" | "next";
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const variantStyles = {
  back: `${SMALL_SECONDARY_BUTTON_STYLES} gap-1 pl-2.5 max-[359px]:px-2`,
  next: `${PRIMARY_BUTTON_STYLES} min-w-32`,
};

const StepButton = ({ variant, onClick, children, disabled = false }: StepButtonProps) => {
  return (
    <button type="button" className={variantStyles[variant]} onClick={onClick} disabled={disabled}>
      {variant === "back" && <Icon name="chevronLeft" className="size-4" />}
      {/* 아주 좁은 화면에서는 뒤로가기 화살표만 표시 */}
      <span className={variant === "back" ? "max-[359px]:sr-only" : undefined}>{children}</span>
    </button>
  );
};

export default StepButton;
