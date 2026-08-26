# CreatorFlow — App Store 1.0 (iOS)

Guide pour archiver, soumettre et passer la review Apple. Version **1.0 gratuite** — pas d’achats intégrés actifs.

## Identifiants

| Champ | Valeur |
| --- | --- |
| Bundle ID | `com.carllaliberte.creatorflow` |
| App name | CreatorFlow |
| Version marketing | 1.0 |
| Capacitor `appId` | `com.carllaliberte.creatorflow` (`capacitor.config.ts`) |
| Sign in with Apple | `ios/App/App/App.entitlements` |

Guide Apple Developer + Supabase + API : [`docs/SIGN_IN_WITH_APPLE.md`](./docs/SIGN_IN_WITH_APPLE.md).

## Build web + sync (obligatoire avant Xcode)

**Ne pas** utiliser `npm run build` seul (base GitHub Pages `/contract/creatorflow/`). Pour l’archive Store :

```bash
cd creatorflow
npm ci
npm run build:ios
```

Ce script :

1. Valide qu’`VITE_AUTH_STUB` n’est pas `true` (refuse le build sinon).
2. Fixe `VITE_BASE_PATH=/` et `VITE_ROUTER_BASENAME=/`.
3. Lance `vite build` puis `npx cap sync ios`.

### `VITE_AUTH_STUB` (interdit en prod iOS)

- **Jamais** `VITE_AUTH_STUB=true` dans un build iOS / App Store.
- Le script `scripts/validate-ios-build.mjs` fait échouer `build:ios` si le stub est actif.
- Sur l’app native, `exchangeAppleSession` ne retourne jamais un jeton stub.
- Voir aussi `SECURITY.md` et `.env.example`.

## Archive Xcode

```bash
cd creatorflow
npm run build:ios
npm run cap:open:ios
```

Dans Xcode :

1. Cible **Any iOS Device (arm64)** (pas le simulateur).
2. **Product → Archive**.
3. **Distribute App → App Store Connect → Upload**.
4. Export compliance : **aucun chiffrement non exempté** (`ITSAppUsesNonExemptEncryption = false` dans `Info.plist` — HTTPS seulement).

Simulateur (sans signature) :

```bash
cd creatorflow/ios/App
xcodebuild build \
  -project App.xcodeproj \
  -scheme App \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO
```

## Notes App Review (coller dans App Store Connect)

```
Demo: bouton « Explorer sans compte ».
Sign in with Apple : Hide My Email accepté.
Aucun achat in-app dans la version 1.0.
Pas de compte test requis.
```

## Captures d’écran (simulateur — ne pas générer par IA)

### Spécifications Apple

- **Set requis** : iPhone 6,9″ (ex. iPhone 16 Pro Max).
- **Résolution** : 1320 × 2868 px.
- **Format** : PNG ou JPEG, **pas de transparence**.

### Procédure

1. `npm run build:ios` puis ouvrir le projet dans Xcode.
2. Simulateur : **iPhone 16 Pro Max**, mode **Dark**.
3. Locale **FR** puis **EN** (Settings → General → Language & Region).
4. **5 écrans**, même ordre :
   1. Dashboard (`/app`)
   2. Pipeline (`/app/pipeline`)
   3. Contenus (`/app/contenus`)
   4. Mode tournage si présent, sinon Réglages
   5. Réglages — session Apple + bouton **Supprimer mon compte**
5. Sauvegarder : **Cmd+S** dans le simulateur (fichiers dans le bureau ou dossier choisi).

### Interdit sur les captures

- Barre debug Capacitor
- `localhost` visible
- Prix IAP / bouton d’achat actif
- Mockups teal (charte : navy + bleu pervenche)

## Checklist avant soumission

- [ ] `privacy.html` accessible : https://carllaliberte.github.io/contract/creatorflow/privacy.html
- [ ] `npm run typecheck` OK
- [ ] `npm run build:ios` OK (sans `VITE_AUTH_STUB`)
- [ ] `NSAllowsArbitraryLoads` absent ou `false` (`Info.plist`)
- [ ] Entitlements Sign in with Apple intacts
- [ ] Paywall : achat indisponible si `CreatorFlowStoreKit` absent (pas d’achat simulé)
- [ ] Bloc META / crypto masqué sur `Capacitor.isNativePlatform()`
- [ ] Fiche Connect : textes dans `ASC-LISTING.md`

## Liens légaux

- Privacy : https://carllaliberte.github.io/contract/creatorflow/privacy.html
- Support : https://github.com/carllaliberte/contract/issues
