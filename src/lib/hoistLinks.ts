import { ResumeData, ResumeEntry } from "@/components/resume/types";

const MD_LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/;
const BARE_URL = /((?:https?:\/\/|www\.)[^\s,;)\]]+)/;

/**
 * Existing resumes usually keep the project/experience link on the title line or
 * inside the first bullet. Move that link into the entry's LINK NAME / LINK URL
 * fields so it shows up pre-filled in the editor.
 */
function hoistEntryLink(entry: ResumeEntry): ResumeEntry {
  if (entry.linkUrl) return entry;

  const fields: ("title" | "subtitle")[] = ["title", "subtitle"];
  for (const field of fields) {
    const value = entry[field];
    if (!value) continue;

    const md = value.match(MD_LINK);
    if (md) {
      const cleaned = value.replace(md[0], "").replace(/\s*[|·—–-]\s*$/, "").replace(/\s{2,}/g, " ").trim();
      return { ...entry, [field]: cleaned || md[1], linkLabel: md[1], linkUrl: md[2] };
    }

    const bare = value.match(BARE_URL);
    if (bare) {
      const cleaned = value.replace(bare[0], "").replace(/\s*[|·—–-]\s*$/, "").replace(/\s{2,}/g, " ").trim();
      return { ...entry, [field]: cleaned || value, linkLabel: "Link", linkUrl: bare[1] };
    }
  }

  return entry;
}

export function hoistResumeLinks(data: ResumeData): ResumeData {
  return {
    ...data,
    experience: (data.experience ?? []).map(hoistEntryLink),
    projects: (data.projects ?? []).map(hoistEntryLink),
    education: (data.education ?? []).map(hoistEntryLink),
  };
}
