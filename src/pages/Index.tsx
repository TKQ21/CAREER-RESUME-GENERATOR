import { useState } from "react";
import { toast } from "sonner";
import InputBox from "@/components/InputBox";
import UploadBox from "@/components/UploadBox";
import ResumeEditor from "@/components/ResumeEditor";
import ResumeOutput, { ResumeData } from "@/components/ResumeOutput";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Index() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedText, setUploadedText] = useState<string | null>(null);

  async function callTranslate(text: string, role: string, mode: "create" | "import") {
    setIsLoading(true);
    setResumeData(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/career-translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ text, role, mode }),
      });

      if (res.status === 429) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
        return;
      }
      if (res.status === 402) {
        toast.error("AI usage limit reached. Please add credits.");
        return;
      }
      if (!res.ok) throw new Error("Failed to generate resume");

      const data = await res.json();
      setResumeData(data);
      toast.success(mode === "import" ? "Resume import ho gaya — ab edit karo!" : "Resume generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 scanline pointer-events-none z-10" />

      <div className="relative z-20 max-w-3xl mx-auto px-4 py-10">
        <header className="text-center mb-2 no-print">
          <h1 className="text-5xl md:text-6xl font-bold font-display neon-text">Resume Creator</h1>
          <p className="text-muted-foreground font-mono text-sm mt-3">
            Apna kaam describe karo ya purana resume upload karo → Professional Resume paao
          </p>
        </header>

        <div className="no-print">
          <UploadBox
            onExtracted={(text) => {
              setUploadedText(text);
              callTranslate(text, "auto", "import");
            }}
            isLoading={isLoading}
          />

          <InputBox
            onGenerate={(text, role) => callTranslate(text, role, "create")}
            isLoading={isLoading}
            initialText={uploadedText ?? ""}
          />
        </div>

        {resumeData && (
          <>
            <ResumeEditor data={resumeData} onChange={setResumeData} />
            <ResumeOutput data={resumeData} />
          </>
        )}

        <div className="no-print text-center text-xs text-muted-foreground mt-16 pb-6">
          © 2026 Mohd Kaif · Built with AI assistance
        </div>
      </div>
    </div>
  );
}
