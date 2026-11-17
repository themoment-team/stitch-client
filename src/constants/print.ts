import type { LabelLayout } from "@/types";

/** A4 용지 크기 (mm) */
export const PAPER_SIZE = { width: 210, height: 297 } as const;

/**
 * A4 한 장에 찍을 스티커 배치 (mm)
 * 26mm 스티커를 4열 × 5행(20개)으로 놓음
 * 열은 짝수, 줄은 홀수여야 가운데 두 열 사이와 가운데 줄을 기준으로 펼칠 수 있음
 */
export const LABEL_SHEET = {
  columns: 4,
  rows: 5,
  labelWidth: 26,
  labelHeight: 26,
} as const;

/**
 * 예전 고정 배치 (mm). 오려 쓰기 편하도록 스티커 사이를 넉넉히 띄움
 * 위 여백 35.5mm, 왼쪽 여백 28mm(오른쪽 27mm), 열 간격 17mm, 줄 간격 24mm
 */
const CLASSIC_LAYOUT = { marginTop: 35.5, marginLeft: 28, columnGap: 17, rowGap: 24 } as const;

/**
 * 기본 위치. 예전 고정 배치와 같은 자리에 찍히도록 가운데 기준 값으로 바꿔 둠
 * 프린터마다 밀리는 정도가 달라, 출력 화면 주소에 ?calibrate를 붙여 들어가면 직접 맞출 수 있음
 */
export const DEFAULT_LABEL_LAYOUT: LabelLayout = {
  // 가운데 두 열 사이 한가운데 = 왼쪽 두 열 끝 + 가운데 간격의 절반
  centerX:
    CLASSIC_LAYOUT.marginLeft +
    (LABEL_SHEET.columns / 2) * LABEL_SHEET.labelWidth +
    (LABEL_SHEET.columns / 2 - 1) * CLASSIC_LAYOUT.columnGap +
    CLASSIC_LAYOUT.columnGap / 2,
  // 가운데 줄의 한가운데 = 위쪽 줄들 + 가운데 줄 높이의 절반
  centerY:
    CLASSIC_LAYOUT.marginTop +
    ((LABEL_SHEET.rows - 1) / 2) * (LABEL_SHEET.labelHeight + CLASSIC_LAYOUT.rowGap) +
    LABEL_SHEET.labelHeight / 2,
  centerColumnGap: CLASSIC_LAYOUT.columnGap,
  columnGap: CLASSIC_LAYOUT.columnGap,
  rowGap: CLASSIC_LAYOUT.rowGap,
  outerRowGap: CLASSIC_LAYOUT.rowGap,
};

/**
 * 출력 화면에서 맞춘 위치를 그 기기에 저장해 두는 키
 * 원형 라벨지 기준으로 맞춰 둔 값이 예전 배치를 덮어쓰지 않도록 키를 바꿈
 */
export const LABEL_LAYOUT_STORAGE_KEY = "stitch:label-layout:classic";

/** 위치 조정 버튼 한 번에 움직이는 거리 (mm) */
export const LABEL_LAYOUT_STEP = 0.5;

/** 스티커 한 칸에 들어갈 그림 크기 */
export const LABEL_DRAWING_SIZE = 26;

/** 다운로드 QR 칸에 들어갈 QR 크기 (아래 안내 문구 자리를 남김) */
export const LABEL_QR_SIZE = 15;
