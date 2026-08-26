import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveAppleAuthUrl,
  resolveGenerateScriptUrl,
  resolveHealthUrl,
} from "./base";

describe("resolveGenerateScriptUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses Vite proxy when VITE_API_URL is unset", () => {
    vi.stubEnv("VITE_API_URL", "");
    expect(resolveGenerateScriptUrl()).toBe("/ai/generate-script");
  });

  it("appends /ai/generate-script to a Hono API origin", () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
    expect(resolveGenerateScriptUrl()).toBe(
      "https://api.example.com/ai/generate-script",
    );
  });

  it("keeps a full Hono script endpoint unchanged", () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com/ai/generate-script");
    expect(resolveGenerateScriptUrl()).toBe(
      "https://api.example.com/ai/generate-script",
    );
  });

  it("keeps a Supabase Edge Function URL unchanged", () => {
    vi.stubEnv(
      "VITE_API_URL",
      "https://abc.supabase.co/functions/v1/generate-script",
    );
    expect(resolveGenerateScriptUrl()).toBe(
      "https://abc.supabase.co/functions/v1/generate-script",
    );
  });
});

describe("resolveAppleAuthUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses Vite proxy when VITE_API_URL is unset", () => {
    vi.stubEnv("VITE_API_URL", "");
    expect(resolveAppleAuthUrl()).toBe("/auth/apple");
  });

  it("maps a Hono API origin to /auth/apple", () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
    expect(resolveAppleAuthUrl()).toBe("https://api.example.com/auth/apple");
  });

  it("strips /ai/generate-script before resolving auth", () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com/ai/generate-script");
    expect(resolveAppleAuthUrl()).toBe("https://api.example.com/auth/apple");
  });

  it("maps Supabase generate-script to auth-apple", () => {
    vi.stubEnv(
      "VITE_API_URL",
      "https://abc.supabase.co/functions/v1/generate-script",
    );
    expect(resolveAppleAuthUrl()).toBe(
      "https://abc.supabase.co/functions/v1/auth-apple",
    );
  });

  it("rejects the GitHub Pages iOS callback URL", () => {
    vi.stubEnv(
      "VITE_AUTH_APPLE_URL",
      "https://carllaliberte.github.io/contract/creatorflow/auth/apple",
    );
    expect(() => resolveAppleAuthUrl()).toThrow(/callback page/i);
  });

  it("does not treat malformed URLs as the iOS callback page", () => {
    vi.stubEnv(
      "VITE_AUTH_APPLE_URL",
      "not-a-valid-url carllaliberte.github.io/contract/creatorflow/auth/apple",
    );
    expect(() => resolveAppleAuthUrl()).not.toThrow();
    expect(resolveAppleAuthUrl()).toBe(
      "not-a-valid-url carllaliberte.github.io/contract/creatorflow/auth/apple",
    );
  });
});

describe("resolveHealthUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses Vite proxy when VITE_API_URL is unset", () => {
    vi.stubEnv("VITE_API_URL", "");
    expect(resolveHealthUrl()).toBe("/health");
  });

  it("maps a Hono API origin to /health", () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
    expect(resolveHealthUrl()).toBe("https://api.example.com/health");
  });

  it("maps Supabase generate-script to /functions/v1/health", () => {
    vi.stubEnv(
      "VITE_API_URL",
      "https://abc.supabase.co/functions/v1/generate-script",
    );
    expect(resolveHealthUrl()).toBe(
      "https://abc.supabase.co/functions/v1/health",
    );
  });
});
