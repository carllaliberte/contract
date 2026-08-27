# Secrets & variables — carllaliberte/contract

Référence unique pour ce qui est **public au build** (variables `VITE_*`), ce qui reste **secret** (clés serveur, signing, Play), et comment les brancher en local vs GitHub Actions — **sans jamais commiter de clés**.

Configuration GitHub : **Settings → Secrets and variables → Actions**.

## Fichiers ignorés (ne pas commiter)

Le `.gitignore` racine couvre déjà :

| Pattern | Usage |
|---------|--------|
| `.env` | Fichiers d’environnement locaux (tout sous-répertoire) |
| `.env.local` | Overrides locaux (ex. `creatorflow/.env.local`) |
| `*.jks`, `**/*.jks` | Keystores Android (signing), tous niveaux |
| `local.properties` | Chemins SDK Android locaux |
| `**/keystore.properties` | Config signing Android locale |
| `*.keystore` | Keystores Android (alias) |
| `google-app/play-store/secrets-a-remplir.env` | Brouillon local Play (rempli à la main) |
| `google-app/.env`, `google-app/.env.production` | Env META dashboard |

Exemples versionnés : `creatorflow/.env.example`, `google-app/.env.example`, `api/.env.example`, `google-app/play-store/secrets-a-remplir.env.example`.

## Public vs secret

Les variables **`VITE_*`** sont injectées **au build** Vite et finissent dans le bundle client : elles sont **publiques par nature**. Les utiliser comme **variables** GitHub (`vars`), pas comme secrets.

| Domaine | Nom | Type | Où le définir | Obligatoire |
|---------|-----|------|---------------|-------------|
| **CreatorFlow** | `VITE_API_URL` | Public (var) | `creatorflow/.env`, Actions **var** `VITE_API_URL` | Non — vide = démo / chemin relatif |
| **CreatorFlow** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Public (var) | `creatorflow/.env.local`, Actions **vars** | Non — vide = ideas en localStorage seulement |
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

- `VITE_BASE_PATH` et `VITE_ROUTER_BASENAME` sont **forcés** à `/contract/creatorflow/` dans le workflow (Pages).
- `VITE_API_URL` — variable **recommandée** (Settings → Variables) : URL complète de la Edge Function Supabase, ex.  
  `https://TON-PROJET.supabase.co/functions/v1/generate-script`
- `VITE_AUTH_APPLE_URL` — optionnel : `https://TON-PROJET.supabase.co/functions/v1/auth-apple`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — client Supabase (persistance des idées authentifiées)

Si `VITE_API_URL` n’est pas définie, le build utilise le comportement démo.

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

Workflow : `.github/workflows/android-play-release.yml`

- Ne jamais commiter `*.jks`, `**/*.jks`, `*.keystore`, `local.properties`, `**/keystore.properties`, ni JSON compte de service Play.
- Brouillon local : copier `google-app/play-store/secrets-a-remplir.env.example` → `secrets-a-remplir.env` (gitignored), puis coller les valeurs dans GitHub Secrets via `SECRETS-GITHUB-COPIER.txt`.
- Scripts d’aide : `scripts/prepare-play-github-secrets.sh`, `google-app/play-store/META_PLAY_CONFIG.example.json`.

### Rotation si `secrets-a-remplir.env` a été rempli

Si ce fichier a un jour contenu de **vrais** mots de passe ou clés (même en local, même brièvement) :

1. **Considérer les valeurs compromises** si le fichier a été copié ailleurs, partagé, ou commité par erreur.
2. **Rotation immédiate** :
   - Régénérer ou remplacer le keystore Android (`scripts/generate-android-keystore.sh`) et mettre à jour les secrets `ANDROID_KEYSTORE_*` sur GitHub.
   - Révoquer et recréer la clé du compte de service Google Play ; mettre à jour `META_PLAY_CONFIG` ou `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
3. **Vérifier l’historique git** : `git log -- google-app/play-store/secrets-a-remplir.env` — si un commit a exposé le fichier, rotation obligatoire + purge d’historique si le dépôt est public.
4. Supprimer la copie locale remplie ; ne garder que le `.example` versionné.

## CI anti-fuite (optionnel)

Workflow : `.github/workflows/secret-hygiene.yml` — exécute `scripts/check-no-secrets.sh` sur chaque push/PR :

- Recherche `sk-` (clés OpenAI) et `BEGIN PRIVATE KEY` dans les fichiers suivis
- Exclut les `.example`, `.md`, `META_PLAY_CONFIG.example.json`, `package-lock.json`
- Échoue si `secrets-a-remplir.env` est encore tracké par git

Les workflows Play écrivent les secrets dans `GITHUB_ENV` via heredoc (`<<EOF`) et **n’affichent jamais** les mots de passe dans les logs (messages « values not logged » uniquement).

## Règles

1. **Aucune clé dans `src/`**, `index.html`, ou assets publics.
2. **Client** : seulement des `VITE_*` (publiques) — voir `creatorflow/.env.example`, `google-app/.env.example`.
3. **Serveur** (API, Supabase Edge) : `OPENAI_API_KEY`, service role, JWT — secrets hébergeur / Supabase.
4. **Local** : copier les `.env.example` → `.env` ou `.env.local` ; ne jamais `git add` ces fichiers.
5. **CI CreatorFlow** (web/android/ios) : pas de secrets requis ; le déploiement injecte les `vars` au build SEO.

## Configuration rapide (gh CLI)

Scripts et procédure pas-à-pas : [`CI_SECRETS_SETUP.md`](./CI_SECRETS_SETUP.md)

```bash
bash scripts/print-ci-secrets-checklist.sh   # audit Variables vs Secrets
bash scripts/setup-github-ci-env.sh          # pousse les VITE_* non vides
```

- **Variables** (`gh variable set`) : `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WALLETCONNECT_PROJECT_ID`, `VITE_CONTRACT_ADDRESS`, `VITE_RPC_URL`
- **Secrets** (`gh secret set`) : `META_PLAY_CONFIG` (Play), `FIREBASE_TOKEN` (optionnel)
- Ne pas ajouter `OPENAI_API_KEY` ni `VITE_BASE_PATH=/` dans GitHub Actions (voir checklist)

## Voir aussi

- [CI_SECRETS_SETUP.md](./CI_SECRETS_SETUP.md) — `gh auth login` + configuration Actions
- [GHA_ORCHESTRATION.md](./GHA_ORCHESTRATION.md) — enchaînement CI → deploy CreatorFlow
- `creatorflow/README.md` — API scripts IA côté client
- `api/README.md` — variables serveur API
- `google-app/play-store/LISTING.md` — publication Play Store
