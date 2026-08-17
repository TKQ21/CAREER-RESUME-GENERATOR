export interface ResumeEntry {
  title: string;
  subtitle?: string;
  location?: string;
  dates?: string;
  bullets: string[];
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

export const FOOTER_TEXT = "© 2026 Mohd Kaif | Built with AI assistance";

export type TemplateId = "classic" | "modern" | "compact";

export const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "classic", name: "Classic ATS", description: "Centered header, full-width sections" },
  { id: "modern", name: "Modern Sidebar", description: "Left rail for skills & education" },
  { id: "compact", name: "Compact Minimal", description: "Tight spacing, fits more per page" },
];
