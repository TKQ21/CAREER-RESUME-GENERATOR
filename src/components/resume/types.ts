export interface ResumeEntry {
  title: string;
  subtitle?: string;
  location?: string;
  dates?: string;
  bullets: string[];
  /** Optional clickable link shown in place of / next to the subtitle */
  linkLabel?: string;
  linkUrl?: string;
}

export type SkillLayout = "inline" | "bullets";

export interface SkillGroup {
  category: string;
  items: string[];
  /** How the items were written in the source resume: one line (inline) or bullet list */
  layout?: SkillLayout;
}

export interface ResumeData {
  name: string;
  headline: string;
  contact: string[];
  summary: string;
  skills: SkillGroup[];
  experience: ResumeEntry[];
  projects: ResumeEntry[];
  education: ResumeEntry[];
  certifications: string[];
}


export type TemplateId = "classic" | "modern" | "compact";

export const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "classic", name: "Classic ATS", description: "Centered header, full-width sections" },
  { id: "modern", name: "Modern Sidebar", description: "Left rail for skills & education" },
  { id: "compact", name: "Compact Minimal", description: "Tight spacing, fits more per page" },
];

/* ---------- Style / layout controls ---------- */

export type FontFamilyId = "inter" | "georgia" | "times" | "arial" | "garamond" | "calibri";

export const FONT_FAMILIES: { id: FontFamilyId; name: string; stack: string }[] = [
  { id: "inter", name: "Inter (modern sans)", stack: "'Inter', Arial, sans-serif" },
  { id: "calibri", name: "Calibri / Carlito", stack: "Calibri, Carlito, 'Segoe UI', sans-serif" },
  { id: "arial", name: "Arial / Helvetica", stack: "Arial, Helvetica, sans-serif" },
  { id: "georgia", name: "Georgia (serif)", stack: "Georgia, 'Times New Roman', serif" },
  { id: "times", name: "Times New Roman", stack: "'Times New Roman', Times, serif" },
  { id: "garamond", name: "Garamond", stack: "Garamond, 'EB Garamond', Georgia, serif" },
];

export type SectionKey =
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications";

export const SECTION_LABELS: { key: SectionKey; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "education", label: "Education" },
  { key: "certifications", label: "Certifications" },
];

export type SectionTitles = Partial<Record<SectionKey, string>>;

export interface ResumeStyle {
  font: FontFamilyId;
  /** text size multiplier */
  size: number;
  /** page margin in px */
  marginX: number;
  marginY: number;
  /** line-height for body text */
  lineHeight: number;
  /** vertical gap between sections in px */
  sectionGap: number;
  hidden: SectionKey[];
  /** user-renamed section headings */
  titles: SectionTitles;
}

export const DEFAULT_STYLE: ResumeStyle = {
  font: "inter",
  size: 1,
  marginX: 40,
  marginY: 32,
  lineHeight: 1.45,
  sectionGap: 12,
  hidden: [],
  titles: {},
};

export const defaultSectionTitle = (key: SectionKey) =>
  SECTION_LABELS.find((s) => s.key === key)?.label ?? key;

export const sectionTitle = (titles: SectionTitles | undefined, key: SectionKey) =>
  titles?.[key]?.trim() || defaultSectionTitle(key);

export function applyStyleToData(data: ResumeData, hidden: SectionKey[]): ResumeData {
  const off = (k: SectionKey) => hidden.includes(k);
  return {
    ...data,
    summary: off("summary") ? "" : data.summary,
    skills: off("skills") ? [] : data.skills,
    experience: off("experience") ? [] : data.experience,
    projects: off("projects") ? [] : data.projects,
    education: off("education") ? [] : data.education,
    certifications: off("certifications") ? [] : data.certifications,
  };
}
