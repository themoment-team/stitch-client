import type { Metadata } from "next";
import { notFound } from "next/navigation";
// 서버 컴포넌트라 클라이언트 전용 페이지들이 함께 묶인 @/pageContainer 대신 직접 가져옴
import SharePage from "@/pageContainer/SharePage";
import { findDrawing } from "@/server/drawingStore";

export const metadata: Metadata = {
  title: "내가 만든 스티커 | Stitch",
};

export default async function Share({ params }: PageProps<"/share/[id]">) {
  const { id } = await params;
  const drawing = await findDrawing(id);
  if (!drawing) notFound();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <SharePage drawing={drawing} />
    </div>
  );
}
