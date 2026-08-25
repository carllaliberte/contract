# CreatorFlow — builds mobiles (iOS & Android)

CreatorFlow est une app **Capacitor** : le même code React/Vite tourne sur le web (GitHub Pages), dans une WebView iOS et dans une WebView Android.

## Chemins de base : natif vs GitHub Pages

| Cible | `VITE_BASE_PATH` | `VITE_ROUTER_BASENAME` | URL exemple |
| --- | --- | --- | --- |
| **GitHub Pages** (défaut local/CI web) | `/contract/creatorflow/` | `/contract/creatorflow` | https://carllaliberte.github.io/contract/creatorflow/ |
| **Natif** (iOS / Android) | `/` | `/` | `capacitor://localhost/` |

Les scripts `build:ios` et `build:android` fixent automatiquement le chemin racine `/` avant `vite build`, puis lancent `cap sync`. Ne pas réutiliser `npm run build` seul pour embarquer dans l’app native : les assets seraient servis sous `/contract/creatorflow/` et le routage React casserait.

Configuration Vite : `vite.config.ts` (`base` = `VITE_BASE_PATH`).  
React Router : `src/lib/router.ts` (`VITE_ROUTER_BASENAME`).

## Prérequis

- Node.js 22+
- **Android** : JDK 21, Android SDK (Android Studio ou `sdkmanager`)
- **iOS** : macOS, Xcode 15+, compte Apple Developer pour signature device / App Store

## Android

```bash
cd creatorflow
npm ci
npm run build:android    # build web (base /) + cap sync android
```

Ouvrir dans Android Studio :

```bash
npx cap open android
```

APK debug local :

```bash
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Package : `com.carllaliberte.creatorflow` (`capacitor.config.ts`).

## iOS

```bash
cd creatorflow
npm ci
npm run build:ios        # build web (base /) + cap sync ios
```

Ouvrir dans Xcode :

```bash
npm run cap:open:ios
# ou : npx cap open ios
```

Build simulateur (sans signature) :

```bash
cd ios/App
xcodebuild build \
  -project App.xcodeproj \
  -scheme App \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO
```

Sign in with Apple : plugin `@capacitor-community/apple-sign-in`, entitlements dans `ios/App/App/App.entitlements`.

Sécurité iOS (ATS, Keychain, auth) : voir [`SECURITY.md`](./SECURITY.md).

## CI GitHub Actions

Workflow `.github/workflows/ci-creatorflow.yml` :

| Job | Runner | Étapes |
| --- | --- | --- |
| `web` | `ubuntu-latest` | typecheck, tests unitaires, build, e2e Playwright |
| `android` | `ubuntu-latest` | `build:android`, `assembleDebug`, artefact APK |
| `ios` | `macos-latest` | `build:ios`, `xcodebuild` simulateur (`continue-on-error`) |

Le déploiement Pages reste dans `deploy-creatorflow.yml` (`build:seo`, base `/contract/creatorflow/`).

## Fichiers à ne pas committer

Voir `.gitignore` racine et `creatorflow/.gitignore` : keystores (`*.keystore`, `*.jks`), `local.properties`, `DerivedData`, builds Gradle/Xcode.
