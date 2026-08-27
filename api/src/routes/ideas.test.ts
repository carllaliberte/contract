import { beforeEach, describe, expect, it } from "vitest";
import { createIdeasRoutes } from "./ideas.js";
import { clearMemoryIdeasStore } from "../services/ideasStore.js";

describe("ideas routes", () => {
  beforeEach(() => {
    clearMemoryIdeasStore();
  });

  it("GET /ideas returns empty list for demo user", async () => {
    const app = createIdeasRoutes();
    const res = await app.request("/", {
      headers: { "x-demo-id": "ideas-test" },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ideas: unknown[] };
    expect(data.ideas).toEqual([]);
  });

  it("PUT /ideas persists and GET returns ideas", async () => {
    const app = createIdeasRoutes();
    const idea = {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Test idea",
      description: "Desc",
      status: "idea",
      priority: "medium",
      platform: "youtube",
      updatedAt: "2026-08-26T12:00:00.000Z",
      thumbnail: "https://example.com/thumb.jpg",
    };

    const putRes = await app.request("/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-demo-id": "ideas-test",
      },
      body: JSON.stringify({ ideas: [idea] }),
    });
    expect(putRes.status).toBe(200);

    const getRes = await app.request("/", {
      headers: { "x-demo-id": "ideas-test" },
    });
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as { ideas: typeof idea[] };
    expect(data.ideas).toHaveLength(1);
    expect(data.ideas[0].title).toBe("Test idea");
  });

  it("PUT /ideas accepts instagram and x platforms", async () => {
    const app = createIdeasRoutes();
    const idea = {
      id: "22222222-2222-4222-8222-222222222222",
      title: "X thread",
      description: "Desc",
      status: "idea",
      priority: "high",
      platform: "x",
      updatedAt: "2026-08-27T12:00:00.000Z",
      thumbnail: "https://example.com/thumb.jpg",
    };

    const putRes = await app.request("/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-demo-id": "ideas-platform",
      },
      body: JSON.stringify({ ideas: [idea] }),
    });
    expect(putRes.status).toBe(200);
  });

  it("PUT /ideas rejects unknown platforms", async () => {
    const app = createIdeasRoutes();
    const putRes = await app.request("/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-demo-id": "ideas-platform",
      },
      body: JSON.stringify({
        ideas: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            title: "Bad platform",
            description: "Desc",
            status: "idea",
            priority: "low",
            platform: "facebook",
            updatedAt: "2026-08-27T12:00:00.000Z",
            thumbnail: "https://example.com/thumb.jpg",
          },
        ],
      }),
    });
    expect(putRes.status).toBe(400);
  });
});
