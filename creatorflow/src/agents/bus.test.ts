import { beforeEach, describe, expect, it } from "vitest";
import { list, quantumQueue, register, resetAgentBus, run, runQuantum } from "./bus";
import type { AgentCost, AgentId, AgentKind, AgentPort, AgentRunContext } from "./types";
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

function kindFor(id: AgentId): AgentKind {
  if (id === "tally") return "coach";
  if (id === "web3") return "web3";
  if (id === "grok" || id === "gemini") return "measure";
  return "copy";
}

function costFor(id: AgentId): AgentCost {
  return id === "tally" || id === "web3" ? "local" : "paid";
}

function port(
  id: AgentPort["id"],
  impl: () => Promise<{ text: string; apply?: "script" | "pack" }>,
  available = true,
): AgentPort {
  return {
    id,
    kind: kindFor(id),
    label: id,
    cost: costFor(id),
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
    await expect(run("tally", ctx())).resolves.toEqual({
      text: "régie",
      apply: "script",
      source: "tally",
    });
  });

  it("refuses a down port", async () => {
    register(port("openai", async () => ({ text: "nope" }), false));
    await expect(run("openai", ctx())).rejects.toThrow("AGENT_DOWN:openai");
  });

  it("quantum local success never calls paid", async () => {
    let openaiCalls = 0;
    register(port("tally", async () => ({ text: "régie" })));
    register(
      port("openai", async () => {
        openaiCalls += 1;
        return { text: "script payant" };
      }),
    );
    const result = await runQuantum(["tally", "openai"], ctx());
    expect(result.text).toBe("régie");
    expect(result.source).toBe("tally");
    expect(openaiCalls).toBe(0);
  });

  it("quantum paid runs only after local miss", async () => {
    let openaiCalls = 0;
    register(port("tally", async () => ({ text: "   " })));
    register(
      port("openai", async () => {
        openaiCalls += 1;
        return { text: "script" };
      }),
    );
    const result = await runQuantum(["tally", "openai"], ctx());
    expect(result.text).toBe("script");
    expect(result.source).toBe("openai");
    expect(openaiCalls).toBe(1);
  });

  it("quantum never fires a second paid after first paid OK", async () => {
    let customCalls = 0;
    register(
      port("openai", async () => ({ text: "script-1" })),
    );
    register(
      port("custom", async () => {
        customCalls += 1;
        return { text: "script-2" };
      }),
    );
    const result = await runQuantum(["openai", "custom"], ctx(), { kind: "copy" });
    expect(result.text).toBe("script-1");
    expect(customCalls).toBe(0);
  });

  it("quantum copy kind skips régie while script succeeds", async () => {
    let tallyCalls = 0;
    register(
      port("tally", async () => {
        tallyCalls += 1;
        return { text: "régie" };
      }),
    );
    register(port("openai", async () => ({ text: "script" })));
    const result = await runQuantum(["tally", "openai"], ctx(), { kind: "copy" });
    expect(result.text).toBe("script");
    expect(result.source).toBe("openai");
    expect(tallyCalls).toBe(0);
  });

  it("quantum coach kind never calls openai", async () => {
    let openaiCalls = 0;
    register(port("tally", async () => ({ text: "régie" })));
    register(
      port("openai", async () => {
        openaiCalls += 1;
        return { text: "script" };
      }),
    );
    const result = await runQuantum(["tally", "openai"], ctx(), { kind: "coach" });
    expect(result.text).toBe("régie");
    expect(openaiCalls).toBe(0);
  });

  it("quantum falls back to régie when copy paid fails", async () => {
    register(port("tally", async () => ({ text: "régie" })));
    register(
      port("openai", async () => {
        throw new Error("down");
      }),
    );
    const result = await runQuantum(["tally", "openai"], ctx(), { kind: "copy" });
    expect(result.text).toBe("régie");
    expect(result.source).toBe("tally");
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

  it("quantum queue is local → paid same kind → local fallback, never web3", () => {
    const tally = port("tally", async () => ({ text: "t" }));
    const openai = port("openai", async () => ({ text: "o" }));
    const custom = port("custom", async () => ({ text: "c" }));
    const web3 = port("web3", async () => ({ text: "w" }));
    expect(quantumQueue([tally, openai, custom, web3], "copy").map((item) => item.id)).toEqual([
      "openai",
      "custom",
      "tally",
    ]);
    expect(quantumQueue([tally, openai], "coach").map((item) => item.id)).toEqual(["tally"]);
  });
});
