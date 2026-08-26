# CI secrets & variables setup

Configurer **GitHub Actions** pour `carllaliberte/contract` sans jamais commiter de vraies clés.

Référence complète : [`SECRETS.md`](./SECRETS.md).

## Où configurer

**Settings → Secrets and variables → Actions**  
https://github.com/carllaliberte/contract/settings/secrets/actions

- **Variables** : `VITE_*` (publiques, injectées au build)
- **Secrets** : `META_PLAY_CONFIG`, `FIREBASE_TOKEN` (privés)

## Procédure (4 étapes)

### 1. Authentifier `gh`

```bash
gh auth login
gh auth status
```

Droits **admin** sur le dépôt requis pour `gh variable set` / `gh secret set`.

### 2. Vérifier l’état actuel

```bash
bash scripts/print-ci-secrets-checklist.sh
```

### 3. Pousser les variables `VITE_*`

Remplir localement `creatorflow/.env.local` et/ou `google-app/.env` (copier depuis les `.env.example`), puis :

```bash
bash scripts/setup-github-ci-env.sh
```

Le script pousse uniquement les valeurs **non vides** :

| Variable | Source typique |
|----------|----------------|
| `VITE_API_URL` | `creatorflow/.env.local` |
| `VITE_SUPABASE_URL` | `creatorflow/.env.local` |
| `VITE_SUPABASE_ANON_KEY` | `creatorflow/.env.local` |
| `VITE_WALLETCONNECT_PROJECT_ID` | `google-app/.env` |
| `VITE_CONTRACT_ADDRESS` | `google-app/.env` ou `google-app/deployment.json` |
| `VITE_RPC_URL` | `google-app/.env` ou `google-app/deployment.json` |

Le script **ne touche pas** à `VITE_BASE_PATH` ni `VITE_ROUTER_BASENAME`.

Simulation : `bash scripts/setup-github-ci-env.sh --dry-run`

### 4. Secret Play (optionnel)

Uniquement si vous voulez l’upload Google Play en CI :

```bash
bash scripts/print-meta-play-config.sh   # génère le JSON localement
gh secret set META_PLAY_CONFIG --repo carllaliberte/contract   # coller le JSON
```

Schéma : `google-app/play-store/META_PLAY_CONFIG.example.json`

Alternative legacy : `bash scripts/apply-github-secrets.sh` (keystore + JSON compte de service).

## Règles importantes

| À faire | À ne pas faire |
|---------|----------------|
| `VITE_*` en **Variables** | `OPENAI_API_KEY` dans GitHub Actions |
| `META_PLAY_CONFIG` en **Secret** | `VITE_BASE_PATH=/` (casse GitHub Pages) |
| Clés serveur sur Supabase / hébergeur API | Commiter `.env`, `*.keystore`, `play-upload-key.json` |

Les workflows **Deploy CreatorFlow** et **Deploy META** fixent déjà les chemins Pages (`/contract/creatorflow/` et `/contract/`). La valeur `/` est réservée aux builds Capacitor natifs en local.

## Workflows après configuration

| Workflow | Variables | Secrets | Notes |
|----------|-----------|---------|-------|
| Secret scan / CI CreatorFlow / API CI | — | — | Aucune config requise |
| Deploy CreatorFlow | `VITE_API_URL` (optionnel) | — | `VITE_BASE_PATH` forcé dans le YAML |
| Deploy META dashboard | `VITE_*` META (optionnel) | `FIREBASE_TOKEN` (optionnel) | `deployment.json` écrase adresse + RPC |
| Build Android release | — | `META_PLAY_CONFIG` (optionnel) | Upload skip si absent |

## Fichiers locaux (ne pas commiter)

| Fichier | Rôle |
|---------|------|
| `creatorflow/.env` / `.env.local` | `VITE_API_URL` local + source pour `setup-github-ci-env.sh` |
| `google-app/.env` / `.env.local` | `VITE_CONTRACT_ADDRESS`, `VITE_RPC_URL`, `VITE_WALLETCONNECT_PROJECT_ID` |
| `api/.env` | Clés serveur (`OPENAI_API_KEY`, Supabase) — **jamais** en Actions vars |
| `google-app/play-store/secrets-a-remplir.env` | Brouillon Play (gitignored) |

Exemples versionnés : `creatorflow/.env.example`, `google-app/.env.example`, `api/.env.example`.

## Migration `VITE_WALLETCONNECT_PROJECT_ID`

Historiquement parfois stocké en **secret** Actions. La valeur est publique (ID projet WalletConnect) :

1. Définir la **variable** via `setup-github-ci-env.sh` ou l’UI
2. Supprimer l’ancien **secret** du même nom si présent
3. Vérifier avec `print-ci-secrets-checklist.sh`

## Rotation & hygiène

- Ne jamais coller de clés dans issues, PR ou commits
- Workflow `secret-hygiene.yml` : `scripts/check-no-secrets.sh` sur chaque push/PR
- Si un fichier local rempli a fuité : voir [SECRETS.md § Rotation](./SECRETS.md#rotation-si-secrets-a-remplirenv-a-été-rempli)

## Voir aussi

- [`SECRETS.md`](./SECRETS.md) — tableau public vs secret
- [`GHA_ORCHESTRATION.md`](./GHA_ORCHESTRATION.md) — CI → deploy CreatorFlow
- [`GITHUB_PRO_SETUP.md`](./GITHUB_PRO_SETUP.md) — protection de branche, push protection
