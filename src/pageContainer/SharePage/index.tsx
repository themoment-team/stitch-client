"use client";

import { Icon, PixelPreview, StepCard } from "@/components";
import { PRIMARY_BUTTON_STYLES } from "@/constants";
import type { Drawing } from "@/types";
import { drawingToPngDataUrl } from "@/utils";

interface SharePageProps {
  drawing: Drawing;
}

const FILE_NAME = "stitch-sticker.png";

/** 인쇄물의 QR 코드로 들어와 내 그림을 투명 배경 PNG로 저장하는 페이지 */
const SharePage = ({ drawing }: SharePageProps) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = drawingToPngDataUrl(drawing);
    link.download = FILE_NAME;
    link.click();
  };

  return (
    <StepCard>
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-bold tracking-[0.3em] text-subtle uppercase">Stitch</span>
        <h1 className="text-2xl font-bold tracking-tight text-ink">내가 만든 스티커</h1>
      </div>

      <div className="w-full max-w-72 rounded-3xl bg-background p-3 shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)]">
        <PixelPreview drawing={drawing} label="내가 만든 그림" />
      </div>

      <button type="button" onClick={handleDownload} className={PRIMARY_BUTTON_STYLES}>
        <Icon name="download" className="size-4" />
        이미지 저장하기
      </button>
    </StepCard>
  );
};

export default SharePage;
