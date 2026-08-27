import { beforeEach, describe, expect, it } from "vitest";
import { list, register, resetAgentBus, run, runQuantum } from "./bus";
import type { AgentPort, AgentRunContext } from "./types";
import { getContext, resetStyleProfile } from "../services/aiContext";

function ctx(): AgentRunContext {
  const base = getContext({ language: "fr" });
  return {
    ...base,
    ideaId: "idea-1",
    prompt: "5 erreurs de montage",
    title: "5 erreurs",
    description: "Analyse avant/après",
  };
}

function port(
  id: AgentPort["id"],
  impl: () => Promise<{ text: string; apply?: "script" | "pack" }>,
  available = true,
): AgentPort {
  return {
    id,
    kind: id === "tally" ? "coach" : "copy",
    label: id,
    available: () => available,
    run: impl,
  };
}

describe("agent bus", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStyleProfile();
    resetAgentBus();
  });

  it("registers and lists ports", () => {
    register(port("tally", async () => ({ text: "a" })));
    expect(list().map((item) => item.id)).toEqual(["tally"]);
  });

  it("runs a single available port", async () => {
    register(port("tally", async () => ({ text: "régie", apply: "script" })));
    await expect(run("tally", ctx())).resolves.toEqual({ text: "régie", apply: "script" });
  });

  it("refuses a down port", async () => {
    register(port("openai", async () => ({ text: "nope" }), false));
    await expect(run("openai", ctx())).rejects.toThrow("AGENT_DOWN:openai");
  });

  it("quantum keeps the first OK in ids order", async () => {
    register(
      port("tally", async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return { text: "tally-slow" };
      }),
    );
    register(port("openai", async () => ({ text: "openai-fast" })));
    const result = await runQuantum(["tally", "openai"], ctx());
    expect(result.text).toBe("tally-slow");
  });

  it("quantum throws when every port is down", async () => {
    register(port("tally", async () => ({ text: "   " })));
    register(
      port("openai", async () => {
        throw new Error("down");
      }),
    );
    await expect(runQuantum(["tally", "openai"], ctx())).rejects.toThrow(/AGENT_DOWN|AGENT_TIMEOUT/);
  });

  it("skips unavailable ports in quantum", async () => {
    register(port("tally", async () => ({ text: "ok" }), false));
    register(port("openai", async () => ({ text: "script" })));
    const result = await runQuantum(["tally", "openai"], ctx());
    expect(result.text).toBe("script");
  });
});
