import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Sparkles } from "lucide-react";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import { Button } from "./ui";

const platformLabel: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  reels: "Reels",
};

type IdeaCardProps = {
  idea: Idea;
  onGenerateScript?: (idea: Idea) => void;
  isGenerating?: boolean;
  dragOverlay?: boolean;
};

export function IdeaCard({
  idea,
  onGenerateScript,
  isGenerating,
  dragOverlay,
}: IdeaCardProps) {
  const { tr } = useI18n();
  const canGenerate =
    onGenerateScript && (idea.status === "idea" || idea.status === "script");

  return (
    <article
      className={`pipeline-card overflow-hidden rounded-xl border border-border bg-card ${
        dragOverlay ? "shadow-card-hover ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={idea.thumbnail}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
          {platformLabel[idea.platform] ?? idea.platform}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug">{idea.title}</p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {idea.description}
        </p>
        {canGenerate && (
          <Button
            type="button"
            variant="secondary"
            className="mt-2.5 h-9 w-full text-xs"
            disabled={isGenerating}
            onClick={() => onGenerateScript(idea)}
          >
            <Sparkles className="size-3.5" />
            {isGenerating ? tr("script.generating") : tr("script.generate")}
          </Button>
        )}
      </div>
    </article>
  );
}

type DraggableIdeaCardProps = IdeaCardProps;

export function DraggableIdeaCard(props: DraggableIdeaCardProps) {
  const { idea } = props;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: idea.id,
    data: { type: "idea", status: idea.status },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group touch-none ${isDragging ? "opacity-40" : ""}`}
      {...listeners}
      {...attributes}
    >
      <IdeaCard {...props} />
    </div>
  );
}
