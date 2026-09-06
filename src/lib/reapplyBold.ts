import { ResumeData, ResumeEntry } from "@/components/resume/types";

/** Collect the phrases that were bold in the uploaded resume. */
export function collectBoldPhrases(source: string): string[] {
  const out = new Set<string>();
  const re = /\*\*([^*]+)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const phrase = m[1].replace(/\s+/g, " ").trim();
    // skip section headings & very short / very long noise
    if (phrase.length < 2 || phrase.length > 60) continue;
    out.add(phrase);
  }
  return [...out].sort((a, b) => b.length - a.length);
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function boldIn(text: string, phrases: string[]): string {
  if (!text) return text;
  let result = text;
  for (const phrase of phrases) {
    const re = new RegExp(`(?<!\\*)\\b${escape(phrase)}\\b(?!\\*)`, "gi");
    result = result.replace(re, (match, offset: number, full: string) => {
      // don't touch text already inside ** ** or inside a link target
      const before = full.slice(0, offset);
      const openBold = (before.match(/\*\*/g) ?? []).length % 2 === 1;
      const inLink = /\([^)\s]*$/.test(before);
      if (openBold || inLink) return match;
      return `**${match}**`;
    });
  }
  return result;
}

function entryBold(entry: ResumeEntry, phrases: string[]): ResumeEntry {
  return {
    ...entry,
    title: boldIn(entry.title, phrases),
    subtitle: entry.subtitle ? boldIn(entry.subtitle, phrases) : entry.subtitle,
    bullets: entry.bullets.map((b) => boldIn(b, phrases)),
  };
}

/**
 * The AI sometimes drops the ** ** markers from an imported resume.
 * Re-apply bold to exactly the words that were bold in the original file.
 */
export function reapplyBold(data: ResumeData, source: string): ResumeData {
  const phrases = collectBoldPhrases(source);
  if (phrases.length === 0) return data;

  return {
    ...data,
    summary: boldIn(data.summary, phrases),
    skills: data.skills.map((g) => ({
      ...g,
      items: g.items.map((i) => boldIn(i, phrases)),
    })),
    experience: data.experience.map((e) => entryBold(e, phrases)),
    projects: data.projects.map((e) => entryBold(e, phrases)),
    education: data.education.map((e) => entryBold(e, phrases)),
    certifications: data.certifications.map((c) => boldIn(c, phrases)),
  };
}
