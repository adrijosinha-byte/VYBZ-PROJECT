// Server-Side OpenAI Responses API Client for VYBZ // ARCADE SYSTEM
// NEVER import this file from client components.

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY || "";

export const isOpenAiConfigured = Boolean(
  apiKey &&
    apiKey.trim().length > 0 &&
    !apiKey.includes("placeholder") &&
    !apiKey.includes("your-api-key")
);

export const openai = new OpenAI({
  apiKey: apiKey || "dummy-key-for-build",
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

/**
 * Generate typed, structured JSON from OpenAI Responses API
 */
export async function generateStructuredJson<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
}): Promise<T> {
  if (!isOpenAiConfigured) {
    throw new Error(
      "OPENAI_NOT_CONFIGURED // OPENAI_API_KEY is not set in environment variables."
    );
  }

  const response = await openai.chat.completions.create({
    model: params.model || OPENAI_MODEL,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: params.temperature ?? 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("EMPTY_AI_RESPONSE // OpenAI returned an empty response body.");
  }

  try {
    return JSON.parse(content) as T;
  } catch (err: any) {
    throw new Error(`MALFORMED_JSON_OUTPUT // Failed to parse OpenAI JSON output: ${err?.message}`);
  }
}
