import OpenAI from "openai";
import { env } from "../env.js";

export const TTS_VOICES = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
] as const;

export type TtsVoiceId = (typeof TTS_VOICES)[number];

export type TtsInput = {
  text: string;
  voiceId: string;
  speed: number;
};

/** Minimal valid MP3 used when MOCK_LLM / no OpenAI key. */
const MOCK_MP3_BASE64 =
  "//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU3AAAAAAAAAAAAAAAAJAAAAAAAAAAAAAAnEL0JAAAAAAAAAAAAAAAAAAAA//uQZAAAAAD0AAD/4QB8AAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

function isTtsVoice(value: string): value is TtsVoiceId {
  return (TTS_VOICES as readonly string[]).includes(value);
}

function mockTtsAudio(): ArrayBuffer {
  const binary = Buffer.from(MOCK_MP3_BASE64, "base64");
  return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
}

export async function generateTtsAudio(input: TtsInput): Promise<ArrayBuffer> {
  const text = input.text.trim();
  if (!text) {
    throw new Error("Text is required");
  }

  if (env.mockLlm) {
    return mockTtsAudio();
  }

  const client = new OpenAI({ apiKey: env.openaiApiKey });
  const response = await client.audio.speech.create({
    model: "tts-1",
    voice: isTtsVoice(input.voiceId) ? input.voiceId : "nova",
    input: text.slice(0, 4096),
    speed: input.speed,
  });

  return response.arrayBuffer();
}
