import { useRef } from "react";

export interface ResumeData {
  name: string;
  title: string;
  contact: string;
  objective: string;
  skills: string[];
  projects: string[];
  education: string;
  certifications: string[];
}

interface ResumeOutputProps {
  data: ResumeData;
}

export default function ResumeOutput({ data }: ResumeOutputProps) {
  const resumeRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = resumeRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${data.name} - Resume</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 12px; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; }
            .name { font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
            .title { font-size: 14px; color: #444; margin-top: 4px; }
            .contact { font-size: 11px; color: #666; margin-top: 8px; }
            .section { margin-bottom: 18px; }
            .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
            .bullet { margin-left: 16px; margin-bottom: 4px; }
            .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${data.name || "YOUR NAME"}</div>
            <div class="title">${data.title || ""}</div>
            <div class="contact">${data.contact || ""}</div>
          </div>
          <div class="section">
            <div class="section-title">Career Objective</div>
            <p>${data.objective}</p>
          </div>
          <div class="section">
            <div class="section-title">Technical Skills</div>
            ${data.skills.map((s) => `<div class="bullet">• ${s}</div>`).join("")}
          </div>
          <div class="section">
            <div class="section-title">Projects / Experience</div>
            ${data.projects.map((p) => `<div class="bullet">• ${p}</div>`).join("")}
          </div>
          ${data.education ? `<div class="section"><div class="section-title">Education</div><p>${data.education}</p></div>` : ""}
          ${data.certifications.length > 0 ? `<div class="section"><div class="section-title">Certifications</div>${data.certifications.map((c) => `<div class="bullet">• ${c}</div>`).join("")}</div>` : ""}
          <div class="footer">© 2026 Mohd Kaif · Built with AI assistance</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Preview */}
      <div ref={resumeRef} className="bg-card neon-border rounded-lg p-6 space-y-5 scanline">
        {/* Header */}
        <div className="text-center border-b border-border pb-4">
          <h2 className="text-2xl font-bold font-display tracking-wider uppercase text-foreground">
            {data.name || "YOUR NAME"}
          </h2>
          {data.title && (
            <p className="text-sm text-primary font-mono mt-1">{data.title}</p>
          )}
          {data.contact && (
            <p className="text-xs text-muted-foreground font-mono mt-2">{data.contact}</p>
          )}
        </div>

        {/* Objective */}
        <Section title="CAREER OBJECTIVE">
          <p className="text-sm text-foreground/90 leading-relaxed">{data.objective}</p>
        </Section>

        {/* Skills */}
        <Section title="TECHNICAL SKILLS">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {data.skills.map((s, i) => (
              <p key={i} className="text-sm text-foreground/90 font-mono">• {s}</p>
            ))}
          </div>
        </Section>

        {/* Projects */}
        <Section title="PROJECTS / EXPERIENCE">
          {data.projects.map((p, i) => (
            <p key={i} className="text-sm text-foreground/90 font-mono mb-1">• {p}</p>
          ))}
        </Section>

        {/* Education */}
        {data.education && (
          <Section title="EDUCATION">
            <p className="text-sm text-foreground/90">{data.education}</p>
          </Section>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <Section title="CERTIFICATIONS">
            {data.certifications.map((c, i) => (
              <p key={i} className="text-sm text-foreground/90 font-mono">• {c}</p>
            ))}
          </Section>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          © 2026 Mohd Kaif · Built with AI assistance
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handlePrint}
        className="gradient-btn px-6 py-3 rounded-md font-display font-semibold text-primary-foreground w-full text-lg"
      >
        📄 Download Resume PDF
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold font-display tracking-widest uppercase text-primary border-b border-border/50 pb-1 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
