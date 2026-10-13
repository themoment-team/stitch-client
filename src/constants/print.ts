/**
 * A4 한 장에 찍을 스티커 배치 (mm)
 * 26mm 스티커를 4열 × 6행(24개)으로 놓고, 오려 쓰기 편하도록 스티커 사이를 20mm씩 넉넉히 띄움
 * 스티커 묶음(164 × 256mm)이 용지 가운데 오도록 위·왼쪽 여백을 잡음
 * 크기나 개수를 바꾸면 여백도 (용지 크기 - 묶음 크기) / 2로 다시 맞춤
 */
export const LABEL_SHEET = {
  columns: 4,
  rows: 6,
  labelWidth: 26,
  labelHeight: 26,
  /** 용지 위쪽 끝에서 첫 줄 스티커까지 */
  marginTop: 20.5,
  /** 용지 왼쪽 끝에서 첫 칸 스티커까지 */
  marginLeft: 23,
  columnGap: 20,
  rowGap: 20,
} as const;

/** 스티커 한 칸에 들어갈 그림 크기 */
export const LABEL_DRAWING_SIZE = 26;

/** 다운로드 QR 칸에 들어갈 QR 크기 (아래 안내 문구 자리를 남김) */
export const LABEL_QR_SIZE = 15;
