import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const APPLE_JWKS_URL = new URL("https://appleid.apple.com/auth/keys");
const APPLE_ISSUER = "https://appleid.apple.com";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getAppleJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(APPLE_JWKS_URL);
  }
  return jwks;
}

export type VerifiedAppleIdentity = {
  sub: string;
  email?: string;
  emailVerified?: boolean;
};

export async function verifyAppleIdentityToken(
  identityToken: string,
  clientId: string,
): Promise<VerifiedAppleIdentity> {
  const { payload } = await jwtVerify(identityToken, getAppleJwks(), {
    issuer: APPLE_ISSUER,
    audience: clientId,
  });

  return parseApplePayload(payload);
}

function parseApplePayload(payload: JWTPayload): VerifiedAppleIdentity {
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("Apple identity token missing sub");
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified:
      payload.email_verified === true || payload.email_verified === "true",
  };
}
