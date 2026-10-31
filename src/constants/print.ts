/**
 * A4 한 장에 찍을 스티커 배치 (mm)
 * 26mm 스티커를 4열 × 5행(20개)으로 놓고, 오려 쓰기 편하도록 스티커 사이를 넉넉히 띄움
 * 실제 인쇄에서 전체가 2mm 아래로 밀려 나와 위쪽 여백을 33.5mm로 줄임 (아래쪽 여백은 37.5mm)
 * 가로도 실제 인쇄에서 전체가 2mm 오른쪽으로 밀려 나와 왼쪽 여백을 26mm로 줄임 (오른쪽 여백은 29mm)
 * 줄 간격 = (297 - 위아래 여백 합 - 스티커 높이 × 줄 수) / (줄 수 - 1)
 */
export const LABEL_SHEET = {
  columns: 4,
  rows: 5,
  labelWidth: 26,
  labelHeight: 26,
  /** 용지 위쪽 끝에서 첫 줄 스티커까지 */
  marginTop: 33.5,
  /** 용지 왼쪽 끝에서 첫 칸 스티커까지 */
  marginLeft: 26,
  columnGap: 17,
  rowGap: 24,
} as const;

/** 스티커 한 칸에 들어갈 그림 크기 */
export const LABEL_DRAWING_SIZE = 26;

/** 다운로드 QR 칸에 들어갈 QR 크기 (아래 안내 문구 자리를 남김) */
export const LABEL_QR_SIZE = 15;
