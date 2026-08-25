# TruffleHog — scan de secrets en CI

[TruffleHog](https://github.com/trufflesecurity/trufflehog) détecte et **vérifie** les credentials exposés dans l’historique git. Il complète le check léger [`secret-hygiene.yml`](../.github/workflows/secret-hygiene.yml) (`sk-` / `BEGIN PRIVATE KEY`).

Workflow : **`.github/workflows/secret-scan.yml`**

## Déclencheurs

| Événement | Comportement |
|-----------|--------------|
| `push` sur `main` | Scan des commits poussés |
| `pull_request` | Scan du diff PR (commits de la branche) |
| `workflow_dispatch` | Scan **complet** de la branche sélectionnée (`base: ""`, `head: ref`) |

## Configuration

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0          # historique complet requis

- uses: trufflesecurity/trufflehog@main
  with:
    extra_args: --only-verified --fail
```

| Flag | Effet |
|------|--------|
| `--only-verified` | Ne remonte que les secrets **confirmés actifs** (moins de faux positifs) |
| `--fail` | Exit code 183 si un secret vérifié est trouvé → **échec du job** |

## Exécution manuelle

1. **Actions → Secret scan (TruffleHog) → Run workflow**
2. Choisir la branche (souvent `main`)
3. Consulter les logs ; en cas d’échec, rotation des credentials exposés (voir [SECRETS.md](./SECRETS.md))

## Relation avec les autres contrôles

| Outil | Portée | Vérification live |
|-------|--------|-------------------|
| `scripts/check-no-secrets.sh` | Fichiers trackés, patterns simples | Non |
| TruffleHog | Historique git / diff | Oui (`--only-verified`) |
| `secret-hygiene.yml` | Wrapper du script shell | Non |

Les placeholders versionnés (`*.env.example`, `META_PLAY_CONFIG.example.json`, `sk-...` dans la doc) ne doivent pas déclencher TruffleHog en mode `--only-verified`.

## En cas d’alerte

1. **Ne pas merger** tant que le scan est rouge.
2. Identifier le commit / fichier dans les logs TruffleHog.
3. **Révoquer et régénérer** le secret (OpenAI, Play, keystore, etc.).
4. Purger l’historique git si le secret a été commité sur un dépôt public (`git filter-repo` ou support GitHub).
5. Relancer le workflow (`workflow_dispatch` sur `main` pour audit complet).

## Références

- [TruffleHog GitHub Action](https://github.com/trufflesecurity/trufflehog#octocat-trufflehog-github-action)
- [SECRETS.md](./SECRETS.md) — inventaire public vs secret, rotation Play
- [GHA_ORCHESTRATION.md](./GHA_ORCHESTRATION.md) — pipelines CreatorFlow
