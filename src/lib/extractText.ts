import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const BOLD_NAME = /bold|black|heavy|semib|[-,]bd\b/i;

/** Resolve the real embedded font names (e.g. "AAAAAA+Arial-Bold") for a page. */
async function boldFontIds(page: pdfjs.PDFPageProxy, fontIds: string[]): Promise<Set<string>> {
  const bold = new Set<string>();
  try {
    await page.getOperatorList();
    for (const id of fontIds) {
      let obj: unknown;
      try {
        obj = (page as unknown as { commonObjs: { get(k: string): unknown } }).commonObjs.get(id);
      } catch {
        continue;
      }
      const font = (obj as { font?: { name?: string } })?.font ?? (obj as { name?: string });
      const name = (font as { name?: string })?.name ?? "";
      if (BOLD_NAME.test(name) || BOLD_NAME.test(id)) bold.add(id);
    }
  } catch {
    /* ignore, fall back to id heuristic */
  }
  for (const id of fontIds) if (BOLD_NAME.test(id)) bold.add(id);
  return bold;
}


interface LinkRect {
  url: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

async function pageLinks(page: pdfjs.PDFPageProxy): Promise<LinkRect[]> {
  try {
    const anns = await page.getAnnotations({ intent: "display" });
    return anns
      .filter((a: { subtype?: string; url?: string; rect?: number[] }) => a.subtype === "Link" && a.url && a.rect)
      .map((a: { url: string; rect: number[] }) => {
        const [ax, ay, bx, by] = a.rect;
        return {
          url: a.url,
          x1: Math.min(ax, bx),
          y1: Math.min(ay, by),
          x2: Math.max(ax, bx),
          y2: Math.max(ay, by),
        };
      });
  } catch {
    return [];
  }
}

function linkAt(links: LinkRect[], x: number, y: number) {
  return links.find((l) => x >= l.x1 - 2 && x <= l.x2 + 2 && y >= l.y1 - 3 && y <= l.y2 + 3);
}

async function extractPdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const styles = content.styles as Record<string, { fontFamily?: string }>;
    const links = await pageLinks(page);

    const lines: string[] = [];
    let line = "";
    let lastY: number | null = null;

    type Item = { str: string; transform: number[]; fontName?: string; hasEOL?: boolean };
    for (const item of content.items as Item[]) {
      if (!item.str) continue;
      const x = item.transform?.[4] ?? 0;
      const y = item.transform?.[5] ?? 0;

      if (lastY !== null && Math.abs(y - lastY) > 3) {
        lines.push(line.trim());
        line = "";
      }

      let piece = item.str;
      const link = linkAt(links, x, y);
      if (link) {
        const label = piece.trim();
        piece = label ? `[${label}](${link.url})` : piece;
      } else if (isBoldFont(styles, item.fontName) && piece.trim()) {
        const lead = piece.match(/^\s*/)?.[0] ?? "";
        const tail = piece.match(/\s*$/)?.[0] ?? "";
        piece = `${lead}**${piece.trim()}**${tail}`;
      }

      line += piece + " ";
      lastY = y;
    }
    lines.push(line.trim());

    // merge adjacent bold markers: "**A** **B**" -> "**A B**"
    const merged = lines.map((l) => l.replace(/\*\*\s+\*\*/g, " ").replace(/\s{2,}/g, " "));
    pages.push(merged.filter(Boolean).join("\n"));
  }
  return pages.join("\n\n");
}

function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(walk).join("");
    const tag = el.tagName.toLowerCase();

    if (tag === "a") {
      const href = el.getAttribute("href") ?? "";
      const label = inner.trim().replace(/\*\*/g, "");
      if (!href) return inner;
      return label ? `[${label}](${href})` : href;
    }
    if (tag === "strong" || tag === "b") {
      const t = inner.trim();
      return t ? `**${t}** ` : "";
    }
    if (tag === "li") return `- ${inner.trim()}\n`;
    if (tag === "br") return "\n";
    if (["p", "div", "h1", "h2", "h3", "h4", "ul", "ol", "table", "tr"].includes(tag)) {
      return `${inner.trim()}\n`;
    }
    if (tag === "td" || tag === "th") return `${inner.trim()} `;
    return inner;
  }

  return walk(doc.body)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  try {
    const res = await mammoth.convertToHtml({ arrayBuffer: buf });
    const md = htmlToMarkdown(res.value);
    if (md.trim().length > 30) return md;
  } catch {
    /* fall back to raw text */
  }
  const raw = await mammoth.extractRawText({ arrayBuffer: buf });
  return raw.value;
}

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdf(file);
  if (name.endsWith(".docx")) return extractDocx(file);
  if (name.endsWith(".txt") || name.endsWith(".md")) return file.text();
  throw new Error("Unsupported file. Please upload a PDF, DOCX or TXT file.");
}
