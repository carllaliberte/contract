import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { DraggableIdeaCard, IdeaCard } from "../components/IdeaCard";
import { useIdeas } from "../context/IdeasContext";
import type { Idea, IdeaStatus } from "../data/demo";
import { useI18n } from "../i18n/context";
import { canUseAiGeneration, getAiUsage } from "../lib/aiUsage";

const columns: IdeaStatus[] = ["idea", "script", "production", "ready", "published"];

const columnStyles: Record<IdeaStatus, string> = {
  idea: "border-status-idea/30",
  script: "border-status-script/35",
  production: "border-status-production/35",
  ready: "border-status-ready/35",
  published: "border-status-published/25",
};

const headerStyles: Record<IdeaStatus, string> = {
  idea: "text-status-idea",
  script: "text-status-script",
  production: "text-status-production",
  ready: "text-status-ready",
  published: "text-status-published",
};

function DroppableColumn({
  status,
  children,
  className,
}: {
  status: IdeaStatus;
  children: React.ReactNode;
  className: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`${className} transition-colors duration-200 ${
        isOver ? "bg-primary/10 ring-2 ring-primary/45 ring-inset" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function PipelinePage() {
  const { tr } = useI18n();
  const { ideas, moveIdea, generateScript } = useIdeas();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const grouped = columns.reduce(
    (acc, col) => {
      acc[col] = ideas.filter((i) => i.status === col);
      return acc;
    },
    {} as Record<IdeaStatus, Idea[]>,
  );

  const activeIdea = activeId ? ideas.find((i) => i.id === activeId) : null;
  const aiUsage = getAiUsage();

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    const ideaId = String(active.id);
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;

    let targetStatus: IdeaStatus | null = null;
    if (columns.includes(overId as IdeaStatus)) {
      targetStatus = overId as IdeaStatus;
    } else {
      const overIdea = ideas.find((i) => i.id === overId);
      if (overIdea) targetStatus = overIdea.status;
    }

    if (targetStatus && targetStatus !== idea.status) {
      moveIdea(ideaId, targetStatus);
    }
  }

  async function handleGenerateScript(idea: Idea) {
    if (!canUseAiGeneration()) {
      setAiNotice(tr("script.limitReached"));
      return;
    }
    setGeneratingId(idea.id);
    setAiNotice(null);
    await generateScript(idea.id);
    setGeneratingId(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tr("pipeline.titlePage")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tr("pipeline.subtitlePage")}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {ideas.length} contenus · {tr("script.aiRemaining", { n: String(aiUsage.remaining) })}
        </p>
      </header>

      {aiNotice && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {aiNotice}
        </p>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
          {columns.map((col) => (
            <DroppableColumn
              key={col}
              status={col}
              className={`w-[280px] shrink-0 rounded-2xl border bg-card/40 p-3.5 ${columnStyles[col]}`}
            >
              <div className="mb-3.5 flex items-center justify-between">
                <h2
                  className={`text-[13px] font-semibold uppercase tracking-wide ${headerStyles[col]}`}
                >
                  {tr(`status.${col}`)}
                </h2>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] font-semibold tabular-nums">
                  {grouped[col].length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 min-h-[120px]">
                {grouped[col].length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">
                    {tr("pipeline.empty")}
                  </div>
                ) : (
                  grouped[col].map((idea) => (
                    <DraggableIdeaCard
                      key={idea.id}
                      idea={idea}
                      onGenerateScript={handleGenerateScript}
                      isGenerating={generatingId === idea.id}
                    />
                  ))
                )}
              </div>
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
          {activeIdea ? (
            <IdeaCard idea={activeIdea} dragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
