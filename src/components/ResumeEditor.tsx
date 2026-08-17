import { useEffect, useState } from "react";
import { ResumeData, ResumeEntry } from "./resume/types";

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const inputCls =
  "w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary transition-all";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono text-muted-foreground mb-1">{label}</span>
      <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
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
  const serializedValues = values.join("\u0000");

  useEffect(() => {
    const parsedDraft = parseCommaList(draft);
    if (parsedDraft.join("\u0000") !== serializedValues) {
      setDraft(values.join(", "));
    }
  }, [serializedValues]);

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

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-mono text-muted-foreground">BULLET POINTS</span>
      {bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-primary font-mono pt-2">•</span>
          <textarea
            className={`${inputCls} min-h-[52px] resize-y`}
            value={b}
            onChange={(e) => {
              const next = [...bullets];
              next[i] = e.target.value;
              onChange(next);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const next = [...bullets];
                next.splice(i + 1, 0, "");
                onChange(next);
              }
              if (e.key === "Backspace" && b === "" && bullets.length > 1) {
                e.preventDefault();
                onChange(bullets.filter((_, j) => j !== i));
              }
            }}
          />
          <button
            type="button"
            onClick={() => onChange(bullets.filter((_, j) => j !== i))}
            className="text-muted-foreground hover:text-destructive font-mono text-xs pt-2"
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
            <Field label="TITLE" value={e.title} onChange={(v) => update(i, { title: v })} />
            <Field label="SUBTITLE" value={e.subtitle ?? ""} onChange={(v) => update(i, { subtitle: v })} />
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
          Sab kuch yahan se badlo — preview turant update hoga
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field label="NAME" value={data.name} onChange={(v) => set("name", v)} />
        <Field label="HEADLINE" value={data.headline} onChange={(v) => set("headline", v)} />
      </div>

      <CommaListField
        label="CONTACT (comma separated)"
        values={data.contact}
        onChange={(values) => set("contact", values)}
      />

      <label className="block">
        <span className="block text-[10px] font-mono text-muted-foreground mb-1">SUMMARY</span>
        <textarea
          className={`${inputCls} min-h-[90px] resize-y`}
          value={data.summary}
          onChange={(e) => set("summary", e.target.value)}
        />
      </label>

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

      <label className="block">
        <span className="block text-[10px] font-mono text-muted-foreground mb-1">
          CERTIFICATIONS (one per line)
        </span>
        <textarea
          className={`${inputCls} min-h-[70px] resize-y`}
          value={data.certifications.join("\n")}
          onChange={(e) =>
            set(
              "certifications",
              e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            )
          }
        />
      </label>
    </div>
  );
}
