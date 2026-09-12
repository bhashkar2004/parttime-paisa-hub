import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const AI_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

const SYSTEM_PROMPT = `You are the AI Job Assistant for "Part Time Paisa", an Indian platform for local part-time jobs (shops, small businesses, delivery, tutoring, data entry).

Rules:
- Reply in the language the user used: English, Hindi, Hinglish, or Telugu (Telugu script, or Tenglish if the user wrote Telugu in Roman letters). Keep it short, warm and practical.
- When the user asks about jobs, openings, salary, location or "kaam", ALWAYS call the search_jobs tool first and answer only from its results.
- Never invent jobs. If search_jobs returns nothing, say no matching jobs are posted right now and suggest changing location or job type.
- When listing jobs use a short numbered list: job name — company, location, salary (if given).
- You can also explain how to post a job (Post a Job page), how to apply (Browse Jobs then Apply), and give quick interview/resume tips.
- Keep answers under about 120 words unless the user asks for detail.`;

const TOOLS = [
  {
    type: "function",
    name: "search_jobs",
    description:
      "Search the jobs posted on Part Time Paisa. All filters are optional; pass null to ignore a filter.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        location: { type: ["string", "null"], description: "City or area name" },
        job_type: {
          type: ["string", "null"],
          description: "One of: Part Time, Full Time, Internship, Contract",
        },
        qualification: {
          type: ["string", "null"],
          description: "One of: 10th, Inter, Graduation, Post Graduation",
        },
        keyword: {
          type: ["string", "null"],
          description: "Free text to match job name, company or description",
        },
      },
      required: ["location", "job_type", "qualification", "keyword"],
    },
  },
];

type Args = {
  location: string | null;
  job_type: string | null;
  qualification: string | null;
  keyword: string | null;
};

async function searchJobs(supabase: any, args: Args) {
  let query = supabase
    .from("jobs")
    .select(
      "job_name, company, location, salary, job_type, qualification, experience, description, application_deadline, contact_phone, contact_email",
    )
    .order("created_at", { ascending: false })
    .limit(12);

  if (args.location) query = query.ilike("location", `%${args.location}%`);
  if (args.job_type) query = query.ilike("job_type", `%${args.job_type}%`);
  if (args.qualification) query = query.ilike("qualification", `%${args.qualification}%`);
  if (args.keyword) {
    const k = args.keyword.replace(/[,%]/g, " ").trim();
    if (k) {
      query = query.or(
        `job_name.ilike.%${k}%,company.ilike.%${k}%,description.ilike.%${k}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) return { error: error.message, jobs: [] };
  return { count: data?.length ?? 0, jobs: data ?? [] };
}

async function callModel(input: unknown[]) {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY") ?? "",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: SYSTEM_PROMPT,
      input,
      tools: TOOLS,
      stream: true,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    return { status: res.status, error: body, output: [] as any[], text: "" };
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let text = "";
  let output: any[] = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      let evt: any;
      try {
        evt = JSON.parse(raw);
      } catch {
        continue;
      }
      if (evt.type === "response.output_text.delta" && evt.delta) text += evt.delta;
      if (evt.type === "response.completed" && evt.response?.output) {
        output = evt.response.output;
        if (evt.response.output_text) text = evt.response.output_text;
      }
    }
  }

  return { status: 200, error: "", output, text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Please log in to use the assistant." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
    if (userError || !user) return json({ error: "Please log in to use the assistant." }, 401);

    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 2000) {
      return json({ error: "Please send a message (up to 2000 characters)." }, 400);
    }

    const { data: history } = await supabase
      .from("ai_chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(30);

    await supabase.from("ai_chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: message,
    });

    const input: any[] = (history ?? []).map((m: any) => ({
      type: "message",
      role: m.role,
      content: [
        {
          type: m.role === "assistant" ? "output_text" : "input_text",
          text: m.content,
        },
      ],
    }));
    input.push({
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: message }],
    });

    let answer = "";
    for (let step = 0; step < 4; step++) {
      const result = await callModel(input);

      if (result.status !== 200) {
        console.error("AI gateway error", result.status, result.error);
        const msg =
          result.status === 402
            ? "The AI assistant has run out of credits. Please try again later."
            : result.status === 429
              ? "Too many requests right now. Please try again in a moment."
              : "The AI assistant is unavailable right now. Please try again.";
        return json({ error: msg }, result.status === 429 ? 429 : 503);
      }

      const calls = result.output.filter((o: any) => o.type === "function_call");
      if (calls.length === 0) {
        answer = result.text.trim();
        break;
      }

      for (const item of result.output) input.push(item);

      for (const call of calls) {
        let args: Args = { location: null, job_type: null, qualification: null, keyword: null };
        try {
          args = { ...args, ...JSON.parse(call.arguments || "{}") };
        } catch {
          // keep defaults
        }
        const toolResult = await searchJobs(supabase, args);
        input.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(toolResult),
        });
      }
    }

    if (!answer) answer = "Sorry, I could not come up with an answer. Please try asking again.";

    await supabase.from("ai_chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: answer,
    });

    return json({ reply: answer });
  } catch (err) {
    console.error("ai-job-assistant failed", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
