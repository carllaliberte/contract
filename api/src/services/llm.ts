import OpenAI from "openai";
import { env } from "../env.js";
import {
  buildMockScript,
  buildScriptPrompt,
  type PromptInput,
} from "./prompt.js";

export async function generateScriptWithLlm(
  input: PromptInput,
): Promise<{ script: string; model: string }> {
  if (env.mockLlm) {
    return { script: buildMockScript(input), model: "mock" };
  }

  const client = new OpenAI({ apiKey: env.openaiApiKey });
  const { system, user } = buildScriptPrompt(input);

  const completion = await client.chat.completions.create({
    model: env.openaiModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
  });

  const script = completion.choices[0]?.message?.content?.trim();
  if (!script) {
    throw new Error("Empty LLM response");
  }

  return { script, model: completion.model ?? env.openaiModel };
}
