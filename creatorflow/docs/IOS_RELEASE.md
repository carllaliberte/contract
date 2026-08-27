# CreatorFlow — iOS App Store release

CI archives and uploads to App Store Connect when you push a tag. **Carl does the Apple paperwork on the Mac. The repo never holds certs, `.p12`, `.p8`, or profiles.**

**Bundle ID:** `com.carllaliberte.creatorflow`  
**Workflow:** `.github/workflows/macos-ios-virtual.yml`

## Carl fait ça sur le Mac, puis tag `ios-release-v*`

Do this once on the Mac (Xcode + Apple Developer). Do not ask the agent to create these, and do not commit them.

1. **Apple Distribution certificate** — Xcode or developer.apple.com → Certificates.
2. **Export `.p12`** of that cert (with a password you keep off-git).
3. **App Store provisioning profile** for `com.carllaliberte.creatorflow`.
4. **App Store Connect API key `.p8`** (Users and Access → Integrations → App Store Connect API).
5. **GitHub Secrets** (Settings → Secrets and variables → Actions), one JSON secret **`CREATORFLOW_APPLE_CONFIG`**:

```json
{
  "teamId": "XXXXXXXXXX",
  "apiKeyId": "XXXXXXXXXX",
  "apiIssuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "apiKeyBase64": "<base64 of AuthKey_XXXXXXXXXX.p8>",
  "certificateBase64": "<base64 of the .p12>",
  "certificatePassword": "<p12 password>",
  "provisionProfileBase64": "<base64 of the App Store .mobileprovision>"
}
```

Generate the JSON locally (values stay on the Mac):

```bash
export APPLE_TEAM_ID=...
export APP_STORE_CONNECT_API_KEY_ID=...
export APP_STORE_CONNECT_API_ISSUER_ID=...
export APP_STORE_CONNECT_API_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
bash scripts/print-creatorflow-apple-config.sh
```

Paste into the secret. **Never commit `.p8`, certificates, passwords, or `VITE_AUTH_STUB=true`.**

6. **Tag and push** from the commit you want in TestFlight:

```bash
git tag ios-release-v1.0.0
git push origin ios-release-v1.0.0
```

That tag is the ship trigger. Also accepted: `ios-release/*`, `deliverable/app-store-*`, or a manual run of **macOS iOS build (virtual Mac)**.

If `CREATORFLOW_APPLE_CONFIG` is missing, the job still compiles for simulator and skips archive/upload.

## Still manual in App Store Connect

After the IPA appears in TestFlight:

- Submit for Review (metadata, compliance, export regulations)
- In-App Purchases — attach products in App Store Connect
- Screenshots & listing
- Pricing & availability

CI does not submit the app for review.

## Related

- Day-to-day PR CI (simulator only, no signing): `.github/workflows/ci-creatorflow.yml`
- Local archive script: `scripts/ios-archive-and-upload.sh`
- Sign in with Apple: `creatorflow/docs/SIGN_IN_WITH_APPLE.md`
