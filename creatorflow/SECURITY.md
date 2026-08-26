# CreatorFlow — Security (iOS / App Store)

This document describes the production security baseline for the CreatorFlow iOS app (Capacitor). It is intended for App Store review preparation and internal audits.

## Threat model (summary)

| Asset | Risk | Mitigation |
|-------|------|------------|
| Session JWT / Apple credentials | Theft via device backup or XSS | Keychain on iOS; `sessionStorage` on web; no secrets in `localStorage` |
| OpenAI / Supabase service keys | Client extraction | **Never** bundled in the app — server-side only |
| AI quotas | Client tampering | Server enforces quotas; client counters are cache only |
| IAP receipts | Fraudulent Pro unlock | Server-side validation via `POST /iap/apple/validate` |
| AI abuse / burst traffic | Cost spike, DoS | API burst limit (`429 RATE_LIMITED` + `Retry-After`) before LLM |

## App Transport Security (ATS)

- `ios/App/App/Info.plist` **must not** set `NSAllowsArbitraryLoads` to `true`.
- Default ATS applies: HTTPS required for all network calls.
- Capacitor WebView uses `iosScheme: "https"` (`capacitor.config.ts`) for bundled assets.
- CI enforces the ATS check (`.github/workflows/ci-creatorflow.yml`).

If a development-only HTTP endpoint is required, add a **Debug-only** `NSExceptionDomains` entry — never ship arbitrary loads to production.

## Keychain & secure storage

Sensitive session material uses `src/lib/secureStorage.ts`:

| Key | Storage | Content |
|-----|---------|---------|
| `cf-auth-token` | Keychain (iOS) / `sessionStorage` (web) | App session JWT |
| `cf-apple-user` | Keychain | Apple user identifier |
| `cf-session-kind` | Keychain | `apple` \| `demo` |

Non-sensitive data remains in `localStorage` (locale, demo ideas, AI usage cache, demo flag `cf-demo`).

Plugin: `@aparajita/capacitor-secure-storage` (iOS Keychain, Android EncryptedSharedPreferences).

## Authentication

### Sign in with Apple

1. Native iOS obtains `identityToken` + `authorizationCode` via `@capacitor-community/apple-sign-in`.
2. Client POSTs tokens to `POST /auth/apple` (or `VITE_AUTH_APPLE_URL`) — see `src/lib/api/auth.ts`.
3. Server validates the Apple JWT (JWKS, `aud`, `iss`) via `api/src/services/appleAuth.ts` and exchanges for a Supabase session.
4. **Dev stub**: when no backend is configured (`DEV`, `VITE_AUTH_STUB=true`, or empty `VITE_API_URL`), a dev-only stub token is issued — **not for production**.

Tokens are **never** persisted in `localStorage`. The `identityToken` exists only in memory during the exchange.

### Demo mode

Explicit opt-in (`cf-demo` + `cf-session-kind=demo`). Demo does not grant authenticated API access; requests use `x-demo-id`.

## In-app purchases

1. Native StoreKit bridge (`CreatorFlowStoreKit`) completes purchase on device.
2. Client POSTs `{ productId, signedTransaction }` to `POST /iap/apple/validate` with session Bearer token.
3. Server verifies transaction (Apple App Store Server API in production; `IAP_APPLE_STUB` for staging).
4. Server updates `profiles.plan = 'pro'`; client refreshes plan state via `setCurrentPlan('pro')` after successful sync.

Bridge: `src/lib/iap.ts` · Catalog: `docs/IAP_CATALOG.md`

## AI rate limiting & provenance

| Layer | Enforcement | Response |
|-------|-------------|----------|
| Monthly quota | `ai_usage` / plan limits | `429 LIMIT_REACHED`, `Retry-After: 86400` |
| Burst limit | Sliding window per user (default 6/min) | `429 RATE_LIMITED`, `Retry-After: N` |

Generation provenance (platform, format, model, plan, title hash) is logged server-side — see `api/src/services/provenanceService.ts`. Full prompts are not stored.

## Secrets policy

**Allowed in Vite env (`VITE_*`):**

- `VITE_API_URL` — public API base URL
- `VITE_AUTH_APPLE_URL` — optional dedicated Apple auth endpoint
- `VITE_IAP_VALIDATE_URL` — optional dedicated IAP validation endpoint
- `VITE_AUTH_STUB` — `true` only for local/staging stub auth (remove for App Store release)
- `VITE_BASE_PATH`, `VITE_ROUTER_BASENAME` — routing

**Never in the client bundle:**

- OpenAI API keys
- Supabase service role / JWT secret
- Apple Sign In private key
- App Store shared secret / IAP signing keys

See `.env.example` and `README.md`.

## Plans & IAP alignment

Single source: `shared/plans.ts` (quotas + `IAP_PRODUCT_IDS`). Re-exported by:

- `creatorflow/src/lib/plans.ts`
- `api/src/limits.ts`
- `supabase/functions/_shared/limits.ts`

## P1 roadmap (remaining)

See `docs/ios-p1-stubs.md` for:

- Full Apple App Store Server API JWS verification (production IAP credentials)
- Privacy manifest completion (`PrivacyInfo.xcprivacy`)

## Reporting vulnerabilities

Report security issues privately via [GitHub Security Advisories](https://github.com/carllaliberte/contract/security/advisories/new) or email listed in the root [`SECURITY.md`](../SECURITY.md). Do not open public issues for undisclosed vulnerabilities.

## Checklist before App Store submission

- [ ] `NSAllowsArbitraryLoads` absent or `false` in Release `Info.plist`
- [ ] `VITE_AUTH_STUB` unset in production build
- [ ] Apple auth backend validates `identityToken` (no stub in production)
- [ ] IAP validation live with Apple credentials (not `IAP_APPLE_STUB`)
- [ ] Session tokens only in Keychain
- [ ] Privacy manifest reviewed (`ios/App/App/PrivacyInfo.xcprivacy`)
- [ ] No API secrets in client bundle (`npm run build` + inspect `dist/`)
