import { useRef, useState } from "react";
import { ResumeData, ResumeEntry } from "./resume/types";

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const inputCls =
  "w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary transition-all";

type TextEl = HTMLInputElement | HTMLTextAreaElement;

function wrapSelection(el: TextEl | null, value: string, mode: "bold" | "link", onChange: (v: string) => void) {
  if (!el) return;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (start === end) return;
  const selected = value.slice(start, end);

  let replacement: string;
  if (mode === "bold") {
    replacement =
      selected.startsWith("**") && selected.endsWith("**") && selected.length > 4
        ? selected.slice(2, -2)
        : `**${selected}**`;
  } else {
    const url = window.prompt("Paste the URL (https://...)", "https://");
    if (!url || url === "https://") return;
    replacement = `[${selected}](${url.trim()})`;
  }

  const next = value.slice(0, start) + replacement + value.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start, start + replacement.length);
  });
}

function FormatToolbar({ elRef, value, onChange }: { elRef: React.RefObject<TextEl>; value: string; onChange: (v: string) => void }) {
  const btn =
    "px-2 py-[2px] rounded border border-border text-[10px] font-mono text-muted-foreground hover:text-primary hover:border-primary/60";
  return (
    <span className="flex gap-1">
      <button type="button" className={btn} title="Bold selected text (Ctrl+B)" onClick={() => wrapSelection(elRef.current, value, "bold", onChange)}>
        <span className="font-bold">B</span>
      </button>
      <button type="button" className={btn} title="Turn selected text into a clickable link" onClick={() => wrapSelection(elRef.current, value, "link", onChange)}>
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
  format = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  format?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
        <span>{label}</span>
        {format && <FormatToolbar elRef={ref as React.RefObject<TextEl>} value={value} onChange={onChange} />}
      </span>
      <input
        ref={ref}
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            wrapSelection(e.currentTarget, value, "bold", onChange);
          }
        }}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  minHeight = 90,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  minHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
        <span>{label}</span>
        <FormatToolbar elRef={ref as React.RefObject<TextEl>} value={value} onChange={onChange} />
      </span>
      <textarea
        ref={ref}
        className={`${inputCls} resize-y`}
        style={{ minHeight }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            wrapSelection(e.currentTarget, value, "bold", onChange);
          }
        }}
      />
    </label>
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
      onChange={(value) => {
        setDraft(value);
        onChange(parseCommaList(value));
      }}
    />
  );
}

function BulletRow({
  value,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <span className="text-primary font-mono pt-2">•</span>
        <textarea
          ref={ref}
          className={`${inputCls} min-h-[52px] resize-y`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
              e.preventDefault();
              wrapSelection(e.currentTarget, value, "bold", onChange);
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onEnter();
            }
            if (e.key === "Backspace" && value === "") {
              e.preventDefault();
              onBackspaceEmpty();
            }
          }}
        />
        <div className="flex flex-col items-end gap-1 pt-1">
          <FormatToolbar elRef={ref as React.RefObject<TextEl>} value={value} onChange={onChange} />
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive font-mono text-xs"
            aria-label="Remove bullet"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-mono text-muted-foreground">BULLET POINTS</span>
      {bullets.map((b, i) => (
        <BulletRow
          key={i}
          value={b}
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
          onBackspaceEmpty={() => {
            if (bullets.length > 1) onChange(bullets.filter((_, j) => j !== i));
          }}
          onRemove={() => onChange(bullets.filter((_, j) => j !== i))}
        />
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
            <Field label="TITLE" value={e.title} onChange={(v) => update(i, { title: v })} />
            <Field label="SUBTITLE" value={e.subtitle ?? ""} onChange={(v) => update(i, { subtitle: v })} />
            <Field label="LOCATION" value={e.location ?? ""} onChange={(v) => update(i, { location: v })} format={false} />
            <Field label="DATES" value={e.dates ?? ""} onChange={(v) => update(i, { dates: v })} format={false} />
            <Field
              label="LINK NAME (shown on resume)"
              value={e.linkLabel ?? ""}
              placeholder="Live Demo"
              onChange={(v) => update(i, { linkLabel: v })}
              format={false}
            />
            <Field
              label="LINK URL (opens on click)"
              value={e.linkUrl ?? ""}
              placeholder="https://github.com/..."
              onChange={(v) => update(i, { linkUrl: v })}
              format={false}
            />
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
          Text select karke <span className="text-primary font-bold">B</span> = bold, LINK = clickable link
          (resume me sirf naam dikhega, black · no underline)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field label="NAME" value={data.name} onChange={(v) => set("name", v)} format={false} />
        <Field label="HEADLINE" value={data.headline} onChange={(v) => set("headline", v)} />
      </div>

      <CommaListField
        label="CONTACT (comma separated · [GitHub](https://...) se clickable)"
        values={data.contact}
        onChange={(values) => set("contact", values)}
      />

      <TextAreaField label="SUMMARY" value={data.summary} onChange={(v) => set("summary", v)} />

      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground text-sm">Skills</h3>
        {data.skills.map((g, i) => (
          <div key={i} className="rounded-md border border-border bg-card/40 p-3 space-y-2">
            <Field
              label="CATEGORY"
              value={g.category}
              format={false}
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

      <TextAreaField
        label="CERTIFICATIONS (one per line · [Certificate](https://...) clickable)"
        value={data.certifications.join("\n")}
        minHeight={70}
        onChange={(v) => set("certifications", v.split("\n").map((s) => s.trimStart()).filter((s) => s !== ""))}
      />
    </div>
  );
}
