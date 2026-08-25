const STORAGE_KEY = "cf-ai-usage";
const MONTHLY_LIMIT = 8;

type UsageRecord = { month: string; count: number; limit?: number };

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function readUsage(): UsageRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { month: currentMonth(), count: 0 };
    const parsed = JSON.parse(raw) as UsageRecord;
    if (parsed.month !== currentMonth()) return { month: currentMonth(), count: 0 };
    return parsed;
  } catch {
    return { month: currentMonth(), count: 0 };
  }
}

function writeUsage(record: UsageRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function getAiUsage(): { count: number; limit: number; remaining: number } {
  const { count, limit } = readUsage();
  const effectiveLimit = limit ?? MONTHLY_LIMIT;
  return {
    count,
    limit: effectiveLimit,
    remaining: Math.max(0, effectiveLimit - count),
  };
}

export function canUseAiGeneration(): boolean {
  const { count, limit } = readUsage();
  const effectiveLimit = limit ?? MONTHLY_LIMIT;
  return count < effectiveLimit;
}

export function recordAiGeneration(): boolean {
  const usage = readUsage();
  const effectiveLimit = usage.limit ?? MONTHLY_LIMIT;
  if (usage.count >= effectiveLimit) return false;
  writeUsage({ month: currentMonth(), count: usage.count + 1, limit: usage.limit });
  return true;
}

export function syncAiUsage(usage: { count: number; limit?: number }) {
  writeUsage({ month: currentMonth(), count: usage.count, limit: usage.limit });
}
