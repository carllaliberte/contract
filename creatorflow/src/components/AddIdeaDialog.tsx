import { useEffect, useState } from "react";
import { mediaUrl, type Idea, type Priority } from "../data/demo";
import { useIdeas } from "../context/IdeasContext";
import { useI18n } from "../i18n/context";
import { Button, Input, Label } from "./ui";

const defaultThumbnails = [
  mediaUrl("still-edit.jpg"),
  mediaUrl("still-tiktok.jpg"),
  mediaUrl("still-reels.jpg"),
];

type AddIdeaDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AddIdeaDialog({ open, onClose }: AddIdeaDialogProps) {
  const { addIdea } = useIdeas();
  const { tr } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<Idea["platform"]>("youtube");
  const [priority, setPriority] = useState<Priority>("medium");
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addIdea({
      title: title.trim(),
      description: description.trim() || tr("idea.defaultDescription"),
      status: "idea",
      priority,
      platform,
      scheduledAt: scheduledAt || undefined,
      thumbnail: defaultThumbnails[Math.floor(Math.random() * defaultThumbnails.length)],
    });
    setTitle("");
    setDescription("");
    setPlatform("youtube");
    setPriority("medium");
    setScheduledAt("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-idea-title"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-card-hover">
        <h2 id="add-idea-title" className="text-lg font-semibold tracking-tight">
          {tr("dashboard.newIdea")}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-title">{tr("idea.title")}</Label>
            <Input
              id="idea-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tr("idea.titlePlaceholder")}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-desc">{tr("idea.description")}</Label>
            <Input
              id="idea-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr("idea.descPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="idea-platform">{tr("idea.platform")}</Label>
              <select
                id="idea-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Idea["platform"])}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="x">X</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="idea-priority">{tr("idea.priority")}</Label>
              <select
                id="idea-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="high">{tr("priority.high")}</option>
                <option value="medium">{tr("priority.medium")}</option>
                <option value="low">{tr("priority.low")}</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-scheduled">{tr("idea.scheduledAt")}</Label>
            <Input
              id="idea-scheduled"
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {tr("idea.cancel")}
            </Button>
            <Button type="submit" className="flex-1">{tr("idea.save")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
