"use client";

import { BoardScene } from "@/components";
import { useBoardDrawings } from "@/hooks";
import type { BoardDrawing } from "@/types";

interface BoardPageProps {
  initialDrawings: BoardDrawing[];
}

/** 행사장 화면에 띄워 두는 보드. 만든 그림들이 화면 속을 돌아다니고, 새 그림은 가운데에 크게 등장함 */
const BoardPage = ({ initialDrawings }: BoardPageProps) => {
  const drawings = useBoardDrawings(initialDrawings);

  return (
    <main className="relative h-dvh overflow-hidden select-none">
      {/* 화면에는 그림만 보이도록 제목은 스크린 리더에만 읽힘 */}
      <h1 className="sr-only">Stitch 그림 보드</h1>
      <BoardScene drawings={drawings} />

      {/* 캔버스를 누르는 데 방해되지 않도록 글자는 터치를 통과시킴 */}
      {drawings.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-medium text-subtle">
          아직 만든 그림이 없어요. 첫 스티커를 만들어보세요!
        </p>
      )}
    </main>
  );
};

export default BoardPage;
