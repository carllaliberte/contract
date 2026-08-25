# TruffleHog — scan de secrets en CI (mode strict)

[TruffleHog](https://github.com/trufflesecurity/trufflehog) détecte et **vérifie** les credentials exposés dans l’historique git. Il complète le check léger [`secret-hygiene.yml`](../.github/workflows/secret-hygiene.yml).

Workflow : **`.github/workflows/secret-scan.yml`**

## Déclencheurs

| Événement | Comportement |
|-----------|--------------|
| `push` sur `main` | Scan des commits poussés |
| `pull_request` | Scan du diff PR (commits de la branche) |
| `workflow_dispatch` | Scan **complet** de la branche sélectionnée (`base: ""`, `head: ref`) |

## Configuration (strict)

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

- uses: trufflesecurity/trufflehog@main
  with:
    extra_args: --results=verified,unknown --fail --exclude-paths=.trufflehog-exclude
```

| Flag / fichier | Effet |
|----------------|--------|
| `--results=verified,unknown` | Remonte les secrets **vérifiés actifs** et ceux **non vérifiables** (inconnu) — plus strict que `--only-verified` |
| `--fail` | Exit code 183 si un résultat correspond → **échec du job** (ne pas retirer) |
| `.trufflehog-exclude` | Regex de chemins exclus (lockfiles, `node_modules`, assets binaires, exemples) |

## Fichier `.trufflehog-exclude`

Une regex par ligne. Exemples inclus :

- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `node_modules/`, `dist/`, `build/`
- `*.svg`, images, polices
- `META_PLAY_CONFIG.example.json`, `secrets-a-remplir.env.example`

**Ne pas** y ajouter des chemins `src/` ou workflows pour masquer une fuite réelle.

## Placeholders doc / exemples

Les fichiers versionnés ne doivent **pas** contenir de motifs détectables :

| À éviter | Préférer |
|----------|----------|
| `sk-...` ou `sk-abc123…` | `<your-openai-api-key>` |
| `-----BEGIN PRIVATE KEY-----` | `<PEM from service account JSON — never commit>` |

Fichiers concernés : `api/.env.example`, `supabase/functions/generate-script/README.md`, `META_PLAY_CONFIG.example.json`.

## Exécution manuelle

1. **Actions → Secret scan (TruffleHog) → Run workflow**
2. Choisir la branche (souvent `main`)
3. En cas d’échec : rotation des credentials (voir [SECRETS.md](./SECRETS.md))

## Relation avec les autres contrôles

| Outil | Portée | Mode |
|-------|--------|------|
| `scripts/check-no-secrets.sh` | Fichiers trackés, regex simples | Patterns `sk-` / PEM |
| TruffleHog | Historique git / diff | `verified` + `unknown`, `--fail` |
| `secret-hygiene.yml` | Wrapper du script shell | CI rapide |

## En cas d’alerte

1. **Ne pas merger** tant que le scan est rouge.
2. Lire le détecteur et le chemin dans les logs TruffleHog.
3. **Révoquer et régénérer** le secret (OpenAI, Play, keystore, etc.).
4. Purger l’historique git si commit public (`git filter-repo` ou support GitHub).
5. Relancer `workflow_dispatch` sur `main` pour audit complet.

## Références

- [TruffleHog GitHub Action](https://github.com/trufflesecurity/trufflehog#octocat-trufflehog-github-action)
- [SECRETS.md](./SECRETS.md) — inventaire public vs secret, rotation Play
- [GHA_ORCHESTRATION.md](./GHA_ORCHESTRATION.md) — pipelines CreatorFlow
