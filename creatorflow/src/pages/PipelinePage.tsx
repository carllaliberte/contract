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
import { useNavigate } from "react-router-dom";
import { DraggableIdeaCard, IdeaCard } from "../components/IdeaCard";
import { PaywallSheet } from "../components/PaywallSheet";
import { PackApplyDialog } from "../components/PackApplyDialog";
import {
  ScriptGenerateDialog,
  type ScriptGenerateOptions,
} from "../components/ScriptGenerateDialog";
import { isGenerateScriptError, useIdeas } from "../context/IdeasContext";
import type { Idea, IdeaStatus } from "../data/demo";
import { useI18n } from "../i18n/context";
import { syncAiUsage } from "../lib/aiUsage";
import type { ScriptFormat } from "../lib/plans";
import { AiUsageBadge } from "../components/AiUsageBadge";
import { useAiUsage } from "../hooks/useAiUsage";
import { runScriptPreviewWithPaywall, useScriptPackFlow } from "../hooks/useScriptPackFlow";
import { getNextStatus } from "../lib/pipelineActions";

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
  const navigate = useNavigate();
  const { ideas, moveIdea, duplicateIdea } = useIdeas();
  const {
    generatingId,
    notice: aiNotice,
    setNotice: setAiNotice,
    packPreview,
    isApplying,
    providerLabel,
    submitPreview,
    confirmApply,
    discardPreview,
  } = useScriptPackFlow();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogIdea, setDialogIdea] = useState<Idea | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

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
  const aiUsage = useAiUsage();

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

  function openGenerateDialog(idea: Idea) {
    setAiNotice(null);
    setDialogIdea(idea);
  }

  function handlePaywall(format: ScriptFormat) {
    setDialogIdea(null);
    setAiNotice(
      tr(
        format === "long" ? "script.limitReachedLong" : "script.limitReachedShort",
        {
          limit: String(
            format === "long" ? aiUsage.long.limit : aiUsage.short.limit,
          ),
        },
      ),
    );
    setPaywallOpen(true);
  }

  async function handleGenerateSubmit(idea: Idea, options: ScriptGenerateOptions) {
    setDialogIdea(null);
    try {
      await runScriptPreviewWithPaywall(idea, options, submitPreview, handlePaywall);
    } catch (error) {
      if (isGenerateScriptError(error) && error.error === "LIMIT_REACHED") {
        if (error.usage) syncAiUsage(error.usage);
        handlePaywall(options.format);
      }
    }
  }

  function handleAdvance(idea: Idea) {
    const next = getNextStatus(idea.status);
    if (next) moveIdea(idea.id, next);
  }

  function handleDuplicate(idea: Idea) {
    duplicateIdea(idea.id);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tr("pipeline.titlePage")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tr("pipeline.subtitlePage")}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{ideas.length} contenus</p>
          <AiUsageBadge className="mt-0.5" />
        </div>
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
                      onGenerateScript={openGenerateDialog}
                      onAdvance={handleAdvance}
                      onShoot={(item) => navigate(`/app/shoot/${item.id}`)}
                      onDuplicate={handleDuplicate}
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

      <ScriptGenerateDialog
        idea={dialogIdea}
        open={dialogIdea !== null}
        onClose={() => setDialogIdea(null)}
        onSubmit={handleGenerateSubmit}
        isGenerating={generatingId === dialogIdea?.id}
        onPaywall={handlePaywall}
      />

      <PackApplyDialog
        idea={packPreview?.idea ?? null}
        pack={packPreview?.pack ?? null}
        open={packPreview !== null}
        providerLabel={providerLabel}
        onClose={discardPreview}
        onApply={confirmApply}
        isApplying={isApplying}
      />

      <PaywallSheet open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
