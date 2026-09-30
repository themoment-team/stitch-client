import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stitch',
  description: '픽셀 그림을 그리고 AI로 다듬어 스티커로 출력하는 서비스',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="site-header mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-10 sm:pt-9">
          <div
            className="flex items-center gap-3"
            aria-label="Stitch 픽셀 스티커 스튜디오"
          >
            <span
              className="surface-raised grid size-10 grid-cols-2 gap-0.5 rounded-xl p-2.5"
              aria-hidden="true"
            >
              <span className="rounded-[2px] bg-accent" />
              <span className="rounded-[2px] bg-accent/35" />
              <span className="rounded-[2px] bg-accent/35" />
              <span className="rounded-[2px] bg-accent" />
            </span>
            <span className="text-lg font-black tracking-[-0.06em] text-ink">
              stitch<span className="text-accent-ink">.</span>
            </span>
          </div>
          <span className="hidden text-sm font-semibold tracking-tight text-muted sm:block">
            나만의 한 칸, 나만의 스티커
          </span>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
