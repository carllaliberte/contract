import type { IdeaStatus } from "../data/demo";

export const STATUS_FLOW: IdeaStatus[] = [
  "idea",
  "script",
  "production",
  "ready",
  "published",
];

export function getNextStatus(status: IdeaStatus): IdeaStatus | null {
  const index = STATUS_FLOW.indexOf(status);
  if (index < 0 || index >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1];
}

export function canAdvanceStatus(status: IdeaStatus): boolean {
  return getNextStatus(status) !== null;
}
