# Archive iOS 1.0 — GitHub Actions (macOS hébergé)

Workflow **manuel** pour archiver CreatorFlow 1.0, exporter l’IPA et l’envoyer sur App Store Connect / TestFlight — **sans Mac local**.

| Élément | Valeur |
| --- | --- |
| Workflow | `.github/workflows/archive-ios.yml` |
| Déclencheur | `workflow_dispatch` uniquement |
| Runner | `macos-latest` |
| Bundle ID | `com.carllaliberte.creatorflow` |
| Build web | `npm run build:ios` (`VITE_BASE_PATH=/`, **refuse** `VITE_AUTH_STUB=true`) |

Ce workflow est **distinct** de la PR launch iOS (#61, déjà mergée). Il n’ajoute ni Capgo ni IAP.

## Secrets requis (4)

Configurer dans **Settings → Secrets and variables → Actions → Repository secrets** :

| Secret | Description |
| --- | --- |
| `APPLE_TEAM_ID` | Team ID Apple Developer (10 caractères) |
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID de la clé API App Store Connect |
| `APP_STORE_CONNECT_API_ISSUER_ID` | Issuer ID (UUID) App Store Connect |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Contenu du fichier `AuthKey_<KEY_ID>.p8`, encodé en base64 |

Générer le base64 de la clé `.p8` :

```bash
base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy   # macOS
# ou
base64 -w0 AuthKey_XXXXXXXXXX.p8         # Linux
```

Le workflow **échoue immédiatement** si l’un des quatre secrets manque. Ne pas lancer tant qu’ils ne sont pas tous renseignés.

## Déclencher l’archive

```bash
gh workflow run archive-ios.yml --ref main
```

Ou : **Actions → Archive iOS (App Store 1.0) → Run workflow**.

## Étapes du workflow

1. Vérification des 4 secrets
2. `npm ci` + `npm run build:ios` (validation `validate-ios-build.mjs`, base `/`, pas de stub auth)
3. Installation temporaire de la clé API (`.p8` décodée depuis le secret)
4. `xcodebuild archive` — signature automatique via clé API (`-allowProvisioningUpdates`)
5. `xcodebuild -exportArchive` — IPA App Store Connect
6. `xcrun altool --upload-app` — upload vers App Store Connect
7. Artefact IPA (`creatorflow-ios-1.0-ipa`), rétention **14 jours**
8. Suppression du fichier `.p8` sur le runner (`if: always`)

## Après l’upload

1. Ouvrir [App Store Connect](https://appstoreconnect.apple.com/apps)
2. Attendre le traitement du build (souvent 5–15 min)
3. Renseigner la fiche 1.0 : textes dans `creatorflow/ASC-LISTING.md`, `creatorflow/STORE.md`
4. Soumettre pour review (version **1.0 gratuite**, pas d’IAP)

## CI existante (inchangée)

`.github/workflows/ci-creatorflow.yml` reste sur **simulateur non signé** (`CODE_SIGNING_ALLOWED=NO`). Ce workflow archive est réservé aux releases App Store manuelles.

## Dépannage

| Symptôme | Piste |
| --- | --- |
| `Missing repository secrets` | Ajouter les 4 secrets ci-dessus |
| `VITE_AUTH_STUB=true is forbidden` | Retirer `VITE_AUTH_STUB` des variables d’environnement / secrets |
| Échec signature / provisioning | Vérifier `APPLE_TEAM_ID`, bundle `com.carllaliberte.creatorflow`, certificats ASC |
| `altool` upload failed | Vérifier Key ID, Issuer ID, contenu base64 de la `.p8` |

Voir aussi : `docs/GITHUB_COMMANDS.md`, `creatorflow/STORE.md`.
