import { useCallback, useId } from "react";
import { PALETTE } from "@/constants";

interface ColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
  /** 기본 팔레트 아래에 따로 보여줄 색 (도안에 쓰인 색 등). 비어 있으면 보이지 않음 */
  suggestedColors?: string[];
  /** 추가 색 묶음 위에 붙일 이름 */
  suggestedLabel?: string;
  disabled?: boolean;
  /** 브라우저 기본 색상 선택기가 열리고 닫힐 때 */
  onPickerOpenChange?: (open: boolean) => void;
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

const ColorPalette = ({
  value,
  onChange,
  suggestedColors = [],
  suggestedLabel,
  disabled = false,
  onPickerOpenChange,
}: ColorPaletteProps) => {
  // 추가 색을 고른 경우에도 직접 선택(무지개) 칸이 선택된 것처럼 보이지 않도록 둘 다 확인
  const isCustom = !PALETTE.includes(value) && !suggestedColors.includes(value);
  const suggestedLabelId = useId();

  // 선택기는 색을 확정하면 change, Esc·취소로 닫으면 cancel을 보냄 (React onChange는 input 이벤트라 직접 구독)
  // 요소가 다시 붙어도 리스너가 따라가도록 ref 콜백으로 붙임
  const colorInputRef = useCallback(
    (input: HTMLInputElement | null) => {
      if (!input || !onPickerOpenChange) return;

      const handleClose = () => onPickerOpenChange(false);
      input.addEventListener("change", handleClose);
      input.addEventListener("cancel", handleClose);
      return () => {
        input.removeEventListener("change", handleClose);
        input.removeEventListener("cancel", handleClose);
      };
    },
    [onPickerOpenChange],
  );

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
            ref={colorInputRef}
            onChange={(event) => onChange(event.target.value)}
            // Tab으로 포커스만 옮긴 경우는 열린 게 아니므로, 눌러서 선택기를 열 때만 열림으로 봄
            // blur는 선택기가 별도 창으로 뜰 때(macOS 등) 열자마자 올 수 있어 닫힘 신호로 쓰지 않음
            onClick={() => onPickerOpenChange?.(true)}
            disabled={disabled}
          />
          <span className="sr-only">색상 직접 선택</span>
        </label>
      </div>

      {suggestedColors.length > 0 && (
        // 화면 낭독기에서도 아래 색들이 어떤 묶음인지 들리도록 이름을 붙인 그룹으로 묶음
        <div role="group" aria-labelledby={suggestedLabel ? suggestedLabelId : undefined} className="flex flex-col gap-3">
          {suggestedLabel && (
            <span id={suggestedLabelId} className="text-xs font-semibold text-muted">
              {suggestedLabel}
            </span>
          )}
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
