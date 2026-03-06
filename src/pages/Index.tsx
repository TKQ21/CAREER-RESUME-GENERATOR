import { useState } from "react";
import { toast } from "sonner";
import InputBox from "@/components/InputBox";
import ResumeOutput, { ResumeData } from "@/components/ResumeOutput";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Index() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate(text: string, role: string) {
    setIsLoading(true);
    setResumeData(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/career-translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ text, role }),
      });

      if (res.status === 429) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
        return;
      }
      if (res.status === 402) {
        toast.error("AI usage limit reached. Please add credits.");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to generate resume");
      }

      const data = await res.json();
      setResumeData(data);
      toast.success("Resume generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Scanline overlay */}
      <div className="fixed inset-0 scanline pointer-events-none z-10" />

      <div className="relative z-20 max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-5xl md:text-6xl font-bold font-display neon-text">
            Career Translator
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-3">
            Apna kaam describe karo → Professional Resume paao
          </p>
        </div>

        <InputBox onGenerate={handleGenerate} isLoading={isLoading} />

        {resumeData && <ResumeOutput data={resumeData} />}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground mt-16 pb-6">
          © 2026 Mohd Kaif · Built with AI assistance
        </div>
      </div>
    </div>
  );
}
