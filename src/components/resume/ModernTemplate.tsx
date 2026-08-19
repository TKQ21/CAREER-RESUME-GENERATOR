import { ResumeData, ResumeEntry } from "./types";
import RichText from "./RichText";

function Rail({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-ink/60 mb-2">{children}</h2>;
}

function MainTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="resume-section-title text-[13px] font-bold uppercase tracking-[1.5px] border-b-2 border-ink/80 pb-1 mb-2 mt-4">
      {children}
    </h2>
  );
}

function Entry({ entry }: { entry: ResumeEntry }) {
  return (
    <div className="resume-block mb-3">
      <p className="text-[12px] font-bold"><RichText text={entry.title} /></p>
      <p className="text-[10.5px] text-ink/70">
        {[entry.subtitle, entry.location, entry.dates].filter(Boolean).join(" · ")}
      </p>
      <ul className="mt-1 space-y-[3px]">
        {entry.bullets.map((b, i) => (
          <li key={i} className="text-[11px] leading-[1.45] pl-3 relative">
            <span className="absolute left-0">–</span>
            <RichText text={b} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ModernTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="resume-page bg-paper text-ink px-9 py-8">
      <header className="border-b-4 border-ink pb-3 mb-4">
        <h1 className="text-[28px] font-bold leading-none">{data.name || "YOUR NAME"}</h1>
        {data.headline && <p className="text-[12px] text-ink/75 mt-1">{data.headline}</p>}
      </header>

      <div className="flex gap-7 items-start">
        <aside className="w-[33%] shrink-0">
          {data.contact.length > 0 && (
            <div className="resume-block mb-4">
              <Rail>Contact</Rail>
              <div className="space-y-1">
                {data.contact.map((c, i) => (
                  <p key={i} className="text-[10px] break-words leading-snug">
                    <RichText text={c} />
                  </p>
                ))}
              </div>
            </div>
          )}

          {data.skills.length > 0 && (
            <div className="mb-4">
              <Rail>Skills</Rail>
              <div className="space-y-2">
                {data.skills.map((g, i) => (
                  <div key={i} className="resume-block">
                    <p className="text-[10.5px] font-bold">{g.category}</p>
                    {g.layout === "bullets" ? (
                      <ul className="mt-[2px] space-y-[2px] text-[10px] leading-[1.4] text-ink/80">
                        {g.items.map((item, j) => (
                          <li key={j} className="pl-3 relative">
                            <span className="absolute left-0">•</span><RichText text={item} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-[2px] text-[10px] leading-[1.4] text-ink/80">
                        {g.items.map((item, j) => (
                        <span key={j}>{j > 0 && ", "}<RichText text={item} /></span>
                      ))}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.education.length > 0 && (
            <div className="mb-4">
              <Rail>Education</Rail>
              {data.education.map((e, i) => (
                <div key={i} className="resume-block mb-2">
                  <p className="text-[10.5px] font-bold"><RichText text={e.title} /></p>
                  <p className="text-[10px] text-ink/70">
                    {[e.subtitle, e.dates].filter(Boolean).join(" · ")}
                  </p>
                  {e.bullets.map((b, j) => (
                    <p key={j} className="text-[10px] text-ink/80 leading-snug">
                      <RichText text={b} />
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {data.certifications.length > 0 && (
            <div>
              <Rail>Certifications</Rail>
              <ul className="space-y-1">
                {data.certifications.map((c, i) => (
                  <li key={i} className="text-[10px] leading-snug">
                    <RichText text={c} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0">
          {data.summary && (
            <section>
              <MainTitle>Profile</MainTitle>
              <p className="text-[11px] leading-[1.5]"><RichText text={data.summary} /></p>
            </section>
          )}

          {data.experience.length > 0 && (
            <section>
              <MainTitle>Experience</MainTitle>
              {data.experience.map((e, i) => (
                <Entry key={i} entry={e} />
              ))}
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <MainTitle>Projects</MainTitle>
              {data.projects.map((e, i) => (
                <Entry key={i} entry={e} />
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
