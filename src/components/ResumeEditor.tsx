import { useRef, useState } from "react";
import { ResumeData, ResumeEntry } from "./resume/types";

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const inputCls =
  "w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary transition-all";

type Ctl = HTMLInputElement | HTMLTextAreaElement;

/** Wraps the current text selection with `before` / `after` (toggles ** off again). */
function wrapSelection(el: Ctl | null, onChange: (v: string) => void, before: string, after: string) {
  if (!el) return;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (start === end) return;
  const value = el.value;
  const sel = value.slice(start, end);
  const isBold = before === "**" && /^\*\*[\s\S]+\*\*$/.test(sel);
  const replaced = isBold ? sel.slice(2, -2) : `${before}${sel}${after}`;
  const next = value.slice(0, start) + replaced + value.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    const offset = isBold ? -2 : before.length;
    el.setSelectionRange(start + Math.max(0, offset), start + replaced.length - (isBold ? 0 : after.length));
  });
}

function ToolBar({ el, onChange }: { el: () => Ctl | null; onChange: (v: string) => void }) {
  const btn =
    "px-2 py-[2px] rounded border border-border text-[10px] font-mono text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors";
  return (
    <span className="flex gap-1">
      <button type="button" className={btn} onClick={() => wrapSelection(el(), onChange, "**", "**")}>
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => wrapSelection(el(), onChange, "[", "](https://paste-link-here)")}
      >
        LINK
      </button>
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  rich,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rich?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground mb-1">
        <span>{label}</span>
        {rich && <ToolBar el={() => ref.current} onChange={onChange} />}
      </span>
      <input
        ref={ref}
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (rich && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            wrapSelection(ref.current, onChange, "**", "**");
          }
        }}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function RichArea({
  label,
  value,
  onChange,
  minH = "90px",
  onEnter,
  onEmptyBackspace,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  minH?: string;
  onEnter?: () => void;
  onEmptyBackspace?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="block w-full">
      <span className="flex items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground mb-1">
        <span>{label ?? ""}</span>
        <ToolBar el={() => ref.current} onChange={onChange} />
      </span>
      <textarea
        ref={ref}
        className={`${inputCls} resize-y`}
        style={{ minHeight: minH }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            wrapSelection(ref.current, onChange, "**", "**");
            return;
          }
          if (onEnter && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnter();
          }
          if (onEmptyBackspace && e.key === "Backspace" && value === "") {
            e.preventDefault();
            onEmptyBackspace();
          }
        }}
      />
    </div>
  );
}

const parseCommaList = (value: string) =>
  value.split(",").map((item) => item.trim()).filter(Boolean);

function CommaListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState(values.join(", "));

  return (
    <Field
      label={label}
      value={draft}
      rich
      onChange={(value) => {
        setDraft(value);
        onChange(parseCommaList(value));
      }}
    />
  );
}

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-mono text-muted-foreground">BULLET POINTS</span>
      {bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-primary font-mono pt-6">•</span>
          <RichArea
            value={b}
            minH="52px"
            onChange={(v) => {
              const next = [...bullets];
              next[i] = v;
              onChange(next);
            }}
            onEnter={() => {
              const next = [...bullets];
              next.splice(i + 1, 0, "");
              onChange(next);
            }}
            onEmptyBackspace={() => {
              if (bullets.length > 1) onChange(bullets.filter((_, j) => j !== i));
            }}
          />
          <button
            type="button"
            onClick={() => onChange(bullets.filter((_, j) => j !== i))}
            className="text-muted-foreground hover:text-destructive font-mono text-xs pt-6"
            aria-label="Remove bullet"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...bullets, ""])}
        className="text-xs font-mono text-primary hover:underline"
      >
        + Add bullet
      </button>
    </div>
  );
}

