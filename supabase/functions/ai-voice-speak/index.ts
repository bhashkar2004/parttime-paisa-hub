import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return new Response(JSON.stringify({ error: "No text to speak." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const input = text.slice(0, 2000);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input,
        voice: "alloy",
        response_format: "mp3",
        instructions:
          "Speak in a friendly, clear, helpful tone at a natural pace. Detect the language of the text and speak it naturally as a native Indian speaker would: English, Hindi, Hinglish, or Telugu (including Telugu written in Roman letters).",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("TTS failed", res.status, detail);
      return new Response(JSON.stringify({ error: "Voice is unavailable right now." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }

    return new Response(JSON.stringify({ audio: btoa(binary), mimeType: "audio/mpeg" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-voice-speak failed", err);
    return new Response(JSON.stringify({ error: "Voice is unavailable right now." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
