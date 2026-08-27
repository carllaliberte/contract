# Commandes GitHub — CreatorFlow

Aide-mémoire pour merger et déployer **un seul produit**.

Règle : [`docs/PRODUCT_LANE.md`](PRODUCT_LANE.md).

## Merge canonique sur `main`

Toujours **merge commit** (`--no-ff`), jamais de force-push sur `main`.

```bash
git fetch origin
git checkout main
git pull origin main
git merge --no-ff origin/<branche-feature>
git push origin main
```

Via GitHub CLI :

```bash
gh pr merge <numéro> --merge --delete-branch=false
```

## Interdit dans cette lane

- Merger `#74` (Quantum / AgentBus) ou `#75` (pack dump / iOS tag)
- Merger Dependabot avec une PR produit
- Rouvrir le dashboard META comme face publique
- Ouvrir une 2ᵉ ou 3ᵉ PR « launch » en parallèle

## Déploiement GitHub Pages

Après merge sur `main` :

```bash
gh workflow run deploy-creatorflow.yml --ref main
```

Vérifier :

```bash
curl -sI https://carllaliberte.github.io/contract/
curl -sI https://carllaliberte.github.io/contract/creatorflow/
curl -sI https://carllaliberte.github.io/contract/creatorflow/privacy.html
```

- `/contract/` doit **rediriger** vers `/contract/creatorflow/`
- `/contract/creatorflow/` et `privacy.html` doivent répondre **HTTP 200**

Le workflow `deploy-meta-dashboard.yml` est manuel uniquement. S’il tourne, il publie sous `/contract/meta/` — jamais à la racine.

## Archive iOS 1.0 (local, macOS + Xcode)

```bash
cd creatorflow
npm ci
npm run build:ios   # VITE_BASE_PATH=/ VITE_ROUTER_BASENAME=/ — jamais VITE_AUTH_STUB=true
npm run cap:open:ios
```

Dans Xcode : **Product → Archive** → App Store Connect.

Bundle ID : `com.carllaliberte.creatorflow`.
