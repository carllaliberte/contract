import type { AiUsageSnapshot } from "./api/types";
import {
  limitForFormat,
  type PlanId,
  type ScriptFormat,
  PLAN_LIMITS,
} from "./plans";

const STORAGE_KEY = "cf-ai-usage";
const PLAN_KEY = "cf-plan";
const USAGE_EVENT = "cf-ai-usage-change";
const PLAN_EVENT = "cf-plan-change";

type UsageRecord = {
  month: string;
  shortCount: number;
  longCount: number;
  plan?: PlanId;
};

export type FormatQuota = {
  count: number;
  limit: number;
  remaining: number;
};

export type AiUsageState = {
  short: FormatQuota;
  long: FormatQuota;
  plan: PlanId;
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function readPlan(): PlanId {
  const saved = localStorage.getItem(PLAN_KEY);
  return saved === "pro" ? "pro" : "free";
}

export function getCurrentPlan(): PlanId {
  return readPlan();
}

export function setCurrentPlan(plan: PlanId): void {
  localStorage.setItem(PLAN_KEY, plan);
  window.dispatchEvent(new Event(PLAN_EVENT));
  window.dispatchEvent(new Event(USAGE_EVENT));
}

export function subscribePlan(listener: () => void): () => void {
  window.addEventListener(PLAN_EVENT, listener);
  return () => window.removeEventListener(PLAN_EVENT, listener);
}

function readUsage(): UsageRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const plan = readPlan();
    if (!raw) {
      return { month: currentMonth(), shortCount: 0, longCount: 0, plan };
    }
    const parsed = JSON.parse(raw) as Partial<UsageRecord> & { count?: number };
    if (parsed.month !== currentMonth()) {
      return { month: currentMonth(), shortCount: 0, longCount: 0, plan };
    }
    return {
      month: parsed.month ?? currentMonth(),
      shortCount: parsed.shortCount ?? parsed.count ?? 0,
      longCount: parsed.longCount ?? 0,
      plan: parsed.plan ?? plan,
    };
  } catch {
    return { month: currentMonth(), shortCount: 0, longCount: 0, plan: readPlan() };
  }
}

function writeUsage(record: UsageRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new Event(USAGE_EVENT));
}

function buildSnapshot(record: UsageRecord): AiUsageState {
  const plan = record.plan ?? readPlan();
  const shortLimit = limitForFormat(plan, "short");
  const longLimit = limitForFormat(plan, "long");
  return {
    plan,
    short: {
      count: record.shortCount,
      limit: shortLimit,
      remaining: Math.max(0, shortLimit - record.shortCount),
    },
    long: {
      count: record.longCount,
      limit: longLimit,
      remaining: Math.max(0, longLimit - record.longCount),
    },
  };
}

export function getAiUsage(): AiUsageState {
  return buildSnapshot(readUsage());
}

export function canUseAiGeneration(format: ScriptFormat = "short"): boolean {
  const usage = getAiUsage();
  return format === "long" ? usage.long.remaining > 0 : usage.short.remaining > 0;
}

export function syncAiUsage(usage: AiUsageSnapshot) {
  writeUsage({
    month: currentMonth(),
    shortCount: usage.short.count,
    longCount: usage.long.count,
    plan: usage.plan,
  });
  if (usage.plan !== readPlan()) {
    localStorage.setItem(PLAN_KEY, usage.plan);
    window.dispatchEvent(new Event(PLAN_EVENT));
  }
}

export function subscribeAiUsage(listener: () => void): () => void {
  window.addEventListener(USAGE_EVENT, listener);
  return () => window.removeEventListener(USAGE_EVENT, listener);
}

export { PLAN_LIMITS };
