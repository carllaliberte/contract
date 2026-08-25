# CI secrets & variables setup — carllaliberte/contract

Guide pas-à-pas pour configurer **GitHub Actions** sans commiter de clés.  
Les valeurs `VITE_*` sont **publiques** (injectées au build Vite) : les stocker comme **variables** (`vars`), pas comme secrets.

## Prérequis

- [GitHub CLI](https://cli.github.com/) (`gh`) installé et authentifié avec droits admin sur le dépôt
- Dépôt cible : `carllaliberte/contract`

```bash
gh auth login
gh auth status
```

## 1. Variables publiques (`VITE_*`)

### Option A — script automatique (recommandé)

Remplir localement `creatorflow/.env` et/ou `google-app/.env` (fichiers gitignored), **ou** exporter les variables dans le shell, puis :

```bash
bash scripts/setup-github-ci-env.sh
```

Le script :

- lit `VITE_API_URL`, `VITE_WALLETCONNECT_PROJECT_ID`, `VITE_CONTRACT_ADDRESS`, `VITE_RPC_URL`
- **ignore** toute valeur vide (aucun écrasement par une chaîne vide)
- exécute `gh variable set` sur `carllaliberte/contract`
- **ne touche pas** à `VITE_BASE_PATH` ni `VITE_ROUTER_BASENAME`

Ordre de lecture : variable shell → `creatorflow/.env` → `creatorflow/.env.local` → `google-app/.env` → `google-app/.env.local`.

### Option B — interface GitHub

**Settings → Secrets and variables → Actions → Variables**

| Variable | Usage | Obligatoire |
|----------|-------|-------------|
| `VITE_API_URL` | Endpoint scripts IA CreatorFlow | Non — vide = mode démo |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect META ([cloud.walletconnect.com](https://cloud.walletconnect.com)) | Non — WC désactivé si absent |
| `VITE_CONTRACT_ADDRESS` | Adresse contrat META | Non — défaut dans `config.ts` ou `deployment.json` |
| `VITE_RPC_URL` | RPC Ethereum (ex. Sepolia) | Non — RPC public par défaut |
| `VITE_BASE_PATH` | Base URL META sur Pages | Non — défaut workflow `/contract/` |

> **Ne pas** définir `VITE_BASE_PATH=/` pour les déploiements GitHub Pages : les workflows CreatorFlow et META utilisent des sous-chemins (`/contract/`, `/contract/creatorflow/`). La valeur `/` est réservée aux builds Capacitor natifs en local (`npm run build:android` / `build:ios`).

### Vérifier

```bash
gh variable list --repo carllaliberte/contract
bash scripts/print-ci-secrets-checklist.sh
```

## 2. Secrets (signing, Play, Firebase)

Les secrets **ne passent jamais** par `setup-github-ci-env.sh`. Utiliser les scripts dédiés ou l’UI GitHub.

| Secret | Workflow | Script d’aide |
|--------|----------|---------------|
| `ANDROID_KEYSTORE_*`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | `android-play-release.yml` | `scripts/apply-github-secrets.sh`, `scripts/prepare-play-github-secrets.sh` |
| `META_PLAY_CONFIG` | `android-play-release.yml` | `google-app/play-store/META_PLAY_CONFIG.example.json` |
| `FIREBASE_TOKEN` | `deploy-meta-dashboard.yml` (job Firebase) | Manuel — skip si absent |

Checklist complète :

```bash
bash scripts/print-ci-secrets-checklist.sh
```

## 3. Workflows et variables attendues

| Workflow | Variables | Secrets | Notes |
|----------|-----------|---------|-------|
| `deploy-creatorflow.yml` | `VITE_API_URL` | — | `VITE_BASE_PATH` / `VITE_ROUTER_BASENAME` forcés dans le YAML |
| `deploy-meta-dashboard.yml` | `VITE_*` META + `VITE_BASE_PATH` optionnel | `FIREBASE_TOKEN` (optionnel) | `deployment.json` écrase adresse + RPC |
| `android-play-release.yml` | — | signing + Play (+ legacy `VITE_WALLETCONNECT_PROJECT_ID` secret) | Préférer la **variable** WC |
| `api-ci.yml` | — | — | `MOCK_LLM` + `MEMORY_STORE` en dur |
| `ci-creatorflow.yml` | — | — | Aucun secret requis |

## 4. Fichiers locaux (ne pas commiter)

| Fichier | Rôle |
|---------|------|
| `creatorflow/.env` | `VITE_API_URL` local + source pour `setup-github-ci-env.sh` |
| `google-app/.env` | `VITE_CONTRACT_ADDRESS`, `VITE_RPC_URL`, `VITE_WALLETCONNECT_PROJECT_ID` |
| `api/.env` | Clés serveur (`OPENAI_API_KEY`, Supabase) — **jamais** en Actions vars |
| `google-app/play-store/secrets-a-remplir.env` | Brouillon Play (gitignored) |

Exemples versionnés : `creatorflow/.env.example`, `google-app/.env.example`, `api/.env.example`.

## 5. Migration `VITE_WALLETCONNECT_PROJECT_ID`

Historiquement parfois stocké en **secret** Actions. La valeur est publique (ID projet WalletConnect) :

1. Définir la **variable** via `setup-github-ci-env.sh` ou l’UI
2. Supprimer l’ancien **secret** du même nom si présent
3. Vérifier avec `print-ci-secrets-checklist.sh` (ligne `legacy`)

## 6. Rotation & hygiène

- Ne jamais coller de clés dans issues, PR ou commits
- Workflow `secret-hygiene.yml` : `scripts/check-no-secrets.sh` sur chaque push/PR
- Si un fichier local rempli a fuité : voir [SECRETS.md § Rotation](./SECRETS.md#rotation-si-secrets-a-remplirenv-a-été-rempli)

## Voir aussi

- [SECRETS.md](./SECRETS.md) — tableau complet public vs secret
- [GHA_ORCHESTRATION.md](./GHA_ORCHESTRATION.md) — enchaînement CI → deploy
- [GITHUB_PRO_SETUP.md](./GITHUB_PRO_SETUP.md) — checklist admin GitHub Pro
