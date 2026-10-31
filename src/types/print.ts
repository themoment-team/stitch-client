/**
 * 라벨지에 스티커를 놓는 위치 (mm). 가운데를 기준으로 잡아, 간격을 바꿔도 가운데는 그대로 두고 양쪽으로 펼쳐짐
 */
export interface LabelLayout {
  /** 용지 왼쪽 끝에서 가운데 두 열 사이 한가운데까지 */
  centerX: number;
  /** 용지 위쪽 끝에서 가운데 줄의 한가운데까지 */
  centerY: number;
  /** 가운데 두 열 사이 간격 */
  centerColumnGap: number;
  /** 가운데를 뺀 나머지 열 사이 간격 */
  columnGap: number;
  /** 가운데 쪽 줄 사이 간격 */
  rowGap: number;
  /** 맨 위·맨 아래 줄과 그 안쪽 줄 사이 간격 */
  outerRowGap: number;
}
