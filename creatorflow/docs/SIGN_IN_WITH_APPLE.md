# Sign in with Apple — CreatorFlow

Guide de configuration pour **CreatorFlow** (`com.carllaliberte.creatorflow`).  
Version **1.0 gratuite** — pas d’IAP. **Hide My Email** doit fonctionner (e-mail relay ou absent côté client).

Ce document décrit ce que **Carl configure dans Apple Developer / Supabase / Fly.io**. L’agent ne simule pas ces portails : suivez les étapes manuellement.

## Identifiants (référence)

| Rôle | Identifiant |
| --- | --- |
| Bundle ID iOS (App ID) | `com.carllaliberte.creatorflow` |
| Services ID (web / redirect) | `com.carllaliberte.creatorflow.web` |
| Return URL (GitHub Pages) | `https://carllaliberte.github.io/contract/creatorflow/auth/apple` |
| Domaine web | `carllaliberte.github.io` |
| Privacy Policy | `https://carllaliberte.github.io/contract/creatorflow/privacy.html` |
| App publique | `https://carllaliberte.github.io/contract/creatorflow/` |

## Déjà en place dans le repo

- Entitlement natif : `creatorflow/ios/App/App/App.entitlements` → `com.apple.developer.applesignin = Default`
- Plugin Capacitor : `@capacitor-community/apple-sign-in`
- Session client : `creatorflow/src/lib/auth/session.ts`, `useAuth`, `useAppleSignIn`
- Bouton iOS : `AppleSignInButton` (natif uniquement — pas de redesign web)
- Callback SPA : route `/auth/apple` → `AppleAuthCallbackPage.tsx`
- API d’échange : `POST /auth/apple` (`api/src/routes/auth.ts`)
- **Interdit** au build App Store : `VITE_AUTH_STUB=true` (bloqué par `scripts/validate-ios-build.mjs`)

## 1. Apple Developer — App ID (natif iOS)

