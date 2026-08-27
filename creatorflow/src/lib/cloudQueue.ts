import type { ScriptGenerateOptions } from "../components/ScriptGenerateDialog";
import type { Idea } from "../data/demo";

const QUEUE_KEY = "cf-cloud-queue";

export type GenerateScriptQueueOp = {
  type: "generate-script";
  ideaId: string;
  options: ScriptGenerateOptions;
  createdAt: string;
};

export type IdeasSyncQueueOp = {
  type: "ideas-sync";
  ideas: Idea[];
  createdAt: string;
};

export type CloudQueueOp = GenerateScriptQueueOp | IdeasSyncQueueOp;

type CloudQueueEnqueue =
  | Omit<GenerateScriptQueueOp, "createdAt">
  | Omit<IdeasSyncQueueOp, "createdAt">;

type QueueListener = () => void;
const listeners = new Set<QueueListener>();

function readQueue(): CloudQueueOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CloudQueueOp[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(ops: CloudQueueOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
  listeners.forEach((listener) => listener());
}

export function subscribeCloudQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCloudQueueLength(): number {
  return readQueue().length;
}

export function enqueueCloudOp(op: CloudQueueEnqueue): void {
  const queue = readQueue();
  queue.push({ ...op, createdAt: new Date().toISOString() });
  writeQueue(queue);
}

export function clearCloudQueue(): void {
  writeQueue([]);
}

export async function drainCloudQueue(
  handlers: {
    onGenerateScript: (ideaId: string, options: ScriptGenerateOptions) => Promise<void>;
    onIdeasSync: (ideas: Idea[]) => Promise<void>;
  },
): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  const remaining: CloudQueueOp[] = [];
  let processed = 0;

  for (const op of queue) {
    try {
      if (op.type === "generate-script") {
        await handlers.onGenerateScript(op.ideaId, op.options);
      } else {
        await handlers.onIdeasSync(op.ideas);
      }
      processed += 1;
    } catch {
      remaining.push(op);
    }
  }

  writeQueue(remaining);
  return processed;
}
