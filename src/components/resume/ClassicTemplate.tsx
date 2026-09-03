import { ResumeData, ResumeEntry, SectionKey, SectionTitles, normalizeOrder, sectionTitle } from "./types";
import RichText, { PlainLink } from "./RichText";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="resume-section-title text-center text-[15px] font-bold tracking-wide border-y border-ink/70 py-[2px] my-3">
      {children}
    </h2>
  );
}

function Entry({ entry, inlineSubtitle = false }: { entry: ResumeEntry; inlineSubtitle?: boolean }) {
  const subtitleParts: React.ReactNode[] = [];
  if (!inlineSubtitle && entry.subtitle) subtitleParts.push(<RichText key="s" text={entry.subtitle} />);
  if (entry.linkUrl)
    subtitleParts.push(
      <PlainLink key="l" href={entry.linkUrl}>
        {entry.linkLabel?.trim() || "Link"}
      </PlainLink>,
    );

  return (
    <div className="resume-block mb-3">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[12.5px] font-bold">
          <RichText text={entry.title} />
          {inlineSubtitle && entry.subtitle && (
            <span className="font-normal"> | <RichText text={entry.subtitle} /></span>
          )}
        </p>
        <p className="text-[10.5px] text-ink/70 whitespace-nowrap">
          {[entry.location, entry.dates].filter(Boolean).join(" | ")}
        </p>
      </div>
      {subtitleParts.length > 0 && (
        <p className="text-[11px] italic text-ink/80">
          {subtitleParts.map((n, i) => (
            <span key={i}>
              {i > 0 && " · "}
              {n}
            </span>
          ))}
        </p>
      )}
      <ul className="mt-1 space-y-[3px]">
        {entry.bullets.map((b, i) => (
          <li key={i} className="text-[11px] leading-[1.45] pl-3 relative">
            <span className="absolute left-0">•</span>
            <RichText text={b} />
          </li>
        ))}
      </ul>
    </div>
  );
}


export default function ClassicTemplate({
  data,
  titles,
  order,
}: {
  data: ResumeData;
  titles?: SectionTitles;
  order?: SectionKey[];
}) {
  const sections: Record<SectionKey, React.ReactNode> = {
    summary: data.summary ? (
      <section key="summary">
        <SectionTitle>{sectionTitle(titles, "summary")}</SectionTitle>
        <p className="text-[11px] leading-[1.5] text-justify"><RichText text={data.summary} /></p>
      </section>
    ) : null,
    skills: data.skills.length > 0 ? (
      <section key="skills">
        <SectionTitle>{sectionTitle(titles, "skills")}</SectionTitle>
        <div className="space-y-2">
          {data.skills.map((g, i) => (
            <div key={i} className="resume-block text-[11px] leading-[1.45]">
              {g.layout === "bullets" ? (
                <>
                  <p className="font-bold">{g.category}</p>
                  <ul className="space-y-[2px]">
                    {g.items.map((item, j) => (
                      <li key={j} className="pl-3 relative">
                        <span className="absolute left-0">•</span><RichText text={item} />
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>
                  <span className="font-bold">{g.category}: </span>
                  {g.items.map((item, j) => (
                    <span key={j}>{j > 0 && ", "}<RichText text={item} /></span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    ) : null,
    experience: data.experience.length > 0 ? (
      <section key="experience">
        <SectionTitle>{sectionTitle(titles, "experience")}</SectionTitle>
        {data.experience.map((e, i) => (
          <Entry key={i} entry={e} />
        ))}
      </section>
    ) : null,
    projects: data.projects.length > 0 ? (
      <section key="projects">
        <SectionTitle>{sectionTitle(titles, "projects")}</SectionTitle>
        {data.projects.map((e, i) => (
          <Entry key={i} entry={e} inlineSubtitle />
        ))}
      </section>
    ) : null,
    education: data.education.length > 0 ? (
      <section key="education">
        <SectionTitle>{sectionTitle(titles, "education")}</SectionTitle>
        {data.education.map((e, i) => (
          <Entry key={i} entry={e} />
        ))}
      </section>
    ) : null,
    certifications: data.certifications.length > 0 ? (
      <section key="certifications">
        <SectionTitle>{sectionTitle(titles, "certifications")}</SectionTitle>
        <ul className="space-y-[3px]">
          {data.certifications.map((c, i) => (
            <li key={i} className="text-[11px] pl-3 relative">
              <span className="absolute left-0">•</span>
              <RichText text={c} />
            </li>
          ))}
        </ul>
      </section>
    ) : null,
  };

  return (
    <div className="resume-page bg-paper text-ink px-10 py-8">
      <header className="text-center">
        <h1 className="text-[26px] font-bold tracking-normal uppercase">{data.name || "YOUR NAME"}</h1>
        {data.headline && <p className="text-[12.5px] font-semibold mt-1">{data.headline}</p>}
        {data.contact.length > 0 && (
          <p className="text-[10.5px] text-ink/75 mt-1 leading-relaxed">
            {data.contact.map((c, i) => (
              <span key={i}>
                {i > 0 && "  |  "}
                <RichText text={c} />
              </span>
            ))}
          </p>
        )}
      </header>

      {normalizeOrder(order).map((k) => sections[k])}
    </div>
  );
}

