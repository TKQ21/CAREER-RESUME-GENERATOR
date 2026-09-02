import { useEffect, useState } from "react";

const AUTO_ROLE = "auto";

const ROLES = [
  "Data Analyst",
  "AI Product Builder",
  "AI Application Developer",
  "ML Engineer",
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Product Manager",
];

interface InputBoxProps {
  onGenerate: (text: string, role: string) => void;
  isLoading: boolean;
  initialText?: string;
}

export default function InputBox({ onGenerate, isLoading, initialText = "" }: InputBoxProps) {
  const [text, setText] = useState(initialText);
  const [role, setRole] = useState(AUTO_ROLE);

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);


  return (
    <div className="mt-8 space-y-4">
      <div>
        <label className="block text-sm font-mono text-muted-foreground mb-2">
          TARGET ROLE (or let AI detect it)
        </label>
        <select
          className="w-full bg-card border border-border rounded-md p-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value={AUTO_ROLE} className="bg-card">
            Auto-detect from my information
          </option>
          {ROLES.map((r) => (
            <option key={r} value={r} className="bg-card">
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-mono text-muted-foreground mb-2">
          DESCRIBE YOUR WORK (Hindi / Hinglish / English)
        </label>
        <textarea
          className="w-full h-56 bg-card neon-border rounded-md p-4 text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
          placeholder="Naam, contact, education, internships, projects, skills — jitna likhna hai likho. Jaise: 'Ananya Verma, Pune, +91 98200 45678, ananya.verma@example.com, maine Python me sales dashboard banaya...'"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <button
        onClick={() => text.trim() && onGenerate(text, role)}
        disabled={isLoading || !text.trim()}
        className="gradient-btn px-8 py-3 rounded-md font-display font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed w-full text-lg"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-pulse-glow">⚡</span> Generating Resume...
          </span>
        ) : (
          "Translate & Generate Resume 🚀"
        )}
      </button>
    </div>
  );
}
