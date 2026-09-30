"use client";

import { useEffect, useRef } from "react";
import { Icon, StepCard } from "@/components";
import { PRIMARY_BUTTON_STYLES } from "@/constants";
import type { Drawing } from "@/types";
import { drawingToPngDataUrl } from "@/utils";

interface SharePageProps {
  drawing: Drawing;
}

const FILE_NAME = "stitch-sticker.png";

// 공유 시트는 누른 직후에만 열 수 있어서(iOS) 기다림 없이 바로 파일로 바꿈
const dataUrlToFile = (dataUrl: string) => {
  const binary = atob(dataUrl.split(",")[1]);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new File([bytes], FILE_NAME, { type: "image/png" });
};

/** 인쇄물의 QR 코드로 들어와 내 그림을 투명 배경 PNG로 저장하는 페이지 */
const SharePage = ({ drawing }: SharePageProps) => {
  const imageRef = useRef<HTMLImageElement>(null);

  // 캔버스가 아닌 이미지로 보여줘야 버튼이 안 되는 인앱 브라우저에서도 길게 눌러 저장할 수 있음
  // 이미지는 브라우저의 캔버스로 만들기 때문에 서버 렌더링이 끝난 뒤에 채움
  useEffect(() => {
    if (imageRef.current) imageRef.current.src = drawingToPngDataUrl(drawing);
  }, [drawing]);

  const handleSave = async () => {
    const file = dataUrlToFile(drawingToPngDataUrl(drawing));

    // 모바일은 공유 시트로 열어야 '이미지 저장'으로 사진 앱에 바로 저장됨
    // (다운로드 링크는 iOS에서 파일 앱으로 들어가고, 인앱 브라우저에서는 동작하지 않음)
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (error) {
        // 사용자가 공유 시트를 닫은 경우는 그대로 끝냄
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <StepCard className="desktop-fit-share">
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm font-bold tracking-[0.2em] text-accent uppercase">Made with Stitch</span>
        <h1 className="page-heading">세상에 하나뿐인 내 스티커</h1>
        <p className="text-[15px] leading-relaxed text-muted">이미지를 저장해 언제든 다시 꺼내 보세요.</p>
      </div>

      <div className="share-preview surface-inset w-full max-w-sm rounded-[2rem] p-4 sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL이라 최적화 대상이 아님 */}
        <img
          ref={imageRef}
          alt="내가 만든 그림"
          className="aspect-square w-full rounded-2xl bg-white [image-rendering:pixelated]"
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <button type="button" onClick={handleSave} className={PRIMARY_BUTTON_STYLES}>
          <Icon name="download" className="size-4" />
          이미지 저장하기
        </button>
        <p className="text-sm leading-relaxed font-medium text-muted">저장이 안 되면 그림을 길게 눌러 저장해주세요.</p>
      </div>
    </StepCard>
  );
};

export default SharePage;
