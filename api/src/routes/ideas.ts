import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AuthVariables } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { env } from "../env.js";
import {
  resolveIdeasStore,
  type IdeaRow,
} from "../services/ideasStore.js";

type AppEnv = { Variables: AuthVariables };

type ClientIdea = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  platform: string;
  updatedAt: string;
  script?: string;
  thumbnail: string;
  videoUrl?: string;
  scheduledAt?: string;
};

function rowToClient(row: IdeaRow): ClientIdea {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    platform: row.platform,
    updatedAt: row.updated_at,
    script: row.script ?? undefined,
    thumbnail: row.thumbnail,
    videoUrl: row.video_url ?? undefined,
    scheduledAt: row.scheduled_at ?? undefined,
  };
}

function clientToRow(userId: string, idea: ClientIdea): IdeaRow {
  return {
    id: idea.id,
    user_id: userId,
    title: idea.title,
    description: idea.description,
    status: idea.status,
    priority: idea.priority,
    platform: idea.platform,
    script: idea.script ?? null,
    thumbnail: idea.thumbnail,
    video_url: idea.videoUrl ?? null,
    scheduled_at: idea.scheduledAt ?? null,
    updated_at: idea.updatedAt,
  };
}

function parseIdeasPayload(raw: unknown): ClientIdea[] | null {
  if (!raw || typeof raw !== "object") return null;
  const ideas = (raw as { ideas?: unknown }).ideas;
  if (!Array.isArray(ideas)) return null;

  const parsed: ClientIdea[] = [];
  for (const item of ideas) {
    if (!item || typeof item !== "object") return null;
    const i = item as Record<string, unknown>;
    if (typeof i.id !== "string" || !i.id.trim()) return null;
    if (typeof i.title !== "string" || !i.title.trim()) return null;
    if (typeof i.description !== "string") return null;
    if (typeof i.status !== "string") return null;
    if (typeof i.priority !== "string") return null;
    if (typeof i.platform !== "string") return null;
    if (typeof i.updatedAt !== "string") return null;
    if (typeof i.thumbnail !== "string") return null;

    parsed.push({
      id: i.id.trim(),
      title: i.title.trim(),
      description: i.description,
      status: i.status,
      priority: i.priority,
      platform: i.platform,
      updatedAt: i.updatedAt,
      script: typeof i.script === "string" ? i.script : undefined,
      thumbnail: i.thumbnail,
      videoUrl: typeof i.videoUrl === "string" ? i.videoUrl : undefined,
      scheduledAt: typeof i.scheduledAt === "string" ? i.scheduledAt : undefined,
    });
  }

  return parsed;
}

export function createIdeasRoutes() {
  const ideas = new Hono<AppEnv>();

  ideas.use(
    "*",
    cors({
      origin: env.corsOrigins,
      allowHeaders: ["Content-Type", "Authorization", "x-demo-id"],
      allowMethods: ["GET", "PUT", "OPTIONS"],
    }),
  );

  ideas.use("*", authMiddleware);

  ideas.get("/", async (c) => {
    const store = await resolveIdeasStore(c.get("userId"));
    const rows = await store.list();
    return c.json({ ideas: rows.map(rowToClient) });
  });

  ideas.put("/", async (c) => {
    const payload = parseIdeasPayload(await c.req.json().catch(() => null));
    if (!payload) {
      return c.json(
        { error: "INVALID_BODY", message: "Expected { ideas: Idea[] }" },
        400,
      );
    }

    const userId = c.get("userId");
    const store = await resolveIdeasStore(userId);
    const rows = payload.map((idea) => clientToRow(userId, idea));
    await store.replaceAll(rows);
    return c.json({ ok: true, count: rows.length });
  });

  return ideas;
}
