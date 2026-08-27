# CreatorFlow — iOS App Store release (TestFlight)

Automated archive and upload to App Store Connect via GitHub Actions on a macOS virtual runner. No local Mac or second Fastlane/Xcode Cloud setup required.

**Bundle ID:** `com.carllaliberte.creatorflow`  
**Workflow:** `.github/workflows/macos-ios-virtual.yml`

## 1. GitHub secret (one-time)

Add repository secret **`CREATORFLOW_APPLE_CONFIG`** (Settings → Secrets and variables → Actions). Paste a single JSON object:

```json
{
  "teamId": "XXXXXXXXXX",
  "apiKeyId": "XXXXXXXXXX",
  "apiIssuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "apiKeyBase64": "<base64 of AuthKey_XXXXXXXXXX.p8>",
  "certificateBase64": "<optional, base64 .p12>",
  "certificatePassword": "<optional>",
  "provisionProfileBase64": "<optional>"
}
```

- **Required:** `teamId`, `apiKeyId`, `apiIssuerId`, `apiKeyBase64`
- **Optional:** certificate and provisioning profile fields (automatic signing often works with the API key alone)

Generate the JSON locally (values stay on your machine):

```bash
export APPLE_TEAM_ID=...
export APP_STORE_CONNECT_API_KEY_ID=...
export APP_STORE_CONNECT_API_ISSUER_ID=...
export APP_STORE_CONNECT_API_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
bash scripts/print-creatorflow-apple-config.sh
```

Copy the printed JSON into the secret. **Do not commit `.p8` files, certificates, or passwords to the repo.**

## 2. Trigger a release

Tag and push from a commit you want to ship:

```bash
git tag ios-release/1.0.0
git push origin ios-release/1.0.0
```

Also supported:

- Tags matching `deliverable/app-store-*` (deliverable snapshots)
- Manual run: Actions → **macOS iOS build (virtual Mac)** → **Run workflow**

The workflow builds the Capacitor web app, runs a simulator compile check, then (when credentials are present) archives, exports an IPA, and uploads to App Store Connect / TestFlight.

If `CREATORFLOW_APPLE_CONFIG` is missing, the job completes with a warning and skips archive/upload (simulator build still runs).

## 3. Still manual in App Store Connect

After the IPA appears in TestFlight:

- **Submit for Review** (metadata, compliance, export regulations)
- **In-App Purchases** — configure and attach products in App Store Connect
- **Screenshots & listing** — app preview, description, keywords, privacy nutrition labels
- **Pricing & availability**

CI does not submit the app for review or change store listing content.

## Related

- Day-to-day PR CI (simulator only, no signing): `.github/workflows/ci-creatorflow.yml`
- Local archive script: `scripts/ios-archive-and-upload.sh`
