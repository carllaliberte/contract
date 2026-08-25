# CreatorFlow iOS — P1 stubs (documented, not implemented)

These items are **intentionally stubbed** for P0 App Store hardening. Implement before enabling production billing or scaling AI traffic.

## 1. Server-side IAP validation

**Status:** Stub — client-only plan flag via `setCurrentPlan('pro')`.

**Target flow:**

```
iOS StoreKit → receipt / transaction JWS
  → POST /iap/validate (Hono or Supabase Edge Function)
  → Apple App Store Server API verification
  → UPDATE profiles.plan = 'pro'
  → Client refreshes session / plan from server
```

**Files:**

| File | Role |
|------|------|
| `src/lib/iap.ts` | Native bridge stub (`CreatorFlowStoreKit`) |
| `docs/IAP_CATALOG.md` | Product IDs (`cf_pro_monthly`, `cf_pro_yearly`) |
| `shared/plans.ts` | Quota source of truth |

**Server stub endpoint (to create):** `POST /iap/apple/validate` with `{ signedTransaction, productId }`.

## 2. AI rate limiting

**Status:** Quotas enforced per-plan in API/Edge Function; no global IP/user rate limit yet.

**Target:**

- Redis or Supabase sliding window per `userId` / `x-demo-id`
- Return `429` with `Retry-After` before LLM call
- Align limits with `shared/plans.ts` (`PLAN_LIMITS`)

**Files:**

| File | Role |
|------|------|
| `api/src/routes/ai.ts` | Hono enforcement |
| `supabase/functions/generate-script/index.ts` | Edge Function enforcement |
| `api/src/services/aiUsage.ts` | Usage persistence |

## 3. Privacy manifest placeholders

**Status:** `ios/App/App/PrivacyInfo.xcprivacy` contains placeholder entries.

**Before submission:**

1. Audit required-reason APIs (UserDefaults, file timestamps, etc.)
2. Declare collected data types (email if Apple Sign In, usage analytics if added)
3. Set `NSPrivacyTracking` to accurate value
4. Run Xcode **Privacy Report** on Release archive

**Reference:** [Apple Privacy manifest docs](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)

## Related

- `SECURITY.md` — ATS, Keychain, auth, secrets policy
- `README-MOBILE.md` — build & Capacitor sync
