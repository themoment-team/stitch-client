import { LABEL_LAYOUT_STEP, SMALL_PRIMARY_BUTTON_STYLES, SMALL_SECONDARY_BUTTON_STYLES } from "@/constants";
import type { LabelLayout } from "@/types";

interface LabelLayoutPanelProps {
  layout: LabelLayout;
  onChange: (layout: LabelLayout) => void;
  onReset: () => void;
}

interface Control {
  key: keyof LabelLayout;
  label: string;
  /** 값을 줄이는 버튼과 늘리는 버튼에 붙일 이름 */
  decrease: string;
  increase: string;
}

const CONTROLS: Control[] = [
  { key: "centerY", label: "전체 위아래 위치", decrease: "위로", increase: "아래로" },
  { key: "centerX", label: "전체 좌우 위치", decrease: "왼쪽", increase: "오른쪽" },
  { key: "centerColumnGap", label: "2·3번째 열 사이 (모든 열이 함께 벌어짐)", decrease: "좁게", increase: "넓게" },
  { key: "columnGap", label: "1·2번째, 3·4번째 열 사이", decrease: "좁게", increase: "넓게" },
  { key: "rowGap", label: "줄 간격 (3번째 줄 기준, 모든 줄이 함께 벌어짐)", decrease: "좁게", increase: "넓게" },
  { key: "outerRowGap", label: "1·2번째, 4·5번째 줄 사이", decrease: "좁게", increase: "넓게" },
];

const formatMm = (value: number) => `${Number(value.toFixed(2))}mm`;

/**
 * 실제 라벨지에 맞춰 인쇄 위치를 조정하는 패널 (출력 화면 주소에 ?calibrate를 붙였을 때만 보임)
 * 간격은 가운데를 기준으로 양쪽에 똑같이 펼쳐지고, 바꾼 값은 그 기기에 저장됨
 */
const LabelLayoutPanel = ({ layout, onChange, onReset }: LabelLayoutPanelProps) => {
  const handleStep = (key: keyof LabelLayout, direction: 1 | -1) =>
    onChange({ ...layout, [key]: Math.max(0, layout[key] + LABEL_LAYOUT_STEP * direction) });

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3 rounded-3xl bg-background p-4 text-left shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">인쇄 위치 조정</span>
        <button type="button" onClick={onReset} className={SMALL_SECONDARY_BUTTON_STYLES}>
          기본값으로
        </button>
      </div>
      <p className="text-xs text-muted">버튼 한 번에 {formatMm(LABEL_LAYOUT_STEP)}씩 움직여요. 바꾼 값은 이 기기에 저장돼요.</p>
      <div className="flex flex-col gap-2">
        {CONTROLS.map(({ key, label, decrease, increase }) => (
          <div key={key} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted">{label}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleStep(key, -1)} className={SMALL_PRIMARY_BUTTON_STYLES}>
                {decrease}
              </button>
              <span className="w-16 text-center text-sm font-semibold text-ink tabular-nums">
                {formatMm(layout[key])}
              </span>
              <button type="button" onClick={() => handleStep(key, 1)} className={SMALL_PRIMARY_BUTTON_STYLES}>
                {increase}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabelLayoutPanel;
