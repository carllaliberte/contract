# CreatorFlow — Security (iOS / App Store)

This document describes the production security baseline for the CreatorFlow iOS app (Capacitor). It is intended for App Store review preparation and internal audits.

## Threat model (summary)

| Asset | Risk | Mitigation |
|-------|------|------------|
| Session JWT / Apple credentials | Theft via device backup or XSS | Keychain on iOS; `sessionStorage` on web; no secrets in `localStorage` |
| OpenAI / Supabase service keys | Client extraction | **Never** bundled in the app — server-side only |
| AI quotas | Client tampering | Server enforces quotas; client counters are cache only |
| IAP receipts | Fraudulent Pro unlock | P1: server-side receipt validation (stub documented) |

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
3. Server validates the Apple JWT (JWKS, `aud`, `iss`) and returns an app session token.
4. **P0 stub**: when no backend is configured (`DEV`, `VITE_AUTH_STUB=true`, or empty `VITE_API_URL`), a dev-only stub token is issued — **not for production**.

Tokens are **never** persisted in `localStorage`. The `identityToken` exists only in memory during the exchange.

### Demo mode

Explicit opt-in (`cf-demo` + `cf-session-kind=demo`). Demo does not grant authenticated API access; requests use `x-demo-id`.

## Secrets policy

**Allowed in Vite env (`VITE_*`):**

- `VITE_API_URL` — public API base URL
- `VITE_AUTH_APPLE_URL` — optional dedicated Apple auth endpoint
- `VITE_AUTH_STUB` — `true` only for local/staging stub auth (remove for App Store release)
- `VITE_BASE_PATH`, `VITE_ROUTER_BASENAME` — routing

**Never in the client bundle:**

- OpenAI API keys
- Supabase service role / JWT secret
- Apple Sign In private key
- App Store shared secret

See `.env.example` and `README.md`.

## Plans & IAP alignment

Single source: `shared/plans.ts` (quotas + `IAP_PRODUCT_IDS`). Re-exported by:

- `creatorflow/src/lib/plans.ts`
- `api/src/limits.ts`
- `supabase/functions/_shared/limits.ts`

StoreKit bridge stub: `creatorflow/src/lib/iap.ts` — see `docs/IAP_CATALOG.md`.

## P1 roadmap (documented stubs)

See `docs/ios-p1-stubs.md` for:

- Server-side IAP receipt validation
- AI rate limiting (edge/API)
- Privacy manifest completion (`PrivacyInfo.xcprivacy`)

## Reporting vulnerabilities

Report security issues privately to the repository owner via GitHub Security Advisories or email listed in the App Store Connect account. Do not open public issues for undisclosed vulnerabilities.

## Checklist before App Store submission

- [ ] `NSAllowsArbitraryLoads` absent or `false` in Release `Info.plist`
- [ ] `VITE_AUTH_STUB` unset in production build
- [ ] Apple auth backend validates `identityToken` (no stub in production)
- [ ] Session tokens only in Keychain
- [x] Privacy policy published (`creatorflow/public/privacy.html`)
- [x] IAP receipt validation endpoint (`POST /iap/apple/validate`)
- [x] StoreKit plugin (`creatorflow/plugins/creatorflow-storekit`)
- [ ] App Store Server Notifications configured (`POST /iap/apple/notifications`)
- [ ] No API secrets in client bundle (`npm run build` + inspect `dist/`)
