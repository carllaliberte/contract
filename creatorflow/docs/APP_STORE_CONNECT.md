# CreatorFlow — App Store Connect checklist

Complete guide for submitting **CreatorFlow** (`com.carllaliberte.creatorflow`) to the Apple App Store with Pro subscriptions (Option B).

## URLs required by Apple

| Field | URL |
|-------|-----|
| Privacy Policy (FR) | https://carllaliberte.github.io/contract/creatorflow/privacy.html |
| Privacy Policy (EN) | https://carllaliberte.github.io/contract/creatorflow/privacy-en.html |
| Terms of Use | https://carllaliberte.github.io/contract/creatorflow/terms.html |
| Support | https://github.com/carllaliberte/contract/issues |
| Marketing / demo | https://carllaliberte.github.io/contract/creatorflow/ |

Deploy Pages after merge: `.github/workflows/deploy-creatorflow.yml`

## App Store Connect — App record

| Field | Value |
|-------|-------|
| Name | CreatorFlow |
| Subtitle (30 chars) | Pipeline créateurs vidéo |
| Bundle ID | com.carllaliberte.creatorflow |
| SKU | creatorflow-ios |
| Primary language | French (Canada) |
| Category | Productivity |
| Secondary category | Photo & Video |
| Age rating | 4+ (no restricted content) |
| Copyright | © 2026 Carl Laliberté |

### Description (FR) — see `STORE-LISTING.md`

### Description (EN)

```
CreatorFlow — the content creator pipeline.

Go from idea to publish without friction:
• Kanban Idea → Script → Production → Ready → Published
• AI scripts for YouTube, TikTok, and Reels
• Clear organization for your video ideas
• Instant demo mode, no credit card required

FOR WHO?
YouTube, TikTok, Instagram Reels creators, solopreneurs, and content teams.

FEATURES
– Visual drag-and-drop pipeline
– Structured script generation (hooks, scenes, CTA)
– Priority dashboard
– Premium dark UI, bilingual FR/EN

Download CreatorFlow and publish more consistently.
```

### Keywords (100 chars max)

```
youtube,tiktok,reels,script,content,creator,pipeline,ia,video,shorts
```

### Promotional text

```
Organisez vos idées, générez des scripts IA et publiez plus souvent — tout en un seul pipeline.
```

## Subscriptions (In-App Purchases)

Create subscription group: **CreatorFlow Pro**

| Product ID | Reference name | Duration | Price (CAD) |
|------------|----------------|----------|-------------|
| `cf_pro_monthly` | CreatorFlow Pro Monthly | 1 month | 6,99 $ |
| `cf_pro_yearly` | CreatorFlow Pro Yearly | 1 year | 59,99 $ |

### Subscription localization (FR)

**Monthly display name:** CreatorFlow Pro — Mensuel  
**Monthly description:** 100 scripts courts et 50 scripts longs par mois, durée longue jusqu'à 30 min.

**Yearly display name:** CreatorFlow Pro — Annuel  
**Yearly description:** Même avantages Pro, économisez avec l'abonnement annuel.

### Review notes for Apple

```
CreatorFlow is a content pipeline for video creators.

Sign in with Apple is required for Pro purchases (demo mode available without account).

Sandbox test account: [your sandbox Apple ID]
Steps: Launch app → Sign in with Apple → Settings → Upgrade to Pro → purchase cf_pro_monthly

API: VITE_API_URL points to our backend for AI script generation and receipt validation.
Privacy: https://carllaliberte.github.io/contract/creatorflow/privacy.html
```

## Screenshots required

| Device | Size | Count |
|--------|------|-------|
| iPhone 6.7" | 1290 × 2796 | 3–10 |
| iPhone 6.5" | 1284 × 2778 | 3–10 |
| iPad Pro 12.9" (optional) | 2048 × 2732 | 3–10 |

Suggested screens: Landing, Pipeline kanban, Script generation, Paywall, Settings/plan.

## Xcode capabilities

- [x] Sign in with Apple (`App.entitlements`)
- [ ] In-App Purchase capability (enable in Xcode → Signing & Capabilities)
- [x] App Transport Security (no arbitrary loads)
- [x] Privacy manifest (`PrivacyInfo.xcprivacy`)

## Server configuration (production)

```bash
# api/.env — NO mock flags in production
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
APPLE_CLIENT_ID=com.carllaliberte.creatorflow
APPLE_BUNDLE_ID=com.carllaliberte.creatorflow
MEMORY_STORE=false
MOCK_IAP=false
MOCK_APPLE_AUTH=false
```

```bash
# creatorflow build (release)
VITE_API_URL=https://your-api.example.com npm run build:ios
# VITE_AUTH_STUB must be UNSET
```

### App Store Server Notifications V2

Configure in App Store Connect → App → App Information → App Store Server Notifications:

```
https://your-api.example.com/iap/apple/notifications
```

## Pre-submission checklist

- [ ] Products `cf_pro_monthly` / `cf_pro_yearly` approved in App Store Connect
- [ ] Privacy policy URL live on GitHub Pages
- [ ] API deployed with Supabase migration `20250825180000_iap_subscriptions.sql`
- [ ] Sandbox: Sign in with Apple → purchase → restore → verify Pro quotas
- [ ] Sandbox: subscription expiry/downgrade via webhook
- [ ] Release archive signed with Distribution certificate
- [ ] Export compliance: No encryption beyond standard HTTPS (or declare exempt)
- [ ] App Review contact: laliberte22@gmail.com

## Build commands (Mac)

```bash
cd creatorflow
npm ci
VITE_API_URL=https://your-api.example.com npm run build:ios

# Automated archive + upload (recommended)
export APPLE_TEAM_ID=XXXXXXXXXX
export APP_STORE_CONNECT_API_KEY_ID=XXXXXXXXXX
export APP_STORE_CONNECT_API_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export APP_STORE_CONNECT_API_KEY_PATH=~/AuthKey_XXXXXXXXXX.p8
bash ../scripts/ios-archive-and-upload.sh
```

Or all-in-one:

```bash
bash scripts/force-app-store-release.sh https://your-api.example.com
```

### GitHub Actions (CI archive)

Workflow: `.github/workflows/ios-app-store-release.yml`

Secrets required:
- `APPLE_TEAM_ID`
- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_API_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_BASE64` (contents of `.p8` file, base64)
- Optional: `APPLE_CERTIFICATE_BASE64`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_PROVISION_PROFILE_BASE64`

Trigger: Actions → **iOS App Store release** → Run workflow

Or push tag: `git tag ios-release/1.0.0 && git push origin ios-release/1.0.0`
