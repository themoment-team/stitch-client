import type { Metadata } from "next";
import { connection } from "next/server";
// 서버 컴포넌트라 클라이언트 전용 페이지들이 함께 묶인 @/pageContainer 대신 직접 가져옴
import BoardPage from "@/pageContainer/BoardPage";
import { findRecentDrawings } from "@/server/drawingStore";
import type { BoardDrawing } from "@/types";

export const metadata: Metadata = {
  title: "그림 보드 | Stitch",
};

export default async function Board() {
  // 빌드 때 미리 렌더하면 DB 접근이 필요하고 그림도 그 시점에 고정되므로 요청이 올 때 렌더함
  await connection();

  // 띄워 둔 화면이 오류 페이지로 멈추지 않도록 빈 보드로 시작하고, 폴링이 성공하면 그때 채움
  let drawings: BoardDrawing[] = [];
  try {
    drawings = await findRecentDrawings();
  } catch (error) {
    console.error(error);
  }

  return <BoardPage initialDrawings={drawings} />;
}
