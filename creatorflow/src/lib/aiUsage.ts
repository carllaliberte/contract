const STORAGE_KEY = "cf-ai-usage";
const MONTHLY_LIMIT = 8;

type UsageRecord = { month: string; count: number };

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
  const { count } = readUsage();
  return { count, limit: MONTHLY_LIMIT, remaining: Math.max(0, MONTHLY_LIMIT - count) };
}

export function canUseAiGeneration(): boolean {
  return readUsage().count < MONTHLY_LIMIT;
}

export function recordAiGeneration(): boolean {
  const usage = readUsage();
  if (usage.count >= MONTHLY_LIMIT) return false;
  writeUsage({ month: currentMonth(), count: usage.count + 1 });
  return true;
}
