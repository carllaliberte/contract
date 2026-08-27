import OpenAI from "openai";
import { env } from "../env.js";
import {
  buildMockPack,
  buildScriptPrompt,
  type PromptInput,
} from "./prompt.js";
import { parseScriptPack, type ScriptPackPayload } from "./scriptPack.js";

export async function generateScriptWithLlm(
  input: PromptInput,
): Promise<ScriptPackPayload & { model: string }> {
  if (env.mockLlm) {
    return { ...buildMockPack(input), model: "mock" };
  }

  const client = new OpenAI({
    apiKey: env.xaiApiKey,
    baseURL: "https://api.x.ai/v1",
  });
  const { system, user } = buildScriptPrompt(input);

  const completion = await client.chat.completions.create({
    model: env.xaiModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("Empty LLM response");
  }

  return { ...parseScriptPack(raw), model: completion.model ?? env.xaiModel };
}