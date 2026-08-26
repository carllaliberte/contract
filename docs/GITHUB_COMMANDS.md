# Commandes GitHub — CreatorFlow / contract

Aide-mémoire pour merger, déployer et dépanner sans surprises.

## Merge canonique sur `main`

Toujours **merge commit** (`--no-ff`), jamais de force-push sur `main`.

```bash
git fetch origin
git checkout main
git pull origin main
git merge --no-ff origin/<branche-feature>
git push origin main
```

Via GitHub CLI (équivalent) :

```bash
gh pr merge <numéro> --merge --delete-branch=false
```

Si `gh pr merge` refuse (permissions, checks bloquants), utiliser la séquence git ci-dessus.

## PR launch iOS — une seule branche

| PR | Branche | Action |
| --- | --- | --- |
| **#61** | `feat/app-store-1.0-launch` | **Merger** (canonique) |
| **#60** | `cursor/ios-app-store-launch-prep-2674` | **Fermer** (doublon) |

Ne pas ouvrir une 3ᵉ PR « launch ».

## Déploiement GitHub Pages

Après merge sur `main` :

```bash
gh workflow run deploy-creatorflow.yml --ref main
```

Vérifier :

```bash
curl -sI https://carllaliberte.github.io/contract/creatorflow/privacy.html
curl -sI https://carllaliberte.github.io/contract/creatorflow/
```

Les deux doivent répondre **HTTP 200**.

## Fiche iPhone ≠ conflit de merge

Une modification dans `creatorflow/ASC-LISTING.md` ou `creatorflow/STORE.md` (textes App Store Connect) **n’est pas** un conflit avec les changements CI/Pages sur une autre branche launch.

En cas de conflit git sur ces fichiers :

1. Garder la version la plus à jour des **textes légaux** (`privacy.html`, URLs, 1.0 gratuite, 4+, Productivité).
2. Garder la version la plus à jour des **workflows** (`deploy-creatorflow.yml`, `ci-creatorflow.yml`).
3. Résoudre manuellement, puis `git add` + continuer le merge.

## Archive iOS 1.0 (local, macOS + Xcode)

```bash
cd creatorflow
npm ci
npm run build:ios   # VITE_BASE_PATH=/ VITE_ROUTER_BASENAME=/ — jamais VITE_AUTH_STUB=true
npm run cap:open:ios
```

Dans Xcode : **Product → Archive** → App Store Connect.

Bundle ID : `com.carllaliberte.creatorflow`.
