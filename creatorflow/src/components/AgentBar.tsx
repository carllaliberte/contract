import { useMemo, useState } from "react";
import { useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import { ensureAgentsRegistered, KIND_LABEL, list, run, runQuantum } from "../agents";
import type { AgentKind, AgentPort, AgentResult, AgentRunContext } from "../agents";
import { aiContext } from "../services/aiContext";
import { Button } from "./ui";

ensureAgentsRegistered();

function kindKey(kind: AgentKind): string {
  return `agent.kind.${kind}`;
}

function portsByKind(ports: AgentPort[]): AgentPort[] {
  const seen = new Set<AgentKind>();
  const unique: AgentPort[] = [];
  for (const port of ports) {
    if (!port.available() || seen.has(port.kind)) continue;
    seen.add(port.kind);
    unique.push(port);
  }
  return unique;
}

function buildContext(idea: Idea, locale: "fr" | "en"): AgentRunContext {
  const prompt = idea.script?.trim() || idea.description;
  const ctx = aiContext.getContext({
    platform: idea.platform,
    language: locale,
  });
  return {
    ...ctx,
    ideaId: idea.id,
    prompt,
    title: idea.title,
    description: idea.description,
    existingScript: idea.script,
    platform: idea.platform,
  };
}

export function AgentBar({ idea }: { idea: Idea }) {
  const { tr, locale } = useI18n();
  const { updateIdea } = useIdeas();
  const [quantum, setQuantum] = useState(false);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState<AgentResult | null>(null);

  const actions = useMemo(() => portsByKind(list()), [quantum, running]);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }

  async function handleRun(port: AgentPort) {
    if (running) return;
    setRunning(true);
    setToast(null);
    const ctx = buildContext(idea, locale);
    try {
      const result = quantum
        ? await runQuantum(
            list()
              .filter((item) => item.available())
              .map((item) => item.id),
            ctx,
          )
        : await run(port.id, ctx);
      setPending(result);
    } catch {
      flash(tr("agent.down"));
    } finally {
      setRunning(false);
    }
  }

  function handleApply() {
    if (!pending?.text.trim()) return;
    const script = pending.text.trim();
    updateIdea(idea.id, {
      script,
      status: idea.status === "idea" ? "script" : idea.status,
    });
    aiContext.updateStyleFromPackage({
      ideaId: idea.id,
      platform: idea.platform,
      language: locale,
      script,
      source: "edited",
    });
    setPending(null);
  }

  if (actions.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={quantum}
          aria-label={tr("agent.quantum")}
          disabled={running}
          onClick={() => setQuantum((value) => !value)}
          className={`h-8 rounded-xl border px-2.5 text-xs font-medium transition-colors ${
            quantum
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
          }`}
        >
          {tr("agent.quantum")}
        </button>
        {actions.map((port) => (
          <button
            key={port.kind}
            type="button"
            disabled={running}
            onClick={() => void handleRun(port)}
            className="h-8 rounded-xl border border-border bg-transparent px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/80 disabled:opacity-45"
          >
            {tr(kindKey(port.kind)) || KIND_LABEL[port.kind][locale]}
          </button>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-8 px-2.5 text-xs"
          disabled={running || !pending?.text.trim()}
          onClick={handleApply}
        >
          {tr("agent.apply")}
        </Button>
      </div>
      {running && (
        <p className="text-[11px] text-muted-foreground">{tr("agent.running")}</p>
      )}
      {pending?.text && !running && (
        <p className="line-clamp-2 rounded-lg bg-secondary/50 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line">
          {pending.text}
        </p>
      )}
      {toast && (
        <p
          role="status"
          className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1.5 text-[11px] text-muted-foreground"
        >
          {toast}
        </p>
      )}
    </div>
  );
}
