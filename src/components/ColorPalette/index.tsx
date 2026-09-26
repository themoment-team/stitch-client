import { PALETTE } from "@/constants";

interface ColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const selectedStyles = "ring-2 ring-ink ring-offset-2 ring-offset-background";

const ColorPalette = ({ value, onChange, disabled = false }: ColorPaletteProps) => {
  const isCustom = !PALETTE.includes(value);

  return (
    <div className={`grid grid-cols-6 justify-items-center gap-3 ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          className={`aspect-square w-full max-w-10 cursor-pointer rounded-full border border-black/5 shadow-[3px_3px_6px_var(--neu-dark),-3px_-3px_6px_var(--neu-light)] transition-transform duration-200 hover:scale-110 ${value === color ? selectedStyles : ""}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          disabled={disabled}
          aria-label={`색상 ${color}`}
          aria-pressed={value === color}
        />
      ))}

      <label
        className={`relative aspect-square w-full max-w-10 cursor-pointer overflow-hidden rounded-full shadow-[3px_3px_6px_var(--neu-dark),-3px_-3px_6px_var(--neu-light)] transition-transform duration-200 hover:scale-110 ${isCustom ? selectedStyles : ""}`}
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
  );
};

export default ColorPalette;
