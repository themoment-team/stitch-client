interface StepCardProps {
  children: React.ReactNode;
  size?: "default" | "wide";
  className?: string;
}

const StepCard = ({ children, size = "default", className = "" }: StepCardProps) => {
  const sizeStyles = {
    default: "max-w-3xl gap-8 px-6 py-8 sm:gap-10 sm:px-12 sm:py-12",
    wide: "max-w-6xl gap-8 px-5 py-7 sm:gap-10 sm:px-10 sm:py-10 lg:px-12",
  };

  return (
    <div
      className={`surface-raised flex w-full flex-col items-center rounded-[2rem] border border-white/70 text-center sm:rounded-[2.5rem] ${sizeStyles[size]} ${className}`}
    >
      {children}
    </div>
  );
};

export default StepCard;
