import { ResumeData, ResumeEntry, FOOTER_TEXT } from "./types";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="resume-section-title text-[11px] font-bold uppercase tracking-[2px] text-ink/70 mt-3 mb-1">
      {children}
    </h2>
  );
}

function Entry({ entry }: { entry: ResumeEntry }) {
  return (
    <div className="resume-block mb-2">
      <p className="text-[11.5px]">
        <span className="font-bold">{entry.title}</span>
        {entry.subtitle && <span className="text-ink/75"> — {entry.subtitle}</span>}
        {(entry.dates || entry.location) && (
          <span className="text-ink/60 text-[10px]">
            {"  "}
            {[entry.location, entry.dates].filter(Boolean).join(", ")}
          </span>
        )}
      </p>
      <ul className="space-y-[1px]">
        {entry.bullets.map((b, i) => (
          <li key={i} className="text-[10.5px] leading-[1.4] pl-3 relative">
            <span className="absolute left-0">▪</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CompactTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="resume-page bg-paper text-ink px-9 py-7">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/60 pb-2">
        <div>
          <h1 className="text-[22px] font-bold uppercase tracking-[1px] leading-none">
            {data.name || "YOUR NAME"}
          </h1>
          {data.headline && <p className="text-[11px] text-ink/75 mt-[3px]">{data.headline}</p>}
        </div>
        {data.contact.length > 0 && (
          <p className="text-[9.5px] text-ink/70 text-right leading-snug max-w-[45%]">
            {data.contact.join(" · ")}
          </p>
        )}
      </header>

      {data.summary && (
        <section>
          <SectionTitle>Summary</SectionTitle>
          <p className="text-[10.5px] leading-[1.45] text-justify">{data.summary}</p>
        </section>
      )}

      {data.skills.length > 0 && (
        <section>
          <SectionTitle>Skills</SectionTitle>
          {data.skills.map((g, i) => (
            <div key={i} className="resume-block text-[10.5px] leading-[1.4] mb-1">
              {g.layout === "bullets" ? (
                <>
                  <p className="font-bold">{g.category}</p>
                  <ul className="grid grid-cols-3 gap-x-4">
                    {g.items.map((item, j) => (
                      <li key={j} className="pl-3 relative">
                        <span className="absolute left-0">▪</span>{item}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>
                  <span className="font-bold">{g.category}: </span>
                  {g.items.join(", ")}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {data.experience.length > 0 && (
        <section>
          <SectionTitle>Experience</SectionTitle>
          {data.experience.map((e, i) => (
            <Entry key={i} entry={e} />
          ))}
        </section>
      )}

      {data.projects.length > 0 && (
        <section>
          <SectionTitle>Projects</SectionTitle>
          {data.projects.map((e, i) => (
            <Entry key={i} entry={e} />
          ))}
        </section>
      )}

      {data.education.length > 0 && (
        <section>
          <SectionTitle>Education</SectionTitle>
          {data.education.map((e, i) => (
            <Entry key={i} entry={e} />
          ))}
        </section>
      )}

      {data.certifications.length > 0 && (
        <section>
          <SectionTitle>Certifications</SectionTitle>
          <p className="text-[10.5px] leading-[1.4]">{data.certifications.join(" · ")}</p>
        </section>
      )}

      <p className="resume-footer text-center text-[9px] text-ink/50 mt-5 pt-2 border-t border-ink/20">
        {FOOTER_TEXT}
      </p>
    </div>
  );
}
