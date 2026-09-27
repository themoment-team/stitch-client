-- 출력 단계에서 저장하는 최종 그림. QR로 들어온 다운로드 페이지(/share/{id})에서 읽음
create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  size smallint not null check (size in (16, 32)),
  -- 칸마다 색상(hex) 또는 빈 칸(null)을 담은 배열
  pixels jsonb not null,
  created_at timestamptz not null default now()
);

-- 정책을 두지 않아 공개 키(anon)로는 읽고 쓸 수 없고, 서버의 service role 키로만 접근
alter table public.drawings enable row level security;
