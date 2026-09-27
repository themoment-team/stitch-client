"use client";

import { useState } from "react";
import { AI_CONVERT_LIMIT, AI_DRAFT_LIMIT, DRAW_TIME_LIMIT } from "@/constants";
import { ConvertPage, DrawPage, StartPage } from "@/pageContainer";
import { type ConvertSnapshot, type Drawing, STEP, type Step } from "@/types";

export default function Home() {
  const [step, setStep] = useState<Step>(STEP.START);
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [guide, setGuide] = useState<Drawing | null>(null);
  // 그림판 제한 시간은 처음 들어갈 때 한 번만 시작하고, 이전으로 갔다 와도 초기화하지 않음
  const [drawEndAt, setDrawEndAt] = useState<number | null>(null);
  // AI 사용 횟수도 이전으로 갔다 와도 초기화되지 않도록 여기서 관리
  const [aiDraftRemaining, setAIDraftRemaining] = useState(AI_DRAFT_LIMIT);
  const [convertRemaining, setConvertRemaining] = useState(AI_CONVERT_LIMIT);
  // 변환 결과와 그 결과를 만든 그림. 그림판에서 그림을 고치면 결과는 버림
  const [convertSnapshot, setConvertSnapshot] = useState<{
    source: Drawing;
    snapshot: ConvertSnapshot;
  } | null>(null);
  // step4(출력)에서 사용
  const [, setFinalDrawing] = useState<Drawing | null>(null);

  const handleStart = () => {
    setDrawEndAt((prev) => prev ?? Date.now() + DRAW_TIME_LIMIT * 1000);
    setStep(STEP.DRAW);
  };

  const saveDrawing = (currentDrawing: Drawing, currentGuide: Drawing | null) => {
    setDrawing(currentDrawing);
    setGuide(currentGuide);
  };

  const handleBackToStart = (currentDrawing: Drawing, currentGuide: Drawing | null) => {
    saveDrawing(currentDrawing, currentGuide);
    setStep(STEP.START);
  };

  const handleDrawComplete = (completedDrawing: Drawing, currentGuide: Drawing | null) => {
    saveDrawing(completedDrawing, currentGuide);
    setStep(STEP.CONVERT);
  };

  const handleAIDraftUsed = () => {
    setAIDraftRemaining((prev) => Math.max(0, prev - 1));
  };

  const handleConverted = () => {
    setConvertRemaining((prev) => Math.max(0, prev - 1));
  };

  const handleBackToDraw = (snapshot: ConvertSnapshot) => {
    if (drawing) setConvertSnapshot({ source: drawing, snapshot });
    setStep(STEP.DRAW);
  };

  const handleConvertComplete = (selectedDrawing: Drawing) => {
    // TODO: step4(출력) 연결
    setFinalDrawing(selectedDrawing);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      {step === STEP.START && <StartPage onStart={handleStart} />}
      {step === STEP.DRAW && drawEndAt !== null && (
        <DrawPage
          endAt={drawEndAt}
          initialDrawing={drawing}
          initialGuide={guide}
          aiDraftRemaining={aiDraftRemaining}
          onAIDraftUsed={handleAIDraftUsed}
          onBack={handleBackToStart}
          onNext={handleDrawComplete}
        />
      )}
      {step === STEP.CONVERT && drawing && (
        <ConvertPage
          drawing={drawing}
          convertRemaining={convertRemaining}
          // 그림을 고치지 않았다면(같은 객체) 이전 변환 결과를 그대로 보여줌
          initialSnapshot={convertSnapshot?.source === drawing ? convertSnapshot.snapshot : null}
          onConverted={handleConverted}
          onBack={handleBackToDraw}
          onNext={handleConvertComplete}
        />
      )}
    </div>
  );
}
