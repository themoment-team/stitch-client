interface StepCardProps {
  children: React.ReactNode;
}

const StepCard = ({ children }: StepCardProps) => {
  return (
    <div className="flex h-160 max-h-[85dvh] w-full max-w-lg flex-col items-center justify-between rounded-4xl bg-background px-10 py-14 text-center shadow-[12px_12px_24px_var(--neu-dark),-12px_-12px_24px_var(--neu-light)] sm:px-12 sm:py-16">
      {children}
    </div>
  );
};

export default StepCard;