1. [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles** → **Identifiers**.
2. Ouvrir l’App ID **explicite** `com.carllaliberte.creatorflow` (ou le créer : App → Continue).
3. Cocher **Sign in with Apple** → **Edit** → rôle **Enable as a primary App ID** → Save.
4. Enregistrer.

L’entitlement Xcode est déjà dans le repo ; après toute modif côté portail, refaire `npm run build:ios` + sync si besoin.

## 2. Apple Developer — Services ID (redirect web)

Requis pour la **Return URL** enregistrée auprès d’Apple (utilisée par le plugin natif et pour un flux web futur).

1. **Identifiers** → **+** → **Services IDs** → Continue.
2. **Description** : `CreatorFlow Web` (libre).
3. **Identifier** : `com.carllaliberte.creatorflow.web`
4. Cocher **Sign in with Apple** → **Configure** :
   - **Primary App ID** : `com.carllaliberte.creatorflow`
   - **Domains and Subdomains** : `carllaliberte.github.io`
   - **Return URLs** :
     ```
     https://carllaliberte.github.io/contract/creatorflow/auth/apple
     ```
5. Save → Continue → Register.

## 3. Apple Developer — Key (.p8)

**Ne jamais committer** le fichier `.p8` ni le coller dans le client Vite.

1. **Keys** → **+** → nom ex. `CreatorFlow Sign in with Apple`.
2. Cocher **Sign in with Apple** → **Configure** → Primary App ID `com.carllaliberte.creatorflow` → Save.
3. **Register** → **Download** le fichier `.p8` (une seule fois).
4. Noter :
   - **Key ID** (10 caractères)
   - **Team ID** (Membership → Team ID)

Conserver le `.p8` dans un gestionnaire de mots de passe ou coffre local — **pas dans git**.

## 4. Supabase — Auth provider Apple

1. Supabase Dashboard → **Authentication** → **Providers** → **Apple**.
2. Activer Apple.
3. **Client IDs** (séparés par virgule si plusieurs) :
   ```
   com.carllaliberte.creatorflow,com.carllaliberte.creatorflow.web
   ```
4. **Secret Key** : générer le client secret JWT à partir du `.p8` (outil Supabase ou script officiel Apple). Coller le secret dans Supabase — **pas dans le repo**.
5. **Team ID** et **Key ID** : valeurs du portail Apple.
6. Sauvegarder.

L’API appelle `supabase.auth.signInWithIdToken({ provider: "apple", token })` après vérification JWKS côté Hono.

## 5. API Hono (Fly.io ou autre)

### Variables d’environnement (serveur uniquement)

| Variable | Exemple / note |
| --- | --- |
| `SUPABASE_URL` | URL projet Supabase |
| `SUPABASE_ANON_KEY` | Clé anon (validation JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — upsert `profiles` |
| `APPLE_CLIENT_IDS` | `com.carllaliberte.creatorflow,com.carllaliberte.creatorflow.web` |
| `CORS_ORIGINS` | Inclure `https://carllaliberte.github.io`, `https://localhost`, `capacitor://localhost` |

**Ne pas** définir `APPLE_AUTH_STUB=true` ni `MEMORY_STORE=true` en production.

### Déploiement Fly.io (exemple)

```bash
cd api
fly apps create creatorflow-api   # une fois
fly secrets set \
  SUPABASE_URL=... \
  SUPABASE_ANON_KEY=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  OPENAI_API_KEY=... \
  CORS_ORIGINS=https://carllaliberte.github.io,https://localhost,capacitor://localhost \
  APPLE_CLIENT_IDS=com.carllaliberte.creatorflow,com.carllaliberte.creatorflow.web
fly deploy
```

Health : `GET https://creatorflow-api.fly.dev/health` → `appleAuthStub: false` en prod.

Endpoint : `POST https://creatorflow-api.fly.dev/auth/apple`

## 6. Build client CreatorFlow

### GitHub Pages (web)

Variable Actions **`VITE_API_URL`** = origine API sans slash final :

```
VITE_API_URL=https://creatorflow-api.fly.dev
```

Le workflow `deploy-creatorflow.yml` l’injecte au build. Sans cette variable, le web reste en mode démo pour l’auth.

### iOS App Store (natif)

```bash
cd creatorflow
# .env.local (non commité) pour archive :
# VITE_API_URL=https://creatorflow-api.fly.dev
npm run build:ios
```

Règles :

- **Jamais** `VITE_AUTH_STUB=true` pour `build:ios`.
- `VITE_BASE_PATH=/` et `VITE_ROUTER_BASENAME=/` sont imposés par `build:ios`.
- Le client natif envoie `identityToken` à `${VITE_API_URL}/auth/apple` ; sans API configurée, la connexion échoue (comportement voulu en prod).

Constantes côté client (`useAppleSignIn.ts`) — **public**, pas des secrets :

- `clientId` natif : `com.carllaliberte.creatorflow`
- `redirectURI` : `https://carllaliberte.github.io/contract/creatorflow/auth/apple`

## 7. Hide My Email

- L’utilisateur peut choisir **Hide My Email** dans la feuille Apple.
- Apple peut ne renvoyer **ni e-mail ni nom** après la première connexion.
- L’app affiche « E-mail masqué par Apple » (`settings.appleEmailHidden`) si l’e-mail est absent.
- Le `sub` Apple (identifiant stable) est stocké en Keychain (`cf-apple-user`) — pas l’e-mail relay en dur.

## 8. App Store Connect / Review

Notes pour App Review (voir aussi `STORE.md`) :

```
Demo: bouton « Explorer sans compte ».
Sign in with Apple : Hide My Email accepté.
Aucun achat in-app dans la version 1.0.
Pas de compte test requis.
```

Checklist :

- [ ] App ID + Services ID + Key configurés (sections 1–3)
- [ ] Supabase Apple provider actif (section 4)
- [ ] API prod sans stub, `POST /auth/apple` OK (section 5)
- [ ] `VITE_API_URL` défini pour build iOS archive (section 6)
- [ ] Privacy URL live : https://carllaliberte.github.io/contract/creatorflow/privacy.html
- [ ] Test sur appareil réel : connexion Apple → Réglages affiche compte (e-mail masqué OK)

## Fichiers code (référence)

| Fichier | Rôle |
| --- | --- |
| `creatorflow/src/hooks/useAppleSignIn.ts` | Flux natif iOS |
| `creatorflow/src/lib/api/auth.ts` | Échange client → API |
| `creatorflow/src/pages/AppleAuthCallbackPage.tsx` | Return URL GitHub Pages |
| `api/src/routes/auth.ts` | Validation JWT + session Supabase |
| `api/src/services/appleAuth.ts` | JWKS Apple (`jose`) |
| `creatorflow/ios/App/App/App.entitlements` | Capability Sign in with Apple |

## Secrets — ne pas committer

| Secret | Où le mettre |
| --- | --- |
| Fichier `.p8` | Coffre local / 1Password — **jamais git** |
| Team ID, Key ID | Supabase + notes privées — pas dans le bundle client |
| `SUPABASE_SERVICE_ROLE_KEY` | Fly secrets / hébergeur |
| `VITE_AUTH_STUB=true` | Dev web uniquement — **interdit** build iOS |

Voir aussi `creatorflow/SECURITY.md`, `docs/SECRETS.md`, `creatorflow/.env.example`, `api/.env.example`.
