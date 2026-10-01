import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const AI_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

const LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi (Devanagari script)", te: "Telugu (Telugu script)",
  ta: "Tamil (Tamil script)", kn: "Kannada (Kannada script)", ml: "Malayalam (Malayalam script)",
  mr: "Marathi (Devanagari script)", bn: "Bengali (Bengali script)", gu: "Gujarati (Gujarati script)",
  pa: "Punjabi (Gurmukhi script)", or: "Odia (Odia script)", as: "Assamese (Bengali script)",
  ur: "Urdu (Arabic script)", ar: "Arabic", zh: "Simplified Chinese", es: "Spanish",
  fr: "French", de: "German", pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean",
  it: "Italian", tr: "Turkish", vi: "Vietnamese", th: "Thai", id: "Indonesian",
  fa: "Persian", sw: "Swahili", nl: "Dutch", pl: "Polish",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const target = typeof body?.target === "string" ? body.target : "";
    const texts = Array.isArray(body?.texts) ? body.texts : null;

    if (!LANG_NAMES[target]) return json({ error: "Unsupported language." }, 400);
    if (!texts || texts.length === 0 || texts.length > 200) {
      return json({ error: "Send between 1 and 200 texts." }, 400);
    }
    const clean = texts.map((t: unknown) => (typeof t === "string" ? t.slice(0, 1200) : ""));
    if (clean.join("").length > 40000) return json({ error: "Too much text." }, 400);

    const res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY") ?? "",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions:
          `You translate short job-listing texts for an Indian local part-time job app into ${LANG_NAMES[target]}. ` +
          `Keep company names, brand names, place names and numbers as they are. Keep it short and natural. ` +
          `Reply with ONLY a JSON array of translated strings, same length and same order as the input array. No extra text.`,
        input: [
          {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: JSON.stringify(clean) }],
          },
        ],
        reasoning: { effort: "low" },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("translate failed", res.status, detail);
      if (res.status === 429) {
        return json({
          translations: clean,
          warning: "Too many requests. Please try Telugu translation again in a moment.",
        });
      }
      return json({ error: "Translation is unavailable right now." }, 503);
    }

    const data = await res.json();
    let text: string = data.output_text ?? "";
    if (!text && Array.isArray(data.output)) {
      for (const item of data.output) {
        for (const c of item?.content ?? []) if (c?.text) text += c.text;
      }
    }

    const match = text.match(/\[[\s\S]*\]/);
    let translations: string[] = [];
    try {
      translations = JSON.parse(match ? match[0] : text);
    } catch {
      console.error("could not parse translation output", text.slice(0, 300));
      return json({ error: "Translation is unavailable right now." }, 503);
    }

    if (!Array.isArray(translations) || translations.length !== clean.length) {
      return json({ error: "Translation is unavailable right now." }, 503);
    }

    return json({
      translations: translations.map((t, i) => (typeof t === "string" && t.trim() ? t : clean[i])),
    });
  } catch (err) {
    console.error("translate-text failed", err);
    return json({ error: "Translation is unavailable right now." }, 500);
  }
});
