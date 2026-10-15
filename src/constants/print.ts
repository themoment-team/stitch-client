/**
 * A4 한 장에 찍을 스티커 배치 (mm)
 * 26mm 스티커를 4열 × 5행(20개)으로 놓고, 오려 쓰기 편하도록 스티커 사이를 넉넉히 띄움
 * 위아래 여백 35.5mm를 두고, 나머지 세로 공간은 줄 간격으로 채움
 * 가로는 3번째 열 위치(왼쪽 끝 114mm)에 맞춰 열 간격을 정하고 왼쪽 여백을 맞춤 (오른쪽 여백은 27mm)
 * 줄 간격 = (297 - 위아래 여백 - 스티커 높이 × 줄 수) / (줄 수 - 1)
 */
export const LABEL_SHEET = {
  columns: 4,
  rows: 5,
  labelWidth: 26,
  labelHeight: 26,
  /** 용지 위쪽 끝에서 첫 줄 스티커까지 */
  marginTop: 35.5,
  /** 용지 왼쪽 끝에서 첫 칸 스티커까지 */
  marginLeft: 28,
  columnGap: 17,
  rowGap: 24,
} as const;

/** 스티커 한 칸에 들어갈 그림 크기 */
export const LABEL_DRAWING_SIZE = 26;

/** 다운로드 QR 칸에 들어갈 QR 크기 (아래 안내 문구 자리를 남김) */
export const LABEL_QR_SIZE = 15;
