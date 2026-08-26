import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui";
import { useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";

const WEEKDAY_KEYS = [
  "calendar.weekdayMon",
  "calendar.weekdayTue",
  "calendar.weekdayWed",
  "calendar.weekdayThu",
  "calendar.weekdayFri",
  "calendar.weekdaySat",
  "calendar.weekdaySun",
] as const;

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildCalendarGrid(month: Date): Array<Date | null> {
  const first = startOfMonth(month);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function resolveScheduledAt(idea: Idea): string {
  return idea.scheduledAt ?? idea.updatedAt.slice(0, 10);
}

export function CalendarPage() {
  const { tr, locale } = useI18n();
  const { ideas } = useIdeas();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const ideasByDate = useMemo(() => {
    const map = new Map<string, Idea[]>();
    for (const idea of ideas) {
      const key = resolveScheduledAt(idea);
      const bucket = map.get(key) ?? [];
      bucket.push(idea);
      map.set(key, bucket);
    }
    return map;
  }, [ideas]);

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(month);

  const cells = buildCalendarGrid(month);
  const todayKey = dateKey(new Date());

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tr("calendar.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tr("calendar.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 w-9 px-0"
            aria-label={tr("calendar.prevMonth")}
            onClick={() => setMonth((current) => addMonths(current, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[10rem] text-center text-sm font-semibold capitalize">
            {monthLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-9 px-0"
            aria-label={tr("calendar.nextMonth")}
            onClick={() => setMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
          {WEEKDAY_KEYS.map((key) => (
            <div
              key={key}
              className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {tr(key)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[92px] border-b border-r border-border/60 bg-background/20 last:border-r-0"
                />
              );
            }

            const key = dateKey(day);
            const dayIdeas = ideasByDate.get(key) ?? [];
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className="min-h-[92px] border-b border-r border-border/60 p-1.5 last:border-r-0"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                      isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayIdeas.length > 0 ? (
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {dayIdeas.length}
                    </span>
                  ) : null}
                </div>

                <ul className="flex flex-col gap-1">
                  {dayIdeas.slice(0, 2).map((idea) => (
                    <li key={idea.id}>
                      <Link
                        to="/app/pipeline"
                        className="block truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/15"
                        title={idea.title}
                      >
                        {idea.title}
                      </Link>
                    </li>
                  ))}
                  {dayIdeas.length > 2 ? (
                    <li className="px-1 text-[10px] text-muted-foreground">
                      {tr("calendar.more", { count: String(dayIdeas.length - 2) })}
                    </li>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
