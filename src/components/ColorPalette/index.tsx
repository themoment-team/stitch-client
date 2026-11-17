import { PALETTE } from "@/constants";

interface ColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
  /** 기본 팔레트 아래에 따로 보여줄 색 (도안에 쓰인 색 등). 비어 있으면 보이지 않음 */
  suggestedColors?: string[];
  /** 추가 색 묶음 위에 붙일 이름 */
  suggestedLabel?: string;
  disabled?: boolean;
}

const selectedStyles = "ring-2 ring-ink ring-offset-2 ring-offset-background";
const swatchStyles =
  "aspect-square w-full max-w-10 cursor-pointer rounded-full shadow-[3px_3px_6px_var(--neu-dark),-3px_-3px_6px_var(--neu-light)] transition-transform duration-200 hover:scale-110 active:scale-90";

interface SwatchProps {
  color: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (color: string) => void;
}

const Swatch = ({ color, selected, disabled, onSelect }: SwatchProps) => (
  <button
    type="button"
    className={`${swatchStyles} border border-black/5 ${selected ? selectedStyles : ""}`}
    style={{ backgroundColor: color }}
    onClick={() => onSelect(color)}
    disabled={disabled}
    aria-label={`색상 ${color}`}
    aria-pressed={selected}
  />
);

const ColorPalette = ({ value, onChange, suggestedColors = [], suggestedLabel, disabled = false }: ColorPaletteProps) => {
  // 추가 색을 고른 경우에도 직접 선택(무지개) 칸이 선택된 것처럼 보이지 않도록 둘 다 확인
  const isCustom = !PALETTE.includes(value) && !suggestedColors.includes(value);

  return (
    <div className={`flex flex-col gap-4 ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      <div className="grid grid-cols-6 justify-items-center gap-3">
        {PALETTE.map((color) => (
          <Swatch key={color} color={color} selected={value === color} disabled={disabled} onSelect={onChange} />
        ))}

        <label
          className={`relative overflow-hidden ${swatchStyles} ${isCustom ? selectedStyles : ""}`}
          style={{
            background: isCustom
              ? value
              : "conic-gradient(#ff5a5f, #ffd93d, #6bcb77, #4d96ff, #6c5ce7, #f78fb3, #ff5a5f)",
          }}
        >
          <input
            type="color"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
          />
          <span className="sr-only">색상 직접 선택</span>
        </label>
      </div>

      {suggestedColors.length > 0 && (
        <div className="flex flex-col gap-3">
          {suggestedLabel && <span className="text-xs font-semibold text-muted">{suggestedLabel}</span>}
          <div className="grid grid-cols-6 justify-items-center gap-3">
            {suggestedColors.map((color) => (
              <Swatch key={color} color={color} selected={value === color} disabled={disabled} onSelect={onChange} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPalette;
