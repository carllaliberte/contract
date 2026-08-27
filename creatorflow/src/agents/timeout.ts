import { AGENT_TIMEOUT_MS } from "./types";

export class AgentTimeoutError extends Error {
  constructor(id: string) {
    super(`AGENT_TIMEOUT:${id}`);
    this.name = "AgentTimeoutError";
  }
}

export function withTimeout<T>(promise: Promise<T>, id: string, ms = AGENT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AgentTimeoutError(id));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
