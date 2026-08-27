import { AgentTimeoutError, withTimeout } from "./timeout";
import { AGENT_TIMEOUT_MS } from "./types";
import type {
  AgentId,
  AgentKind,
  AgentPort,
  AgentResult,
  AgentRunContext,
  QuantumRunOptions,
} from "./types";

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
  const result = await withTimeout(port.run(ctx), id);
  return { ...result, source: result.source ?? id };
}

function isLocal(port: AgentPort): boolean {
  return port.cost === "local";
}

function uniquePorts(queue: AgentPort[]): AgentPort[] {
  const seen = new Set<AgentId>();
  const out: AgentPort[] = [];
  for (const port of queue) {
    if (seen.has(port.id)) continue;
    seen.add(port.id);
    out.push(port);
  }
  return out;
}

/**
 * Local of the requested kind, then at most the paid adapters of that kind,
 * then a free Régie fallback. Web3 never sneaks in as a silent fallback.
 */
export function quantumQueue(selected: AgentPort[], kind?: AgentKind): AgentPort[] {
  const same = kind ? selected.filter((port) => port.kind === kind) : selected;
  const localSame = same.filter(isLocal);
  const paidSame = same.filter((port) => !isLocal(port));
  const localFallback = selected.filter(
    (port) => isLocal(port) && port.kind !== "web3" && (!kind || port.kind !== kind),
  );
  return uniquePorts([...localSame, ...paidSame, ...localFallback]);
}

/**
 * Cascade, not a spray.
 * Local first (0 tokens). One paid call max on a miss. Stop at the first OK.
 * Whole run shares a 12s budget so paid adapters cannot stack.
 */
export async function runQuantum(
  ids: AgentId[],
  ctx: AgentRunContext,
  opts?: QuantumRunOptions,
): Promise<AgentResult> {
  const selected = ids
    .map((id) => ports.get(id))
    .filter((port): port is AgentPort => Boolean(port && port.available()));

  if (selected.length === 0) {
    throw new Error("AGENT_DOWN:quantum");
  }

  const queue = quantumQueue(selected, opts?.kind);
  const started = Date.now();
  let sawTimeout = false;

  for (const port of queue) {
    const remaining = AGENT_TIMEOUT_MS - (Date.now() - started);
    if (!isLocal(port) && remaining <= 0) {
      continue;
    }
    const budget = isLocal(port)
      ? AGENT_TIMEOUT_MS
      : Math.min(AGENT_TIMEOUT_MS, Math.max(remaining, 1));
    try {
      const result = await withTimeout(port.run(ctx), port.id, budget);
      const text = result.text.trim();
      if (text) {
        return { ...result, text, source: result.source ?? port.id };
      }
    } catch (error) {
      if (error instanceof AgentTimeoutError) {
        sawTimeout = true;
      }
    }
  }

  throw new Error(sawTimeout ? "AGENT_TIMEOUT:quantum" : "AGENT_DOWN:quantum");
}
