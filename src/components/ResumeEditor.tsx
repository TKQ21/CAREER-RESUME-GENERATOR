import { useRef, useState } from "react";
import { ResumeData, ResumeEntry } from "./resume/types";
import { move } from "@/lib/reorder";

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const inputCls =
  "w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary transition-all";

const arrowBtn =
  "px-2 rounded border border-border text-[11px] font-mono text-muted-foreground hover:text-primary disabled:opacity-30";

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

/* ---------- reorder chips for individual skills ---------- */

function ReorderChips({
  items,
  onChange,
  label = "ORDER (aage-peeche karo)",
}: {
  items: string[];
  onChange: (items: string[]) => void;
  label?: string;
}) {
  if (items.length < 2) return null;
  return (
    <div>
      <span className="block text-[10px] font-mono text-muted-foreground mb-1">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.map((it, i) => (
          <span
            key={`${it}-${i}`}
            className="flex items-center gap-1 rounded border border-border bg-card px-2 py-[2px] text-[10px] font-mono text-foreground"
          >
            <span className="max-w-[140px] truncate">{it}</span>
            <button type="button" className={arrowBtn} disabled={i === 0} onClick={() => onChange(move(items, i, i - 1))} aria-label="Move left">
              ←
            </button>
            <button
              type="button"
              className={arrowBtn}
              disabled={i === items.length - 1}
              onClick={() => onChange(move(items, i, i + 1))}
              aria-label="Move right"
            >
              →
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- bullets ---------- */

function BulletRow({
  value,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onRemove,
  onUp,
  onDown,
  isFirst,
  isLast,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
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
        <span className="flex gap-1">
          <button type="button" className={arrowBtn} disabled={isFirst} onClick={onUp} aria-label="Move bullet up">
            ↑
          </button>
          <button type="button" className={arrowBtn} disabled={isLast} onClick={onDown} aria-label="Move bullet down">
            ↓
          </button>
        </span>
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
  );
}

/** Splits a pasted paragraph/block into separate bullets. */
export function splitBullets(raw: string): string[] {
  const cleaned = raw.replace(/\r/g, "");
  const byLine = cleaned.split("\n");
  const source = byLine.length > 1 ? byLine : cleaned.split(/(?=[•▪·‣o]\s)/);
  return source
    .map((l) => l.replace(/^\s*[•▪·‣*\-–—]+\s*/, "").trim())
    .filter((l) => l !== "");
}

function BulkBullets({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  const [draft, setDraft] = useState(bullets.join("\n"));
  return (
    <label className="block">
      <span className="block text-[10px] font-mono text-muted-foreground mb-1">
        PASTE ALL POINTS TOGETHER — har nayi line ya • ek bullet ban jayegi
      </span>
      <textarea
        className={`${inputCls} resize-y min-h-[120px]`}
        value={draft}
        placeholder={"Built X using Y\nImproved Z by 30%\nLed a team of 4"}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange(splitBullets(e.target.value));
        }}
      />
    </label>
  );
}

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  const [bulk, setBulk] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">BULLET POINTS</span>
        <button
          type="button"
          onClick={() => setBulk((b) => !b)}
          className="text-[10px] font-mono px-2 py-[2px] rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/60"
        >
          {bulk ? "One-by-one edit" : "Paste all at once"}
        </button>
      </div>

      {bulk ? (
        <BulkBullets key={bullets.length === 0 ? "empty" : "bulk"} bullets={bullets} onChange={onChange} />
      ) : (
        <>
          {bullets.map((b, i) => (
            <BulletRow
              key={i}
              value={b}
              isFirst={i === 0}
              isLast={i === bullets.length - 1}
              onUp={() => onChange(move(bullets, i, i - 1))}
              onDown={() => onChange(move(bullets, i, i + 1))}
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
        </>
      )}
    </div>
  );
}

/* ---------- entries ---------- */

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
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
            <span className="flex gap-1">
              <button type="button" className={arrowBtn} disabled={i === 0} onClick={() => onChange(move(entries, i, i - 1))} aria-label="Move entry up">
                ↑
              </button>
              <button
                type="button"
                className={arrowBtn}
                disabled={i === entries.length - 1}
                onClick={() => onChange(move(entries, i, i + 1))}
                aria-label="Move entry down"
              >
                ↓
              </button>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="TITLE" value={e.title} onChange={(v) => update(i, { title: v })} />
            <Field label='SUBTITLE (title ke side me " | " ke baad)' value={e.subtitle ?? ""} onChange={(v) => update(i, { subtitle: v })} />
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

/* ---------- certifications (with clickable link) ---------- */

const LINK_LINE = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

function parseCert(line: string) {
  const m = line.trim().match(LINK_LINE);
  return m ? { text: m[1], url: m[2] } : { text: line, url: "" };
}

function serializeCert(text: string, url: string) {
  const t = text.trim();
  const u = url.trim();
  if (!t) return "";
  return u ? `[${t}](${u})` : t;
}

function CertificationsEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const rows = items.map(parseCert);
  const update = (i: number, text: string, url: string) =>
    onChange(items.map((old, j) => (j === i ? serializeCert(text, url) : old)));

  return (
    <section className="space-y-3">
      <h3 className="font-display font-semibold text-foreground text-sm">Certifications & Training</h3>
      <p className="text-[10px] font-mono text-muted-foreground">
        LINK URL daalo → resume me naam par click karke certificate / image open ho jayegi
      </p>
      {rows.map((r, i) => (
        <div key={i} className="rounded-md border border-border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
            <span className="flex gap-1">
              <button type="button" className={arrowBtn} disabled={i === 0} onClick={() => onChange(move(items, i, i - 1))} aria-label="Move up">
                ↑
              </button>
              <button
                type="button"
                className={arrowBtn}
                disabled={i === rows.length - 1}
                onClick={() => onChange(move(items, i, i + 1))}
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="px-2 rounded border border-border text-[11px] font-mono text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                ✕
              </button>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="CERTIFICATE / TRAINING NAME" value={r.text} onChange={(v) => update(i, v, r.url)} format={false} />
            <Field
              label="LINK URL (certificate / image)"
              value={r.url}
              placeholder="https://drive.google.com/..."
              onChange={(v) => update(i, r.text, v)}
              format={false}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="text-xs font-mono text-primary hover:underline"
      >
        + Add certificate
      </button>
    </section>
  );
}

/* ---------- main editor ---------- */

export default function ResumeEditor({ data, onChange }: ResumeEditorProps) {
  const set = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => onChange({ ...data, [key]: value });

  return (
    <div className="no-print mt-8 rounded-md border border-border bg-card/30 p-4 space-y-5">
      <div>
        <h2 className="font-display font-semibold text-lg text-foreground">Edit Resume Content</h2>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Text select karke <span className="text-primary font-bold">B</span> = bold, LINK = clickable link
          (resume me sirf naam dikhega, black · no underline) · ↑↓ se order badlo
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
      <ReorderChips items={data.contact} onChange={(v) => set("contact", v)} label="CONTACT ORDER" />

      <TextAreaField label="SUMMARY" value={data.summary} onChange={(v) => set("summary", v)} />

      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground text-sm">Skills</h3>
        {data.skills.map((g, i) => (
          <div key={i} className="rounded-md border border-border bg-card/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
              <span className="flex gap-1">
                <button type="button" className={arrowBtn} disabled={i === 0} onClick={() => set("skills", move(data.skills, i, i - 1))} aria-label="Move group up">
                  ↑
                </button>
                <button
                  type="button"
                  className={arrowBtn}
                  disabled={i === data.skills.length - 1}
                  onClick={() => set("skills", move(data.skills, i, i + 1))}
                  aria-label="Move group down"
                >
                  ↓
                </button>
              </span>
            </div>
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
            <ReorderChips
              items={g.items}
              onChange={(items) => set("skills", data.skills.map((s, j) => (j === i ? { ...s, items } : s)))}
              label="SKILL ORDER"
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

      <CertificationsEditor items={data.certifications} onChange={(c) => set("certifications", c)} />
    </div>
  );
}
