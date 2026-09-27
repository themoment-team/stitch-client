import { createClient } from "@supabase/supabase-js";

// RLS로 외부 접근을 모두 막아 두고, 서버에서만 service role 키로 읽고 씀
export const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");

  return createClient(url, key, { auth: { persistSession: false } });
};
