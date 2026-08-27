import type { Platform } from "../lib/api/types";

export type IdeaStatus =
  | "idea"
  | "script"
  | "production"
  | "ready"
  | "published";

export type Priority = "high" | "medium" | "low";

export type Idea = {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  priority: Priority;
  platform: Platform;
  updatedAt: string;
  /** Planned publish date (YYYY-MM-DD). Falls back to updatedAt in calendar views. */
  scheduledAt?: string;
  script?: string;
  /** Variant titles from an applied content pack. */
  packTitles?: string[];
  /** Hashtags from an applied content pack. */
  packHashtags?: string[];
  /** Social caption / description from pack apply. */
  packCaption?: string;
  thumbnail: string;
  videoUrl?: string;
};

export function mediaUrl(file: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base.endsWith("/") ? base : `${base}/`}media/${file}`;
}

export const demoIdeas: Idea[] = [
  {
    id: "1",
    title: "5 erreurs de montage qui tuent ton retention",
    description: "Analyse concrète avec avant/après — format Shorts + version longue.",
    status: "production",
    priority: "high",
    platform: "youtube",
    updatedAt: "2026-08-24T10:30:00Z",
    scheduledAt: "2026-08-28",
    script:
      "HOOK: « Ces 5 erreurs font fuir 70% de ton audience. »\n1. Transitions trop longues\n2. Audio non normalisé\n3. Hook trop lent\n4. Pas de pattern interrupt\n5. CTA mal placé\nCTA: Abonne-toi pour la checklist complète.",
    thumbnail: mediaUrl("still-edit.jpg"),
    videoUrl: mediaUrl("demo-booth.mp4"),
  },
  {
    id: "2",
    title: "Routine créateur 60 secondes",
    description: "Storytelling vertical — structure matinale pour créateurs solo.",
    status: "script",
    priority: "medium",
    platform: "tiktok",
    updatedAt: "2026-08-23T16:45:00Z",
    scheduledAt: "2026-08-26",
    script:
      "HOOK (0-3s): « Voici comment je structure ma matinée. »\nScène 1: réveil + café\nScène 2: 3 priorités max\nScène 3: deep work block\nCTA: Suis pour le template.",
    thumbnail: mediaUrl("still-tiktok.jpg"),
    videoUrl: mediaUrl("demo-vertical.mp4"),
  },
  {
    id: "3",
    title: "Setup streaming minimaliste (unboxing)",
    description: "Reels — lumière naturelle, esthétique chaleureuse, product placement soft.",
    status: "idea",
    priority: "low",
    platform: "reels",
    updatedAt: "2026-08-22T09:15:00Z",
    scheduledAt: "2026-08-30",
    thumbnail: mediaUrl("still-reels.jpg"),
  },
  {
    id: "4",
    title: "Comment j’organise 30 idées par semaine",
    description: "Long format YouTube — démonstration complète du pipeline CreatorFlow.",
    status: "ready",
    priority: "high",
    platform: "youtube",
    updatedAt: "2026-08-21T14:00:00Z",
    scheduledAt: "2026-08-27",
    script:
      "Intro: le chaos des idées non structurées.\nDémo live du pipeline.\nSystème de priorisation.\nCTA: lien vers la démo.",
    thumbnail: mediaUrl("still-ideas.jpg"),
    videoUrl: mediaUrl("demo-booth.mp4"),
  },
  {
    id: "5",
    title: "Hook qui arrête le scroll (formule)",
    description: "TikTok éducatif — formule réutilisable en 3 temps.",
    status: "published",
    priority: "medium",
    platform: "tiktok",
    updatedAt: "2026-08-18T20:30:00Z",
    script: "Formule: Constat choc → Preuve → Promesse.",
    thumbnail: mediaUrl("still-tiktok.jpg"),
    videoUrl: mediaUrl("demo-vertical.mp4"),
  },
  {
    id: "6",
    title: "Behind the scenes — tournage Reels",
    description: "Coulisses d’un plan séquence en une prise.",
    status: "script",
    priority: "high",
    platform: "reels",
    updatedAt: "2026-08-20T11:20:00Z",
    script: "Plan séquence: caméra → lumière → script imprimé → action.",
    thumbnail: mediaUrl("still-reels.jpg"),
    videoUrl: mediaUrl("demo-vertical.mp4"),
  },
];

export const statusOrder: Record<IdeaStatus, number> = {
  ready: 0,
  production: 1,
  script: 2,
  idea: 3,
  published: 9,
};

export const priorityOrder: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function getNextUp(ideas: Idea[]): Idea | null {
  const active = ideas.filter((i) => i.status !== "published");
  if (active.length === 0) return null;
  return [...active].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    const prioDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (prioDiff !== 0) return prioDiff;
    return b.updatedAt.localeCompare(a.updatedAt);
  })[0];
}

export function countByStatus(ideas: Idea[]) {
  return ideas.reduce(
    (acc, idea) => {
      acc[idea.status] = (acc[idea.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<IdeaStatus, number>,
  );
}

export const showcaseImages = [
  {
    src: mediaUrl("still-edit.jpg"),
    alt: "Créateur devant un écran de montage",
    label: "Dashboard",
  },
  {
    src: mediaUrl("still-youtube.jpg"),
    alt: "Pipeline de contenus sur écran",
    label: "Pipeline",
  },
  {
    src: mediaUrl("still-reels.jpg"),
    alt: "Tournage vidéo vertical pour réseaux sociaux",
    label: "Production",
  },
];

export const exampleGallery = [
  {
    src: mediaUrl("still-tiktok.jpg"),
    title: "TikTok — Routine créateur",
    platform: "TikTok",
    aspect: "aspect-[9/16]",
  },
  {
    src: mediaUrl("still-youtube.jpg"),
    title: "YouTube — Tutoriel montage",
    platform: "YouTube",
    aspect: "aspect-video",
  },
  {
    src: mediaUrl("still-reels.jpg"),
    title: "Reels — Behind the scenes",
    platform: "Reels",
    aspect: "aspect-[9/16]",
  },
  {
    src: mediaUrl("still-ideas.jpg"),
    title: "YouTube — Organisation d’idées",
    platform: "YouTube",
    aspect: "aspect-video",
  },
];

export const demoVideoUrl = mediaUrl("demo-booth.mp4");

export const demoVideoPoster = mediaUrl("still-edit.jpg");
