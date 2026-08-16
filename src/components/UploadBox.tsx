import { useRef, useState } from "react";
import { toast } from "sonner";
import { extractResumeText } from "@/lib/extractText";

interface UploadBoxProps {
  onExtracted: (text: string) => void;
  isLoading: boolean;
}

export default function UploadBox({ onExtracted, isLoading }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  async function handleFile(file: File) {
    setParsing(true);
    setFileName(file.name);
    try {
      const text = await extractResumeText(file);
      if (text.trim().length < 30) {
        toast.error("Is file se text nahi mila. Ho sakta hai scanned PDF ho — text paste kar do.");
        return;
      }
      onExtracted(text);
      toast.success("Resume padh liya — ab edit kar sakte ho.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "File read nahi hui.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="mt-8">
      <label className="block text-sm font-mono text-muted-foreground mb-2">
        EXISTING RESUME UPLOAD KARO (PDF / DOCX / TXT) — optional
      </label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-md border border-dashed border-border bg-card/50 hover:border-primary/70 transition-all p-6 text-center"
      >
        <p className="font-display text-foreground">
          {parsing ? "Reading file..." : "Drop file here or click to browse"}
        </p>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          {fileName ?? "Purana resume upload karo → wahi content templates me edit karo"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          disabled={isLoading || parsing}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
