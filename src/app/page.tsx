"use client";

import { useState } from "react";
import { startSession } from "@/apis";
import { AI_CONVERT_LIMIT, AI_DRAFT_LIMIT, DRAW_TIME_LIMIT } from "@/constants";
import { ConvertPage, DrawPage, PrintPage, StartPage } from "@/pageContainer";
import { type ConvertSnapshot, type Drawing, type Pixels, STEP, type Step } from "@/types";

interface StitchFlowProps {
  onRestart: () => void;
}

const StitchFlow = ({ onRestart }: StitchFlowProps) => {
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
  const [finalDrawing, setFinalDrawing] = useState<Drawing | null>(null);
  // DB에 저장한 그림과 id. 출력에서 이전으로 갔다가 같은 그림으로 돌아오면 다시 저장하지 않음
  const [saved, setSaved] = useState<{ pixels: Pixels; id: string } | null>(null);

  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    // 처음 시작할 때만 서버에서 새 세션을 받아 AI 횟수를 새로 셈
    // 그리기에서 이전으로 왔다가 다시 시작하면 같은 세션을 이어 써서 횟수가 초기화되지 않음
    if (drawEndAt === null) {
      if (isStarting) return;
      setIsStarting(true);
      // 세션을 받지 못해도 그리기는 할 수 있게 진행하고, AI 요청만 실패로 안내
      await startSession().catch((error) => console.error(error));
      setIsStarting(false);
    }
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

  const handleConvertComplete = (selectedDrawing: Drawing, snapshot: ConvertSnapshot) => {
    if (drawing) setConvertSnapshot({ source: drawing, snapshot });
    setFinalDrawing(selectedDrawing);
    setStep(STEP.PRINT);
  };

  const handleSaved = (id: string) => {
    if (finalDrawing) setSaved({ pixels: finalDrawing.pixels, id });
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      {step === STEP.START && <StartPage onStart={handleStart} starting={isStarting} />}
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
      {step === STEP.PRINT && finalDrawing && (
        <PrintPage
          drawing={finalDrawing}
          // 고른 그림이 같으면(같은 픽셀 배열) 저장해 둔 id를 그대로 씀
          savedId={saved?.pixels === finalDrawing.pixels ? saved.id : null}
          onSaved={handleSaved}
          onBack={() => setStep(STEP.CONVERT)}
          onRestart={onRestart}
        />
      )}
    </div>
  );
};

export default function Home() {
  // 처음으로 돌아가면 key를 바꿔 그림·타이머·AI 횟수 등 모든 상태를 새로 시작
  const [sessionKey, setSessionKey] = useState(0);

  return <StitchFlow key={sessionKey} onRestart={() => setSessionKey((prev) => prev + 1)} />;
}
