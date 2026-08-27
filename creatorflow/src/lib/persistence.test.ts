import { describe, expect, it } from "vitest";
import { resolvePersistenceMode } from "./persistence";

describe("resolvePersistenceMode", () => {
  it("keeps demo and unsigned sessions on localStorage", () => {
    expect(
      resolvePersistenceMode({
        session: "demo",
        supabaseConfigured: true,
        apiConfigured: true,
      }),
    ).toBe("local");
    expect(
      resolvePersistenceMode({
        session: "none",
        supabaseConfigured: true,
        apiConfigured: true,
      }),
    ).toBe("local");
  });

  it("prefers Supabase when the Apple client is configured", () => {
    expect(
      resolvePersistenceMode({
        session: "apple",
        supabaseConfigured: true,
        apiConfigured: true,
      }),
    ).toBe("supabase");
  });

  it("uses the API when Apple is signed in and only VITE_API_URL is set", () => {
    expect(
      resolvePersistenceMode({
        session: "apple",
        supabaseConfigured: false,
        apiConfigured: true,
      }),
    ).toBe("api");
  });

  it("falls back to local when Apple is signed in with no cloud backend", () => {
    expect(
      resolvePersistenceMode({
        session: "apple",
        supabaseConfigured: false,
        apiConfigured: false,
      }),
    ).toBe("local");
  });
});
