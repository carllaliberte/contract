import { beforeEach, describe, expect, it, vi } from "vitest";
import { Directory, Encoding } from "@capacitor/filesystem";

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
    readFile: vi.fn(async ({ path, directory }: { path: string; directory: Directory }) => {
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
    getUri: vi.fn(async ({ path }: { path: string }) => ({ uri: `file://${path}` })),
  },
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => false,
    convertFileSrc: (uri: string) => uri,
  },
}));

vi.mock("../lib/api/generateTts", () => ({
  fetchTtsBlob: vi.fn(async () => new Blob(["provider-audio"], { type: "audio/mpeg" })),
}));

import { fetchTtsBlob } from "../lib/api/generateTts";
import { ttsCache } from "./ttsCache";
import { getTtsAudio } from "./ttsProvider";

describe("ttsProvider", () => {
  beforeEach(async () => {
    files.clear();
    localStorage.clear();
    vi.clearAllMocks();
    await ttsCache.clear();
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn(() => "blob:mock-audio"),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  it("appelle le provider puis met en cache via ttsCache", async () => {
    const first = await getTtsAudio({ text: "Bonjour" });
    expect(first.entry.fromCache).toBe(false);
    expect(fetchTtsBlob).toHaveBeenCalledTimes(1);
    expect(first.playbackUrl).toBe("blob:mock-audio");
    expect(files.has(fileKey(first.entry.path))).toBe(true);

    const second = await getTtsAudio({ text: "Bonjour" });
    expect(second.entry.fromCache).toBe(true);
    expect(fetchTtsBlob).toHaveBeenCalledTimes(1);
  });

  it("force la régénération quand force=true", async () => {
    await getTtsAudio({ text: "Texte" });
    await getTtsAudio({ text: "Texte", force: true });
    expect(fetchTtsBlob).toHaveBeenCalledTimes(2);
  });
});
