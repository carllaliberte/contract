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
  platform: "youtube" | "tiktok" | "reels";
  updatedAt: string;
  /** Planned publish date (YYYY-MM-DD). Falls back to updatedAt in calendar views. */
  scheduledAt?: string;
  script?: string;
  thumbnail: string;
  videoUrl?: string;
};

export const demoIdeas: Idea[] = [
  {
    id: "1",
    title: "5 erreurs de montage qui tuent ton retention",
    description: "Analyse concrète avec avant/après — format Shorts + version longue.",
    status: "production",
    priority: "high",
    platform: "youtube",
    updatedAt: "2026-08-24T10:30:00Z",
    script:
      "HOOK: « Ces 5 erreurs font fuir 70% de ton audience. »\n1. Transitions trop longues\n2. Audio non normalisé\n3. Hook trop lent\n4. Pas de pattern interrupt\n5. CTA mal placé\nCTA: Abonne-toi pour la checklist complète.",
    thumbnail:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
    videoUrl:
      "https://cdn.coverr.co/videos/coverr-a-person-editing-a-video-on-a-computer-5633/1080p.mp4",
  },
  {
    id: "2",
    title: "Routine créateur 60 secondes",
    description: "Storytelling vertical — structure matinale pour créateurs solo.",
    status: "script",
    priority: "medium",
    platform: "tiktok",
    updatedAt: "2026-08-23T16:45:00Z",
    script:
      "HOOK (0-3s): « Voici comment je structure ma matinée. »\nScène 1: réveil + café\nScène 2: 3 priorités max\nScène 3: deep work block\nCTA: Suis pour le template.",
    thumbnail:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80",
    videoUrl:
      "https://cdn.coverr.co/videos/coverr-young-woman-recording-a-vlog-4166/1080p.mp4",
  },
  {
    id: "3",
    title: "Setup streaming minimaliste (unboxing)",
    description: "Reels — lumière naturelle, esthétique chaleureuse, product placement soft.",
    status: "idea",
    priority: "low",
    platform: "reels",
    updatedAt: "2026-08-22T09:15:00Z",
    thumbnail:
      "https://images.unsplash.com/photo-1598488035135-bdbb2231bb80?w=800&q=80",
  },
  {
    id: "4",
    title: "Comment j’organise 30 idées par semaine",
    description: "Long format YouTube — démonstration complète du pipeline CreatorFlow.",
    status: "ready",
    priority: "high",
    platform: "youtube",
    updatedAt: "2026-08-21T14:00:00Z",
    script:
      "Intro: le chaos des idées non structurées.\nDémo live du pipeline.\nSystème de priorisation.\nCTA: lien vers la démo.",
    thumbnail:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80",
    videoUrl:
      "https://cdn.coverr.co/videos/coverr-filming-with-a-professional-camera-1585/1080p.mp4",
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
    thumbnail:
      "https://images.unsplash.com/photo-1478737270233-763290ed8258?w=800&q=80",
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
    thumbnail:
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
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
    src: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=1200&q=80",
    alt: "Créateur devant un écran de montage",
    label: "Dashboard",
  },
  {
    src: "https://images.unsplash.com/photo-1533750349088-cd871a694021?w=1200&q=80",
    alt: "Pipeline de contenus sur écran",
    label: "Pipeline",
  },
  {
    src: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&q=80",
    alt: "Tournage vidéo vertical pour réseaux sociaux",
    label: "Production",
  },
];

export const exampleGallery = [
  {
    src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80",
    title: "TikTok — Routine créateur",
    platform: "TikTok",
    aspect: "aspect-[9/16]",
  },
  {
    src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80",
    title: "YouTube — Tutoriel montage",
    platform: "YouTube",
    aspect: "aspect-video",
  },
  {
    src: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80",
    title: "Reels — Behind the scenes",
    platform: "Reels",
    aspect: "aspect-[9/16]",
  },
  {
    src: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&q=80",
    title: "YouTube — Organisation d’idées",
    platform: "YouTube",
    aspect: "aspect-video",
  },
];

export const demoVideoUrl =
  "https://cdn.coverr.co/videos/coverr-a-content-creator-recording-a-video-4165/1080p.mp4";

export const demoVideoPoster =
  "https://images.unsplash.com/photo-1579869847514-7c1a19d2d867?w=1200&q=80";
