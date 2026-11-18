import type { LabelLayout } from "@/types";

/** A4 용지 크기 (mm) */
export const PAPER_SIZE = { width: 210, height: 297 } as const;

/**
 * 스티커 한 칸에 들어갈 그림 크기 (mm)
 * 정사각형 그림의 네 모서리가 지름 48mm 원 안에 들어가는 최대 크기는 48 / √2 ≈ 33.9mm
 * 프린터가 조금 밀려 찍혀도 모서리가 원을 넘지 않도록 모서리마다 1mm 정도 여유를 두어 32mm로 함
 */
export const LABEL_DRAWING_SIZE = 32;

/**
 * A4 한 장에 찍을 스티커 배치 (mm)
 * 그림 크기만 한 칸을 4열 × 5행(20개)으로 놓음
 * 열은 짝수, 줄은 홀수여야 가운데 두 열 사이와 가운데 줄을 기준으로 펼칠 수 있음
 */
export const LABEL_SHEET = {
  columns: 4,
  rows: 5,
  labelWidth: LABEL_DRAWING_SIZE,
  labelHeight: LABEL_DRAWING_SIZE,
} as const;

/**
 * 라벨지 규격 (mm). 지름 48mm 원형 라벨이 4열 × 5행
 * 가로: 용지 끝에서 첫 원까지 좌우 6mm, 원 사이는 남는 길이를 고르게 나눈 2mm ((210 - 6×2 - 48×4) / 3)
 * 세로: 첫 줄 원은 용지 위쪽 끝에서 17mm, 원 사이 6mm
 * 라벨지를 잰 값만 두고, 프린터 때문에 생기는 오차는 아래 PRINT_ROW_DRIFT에 따로 둠
 */
const LABEL_PAPER = { diameter: 48, marginLeft: 6, marginRight: 6, marginTop: 17, rowGap: 6 } as const;

/**
 * 줄마다 더하는 프린터 오차 보정 (mm). 라벨지 규격이 아니라 지금 쓰는 프린터에 맞춘 값
 * 실제 출력에서 첫 줄은 맞고 아래 줄로 갈수록 1mm씩 밀려 내려가, 줄마다 1mm씩 덜 내려가게 함
 * 프린터를 바꾸면 이 값만 다시 맞추면 됨 (밀리지 않는 프린터라면 0)
 */
const PRINT_ROW_DRIFT = -1;

/** 좌우 여백을 뺀 너비에 원을 놓고 남는 길이를 고르게 나눈 원 사이 가로 간격 */
const LABEL_COLUMN_GAP =
  (PAPER_SIZE.width - LABEL_PAPER.marginLeft - LABEL_PAPER.marginRight - LABEL_PAPER.diameter * LABEL_SHEET.columns) /
  (LABEL_SHEET.columns - 1);

/** 원 하나의 중심에서 옆·아래 원의 중심까지 */
const LABEL_PITCH = {
  x: LABEL_PAPER.diameter + LABEL_COLUMN_GAP,
  y: LABEL_PAPER.diameter + LABEL_PAPER.rowGap + PRINT_ROW_DRIFT,
} as const;

/**
 * 기본 위치. 가로 가운데는 좌우 여백을 뺀 영역의 한가운데, 세로 가운데는 첫 줄에서 원 중심 간격만큼 내려간 가운데 줄
 * 스티커 사이를 원 중심 간격에 맞춰 그림이 원마다 정가운데에 오게 함
 * 프린터마다 밀리는 정도가 달라, 출력 화면 주소에 ?calibrate를 붙여 들어가면 직접 맞출 수 있음
 */
export const DEFAULT_LABEL_LAYOUT: LabelLayout = {
  centerX: (LABEL_PAPER.marginLeft + PAPER_SIZE.width - LABEL_PAPER.marginRight) / 2,
  centerY: LABEL_PAPER.marginTop + LABEL_PAPER.diameter / 2 + ((LABEL_SHEET.rows - 1) / 2) * LABEL_PITCH.y,
  centerColumnGap: LABEL_PITCH.x - LABEL_SHEET.labelWidth,
  columnGap: LABEL_PITCH.x - LABEL_SHEET.labelWidth,
  rowGap: LABEL_PITCH.y - LABEL_SHEET.labelHeight,
  // 줄 위치는 가운데 줄 기준으로 위아래에 똑같이 펼쳐짐(getRowTop). 바깥 줄 간격도 안쪽과 같아야
  // 첫 줄이 위 centerY 계산대로 marginTop(17mm)에 놓임. 바깥 줄만 따로 바꾸면 첫 줄도 함께 밀림
  outerRowGap: LABEL_PITCH.y - LABEL_SHEET.labelHeight,
};

/**
 * 출력 화면에서 맞춘 위치를 그 기기에 저장해 두는 키
 * 이전 배치 기준으로 맞춰 둔 값이 새 라벨지 배치를 덮어쓰지 않도록 키를 바꿈
 */
export const LABEL_LAYOUT_STORAGE_KEY = "stitch:label-layout:circle-48";

/** 이전 배치에서 쓰던 저장 키. 더는 읽지 않으므로 기기에 남지 않게 지움 */
export const LEGACY_LABEL_LAYOUT_STORAGE_KEYS = ["stitch:label-layout", "stitch:label-layout:classic"] as const;

/** 위치 조정 버튼 한 번에 움직이는 거리 (mm) */
export const LABEL_LAYOUT_STEP = 0.5;

/** Shift를 누른 채 버튼을 누르면 움직이는 거리 (mm). 마지막 미세 조정용 */
export const LABEL_LAYOUT_FINE_STEP = 0.1;

/** 다운로드 QR 칸에 들어갈 QR 크기 (아래 안내 문구 자리를 남김) */
export const LABEL_QR_SIZE = 15;
