import { beforeEach, describe, expect, it, vi } from "vitest";
import { Directory, Encoding } from "@capacitor/filesystem";
import { ttsCache } from "./ttsCache";

type StoredFile = {
  data: string;
  encoding?: Encoding;
};

const files = new Map<string, StoredFile>();

function fileKey(path: string): string {
  return `${Directory.Data}:${path}`;
}

vi.mock("@capacitor/filesystem", () => ({
  Directory: { Data: "DATA" },
  Encoding: { UTF8: "utf8" },
  Filesystem: {
    readFile: vi.fn(async ({ path, directory, encoding }: { path: string; directory: Directory; encoding?: Encoding }) => {
      const stored = files.get(`${directory}:${path}`);
      if (!stored) {
        throw new Error(`ENOENT: ${path}`);
      }
      return { data: stored.data };
    }),
    writeFile: vi.fn(async ({ path, directory, data, encoding }: { path: string; directory: Directory; data: string; encoding?: Encoding }) => {
      files.set(`${directory}:${path}`, { data, encoding });
    }),
    mkdir: vi.fn(async () => undefined),
    stat: vi.fn(async ({ path, directory }: { path: string; directory: Directory }) => {
      if (!files.has(`${directory}:${path}`)) {
        throw new Error(`ENOENT: ${path}`);
      }
      return { size: files.get(`${directory}:${path}`)?.data.length ?? 0 };
    }),
    deleteFile: vi.fn(async ({ path, directory }: { path: string; directory: Directory }) => {
      files.delete(`${directory}:${path}`);
    }),
  },
}));

describe("ttsCache", () => {
  beforeEach(async () => {
    files.clear();
    await ttsCache.clear();
    vi.clearAllMocks();
  });

  it("génère et met en cache un nouvel audio", async () => {
    const generateFn = vi.fn(async () => new Blob(["audio"], { type: "audio/mpeg" }));

    const first = await ttsCache.getOrGenerate(
      "Bonjour le monde",
      "voice-1",
      "Marie",
      1,
      generateFn,
    );

    expect(first.fromCache).toBe(false);
    expect(generateFn).toHaveBeenCalledTimes(1);
    expect(first.voiceId).toBe("voice-1");
    expect(first.fileSize).toBeGreaterThan(0);

    const second = await ttsCache.getOrGenerate(
      "Bonjour le monde",
      "voice-1",
      "Marie",
      1,
      generateFn,
    );

    expect(second.fromCache).toBe(true);
    expect(generateFn).toHaveBeenCalledTimes(1);
    expect(second.key).toBe(first.key);
  });

  it("normalise le texte pour la clé de cache", async () => {
    const generateFn = vi.fn(async () => new Blob(["audio"], { type: "audio/mpeg" }));

    const first = await ttsCache.getOrGenerate("  Bonjour   le monde  ", "voice-1", "Marie", 1, generateFn);
    const second = await ttsCache.getOrGenerate("Bonjour le monde", "voice-1", "Marie", 1, generateFn);

    expect(second.fromCache).toBe(true);
    expect(second.key).toBe(first.key);
  });

  it("force la régénération quand force=true", async () => {
    const generateFn = vi
      .fn()
      .mockResolvedValueOnce(new Blob(["audio-1"], { type: "audio/mpeg" }))
      .mockResolvedValueOnce(new Blob(["audio-2"], { type: "audio/mpeg" }));

    await ttsCache.getOrGenerate("Texte", "voice-1", "Marie", 1, generateFn);
    const forced = await ttsCache.getOrGenerate("Texte", "voice-1", "Marie", 1, generateFn, {
      force: true,
    });

    expect(forced.fromCache).toBe(false);
    expect(generateFn).toHaveBeenCalledTimes(2);
  });

  it("indique si une entrée existe via has()", async () => {
    expect(await ttsCache.has("Texte", "voice-1", 1)).toBe(false);

    await ttsCache.getOrGenerate(
      "Texte",
      "voice-1",
      "Marie",
      1,
      async () => new Blob(["audio"], { type: "audio/mpeg" }),
    );

    expect(await ttsCache.has("Texte", "voice-1", 1)).toBe(true);
  });

  it("retourne null si le fichier audio est manquant", async () => {
    const entry = await ttsCache.getOrGenerate(
      "Texte",
      "voice-1",
      "Marie",
      1,
      async () => new Blob(["audio"], { type: "audio/mpeg" }),
    );

    files.delete(fileKey(entry.path));

    expect(await ttsCache.get(entry.key)).toBeNull();
    expect(await ttsCache.has("Texte", "voice-1", 1)).toBe(false);
  });

  it("supprime une entrée avec remove()", async () => {
    const entry = await ttsCache.getOrGenerate(
      "Texte",
      "voice-1",
      "Marie",
      1,
      async () => new Blob(["audio"], { type: "audio/mpeg" }),
    );

    await ttsCache.remove(entry.key);

    expect(await ttsCache.get(entry.key)).toBeNull();
    expect(files.has(fileKey(entry.path))).toBe(false);
  });

  it("vide le cache avec clear()", async () => {
    await ttsCache.getOrGenerate(
      "Texte",
      "voice-1",
      "Marie",
      1,
      async () => new Blob(["audio"], { type: "audio/mpeg" }),
    );

    await ttsCache.clear();

    const stats = await ttsCache.getStats();
    expect(stats.entryCount).toBe(0);
    expect(stats.totalSizeBytes).toBe(0);
  });

  it("évince les entrées LRU quand la limite d'entrées est dépassée", async () => {
    const keys: string[] = [];

    for (let i = 0; i < 180; i += 1) {
      const entry = await ttsCache.getOrGenerate(
        `Texte ${i}`,
        "voice-1",
        "Marie",
        1,
        async () => new Blob([`audio-${i}`], { type: "audio/mpeg" }),
      );
      keys.push(entry.key);
    }

    const indexPath = "tts-cache/index.json";
    const raw = files.get(fileKey(indexPath))?.data;
    expect(raw).toBeTruthy();

    const index = JSON.parse(raw!) as Record<string, { lastAccessedAt: string }>;
    const now = Date.now();
    index[keys[0]].lastAccessedAt = new Date(now - 10_000).toISOString();
    for (const key of keys.slice(1)) {
      index[key].lastAccessedAt = new Date(now).toISOString();
    }
    files.set(fileKey(indexPath), { data: JSON.stringify(index), encoding: Encoding.UTF8 });

    const newest = await ttsCache.getOrGenerate(
      "Texte final",
      "voice-1",
      "Marie",
      1,
      async () => new Blob(["audio-final"], { type: "audio/mpeg" }),
    );

    const stats = await ttsCache.getStats();
    expect(stats.entryCount).toBeLessThanOrEqual(180);
    expect(await ttsCache.get(keys[0])).toBeNull();
    expect(await ttsCache.get(newest.key)).not.toBeNull();
  });
});
