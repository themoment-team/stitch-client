import { useEffect, useEffectEvent, useState } from "react";
import type { ImageSource } from "@/apis";

interface UseImageDropOptions {
  disabled: boolean;
  onImage: (source: ImageSource) => void;
}

const DRAG_TYPES = ["Files", "text/uri-list", "text/html"];
const IMAGE_URL_PATTERN = /^(https?:|data:image\/)/i;

const getImageFile = (data: DataTransfer) => [...data.files].find((file) => file.type.startsWith("image/"));

/**
 * 끌어다 놓은 데이터에서 이미지를 꺼냄 (파일 → 이미지 태그 주소 → 링크 주소 순)
 * 검색 결과의 이미지는 링크로 감싸져 있어 text/uri-list에는 결과 페이지 주소가 담기므로, 실제 이미지 주소는 HTML의 img에서 먼저 찾음
 */
const getDroppedImage = (data: DataTransfer): ImageSource | null => {
  const file = getImageFile(data);
  if (file) return file;

  const html = data.getData("text/html");
  if (html) {
    const src = new DOMParser().parseFromString(html, "text/html").querySelector("img")?.getAttribute("src");
    if (src && IMAGE_URL_PATTERN.test(src)) return src;
  }

  const uri = data
    .getData("text/uri-list")
    .split(/\r?\n/)
    .find((line) => line && !line.startsWith("#"));
  return uri && IMAGE_URL_PATTERN.test(uri) ? uri : null;
};

/**
 * 화면 어디에 이미지를 끌어다 놓거나 붙여넣어도(Ctrl+V) 받아서 onImage로 넘김
 * 끌어다 놓는 중인지(isDragging)도 알려줘 놓을 자리를 표시할 수 있게 함
 */
export const useImageDrop = ({ disabled, onImage }: UseImageDropOptions) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleImage = useEffectEvent((source: ImageSource) => {
    if (!disabled) onImage(source);
  });
  const isDisabled = useEffectEvent(() => disabled);

  useEffect(() => {
    const isImageDrag = (event: DragEvent) =>
      event.dataTransfer?.types.some((type) => DRAG_TYPES.includes(type)) ?? false;

    const handleDragOver = (event: DragEvent) => {
      if (!isImageDrag(event)) return;
      // 막지 않으면 브라우저가 놓은 이미지를 열어 그리던 화면을 떠나버림
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = isDisabled() ? "none" : "copy";
      setIsDragging(!isDisabled());
    };

    const handleDragLeave = (event: DragEvent) => {
      // 화면 안의 요소 사이를 옮겨 다닐 때도 발생하므로, 창 밖으로 나갈 때(relatedTarget 없음)만 끝난 것으로 봄
      if (event.relatedTarget === null) setIsDragging(false);
    };

    const handleDrop = (event: DragEvent) => {
      if (!isImageDrag(event)) return;
      event.preventDefault();
      setIsDragging(false);
      const source = event.dataTransfer ? getDroppedImage(event.dataTransfer) : null;
      if (source) handleImage(source);
    };

    const handlePaste = (event: ClipboardEvent) => {
      // 이미지가 없는 붙여넣기(검색어 입력 등)는 그대로 둠
      const file = event.clipboardData ? getImageFile(event.clipboardData) : undefined;
      if (!file) return;
      event.preventDefault();
      handleImage(file);
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  return { isDragging };
};
