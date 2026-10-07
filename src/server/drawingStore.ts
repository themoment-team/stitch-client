import { unstable_cache } from "next/cache";
import { GRID_SIZE, type Drawing, type GridSize } from "@/types";
import { getSupabase } from "./supabase";

const TABLE = "drawings";
/**
 * 공유 페이지 조회 결과를 캐시에 두는 시간(초). 저장된 그림은 바뀌지 않아 QR을 다시 찍어도 DB에 접근하지 않음
 * 나중에 그림을 지우는 정리 작업을 둔다면 보존 기간에 이 시간 이상 여유를 둬야 지운 그림이 캐시에서 나오지 않음
 */
const DRAWING_CACHE_SECONDS = 60 * 60 * 24;
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

/** 그림을 저장하고 id를 반환 */
export const insertDrawing = async ({ size, pixels }: Drawing): Promise<string> => {
  const { data, error } = await getSupabase().from(TABLE).insert({ size, pixels }).select("id").single();
  if (error) throw error;
  return data.id;
};

// 없는 id의 결과(null)도 캐시해 같은 주소를 반복 조회해도 DB에 닿지 않음. 오류는 캐시하지 않음
const selectDrawing = unstable_cache(
  async (id: string): Promise<Drawing | null> => {
    const { data, error } = await getSupabase().from(TABLE).select("size, pixels").eq("id", id).maybeSingle();
    if (error) throw error;
    return isValidDrawing(data) ? data : null;
  },
  [TABLE],
  { revalidate: DRAWING_CACHE_SECONDS },
);

/** id로 저장된 그림을 찾음. 없거나 id 형식이 아니면 null */
export const findDrawing = async (id: string): Promise<Drawing | null> => {
  // 형식이 틀린 주소로 캐시가 쌓이지 않도록 캐시 조회 전에 거름. 대소문자만 다른 id는 같은 캐시를 씀
  if (!UUID_PATTERN.test(id)) return null;
  return selectDrawing(id.toLowerCase());
};
