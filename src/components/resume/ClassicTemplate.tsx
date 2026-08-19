import { ResumeData, ResumeEntry } from "./types";
import RichText from "./RichText";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="resume-section-title text-center text-[15px] font-bold tracking-wide border-y border-ink/70 py-[2px] my-3">
      {children}
    </h2>
  );
}

function Entry({ entry }: { entry: ResumeEntry }) {
  return (
    <div className="resume-block mb-3">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[12.5px] font-bold"><RichText text={entry.title} /></p>
        <p className="text-[10.5px] text-ink/70 whitespace-nowrap">
          {[entry.location, entry.dates].filter(Boolean).join(" | ")}
        </p>
      </div>
      {entry.subtitle && <p className="text-[11px] italic text-ink/80"><RichText text={entry.subtitle} /></p>}
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

export default function ClassicTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="resume-page bg-paper text-ink px-10 py-8">
      <header className="text-center">
        <h1 className="text-[26px] font-bold tracking-[2px] uppercase">{data.name || "YOUR NAME"}</h1>
        {data.headline && <p className="text-[12.5px] font-semibold mt-1">{data.headline}</p>}
        {data.contact.length > 0 && (
          <p className="text-[10.5px] text-ink/75 mt-1 leading-relaxed">{data.contact.join("  |  ")}</p>
        )}
      </header>

      {data.summary && (
        <section>
          <SectionTitle>Summary</SectionTitle>
          <p className="text-[11px] leading-[1.5] text-justify"><RichText text={data.summary} /></p>
        </section>
      )}

      {data.skills.length > 0 && (
        <section>
          <SectionTitle>Skills</SectionTitle>
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
          <ul className="space-y-[3px]">
            {data.certifications.map((c, i) => (
              <li key={i} className="text-[11px] pl-3 relative">
                <span className="absolute left-0">•</span>
                <RichText text={c} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
