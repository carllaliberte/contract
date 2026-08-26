import { useCallback, useEffect, useRef, useState } from "react";
import { getTtsAudio } from "../services/ttsProvider";

export type TtsPlaybackState = "idle" | "loading" | "playing" | "error";

export function useTtsPlayback(text: string) {
  const [state, setState] = useState<TtsPlaybackState>("idle");
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackUrlRef = useRef<string | null>(null);

  const cleanupPlayback = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (playbackUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(playbackUrlRef.current);
    }
    playbackUrlRef.current = null;
  }, []);

  useEffect(() => {
    cleanupPlayback();
    setState("idle");
    setFromCache(false);
    setError(null);
  }, [text, cleanupPlayback]);

  useEffect(() => () => cleanupPlayback(), [cleanupPlayback]);

  const play = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (state === "playing") {
      cleanupPlayback();
      setState("idle");
      return;
    }

    cleanupPlayback();
    setState("loading");
    setError(null);

    try {
      const { entry, playbackUrl } = await getTtsAudio({ text: trimmed });
      setFromCache(entry.fromCache);

      const audio = new Audio(playbackUrl);
      audioRef.current = audio;
      playbackUrlRef.current = playbackUrl;

      audio.onended = () => {
        setState("idle");
        cleanupPlayback();
      };
      audio.onerror = () => {
        setState("error");
        setError("PLAYBACK_FAILED");
        cleanupPlayback();
      };

      await audio.play();
      setState("playing");
    } catch (playError) {
      cleanupPlayback();
      setState("error");
      setError(playError instanceof Error ? playError.message : "TTS_FAILED");
    }
  }, [cleanupPlayback, state, text]);

  return {
    state,
    fromCache,
    error,
    play,
    isLoading: state === "loading",
    isPlaying: state === "playing",
  };
}
