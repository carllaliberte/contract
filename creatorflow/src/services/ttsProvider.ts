import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { fetchTtsBlob } from "../lib/api/generateTts";
import { ttsCache, type TTSCacheEntry } from "./ttsCache";

export const TTS_VOICES = [
  { id: "nova", name: "Nova" },
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "onyx", name: "Onyx" },
  { id: "shimmer", name: "Shimmer" },
] as const;

const VOICE_PREF_KEY = "cf.tts.voice";
const SPEED_PREF_KEY = "cf.tts.speed";

export type TtsVoiceOption = (typeof TTS_VOICES)[number];

export type GetTtsAudioOptions = {
  text: string;
  voiceId?: string;
  voiceName?: string;
  speed?: number;
  force?: boolean;
};

export type TtsAudioResult = {
  entry: TTSCacheEntry;
  playbackUrl: string;
};

export function getSelectedVoice(): TtsVoiceOption {
  const stored = localStorage.getItem(VOICE_PREF_KEY);
  return TTS_VOICES.find((voice) => voice.id === stored) ?? TTS_VOICES[0];
}

export function setSelectedVoice(voiceId: string): void {
  if (TTS_VOICES.some((voice) => voice.id === voiceId)) {
    localStorage.setItem(VOICE_PREF_KEY, voiceId);
  }
}

export function getSelectedSpeed(): number {
  const stored = Number(localStorage.getItem(SPEED_PREF_KEY));
  if (!Number.isFinite(stored) || stored < 0.5 || stored > 2) {
    return 1;
  }
  return stored;
}

export function setSelectedSpeed(speed: number): void {
  const clamped = Math.min(2, Math.max(0.5, speed));
  localStorage.setItem(SPEED_PREF_KEY, String(clamped));
}

export async function resolveTtsPlaybackUrl(entry: TTSCacheEntry): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.getUri({
      path: entry.path,
      directory: Directory.Data,
    });
    return Capacitor.convertFileSrc(uri);
  }

  const result = await Filesystem.readFile({
    path: entry.path,
    directory: Directory.Data,
  });
  const base64 = result.data as string;
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
}

/**
 * Récupère l'audio TTS via le cache local ou le provider distant.
 */
export async function getTtsAudio(options: GetTtsAudioOptions): Promise<TtsAudioResult> {
  const text = options.text.trim();
  if (!text) {
    throw new Error("Text is required");
  }

  const selectedVoice = getSelectedVoice();
  const voiceId = options.voiceId ?? selectedVoice.id;
  const voiceName =
    options.voiceName ??
    TTS_VOICES.find((voice) => voice.id === voiceId)?.name ??
    selectedVoice.name;
  const speed = options.speed ?? getSelectedSpeed();

  const entry = await ttsCache.getOrGenerate(
    text,
    voiceId,
    voiceName,
    speed,
    () => fetchTtsBlob(text, voiceId, speed),
    { force: options.force },
  );

  const playbackUrl = await resolveTtsPlaybackUrl(entry);
  return { entry, playbackUrl };
}
