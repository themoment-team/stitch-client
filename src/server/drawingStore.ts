import { createClient } from "@supabase/supabase-js";
import { GRID_SIZE, type Drawing, type GridSize } from "@/types";

const TABLE = "drawings";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const isGridSize = (value: unknown): value is GridSize =>
  Object.values(GRID_SIZE).includes(value as GridSize);

/** 클라이언트에서 받은 값이 저장할 수 있는 그림인지 확인 (칸 수와 색 형식까지 검사) */
export const isValidDrawing = (value: unknown): value is Drawing => {
  if (typeof value !== "object" || value === null) return false;
  const { size, pixels } = value as Record<string, unknown>;
  return (
    isGridSize(size) &&
    Array.isArray(pixels) &&
    pixels.length === size * size &&
    pixels.every((pixel) => pixel === null || (typeof pixel === "string" && HEX_COLOR_PATTERN.test(pixel)))
  );
};

// RLS로 외부 접근을 모두 막아 두고, 서버에서만 service role 키로 읽고 씀
const getClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");

  return createClient(url, key, { auth: { persistSession: false } });
};

/** 그림을 저장하고 id를 반환 */
export const insertDrawing = async ({ size, pixels }: Drawing): Promise<string> => {
  const { data, error } = await getClient().from(TABLE).insert({ size, pixels }).select("id").single();
  if (error) throw error;
  return data.id;
};

/** id로 저장된 그림을 찾음. 없거나 id 형식이 아니면 null */
export const findDrawing = async (id: string): Promise<Drawing | null> => {
  if (!UUID_PATTERN.test(id)) return null;

  const { data, error } = await getClient().from(TABLE).select("size, pixels").eq("id", id).maybeSingle();
  if (error) throw error;
  return isValidDrawing(data) ? data : null;
};
