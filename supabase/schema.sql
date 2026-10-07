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

-- 오래된 그림을 기간으로 찾아 정리할 때 전체를 훑지 않도록 저장 시각에 인덱스를 둠
create index if not exists drawings_created_at_idx on public.drawings (created_at);

-- API 요청 횟수 기록. 비용이 드는 AI 호출과 DB 저장이 무제한으로 일어나지 않도록 하루 단위로 셈
-- key: 요청한 IP의 해시값, 전체 합계는 '*'
create table if not exists public.api_usage (
  scope text not null,
  key text not null,
  day date not null,
  count integer not null default 0,
  primary key (scope, key, day)
);

alter table public.api_usage enable row level security;

-- IP별 한도와 전체 한도를 함께 확인하고, 둘 다 남아 있을 때만 1회 차감 (동시에 요청이 몰려도 한도를 넘지 않음)
create or replace function public.consume_api_quota(
  p_scope text,
  p_key text,
  p_key_limit integer,
  p_total_limit integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
begin
  insert into api_usage (scope, key, day, count) values (p_scope, p_key, today, 1)
  on conflict (scope, key, day) do update set count = api_usage.count + 1
  where api_usage.count < p_key_limit;
  if not found then
    return false;
  end if;

  insert into api_usage (scope, key, day, count) values (p_scope, '*', today, 1)
  on conflict (scope, key, day) do update set count = api_usage.count + 1
  where api_usage.count < p_total_limit;
  if not found then
    -- 전체 한도가 찼으면 앞에서 올린 IP별 횟수를 되돌림
    update api_usage set count = count - 1 where scope = p_scope and key = p_key and day = today;
    return false;
  end if;

  return true;
end;
$$;

-- 서버의 service role 키로만 호출할 수 있도록 공개 키에서는 실행 권한을 뺌
revoke execute on function public.consume_api_quota(text, text, integer, integer) from public, anon, authenticated;

-- AI 이미지 요청 한도. 세션별(이용자 한 명의 도안·변환 횟수), IP별, 전체 한도를 함께 확인하고
-- 모두 남아 있을 때만 1회씩 차감. 어느 한도에 걸렸는지 돌려줌 ('ok' | 'session' | 'ip' | 'total')
-- 세션 횟수는 scope 'ai_session'(key: 세션 id:도안·변환 구분), IP별·전체 횟수는 scope 'ai'에 기록
create or replace function public.consume_ai_quota(
  p_session_key text,
  p_session_limit integer,
  p_ip_key text,
  p_ip_limit integer,
  p_total_limit integer
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
begin
  insert into api_usage (scope, key, day, count) values ('ai_session', p_session_key, today, 1)
  on conflict (scope, key, day) do update set count = api_usage.count + 1
  where api_usage.count < p_session_limit;
  if not found then
    return 'session';
  end if;

  insert into api_usage (scope, key, day, count) values ('ai', p_ip_key, today, 1)
  on conflict (scope, key, day) do update set count = api_usage.count + 1
  where api_usage.count < p_ip_limit;
  if not found then
    -- IP별 한도가 찼으면 앞에서 올린 세션 횟수를 되돌림
    update api_usage set count = count - 1 where scope = 'ai_session' and key = p_session_key and day = today;
    return 'ip';
  end if;

  insert into api_usage (scope, key, day, count) values ('ai', '*', today, 1)
  on conflict (scope, key, day) do update set count = api_usage.count + 1
  where api_usage.count < p_total_limit;
  if not found then
    -- 전체 한도가 찼으면 앞에서 올린 세션·IP별 횟수를 되돌림
    update api_usage set count = count - 1 where scope = 'ai_session' and key = p_session_key and day = today;
    update api_usage set count = count - 1 where scope = 'ai' and key = p_ip_key and day = today;
    return 'total';
  end if;

  return 'ok';
end;
$$;

-- AI 요청이 실패했을 때 세션 횟수만 1회 되돌림 (화면도 성공했을 때만 횟수를 줄임)
create or replace function public.refund_ai_session_quota(p_session_key text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update api_usage set count = count - 1
  where scope = 'ai_session' and key = p_session_key
    and day = (now() at time zone 'Asia/Seoul')::date and count > 0;
end;
$$;

revoke execute on function public.consume_ai_quota(text, integer, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.refund_ai_session_quota(text) from public, anon, authenticated;

-- 한도 확인에는 오늘 기록만 쓰므로, 비용 확인용으로 30일만 남기고 지난 기록은 매일 지움
-- 한국 시간 새벽 4시(UTC 19시)에 실행. 같은 이름으로 다시 실행하면 기존 작업을 덮어씀
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-api-usage',
  '0 19 * * *',
  $$delete from public.api_usage where day < (now() at time zone 'Asia/Seoul')::date - 30$$
);
