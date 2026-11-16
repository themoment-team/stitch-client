import { useEffect, useRef } from "react";
import { PALETTE } from "@/constants";

interface ColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const selectedStyles = "ring-2 ring-ink ring-offset-2 ring-offset-background";

const ColorPalette = ({ value, onChange, disabled = false }: ColorPaletteProps) => {
  const isCustom = !PALETTE.includes(value);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // 선택기가 닫힐 때만 오는 기본 change 이벤트에서 포커스를 풀어,
  // 그림판이 다음 클릭을 '선택기를 닫는 클릭'으로 여겨 무시하지 않도록 함 (React onChange는 input 이벤트라 직접 구독)
  useEffect(() => {
    const input = colorInputRef.current;
    if (!input) return;

    const handleClose = () => input.blur();
    input.addEventListener("change", handleClose);
    return () => input.removeEventListener("change", handleClose);
  }, []);

  return (
    <div className={`grid grid-cols-6 justify-items-center gap-3 ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          className={`aspect-square w-full max-w-10 cursor-pointer rounded-full border border-black/5 shadow-[3px_3px_6px_var(--neu-dark),-3px_-3px_6px_var(--neu-light)] transition-transform duration-200 hover:scale-110 active:scale-90 ${value === color ? selectedStyles : ""}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          disabled={disabled}
          aria-label={`색상 ${color}`}
          aria-pressed={value === color}
        />
      ))}

      <label
        className={`relative aspect-square w-full max-w-10 cursor-pointer overflow-hidden rounded-full shadow-[3px_3px_6px_var(--neu-dark),-3px_-3px_6px_var(--neu-light)] transition-transform duration-200 hover:scale-110 active:scale-90 ${isCustom ? selectedStyles : ""}`}
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
          disabled={disabled}
        />
        <span className="sr-only">색상 직접 선택</span>
      </label>
    </div>
  );
};

export default ColorPalette;
