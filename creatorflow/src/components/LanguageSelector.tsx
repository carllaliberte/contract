import { Globe } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { LOCALES } from "../i18n/locales";

export function LanguageSelector() {
  const { locale, setLocale, tr } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((item) => item.id === locale) ?? LOCALES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LOCALES;
    return LOCALES.filter(
      (item) =>
        item.native.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="inline-flex h-11 max-w-[11.5rem] items-center gap-2 rounded-lg border border-border bg-card/80 px-3 text-sm font-medium backdrop-blur-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={tr("lang.label")}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{current.native}</span>
      </button>

      {open && (
        <div className="absolute end-0 z-50 mt-2 w-[min(18.5rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border p-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("lang.search")}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/55"
              autoFocus
            />
          </div>
          <ul
            role="listbox"
            aria-label={tr("lang.label")}
            className="max-h-72 overflow-y-auto p-1"
          >
            {filtered.map((item) => {
              const active = item.id === locale;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`flex h-10 w-full items-center rounded-lg px-3 text-start text-sm ${
                      active
                        ? "bg-primary/15 font-semibold text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                    onClick={() => {
                      setLocale(item.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {item.native}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-sm text-muted-foreground">—</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
