import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ClassicTemplate from "./resume/ClassicTemplate";
import ModernTemplate from "./resume/ModernTemplate";
import CompactTemplate from "./resume/CompactTemplate";
import { ResumeData, TEMPLATES, TemplateId } from "./resume/types";

export type { ResumeData } from "./resume/types";

const A4_WIDTH = 794; // px @96dpi
const A4_HEIGHT = 1123;
const FIT_HEIGHT = 1040; // usable height, leaves print-rounding slack

interface ResumeOutputProps {
  data: ResumeData;
}

export default function ResumeOutput({ data }: ResumeOutputProps) {
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [scale, setScale] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [pages, setPages] = useState(1);

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

  // Auto-fit: pick the largest typography scale that still uses the fewest A4 pages
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

      if (!autoFit) {
        el.style.setProperty("--resume-scale", String(scale));
        setPages(measurePages(el, content, scale));
        return;
      }

      const candidates = [1.02, 1, 0.97, 0.94, 0.91, 0.88, 0.85, 0.82, 0.79, 0.76, 0.73, 0.7];
      const minPages = measurePages(el, content, candidates[candidates.length - 1]);
      let best = candidates[candidates.length - 1];
      for (const c of candidates) {
        if (measurePages(el, content, c) <= minPages) {
          best = c;
          break;
        }
      }
      el.style.setProperty("--resume-scale", String(best));
      setPages(minPages);
      setScale(best);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [autoFit, scale, data, template]);



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
      <div className="no-print flex flex-wrap items-center gap-4 rounded-md border border-border bg-card/50 p-3">
        <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <input
            type="checkbox"
            checked={autoFit}
            onChange={(e) => setAutoFit(e.target.checked)}
            className="accent-primary"
          />
          AUTO-FIT
        </label>
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <span className="text-xs font-mono text-muted-foreground">DENSITY</span>
          <input
            type="range"
            min={0.7}
            max={1.1}
            step={0.02}
            value={scale}
            onChange={(e) => {
              setAutoFit(false);
              setScale(Number(e.target.value));
            }}
            className="flex-1 accent-primary"
          />
        </div>
        <span className="text-xs font-mono text-primary">
          {pages} PAGE{pages > 1 ? "S" : ""} · A4
        </span>
      </div>

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
          <div ref={pageRef} className="resume-sheet shadow-2xl">
            <div ref={contentRef}>
              <Template data={data} />
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
