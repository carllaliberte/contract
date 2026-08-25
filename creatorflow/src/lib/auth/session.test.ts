import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSession,
  establishAppleSession,
  establishDemoSession,
  resolveSessionKind,
  SESSION_KEYS,
} from "./session";

vi.mock("../secureStorage", () => {
  const store = new Map<string, string>();
  return {
    secureGet: vi.fn(async (key: string) => store.get(key) ?? null),
    secureSet: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    secureRemove: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    secureClear: vi.fn(async (keys: readonly string[]) => {
      keys.forEach((key) => store.delete(key));
    }),
  };
});

describe("auth session", () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearSession();
  });

  it("resolves demo session", async () => {
    await establishDemoSession();
    expect(await resolveSessionKind()).toBe("demo");
  });

  it("resolves apple session when token is stored", async () => {
    await establishAppleSession({ accessToken: "jwt-test", userId: "apple-user-1" });
    expect(await resolveSessionKind()).toBe("apple");
    expect(localStorage.getItem("cf-demo")).toBeNull();
  });

  it("clears all session keys on sign out", async () => {
    await establishAppleSession({ accessToken: "jwt-test", userId: "apple-user-1" });
    await clearSession();
    expect(await resolveSessionKind()).toBe("none");
  });

  it("exports stable session key names", () => {
    expect(SESSION_KEYS.AUTH_TOKEN).toBe("cf-auth-token");
  });
});
