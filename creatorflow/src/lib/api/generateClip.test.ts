import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clampClipDuration,
  clipRequestKey,
  fetchGeneratedClipFile,
  resetClipClientState,
} from "./generateClip";

vi.mock("../hookClip", () => ({
  renderHookClip: vi.fn(async () =>
    new File([new Uint8Array([0, 0, 1, 2])], "clapshot.mp4", { type: "video/mp4" }),
  ),
}));

import { renderHookClip } from "../hookClip";

describe("clampClipDuration", () => {
  it("keeps the clip at 6s or 15s", () => {
    expect(clampClipDuration(1)).toBe(6);
    expect(clampClipDuration(6)).toBe(6);
    expect(clampClipDuration(10)).toBe(10);
    expect(clampClipDuration(15)).toBe(15);
    expect(clampClipDuration(90)).toBe(15);
  });
});

describe("clipRequestKey", () => {
  it("dedupes the same hook, script, and length", () => {
    expect(clipRequestKey("  One tap.  ", 6, "Publish")).toBe(
      clipRequestKey("One tap.", 6, "Publish"),
    );
    expect(clipRequestKey("One tap.", 6, "Publish")).not.toBe(
      clipRequestKey("One tap.", 15, "Publish"),
    );
  });
});

describe("fetchGeneratedClipFile", () => {
  afterEach(() => {
    resetClipClientState();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("falls back to a local clip when generate-clip is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ code: "NOT_FOUND" }), { status: 404 })),
    );
    const file = await fetchGeneratedClipFile("One tap.", 6, "Publish on X");
    expect(file?.name).toBe("clapshot.mp4");
    expect(renderHookClip).toHaveBeenCalled();
  });

  it("lets Publier sur X use the local clip after a remote 404 prefetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ code: "NOT_FOUND" }), { status: 404 })),
    );
    const prefetch = await fetchGeneratedClipFile("After prefetch.", 6, "Publish on X", {
      allowLocal: false,
    });
    expect(prefetch).toBeNull();
    const file = await fetchGeneratedClipFile("After prefetch.", 6, "Publish on X");
    expect(file?.name).toBe("clapshot.mp4");
    expect(renderHookClip).toHaveBeenCalled();
  });

  it("starts the local recorder without waiting out a hanging generate-clip", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );
    const file = await fetchGeneratedClipFile("Hang.", 6, "Publish on X");
    expect(file?.name).toBe("clapshot.mp4");
    expect(renderHookClip).toHaveBeenCalled();
  });
});
