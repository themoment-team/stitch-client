export interface DraftTemplate {
  id: string;
  name: string;
  /** 키워드 매칭에 쓰는 다른 이름 */
  aliases: string[];
  palette: Record<string, string>;
  /** 16줄 × 16글자. 각 글자는 palette 키, "."은 빈 칸 */
  rows: string[];
  /** 32줄 × 32글자. 32×32 캔버스용으로 세밀하게 그린 버전 (없으면 rows를 2배로 키워 씀) */
  rows32?: string[];
}
