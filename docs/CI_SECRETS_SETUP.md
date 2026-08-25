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
| `VITE_WALLETCONNECT_PROJECT_ID` | `google-app/.env` |
| `VITE_CONTRACT_ADDRESS` | `google-app/.env` ou `deployment.json` |
| `VITE_RPC_URL` | `google-app/.env` ou `deployment.json` |

Simulation : `bash scripts/setup-github-ci-env.sh --dry-run`

### 4. Secret Play (optionnel)

Uniquement si vous voulez l’upload Google Play en CI :

```bash
bash scripts/print-meta-play-config.sh   # génère le JSON localement
gh secret set META_PLAY_CONFIG --repo carllaliberte/contract   # coller le JSON
```

Schéma : `google-app/play-store/META_PLAY_CONFIG.example.json`

## Règles importantes

| À faire | À ne pas faire |
|---------|----------------|
| `VITE_*` en **Variables** | `OPENAI_API_KEY` dans GitHub Actions |
| `META_PLAY_CONFIG` en **Secret** | `VITE_BASE_PATH=/` (casse GitHub Pages) |
| Clés serveur sur Supabase / hébergeur API | Commiter `.env`, `*.keystore`, `play-upload-key.json` |

Les workflows **Deploy CreatorFlow** et **Deploy META** fixent déjà les chemins Pages (`/contract/creatorflow/` et `/contract/`).

## Workflows après configuration

| Workflow | Config requise |
|----------|----------------|
| Secret scan / CI CreatorFlow / API CI | Aucune |
| Deploy CreatorFlow | Optionnel `VITE_API_URL` |
| Deploy META dashboard | Optionnel `VITE_*` |
| Build Android release | `META_PLAY_CONFIG` pour upload Play |

## Voir aussi

- [`SECRETS.md`](./SECRETS.md) — tableau public vs secret
- [`GHA_ORCHESTRATION.md`](./GHA_ORCHESTRATION.md) — CI → deploy CreatorFlow
- [`GITHUB_PRO_SETUP.md`](./GITHUB_PRO_SETUP.md) — protection de branche, push protection
