interface StepCardProps {
  children: React.ReactNode;
  size?: "default" | "wide";
}

const StepCard = ({ children, size = "default" }: StepCardProps) => {
  const sizeStyles = {
    default: "h-160 max-h-[85dvh] max-w-lg justify-between px-10 py-14 sm:px-12 sm:py-16",
    wide: "max-w-5xl gap-8 px-6 py-8 sm:px-10 sm:py-10",
  };

  return (
    <div
      className={`flex w-full flex-col items-center rounded-4xl bg-background text-center shadow-[12px_12px_24px_var(--neu-dark),-12px_-12px_24px_var(--neu-light)] ${sizeStyles[size]}`}
    >
      {children}
    </div>
  );
};

export default StepCard;
