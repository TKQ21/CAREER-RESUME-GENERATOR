import {
  FONT_FAMILIES,
  ResumeStyle,
  SECTION_LABELS,
  SectionKey,
  defaultSectionTitle,
  normalizeOrder,
} from "./resume/types";


interface Props {
  style: ResumeStyle;
  onChange: (s: ResumeStyle) => void;
  onReset: () => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
        <span>{label}</span>
        <span className="text-primary">
          {value}
          {suffix ?? ""}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

export default function ResumeStyleControls({ style, onChange, onReset }: Props) {
  const set = <K extends keyof ResumeStyle>(key: K, value: ResumeStyle[K]) =>
    onChange({ ...style, [key]: value });

  const toggleSection = (key: SectionKey) =>
    set(
      "hidden",
      style.hidden.includes(key) ? style.hidden.filter((k) => k !== key) : [...style.hidden, key],
    );

  return (
    <div className="no-print rounded-md border border-border bg-card/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-mono text-muted-foreground">FONT · SIZE · SPACING · SECTIONS</p>
        <button
          type="button"
          onClick={onReset}
          className="text-[10px] font-mono text-primary hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-[10px] font-mono text-muted-foreground mb-1">FONT STYLE</span>
          <select
            value={style.font}
            onChange={(e) => set("font", e.target.value as ResumeStyle["font"])}
            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <p className="text-[10px] font-mono text-muted-foreground">
            Headings always bold · rename sections niche
          </p>
        </div>


        <Slider
          label="TEXT SIZE"
          value={style.size}
          min={0.8}
          max={1.25}
          step={0.01}
          suffix="x"
          onChange={(v) => set("size", v)}
        />
        <Slider
          label="LINE SPACING"
          value={style.lineHeight}
          min={1}
          max={2}
          step={0.05}
          onChange={(v) => set("lineHeight", v)}
        />
        <Slider
          label="SECTION SPACING"
          value={style.sectionGap}
          min={0}
          max={32}
          step={1}
          suffix="px"
          onChange={(v) => set("sectionGap", v)}
        />
        <Slider
          label="PAGE MARGIN (SIDES)"
          value={style.marginX}
          min={16}
          max={80}
          step={2}
          suffix="px"
          onChange={(v) => set("marginX", v)}
        />
        <Slider
          label="PAGE MARGIN (TOP/BOTTOM)"
          value={style.marginY}
          min={12}
          max={80}
          step={2}
          suffix="px"
          onChange={(v) => set("marginY", v)}
        />
      </div>

      <div>
        <span className="block text-[10px] font-mono text-muted-foreground mb-2">
          SECTIONS (tap to remove / add back)
        </span>
        <div className="flex flex-wrap gap-2">
          {SECTION_LABELS.map(({ key, label }) => {
            const on = !style.hidden.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSection(key)}
                className={`px-3 py-1 rounded-md text-xs font-mono border transition-all ${
                  on
                    ? "border-primary/70 text-primary"
                    : "border-border text-muted-foreground line-through hover:border-primary/40"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="block text-[10px] font-mono text-muted-foreground mb-2">
          SECTION NAMES (rename headings)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SECTION_LABELS.map(({ key, label }) => (
            <input
              key={key}
              value={style.titles?.[key] ?? ""}
              placeholder={label}
              onChange={(e) => set("titles", { ...style.titles, [key]: e.target.value })}
              className="w-full bg-card border border-border rounded-md px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

