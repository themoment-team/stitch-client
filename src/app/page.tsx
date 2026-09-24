"use client";

import { useState } from "react";
import { StartPage } from "@/pageContainer";
import { STEP, type Step } from "@/types";

export default function Home() {
  const [step, setStep] = useState<Step>(STEP.START);

  const handleStart = () => {
    setStep(STEP.START);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      {step === STEP.START && <StartPage onStart={handleStart} />}
    </div>
  );
}
