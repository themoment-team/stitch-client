export interface DraftTemplate {
  id: string;
  name: string;
  /** 키워드 매칭에 쓰는 다른 이름 */
  aliases: string[];
  palette: Record<string, string>;
  /** 16줄 × 16글자. 각 글자는 palette 키, "."은 빈 칸 */
  rows: string[];
}
