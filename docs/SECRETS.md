# Secrets & variables — carllaliberte/contract

Référence unique pour ce qui est **public au build** (variables `VITE_*`), ce qui reste **secret** (clés serveur, signing, Play), et comment les brancher en local vs GitHub Actions — **sans jamais commiter de clés**.

Configuration GitHub : **Settings → Secrets and variables → Actions**.

## Fichiers ignorés (ne pas commiter)

Le `.gitignore` racine couvre déjà :

| Pattern | Usage |
|---------|--------|
| `.env` | Fichiers d’environnement locaux (tout sous-répertoire) |
| `.env.local` | Overrides locaux (ex. `creatorflow/.env.local`) |
| `*.jks` | Keystores Android (signing) |
| `local.properties` | Chemins SDK Android locaux |
| `*.keystore` | Keystores Android (alias) |
| `google-app/.env`, `google-app/.env.production` | Env META dashboard |

Exemples versionnés : `creatorflow/.env.example`, `google-app/.env.example`, `api/.env.example`.

## Public vs secret

Les variables **`VITE_*`** sont injectées **au build** Vite et finissent dans le bundle client : elles sont **publiques par nature**. Les utiliser comme **variables** GitHub (`vars`), pas comme secrets.

| Domaine | Nom | Type | Où le définir | Obligatoire |
|---------|-----|------|---------------|-------------|
| **CreatorFlow** | `VITE_API_URL` | Public (var) | `creatorflow/.env`, Actions **var** `VITE_API_URL` | Non — vide = démo / chemin relatif |
| **CreatorFlow** | `VITE_BASE_PATH` | Public (var) | Local ou Actions **var** | Non — défaut `/contract/creatorflow/` |
| **CreatorFlow** | `VITE_ROUTER_BASENAME` | Public (var) | Local ou Actions **var** | Non — défaut aligné GitHub Pages |
| **CreatorFlow** | `OPENAI_API_KEY` | **Secret** | Supabase Edge / API serveur uniquement | Non côté client |
| **CreatorFlow** | Clés Supabase service role | **Secret** | Supabase Dashboard / `supabase secrets set` | Côté serveur seulement |
| **META** (`google-app`) | `VITE_CONTRACT_ADDRESS` | Public (var) | `google-app/.env`, Actions **var**, ou `deployment.json` | Non — défaut dans `config.ts` |
| **META** | `VITE_RPC_URL` | Public (var) | Idem | Non — RPC public par défaut |
| **META** | `VITE_WALLETCONNECT_PROJECT_ID` | Public (var) | Idem — [WalletConnect Cloud](https://cloud.walletconnect.com) | Non — WC désactivé si absent |
| **META** | `VITE_BASE_PATH` | Public (var) | Actions **var** (défaut workflow `/contract/`) | Non |
| **META** | `FIREBASE_TOKEN` | **Secret** | Actions **secret** | Non — skip Firebase si absent |
| **API** (`api/`) | `OPENAI_API_KEY` | **Secret** | Hébergeur / `.env` local | Non en CI (`MOCK_LLM`) |
| **API** | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Public / config | `.env` local, hébergeur | Non en CI |
| **API** | `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Hébergeur uniquement | Non en CI (`MEMORY_STORE`) |
| **API** | `MOCK_LLM`, `MEMORY_STORE` | Flags CI/dev | `api-ci.yml`, `.env` local | CI : toujours `true` |
| **API** | `CORS_ORIGINS`, `MONTHLY_AI_LIMIT*` | Config | `.env` / hébergeur | Non |
| **Play** (Android META) | `META_PLAY_CONFIG` | **Secret** (JSON) | Actions **secret** | Non — upload skip sinon |
| **Play** | `ANDROID_KEYSTORE_*`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | **Secret** | Actions **secrets** ou WIF | Non — build unsigned / skip upload |
| **Play** | WIF (`google-app/play-store/github-wif.json`) | Config repo (non secret) | Fichier versionné sans placeholders | Option upload sans JSON |
| **Tous** | `GITHUB_TOKEN` | Automatique | Fourni par Actions | Oui pour gh-pages |

## GitHub Actions — variables `VITE_*` au build

### Deploy CreatorFlow

Workflow : `.github/workflows/deploy-creatorflow.yml`

Variables optionnelles (Settings → Variables) :

- `VITE_API_URL` — endpoint scripts IA en production
- `VITE_BASE_PATH`, `VITE_ROUTER_BASENAME` — override rare (Pages utilise les défauts)

Si une variable n’est pas définie, le build utilise les défauts Vite / le comportement démo.

### Deploy META dashboard

Workflow : `.github/workflows/deploy-meta-dashboard.yml`

Variables optionnelles :

- `VITE_BASE_PATH` (défaut workflow : `/contract/`)
- `VITE_WALLETCONNECT_PROJECT_ID`
- `VITE_CONTRACT_ADDRESS`, `VITE_RPC_URL`

Priorité à l’exécution : si `deployment.json` est présent à la racine du repo, il **écrase** `VITE_CONTRACT_ADDRESS` et `VITE_RPC_URL` pour ce build.

> **Migration** : `VITE_WALLETCONNECT_PROJECT_ID` était parfois stocké en **secret** Actions ; préférer une **variable** (valeur publique WC). Ne pas recréer de secret pour les `VITE_*`.

## API CI — sans secret obligatoire

Workflow : `.github/workflows/api-ci.yml`

Les tests tournent avec :

```yaml
MEMORY_STORE: "true"
MOCK_LLM: "true"
```

Aucune clé OpenAI ni Supabase n’est requise en CI. Le build et les tests doivent passer sans secrets repository.

## Play / Android — secrets uniquement

Workflow : `.github/workflows/android-play-release.yml` (inchangé par ce doc)

- Ne jamais commiter `*.jks`, `*.keystore`, `local.properties`, ni JSON compte de service Play.
- Scripts d’aide : `scripts/prepare-play-github-secrets.sh`, `google-app/play-store/META_PLAY_CONFIG.example.json`.

## Règles

1. **Aucune clé dans `src/`**, `index.html`, ou assets publics.
2. **Client** : seulement des `VITE_*` (publiques) — voir `creatorflow/.env.example`, `google-app/.env.example`.
3. **Serveur** (API, Supabase Edge) : `OPENAI_API_KEY`, service role, JWT — secrets hébergeur / Supabase.
4. **Local** : copier les `.env.example` → `.env` ou `.env.local` ; ne jamais `git add` ces fichiers.
5. **CI CreatorFlow** (web/android/ios) : pas de secrets requis ; le déploiement injecte les `vars` au build SEO.

## Voir aussi

- [GHA_ORCHESTRATION.md](./GHA_ORCHESTRATION.md) — enchaînement CI → deploy CreatorFlow
- `creatorflow/README.md` — API scripts IA côté client
- `api/README.md` — variables serveur API
- `google-app/play-store/LISTING.md` — publication Play Store
