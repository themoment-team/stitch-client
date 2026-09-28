/**
 * A4 12칸 라벨지(2열 × 6행) 규격 (mm)
 * 라벨박사 12칸(2X6) 99 × 45mm 기준. 제조사가 여백을 공개하지 않아 라벨 6줄(270mm)이 용지 가운데 오도록 잡음
 * 사용하는 라벨지 제품의 규격표와 다르면 여기만 고치면 됨
 */
export const LABEL_SHEET = {
  columns: 2,
  rows: 6,
  labelWidth: 99,
  labelHeight: 45,
  /** 용지 위쪽 끝에서 첫 줄 라벨까지 */
  marginTop: 13.5,
  /** 용지 왼쪽 끝에서 첫 칸 라벨까지 */
  marginLeft: 5,
  columnGap: 2,
  rowGap: 0,
} as const;

/** 라벨 한 칸에 들어갈 그림 크기 (라벨 높이보다 조금 작게 여백을 둠) */
export const LABEL_DRAWING_SIZE = 40;

/** 다운로드 QR 칸에 들어갈 QR 크기 */
export const LABEL_QR_SIZE = 28;
