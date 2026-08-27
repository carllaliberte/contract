import { AgentTimeoutError, withTimeout } from "./timeout";
import type { AgentId, AgentPort, AgentResult, AgentRunContext } from "./types";
import { QUANTUM_CONCAT_MAX } from "./types";

const ports = new Map<AgentId, AgentPort>();

export function resetAgentBus(): void {
  ports.clear();
}

export function register(port: AgentPort): void {
  ports.set(port.id, port);
}

export function list(): AgentPort[] {
  return [...ports.values()];
}

export function getPort(id: AgentId): AgentPort | undefined {
  return ports.get(id);
}

export async function run(id: AgentId, ctx: AgentRunContext): Promise<AgentResult> {
  const port = ports.get(id);
  if (!port) {
    throw new Error(`AGENT_MISSING:${id}`);
  }
  if (!port.available()) {
    throw new Error(`AGENT_DOWN:${id}`);
  }
  return withTimeout(port.run(ctx), id);
}

function settledText(result: PromiseSettledResult<AgentResult>): string | null {
  if (result.status === "fulfilled") {
    const text = result.value.text.trim();
    return text || null;
  }
  return null;
}

/**
 * Call available agents in parallel.
 * Keep the first successful result; if none succeed, concat short texts (max 600).
 */
export async function runQuantum(ids: AgentId[], ctx: AgentRunContext): Promise<AgentResult> {
  const selected = ids
    .map((id) => ports.get(id))
    .filter((port): port is AgentPort => Boolean(port && port.available()));

  if (selected.length === 0) {
    throw new Error("AGENT_DOWN:quantum");
  }

  const raced = selected.map((port) => withTimeout(port.run(ctx), port.id));
  const settled = await Promise.allSettled(raced);

  const firstOk = settled.find((item) => item.status === "fulfilled" && item.value.text.trim());
  if (firstOk && firstOk.status === "fulfilled") {
    return firstOk.value;
  }

  const fragments = settled
    .map(settledText)
    .filter((text): text is string => Boolean(text));

  if (fragments.length === 0) {
    const timedOut = settled.some(
      (item) => item.status === "rejected" && item.reason instanceof AgentTimeoutError,
    );
    throw new Error(timedOut ? "AGENT_TIMEOUT:quantum" : "AGENT_DOWN:quantum");
  }

  const text = fragments.join("\n\n").slice(0, QUANTUM_CONCAT_MAX);
  return { text, apply: "script" };
}
