import { revalidateTag, unstable_cache } from "next/cache";
import { BOARD_DRAWING_LIMIT } from "@/constants";
import { type BoardDrawing, GRID_SIZE, type Drawing, type GridSize } from "@/types";
import { getSupabase } from "./supabase";

const TABLE = "drawings";
/**
 * 공유 페이지 조회 결과를 캐시에 두는 시간(초). 저장된 그림은 바뀌지 않아 QR을 다시 찍어도 DB에 접근하지 않음
 * 나중에 그림을 지우는 정리 작업을 둔다면 보존 기간에 이 시간 이상 여유를 둬야 지운 그림이 캐시에서 나오지 않음
 */
const DRAWING_CACHE_SECONDS = 60 * 60 * 24;
/**
 * 보드에 띄울 최신 그림 목록을 캐시에 두는 시간(초). 보드를 띄운 화면이 여러 개이거나 누군가 API를 반복 호출해도
 * DB에는 이 간격으로만 접근함. 만료 뒤 첫 요청은 이전 목록을 받으므로(stale-while-revalidate),
 * 새 그림은 저장할 때 RECENT_DRAWINGS_TAG로 캐시를 바로 지워 다음 폴링에서 받게 함
 */
const RECENT_DRAWINGS_CACHE_SECONDS = 5;
const RECENT_DRAWINGS_TAG = "recent-drawings";
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
  // 보드가 이전 목록을 받지 않도록 바로 만료시켜, 다음 조회는 기다렸다가 새 목록을 받게 함
  // 저장은 이미 끝났으므로 만료에 실패해도 오류로 돌려보내지 않음 (다시 시도하면 같은 그림이 두 번 저장됨)
  try {
    revalidateTag(RECENT_DRAWINGS_TAG, { expire: 0 });
  } catch (error) {
    console.error(error);
  }
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

// 요청마다 조건을 달리하지 않고 최신 목록 하나만 캐시해, 호출하는 쪽이 몇 곳이든 캐시 항목이 늘지 않음
const selectRecentDrawings = unstable_cache(
  async (): Promise<BoardDrawing[]> => {
    const { data, error } = await getSupabase()
      .from(TABLE)
      .select("id, size, pixels, created_at")
      .order("created_at", { ascending: false })
      .limit(BOARD_DRAWING_LIMIT);
    if (error) throw error;

    // 형식이 깨진 행은 보드 전체가 멈추지 않도록 건너뜀
    return data
      .filter(isValidDrawing)
      .map(({ id, size, pixels, created_at }) => ({ id, size, pixels, createdAt: created_at }));
  },
  [TABLE, "recent"],
  { revalidate: RECENT_DRAWINGS_CACHE_SECONDS, tags: [RECENT_DRAWINGS_TAG] },
);

/**
 * 보드에 띄울 최신 그림을 새것부터 반환. after(타임스탬프)를 주면 그 시각 이후에 저장된 그림만 반환
 * DB 시각은 마이크로초까지 있어 밀리초로 비교하면 같은 시각이 될 수 있으므로, 같은 시각도 포함하고 중복은 받는 쪽에서 id로 거름
 */
export const findRecentDrawings = async (after?: number): Promise<BoardDrawing[]> => {
  const drawings = await selectRecentDrawings();
  if (after === undefined) return drawings;
  return drawings.filter(({ createdAt }) => Date.parse(createdAt) >= after);
};
