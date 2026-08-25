import { describe, expect, it } from "vitest";
import type { AppleSignInResult } from "../../hooks/useAppleSignIn";
import { exchangeAppleSession } from "./auth";

const payload: AppleSignInResult = {
  user: "apple-user-123",
  email: "user@example.com",
  givenName: "Test",
  familyName: "User",
  identityToken: "header.payload.signature",
  authorizationCode: "auth-code",
};

describe("exchangeAppleSession", () => {
  it("returns dev stub when API URL is not configured", async () => {
    const session = await exchangeAppleSession(payload);
    expect(session.provider).toBe("apple");
    expect(session.accessToken).toContain("stub.apple.");
    expect(session.userId).toBe("apple-user-123");
  });
});
