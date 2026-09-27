/**
 * A4 10칸 라벨지(2열 × 5행) 규격 (mm)
 * 흔히 쓰는 99.1 × 57mm 라벨 기준. 사용하는 라벨지 제품의 규격표와 다르면 여기만 고치면 됨
 */
export const LABEL_SHEET = {
  columns: 2,
  rows: 5,
  labelWidth: 99.1,
  labelHeight: 57,
  /** 용지 위쪽 끝에서 첫 줄 라벨까지 */
  marginTop: 6,
  /** 용지 왼쪽 끝에서 첫 칸 라벨까지 */
  marginLeft: 4.65,
  columnGap: 2.5,
  rowGap: 0,
} as const;

/** 라벨 한 칸에 들어갈 그림 크기 (라벨 높이보다 조금 작게 여백을 둠) */
export const LABEL_DRAWING_SIZE = 45;

/** 다운로드 QR 칸에 들어갈 QR 크기 */
export const LABEL_QR_SIZE = 40;
