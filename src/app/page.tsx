"use client";

import { useState } from "react";
import { AI_DRAFT_LIMIT, DRAW_TIME_LIMIT } from "@/constants";
import { DrawPage, StartPage } from "@/pageContainer";
import { type Drawing, STEP, type Step } from "@/types";

export default function Home() {
  const [step, setStep] = useState<Step>(STEP.START);
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  // 그림판 제한 시간은 처음 들어갈 때 한 번만 시작하고, 이전으로 갔다 와도 초기화하지 않음
  const [drawEndAt, setDrawEndAt] = useState<number | null>(null);
  // AI 도안 생성 횟수도 이전으로 갔다 와도 초기화되지 않도록 여기서 관리
  const [aiDraftRemaining, setAIDraftRemaining] = useState(AI_DRAFT_LIMIT);

  const handleStart = () => {
    setDrawEndAt((prev) => prev ?? Date.now() + DRAW_TIME_LIMIT * 1000);
    setStep(STEP.DRAW);
  };

  const handleBackToStart = (currentDrawing: Drawing) => {
    setDrawing(currentDrawing);
    setStep(STEP.START);
  };

  const handleAIDraftUsed = () => {
    setAIDraftRemaining((prev) => Math.max(0, prev - 1));
  };

  const handleDrawComplete = (completedDrawing: Drawing) => {
    // TODO: step3(AI 변환 여부 선택) 연결
    setDrawing(completedDrawing);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      {step === STEP.START && <StartPage onStart={handleStart} />}
      {step === STEP.DRAW && drawEndAt !== null && (
        <DrawPage
          endAt={drawEndAt}
          initialDrawing={drawing}
          aiDraftRemaining={aiDraftRemaining}
          onAIDraftUsed={handleAIDraftUsed}
          onBack={handleBackToStart}
          onNext={handleDrawComplete}
        />
      )}
    </div>
  );
}
