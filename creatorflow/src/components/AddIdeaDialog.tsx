import { useEffect, useRef, useState } from "react";
import type { Idea } from "../data/demo";
import { useIdeas } from "../context/IdeasContext";
import { useI18n } from "../i18n/context";
import { Button, Input, Label } from "./ui";

const defaultThumbnails = [
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80",
  "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
];

type AddIdeaDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AddIdeaDialog({ open, onClose }: AddIdeaDialogProps) {
  const { addIdea } = useIdeas();
  const { tr } = useI18n();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<Idea["platform"]>("x");
  const [vvh, setVvh] = useState(() =>
    typeof window === "undefined" ? 800 : window.visualViewport?.height ?? window.innerHeight,
  );

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    const vv = window.visualViewport;
    const sync = () => setVvh(vv?.height ?? window.innerHeight);
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    sync();
    const focusTimer = window.setTimeout(() => promptRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prompt = description.trim();
    const nextTitle = title.trim() || prompt.split("\n")[0]?.slice(0, 80) || "";
    if (!nextTitle) return;
    addIdea({
      title: nextTitle,
      description: prompt || tr("idea.defaultDescription"),
      status: "idea",
      priority: "medium",
      platform,
      thumbnail: defaultThumbnails[Math.floor(Math.random() * defaultThumbnails.length)],
    });
    setTitle("");
    setDescription("");
    setPlatform("x");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      style={{ height: vvh }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-idea-title"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-card-hover sm:rounded-2xl"
        style={{ maxHeight: Math.max(280, vvh - 12) }}
      >
        <h2 id="add-idea-title" className="text-lg font-semibold tracking-tight">
          {tr("dashboard.newIdea")}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-desc">{tr("idea.description")}</Label>
            <textarea
              ref={promptRef}
              id="idea-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr("idea.descPlaceholder")}
              rows={5}
              enterKeyHint="done"
              autoCapitalize="sentences"
              autoComplete="off"
              spellCheck
              className="min-h-[8rem] w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-title">{tr("idea.title")}</Label>
            <Input
              id="idea-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tr("idea.titlePlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-platform">{tr("idea.platform")}</Label>
            <select
              id="idea-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Idea["platform"])}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="x">X</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {tr("idea.cancel")}
            </Button>
            <Button type="submit" className="flex-1">
              {tr("idea.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