function EntryListEditor({
  title,
  entries,
  onChange,
}: {
  title: string;
  entries: ResumeEntry[];
  onChange: (e: ResumeEntry[]) => void;
}) {
  const update = (i: number, patch: Partial<ResumeEntry>) =>
    onChange(entries.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  return (
    <section className="space-y-3">
      <h3 className="font-display font-semibold text-foreground text-sm">{title}</h3>
      {entries.map((e, i) => (
        <div key={i} className="rounded-md border border-border bg-card/40 p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="TITLE" value={e.title} rich onChange={(v) => update(i, { title: v })} />
            <Field label="SUBTITLE" value={e.subtitle ?? ""} rich onChange={(v) => update(i, { subtitle: v })} />
            <Field
              label="LINK NAME (jo dikhega)"
              value={e.linkLabel ?? ""}
              placeholder="e.g. LINK / GitHub / Certificate"
              onChange={(v) => update(i, { linkLabel: v })}
            />
            <Field
              label="LINK URL (paste karo)"
              value={e.linkUrl ?? ""}
              placeholder="https://..."
              onChange={(v) => update(i, { linkUrl: v })}
            />
            <Field label="LOCATION" value={e.location ?? ""} onChange={(v) => update(i, { location: v })} />
            <Field label="DATES" value={e.dates ?? ""} onChange={(v) => update(i, { dates: v })} />
          </div>
          <BulletEditor bullets={e.bullets} onChange={(b) => update(i, { bullets: b })} />
          <button
            type="button"
            onClick={() => onChange(entries.filter((_, j) => j !== i))}
            className="text-xs font-mono text-destructive hover:underline"
          >
            Remove this entry
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...entries, { title: "", bullets: [""] }])}
        className="text-xs font-mono text-primary hover:underline"
      >
        + Add {title.toLowerCase()} entry
      </button>
    </section>
  );
}

export default function ResumeEditor({ data, onChange }: ResumeEditorProps) {
  const set = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => onChange({ ...data, [key]: value });

  return (
    <div className="no-print mt-8 rounded-md border border-border bg-card/30 p-4 space-y-5">
      <div>
        <h2 className="font-display font-semibold text-lg text-foreground">Edit Resume Content</h2>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Word select karke <span className="text-primary">B</span> dabao = bold (Ctrl/Cmd + B bhi chalega) ·
          text select karke <span className="text-primary">LINK</span> = clickable link (URL chhupa rehta hai)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field label="NAME" value={data.name} onChange={(v) => set("name", v)} />
        <Field label="HEADLINE" value={data.headline} rich onChange={(v) => set("headline", v)} />
      </div>

      <CommaListField
        label="CONTACT (comma separated)"
        values={data.contact}
        onChange={(values) => set("contact", values)}
      />

      <RichArea label="SUMMARY" value={data.summary} onChange={(v) => set("summary", v)} />

      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground text-sm">Skills</h3>
        {data.skills.map((g, i) => (
          <div key={i} className="rounded-md border border-border bg-card/40 p-3 space-y-2">
            <Field
              label="CATEGORY"
              value={g.category}
              onChange={(v) => set("skills", data.skills.map((s, j) => (j === i ? { ...s, category: v } : s)))}
            />
            <CommaListField
              label="ITEMS (comma separated)"
              values={g.items}
              onChange={(items) =>
                set("skills", data.skills.map((s, j) => (j === i ? { ...s, items } : s)))
              }
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">LAYOUT</span>
              {(["inline", "bullets"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() =>
                    set("skills", data.skills.map((s, j) => (j === i ? { ...s, layout: l } : s)))
                  }
                  className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                    (g.layout ?? "inline") === l
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l === "inline" ? "Horizontal (comma)" : "Vertical (bullets)"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => set("skills", data.skills.filter((_, j) => j !== i))}
              className="text-xs font-mono text-destructive hover:underline"
            >
              Remove group
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("skills", [...data.skills, { category: "", items: [] }])}
          className="text-xs font-mono text-primary hover:underline"
        >
          + Add skill group
        </button>
      </section>

      <EntryListEditor title="Experience" entries={data.experience} onChange={(e) => set("experience", e)} />
      <EntryListEditor title="Projects" entries={data.projects} onChange={(e) => set("projects", e)} />
      <EntryListEditor title="Education" entries={data.education} onChange={(e) => set("education", e)} />

      <RichArea
        label="CERTIFICATIONS / TRAINING (one per line — [Certificate](https://link) se clickable naam banega)"
        value={data.certifications.join("\n")}
        minH="80px"
        onChange={(v) =>
          set(
            "certifications",
            v.split("\n").map((s) => s.trim()).filter(Boolean),
          )
        }
      />
    </div>
  );
}
