interface StepCardProps {
  children: React.ReactNode;
  size?: "default" | "wide";
}

const StepCard = ({ children, size = "default" }: StepCardProps) => {
  const sizeStyles = {
    default: "max-w-lg gap-8 px-8 py-10 sm:px-10 sm:py-12",
    wide: "max-w-5xl gap-6 px-6 py-8 sm:px-10 sm:py-10",
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
