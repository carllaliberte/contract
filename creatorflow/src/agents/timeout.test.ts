import { describe, expect, it } from "vitest";
import { AgentTimeoutError, withTimeout } from "./timeout";

describe("withTimeout", () => {
  it("resolves when the agent is faster than the budget", async () => {
    await expect(withTimeout(Promise.resolve("ok"), "tally", 40)).resolves.toBe("ok");
  });

  it("rejects with AgentTimeoutError after the budget", async () => {
    const hang = new Promise<string>(() => undefined);
    await expect(withTimeout(hang, "openai", 20)).rejects.toBeInstanceOf(AgentTimeoutError);
  });
});
