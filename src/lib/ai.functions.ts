import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Nexora AI — Centralized Gemini Service
 *
 * Frontend → this Service → Google Gemini (via Lovable AI Gateway) → Response → Frontend.
 * Every AI feature MUST route through here. No component may call the model directly.
 */

const GEMINI_MODELS = [
  "google/gemini-3.6-flash",
  "google/gemini-3.5-flash",
  "google/gemini-2.5-flash",
] as const;

const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

const NEXORA_SYSTEM = `You are Nexora AI, an experienced startup consultant, business strategist, branding expert, financial advisor and marketing advisor.

Your job is to help founders transform an idea into a real business.
Always provide practical, realistic and actionable advice.
Avoid generic answers.
Explain every recommendation.
Structure every response clearly.
Never invent facts.
If information is missing, ask follow-up questions before making assumptions.`;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type GenerationConfig = {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "text/plain" | "application/json";
};

type CallOptions = {
  systemInstruction?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  generationConfig?: GenerationConfig;
};

function friendlyError(status: number): Error {
  if (status === 401 || status === 403) return new Error("API key is invalid.");
  if (status === 402) return new Error("AI credits are exhausted. Please add credits in your workspace billing.");
  if (status === 429) return new Error("Daily request limit reached. Please try again later.");
  if (status === 408) return new Error("Gemini is taking longer than expected.");
  if (status >= 500) return new Error("Nexora AI is temporarily unavailable. Please retry.");
  return new Error("Something went wrong while contacting Nexora AI. Please retry.");
}

/**
 * Centralized Gemini caller with automatic Flash-model fallback and 20s per-attempt timeout.
 * Always prepends the Nexora system instruction unless the caller supplies their own.
 */
async function callGemini(opts: CallOptions): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Nexora AI is not configured. Please contact support.");

  const messages: ChatMessage[] = [
    { role: "system", content: opts.systemInstruction ?? NEXORA_SYSTEM },
    ...opts.messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const baseBody: Record<string, unknown> = {
    messages,
    temperature: opts.generationConfig?.temperature ?? 0.7,
    max_tokens: opts.generationConfig?.maxOutputTokens ?? 4096,
    // Gemini 3.x defaults to reasoning ON, which consumes max_tokens and returns
    // an empty content string. Disable reasoning for these completion calls.
    reasoning_effort: "none",
  };
  if (opts.generationConfig?.responseMimeType === "application/json") {
    baseBody.response_format = { type: "json_object" };
  }

  let lastErr: Error | null = null;
  let lastStatus = 0;

  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ ...baseBody, model }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        lastStatus = res.status;
        if (res.status === 404 || res.status === 400) {
          lastErr = new Error(`Model ${model} unavailable`);
          continue;
        }
        throw friendlyError(res.status);
      }

      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content ?? "";
      if (!text.trim()) throw new Error("Nexora AI returned an empty response. Please retry.");
      return text;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        lastErr = new Error("Gemini is taking longer than expected.");
        continue;
      }
      if (err instanceof Error && !/unavailable$/.test(err.message)) throw err;
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastErr ?? friendlyError(lastStatus);
}

/* ---------------------- Health / Status ---------------------- */

export const pingAI = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.LOVABLE_API_KEY;
  return { ok: Boolean(apiKey) };
});

/* ---------------------- Startup Generation ---------------------- */

export type StartupBlueprintInput = {
  idea: string;
  problem: string;
  customers: string[];
  country: string;
  budget: number;
  experience: string;
  timeline: string;
  advantage: string;
};

export type StartupBlueprint = {
  startupName: string;
  tagline: string;
  elevatorPitch: string;
  problemStatement: string;
  solution: string;
  targetAudience: string;
  customerPersona: string;
  marketOpportunity: string;
  competitorAnalysis: string;
  uniqueSellingProposition?: string;
  swotAnalysis: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  businessModel: string;
  revenueModel: string;
  pricingSuggestions: string;
  estimatedStartupCost?: string;
  brandingStrategy: string;
  brandIdentity?: string;
  logoConcept?: string;
  colorPalette?: string[];
  marketingStrategy: string;
  launchRoadmap: string;
  financialEstimate: string;
  risks: string[];
  growthOpportunities?: string[];
  investorPitchSummary?: string;
  recommendations: string[];
  nextSteps: string[];
};

const BLUEPRINT_SCHEMA_HINT = `Return a JSON object with EXACTLY these fields:
{
  "startupName": string,
  "tagline": string,
  "elevatorPitch": string,
  "problemStatement": string,
  "solution": string,
  "targetAudience": string,
  "customerPersona": string,
  "marketOpportunity": string,
  "competitorAnalysis": string,
  "uniqueSellingProposition": string,
  "swotAnalysis": { "strengths": string[], "weaknesses": string[], "opportunities": string[], "threats": string[] },
  "businessModel": string,
  "revenueModel": string,
  "pricingSuggestions": string,
  "estimatedStartupCost": string,
  "brandingStrategy": string,
  "brandIdentity": string,
  "logoConcept": string,
  "colorPalette": string[],           // 4-6 hex color codes with short names, e.g. "#0F172A — Midnight"
  "marketingStrategy": string,
  "launchRoadmap": string,
  "financialEstimate": string,
  "risks": string[],
  "growthOpportunities": string[],
  "investorPitchSummary": string,
  "recommendations": string[],
  "nextSteps": string[]
}

Rules:
- Return ONLY valid JSON. No prose. No markdown fences.
- Be specific and grounded to the founder's inputs.
- Never invent statistics; label estimates as estimates.`;

export const generateStartup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StartupBlueprintInput) => {
    if (!input || typeof input.idea !== "string" || input.idea.trim().length < 3) {
      throw new Error("Please describe your startup idea before generating.");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const prompt = `Founder interview answers:
- Idea: ${data.idea}
- Problem being solved: ${data.problem}
- Target customers: ${data.customers.join(", ") || "unspecified"}
- Country / market: ${data.country || "unspecified"}
- Available budget: $${data.budget?.toLocaleString?.() ?? data.budget} USD
- Founder experience: ${data.experience || "unspecified"}
- Launch timeline: ${data.timeline || "unspecified"}
- Unique advantage: ${data.advantage || "unspecified"}

Produce a complete, investor-ready startup blueprint tailored to these answers. Prefer the founder's stated market and budget. Keep every field substantive (multi-sentence where useful) and honest about uncertainty.

${BLUEPRINT_SCHEMA_HINT}`;

    const raw = await callGemini({
      messages: [{ role: "user", content: prompt }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 8192 },
    });

    let parsed: StartupBlueprint;
    try {
      parsed = JSON.parse(raw) as StartupBlueprint;
    } catch {
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned) as StartupBlueprint;
    }
    return parsed;
  });

/* ---------------------- Consultant Chat ---------------------- */

export type ChatTurn = { role: "user" | "ai"; text: string };

export const chatWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { history: ChatTurn[]; message: string }) => {
    if (!input?.message?.trim()) throw new Error("Please enter a message.");
    return input;
  })
  .handler(async ({ data }) => {
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...data.history.slice(-20).map(t => ({
        role: (t.role === "ai" ? "assistant" : "user") as "user" | "assistant",
        content: t.text,
      })),
      { role: "user" as const, content: data.message },
    ];
    const text = await callGemini({
      messages,
      generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
    });
    return { text };
  });
