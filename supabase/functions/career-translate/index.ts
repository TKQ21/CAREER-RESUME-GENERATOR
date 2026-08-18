import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Entry {
  title?: string;
  subtitle?: string;
  location?: string;
  dates?: string;
  bullets?: unknown;
}

function normalizeEntries(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e: Entry) => ({
      title: String(e?.title ?? "").trim(),
      subtitle: e?.subtitle ? String(e.subtitle).trim() : undefined,
      location: e?.location ? String(e.location).trim() : undefined,
      dates: e?.dates ? String(e.dates).trim() : undefined,
      bullets: Array.isArray(e?.bullets) ? e.bullets.map((b) => String(b).trim()).filter(Boolean) : [],
    }))
    .filter((e) => e.title || e.bullets.length > 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, role, mode } = await req.json();
    if (typeof text !== "string" || text.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Please provide more details about your work." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isImport = mode === "import";
    const autoRole = !role || role === "auto";
    const roleLine = autoRole
      ? `The user did NOT pick a target role. Infer the single most suitable target role from their information and use it in "headline".`
      : `The user's target role is: ${role}. Tailor the resume to it.`;

    const systemPrompt = `You are a professional resume writer, career coach, and translator.

STRICT RULES:
1. FIRST translate the entire input from Roman Hindi / Hinglish into clean professional English.
2. NEVER mix Hindi and English in the output. Never copy raw input text verbatim.
3. NEVER invent fake metrics, companies, dates, degrees or achievements. Only use what the user gave.
4. Content must be honest, ATS-friendly and role-relevant, in a confident HR-ready tone.
5. Use every meaningful detail the user provided — do not drop experience or projects. A longer input should produce a longer resume (2-3 pages is fine).
6. Do NOT include LinkedIn-summary or interview-prep style sections.

${roleLine}

${isImport ? `IMPORT MODE: The input is the raw text of an EXISTING resume the user uploaded. Preserve their real content, wording, section structure, bullet points, job titles, dates and skill groupings as faithfully as possible. Only fix grammar, translate any Hindi/Hinglish parts into English, and keep every bullet as its own bullet. Do NOT rewrite from scratch, do NOT drop sections, do NOT add anything that is not in the file.` : ""}

Respond with ONLY a valid JSON object (no markdown, no commentary) shaped exactly like:
{
  "name": "Full name from input, else empty string",
  "headline": "Role-focused headline, e.g. 'AI Application Developer | Generative AI Engineer'",
  "contact": ["phone", "email", "linkedin url", "github url", "portfolio url"],
  "summary": "3-4 line professional summary",
  "skills": [{ "category": "Programming/Frontend", "items": ["Python", "React.js"], "layout": "inline" }],
  "experience": [{ "title": "Company — Role", "subtitle": "optional", "location": "City, Country", "dates": "MM/YYYY – MM/YYYY", "bullets": ["impact-focused bullet"] }],
  "projects": [{ "title": "Project name — one-line descriptor", "location": "optional", "dates": "optional", "bullets": ["what was built, tech used, outcome"] }],
  "education": [{ "title": "Degree", "subtitle": "Institution", "dates": "years", "bullets": ["optional detail like CGPA if given"] }],
  "certifications": ["certification name"]
}

Rules for fields: omit array items you have no information for (return empty arrays). Group skills into 3-6 labelled categories. Each experience/project should have 3-6 bullets when the input supports it, each bullet one sentence starting with a strong action verb.

SKILLS LAYOUT: for every skill group set "layout" to how it appeared in the source text — "inline" if the items were written horizontally on one line (comma/slash/pipe separated), or "bullets" if each item was on its own line / had its own bullet marker. If unsure, use "inline".`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from AI");

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    const result = {
      name: String(parsed.name ?? "").trim(),
      headline: String(parsed.headline ?? (autoRole ? "" : role)).trim(),
      contact: Array.isArray(parsed.contact)
        ? parsed.contact.map((c: unknown) => String(c).trim()).filter(Boolean)
        : [],
      summary: String(parsed.summary ?? "").trim(),
      skills: Array.isArray(parsed.skills)
        ? parsed.skills
            .map((g: { category?: string; items?: unknown; layout?: string }) => ({
              category: String(g?.category ?? "Skills").trim(),
              items: Array.isArray(g?.items) ? g.items.map((i) => String(i).trim()).filter(Boolean) : [],
              layout: g?.layout === "bullets" ? "bullets" : "inline",
            }))
            .filter((g) => g.items.length > 0)
        : [],
      experience: normalizeEntries(parsed.experience),
      projects: normalizeEntries(parsed.projects),
      education: normalizeEntries(parsed.education),
      certifications: Array.isArray(parsed.certifications)
        ? parsed.certifications.map((c: unknown) => String(c).trim()).filter(Boolean)
        : [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("career-translate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
