import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stitch",
  description: "픽셀 그림을 그리고 AI로 다듬어 스티커로 출력하는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
