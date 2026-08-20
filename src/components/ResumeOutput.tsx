import { useEffect, useMemo, useRef, useState } from "react";
import ClassicTemplate from "./resume/ClassicTemplate";
import ModernTemplate from "./resume/ModernTemplate";
import CompactTemplate from "./resume/CompactTemplate";
import ResumeStyleControls from "./ResumeStyleControls";
import {
  applyStyleToData,
  DEFAULT_STYLE,
  FONT_FAMILIES,
  ResumeData,
  ResumeStyle,
  TEMPLATES,
  TemplateId,
} from "./resume/types";

export type { ResumeData } from "./resume/types";

const A4_WIDTH = 794; // px @96dpi
const A4_HEIGHT = 1123;
const FIT_HEIGHT = 1040; // usable height, leaves print-rounding slack

interface ResumeOutputProps {
  data: ResumeData;
}

type PageTarget = "auto" | 1 | 2 | 3;
const CANDIDATES = [1.06, 1.03, 1, 0.97, 0.94, 0.91, 0.88, 0.85, 0.82, 0.79, 0.76, 0.73, 0.7];

export default function ResumeOutput({ data }: ResumeOutputProps) {
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [scale, setScale] = useState(1);
  const [manual, setManual] = useState(false);
  const [pageTarget, setPageTarget] = useState<PageTarget>("auto");
  const [pages, setPages] = useState(1);
  const [note, setNote] = useState<string | null>(null);
  const [style, setStyle] = useState<ResumeStyle>(DEFAULT_STYLE);

  const visibleData = useMemo(() => applyStyleToData(data, style.hidden), [data, style.hidden]);
  const styleVars = useMemo(
    () =>
      ({
        "--resume-font": FONT_FAMILIES.find((f) => f.id === style.font)?.stack,
        "--resume-size": String(style.size),
        "--resume-margin-x": `${style.marginX}px`,
        "--resume-margin-y": `${style.marginY}px`,
        "--resume-line": String(style.lineHeight),
        "--resume-section-gap": `${style.sectionGap}px`,
        "--resume-heading-weight": "700",
      }) as React.CSSProperties,
    [style],
  );

  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Responsive preview scaling
  useEffect(() => {
    const update = () => {
      const w = wrapperRef.current?.clientWidth ?? A4_WIDTH;
      setPreviewScale(Math.min(1, w / A4_WIDTH));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Fit content into the requested page count (or the fewest possible pages)
  useEffect(() => {
    let cancelled = false;

    const measurePages = (el: HTMLElement, content: HTMLElement, s: number) => {
      el.style.setProperty("--resume-scale", String(s));
      void content.offsetHeight; // force reflow
      return Math.max(1, Math.ceil(content.getBoundingClientRect().height / FIT_HEIGHT));
    };

    const run = async () => {
      await document.fonts?.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;
      const el = pageRef.current;
      const content = contentRef.current;
      if (!el || !content) return;

      if (manual) {
        el.style.setProperty("--resume-scale", String(scale));
        setPages(measurePages(el, content, scale));
        setNote(null);
        return;
      }

      const smallest = CANDIDATES[CANDIDATES.length - 1];
      const minPages = measurePages(el, content, smallest);
      const target = pageTarget === "auto" ? minPages : Math.max(minPages, pageTarget);

      let best = smallest;
      for (const c of CANDIDATES) {
        if (measurePages(el, content, c) <= target) {
          best = c;
          break;
        }
      }
      const finalPages = measurePages(el, content, best);
      el.style.setProperty("--resume-scale", String(best));
      setPages(finalPages);
      setScale(best);
      if (pageTarget !== "auto" && minPages > pageTarget) {
        setNote(`Content ${pageTarget} page me fit nahi hota — ${minPages} page use kiye`);
      } else {
        setNote(null);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [manual, pageTarget, scale, data, template, style]);



  const Template =
    template === "modern" ? ModernTemplate : template === "compact" ? CompactTemplate : ClassicTemplate;

  return (
    <div className="mt-8 space-y-5">
      {/* Template picker */}
      <div className="no-print">
        <p className="text-sm font-mono text-muted-foreground mb-2">CHOOSE A TEMPLATE</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`text-left rounded-md p-3 border transition-all ${
                template === t.id
                  ? "neon-border bg-card"
                  : "border-border bg-card/50 hover:border-primary/60"
              }`}
            >
              <span className="block font-display font-semibold text-foreground text-sm">{t.name}</span>
              <span className="block text-xs text-muted-foreground font-mono mt-1">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fit controls */}
      <div className="no-print space-y-3 rounded-md border border-border bg-card/50 p-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-mono text-muted-foreground">PAGES</span>
          <div className="flex gap-2">
            {(["auto", 1, 2, 3] as PageTarget[]).map((p) => (
              <button
                key={String(p)}
                onClick={() => {
                  setManual(false);
                  setPageTarget(p);
                }}
                className={`px-3 py-1 rounded-md text-xs font-mono border transition-all ${
                  !manual && pageTarget === p
                    ? "neon-border text-primary"
                    : "border-border text-muted-foreground hover:border-primary/60"
                }`}
              >
                {p === "auto" ? "AUTO" : p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <span className="text-xs font-mono text-muted-foreground">DENSITY</span>
            <input
              type="range"
              min={0.7}
              max={1.1}
              step={0.02}
              value={scale}
              onChange={(e) => {
                setManual(true);
                setScale(Number(e.target.value));
              }}
              className="flex-1 accent-primary"
            />
          </div>
          <span className="text-xs font-mono text-primary">
            {pages} PAGE{pages > 1 ? "S" : ""} · A4
          </span>
        </div>
        {note && <p className="text-xs font-mono text-accent">{note}</p>}
      </div>

      <ResumeStyleControls
        style={style}
        onChange={(s) => setStyle(s)}
        onReset={() => setStyle(DEFAULT_STYLE)}
      />

      {/* Preview */}
      <div ref={wrapperRef} className="overflow-hidden">
        <div
          className="print-area origin-top mx-auto"
          style={{
            width: A4_WIDTH,
            transform: `scale(${previewScale})`,
            marginBottom: previewScale < 1 ? -(1 - previewScale) * (pages * A4_HEIGHT) : 0,
          }}
        >
          <div ref={pageRef} className="resume-sheet shadow-2xl" style={styleVars}>
            <div ref={contentRef}>
              <Template data={visibleData} />
            </div>
          </div>

        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="no-print gradient-btn px-6 py-3 rounded-md font-display font-semibold text-primary-foreground w-full text-lg"
      >
        Download Resume PDF
      </button>
    </div>
  );
}
