# CreatorFlow

Application web pour créateurs de contenu — pipeline Idée → Script → Production → Prêt → Publié.

## Démarrage

```bash
cd creatorflow
npm install
cp .env.example .env
# Optionnel : définir VITE_API_URL (voir « Secrets & API »)
npm run dev
```

Ouvrir http://localhost:5173

## Secrets & API

Le client CreatorFlow **ne contient aucune clé LLM**. Seule la variable publique `VITE_API_URL` configure l’endpoint HTTP des scripts IA.

| Où | Quoi |
| --- | --- |
| **Client** (`creatorflow/.env`) | `VITE_API_URL` uniquement — URL de l’API ou de la Supabase Edge Function `generate-script` |
| **Serveur** (Supabase Edge) | `OPENAI_API_KEY`, clés Supabase **service role** / JWT — via `supabase secrets set`, jamais dans le repo |

1. Copier `creatorflow/.env.example` → `creatorflow/.env` (ou `.env.local`).
2. Ne commiter **ni** `.env` **ni** `.env.local` (déjà listés dans `.gitignore`).
3. Déployer la fonction Edge `generate-script` et définir les secrets côté Supabase Dashboard ou CLI.
4. En production GitHub Pages, passer `VITE_API_URL` au build CI si l’API n’est pas sur la même origine.

Les clés OpenAI et autres secrets LLM restent **uniquement** sur le serveur (Supabase Edge Functions). Aucune clé API ne doit apparaître dans `src/`, `index.html` ou les assets publics.

## Fonctionnalités

- Landing page professionnelle avec vidéo de démo, galerie photo et exemples
- Mode démo sans compte (`Explorer sans compte`)
- Tableau de bord, pipeline kanban, contenus vidéo et paramètres
- Interface bilingue FR / EN

## Build

```bash
npm run build
npm run preview
```

Build SEO (prerender landing pour GitHub Pages) :

```bash
npm run build:seo
```

Builds mobiles (iOS / Android) : voir [README-MOBILE.md](./README-MOBILE.md).  
**App Store (Option B — IAP Pro)** : [docs/APP_STORE_CONNECT.md](./docs/APP_STORE_CONNECT.md)
