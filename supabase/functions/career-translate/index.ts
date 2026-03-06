import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, role } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a professional resume writer, career coach, and language translator.

STRICT RULES:
1. FIRST, convert the entire input from Roman Hindi / Hinglish into clean, professional English.
2. DO NOT mix Hindi and English in the final output.
3. DO NOT copy-paste the raw input into the resume.
4. DO NOT add fake metrics, percentages, or achievements unless explicitly mentioned by the user.
5. Keep all content honest, ATS-friendly, and role-relevant.
6. Tone must be professional, confident, and HR-ready.

The user's target role is: ${role}

You MUST respond with a valid JSON object with exactly these fields:
{
  "name": "Extract from input or use empty string",
  "title": "${role} | [other relevant titles from input]",
  "contact": "Extract email, phone, GitHub, LinkedIn from input. If not provided, use empty string",
  "objective": "2-3 line professional career objective for ${role}",
  "skills": ["skill1", "skill2", ...],
  "projects": ["bullet point 1", "bullet point 2", ...],
  "education": "Education info if mentioned, otherwise empty string",
  "certifications": ["cert1", "cert2"] 
}

IMPORTANT: Return ONLY the JSON object. No markdown, no explanation, no extra text.
Skills should be categorized like "Frontend: React, Tailwind CSS" format.
Projects should be impact-focused bullet points (4-6 items).
If contact info is not in the input, leave contact as empty string.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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

    // Parse the JSON from AI response (handle markdown code blocks)
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // Ensure all required fields exist
    const result = {
      name: parsed.name || "",
      title: parsed.title || role,
      contact: parsed.contact || "",
      objective: parsed.objective || "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      education: parsed.education || "",
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
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
