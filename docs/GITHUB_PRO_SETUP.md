# GitHub Pro setup — carllaliberte/contract

Checklist to run this repository like a professional open-source / product monorepo.  
Repo files in this PR provide the **in-repo** half; the steps below are **Settings** actions only a repo admin can complete.

## What this repo already includes

| Asset | Path | Purpose |
| --- | --- | --- |
| README | [`README.md`](../README.md) | Overview, quick starts, doc index |
| License | [`LICENSE`](../LICENSE) | MIT |
| Contributing | [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Dev setup + PR rules |
| Security policy | [`SECURITY.md`](../SECURITY.md) | Private vulnerability reporting |
| CODEOWNERS | [`.github/CODEOWNERS`](../.github/CODEOWNERS) | Default + path-based reviewers |
| Issue templates | [`.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE/) | Bug + feature (+ security contact link) |
| PR template | [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) | Summary / area / test plan |
| Dependabot | [`.github/dependabot.yml`](../.github/dependabot.yml) | Dependency update PRs |
| Secret scan | [`.github/workflows/secret-scan.yml`](../.github/workflows/secret-scan.yml) | TruffleHog on PR/push |
| Secret hygiene | [`.github/workflows/secret-hygiene.yml`](../.github/workflows/secret-hygiene.yml) | Path / pattern guards |

Related ops docs: [`SECRETS.md`](SECRETS.md), [`GHA_ORCHESTRATION.md`](GHA_ORCHESTRATION.md), [`TRUFFLEHOG.md`](TRUFFLEHOG.md).

## Admin checklist (GitHub UI)

### 1. General

- [ ] **Settings → General → Features**: Issues, Projects (optional), Discussions (optional)
- [ ] **Settings → General → Pull Requests**: allow squash merge; consider disabling merge commits for a linear history
- [ ] Confirm **Homepage** / description on the repo match the live apps

### 2. Branches — protect `main`

**Settings → Branches → Add rule** (or ruleset) for `main`:

- [ ] Require a pull request before merging
- [ ] Require approvals (at least 1) when collaborators exist
- [ ] Require status checks to pass — suggest:
  - `CI CreatorFlow / web`
  - `Secret scan (TruffleHog) / trufflehog`
  - `Secret hygiene / check-no-secrets`
  - `API CI` when touching `api/`
- [ ] Require branches to be up to date before merging (optional but recommended)
- [ ] Do not allow force pushes / deletions on `main`
- [ ] Optionally require conversation resolution before merge

CODEOWNERS only enforces reviews if **Require review from Code Owners** is enabled on the same rule.

### 3. Security & analysis

**Settings → Code security and analysis** (names vary slightly by plan):

- [ ] **Dependency graph** — On
- [ ] **Dependabot alerts** — On
- [ ] **Dependabot security updates** — On (complements `.github/dependabot.yml`)
- [ ] **Secret scanning** — On (GitHub native; TruffleHog remains complementary)
- [ ] **Push protection** — On when available
- [ ] **Private vulnerability reporting** — On so [`SECURITY.md`](../SECURITY.md) “Report a vulnerability” works

### 4. Actions permissions

**Settings → Actions → General**:

- [ ] Allow GitHub Actions (required for CI/deploy)
- [ ] Prefer **Allow enterprise/organization**, or **Allow select actions** including:
  - `actions/*`
  - `trufflesecurity/trufflehog@*`
  - other actions already used under `.github/workflows/`
- [ ] Workflow permissions: read for PRs from forks; write only where deploy workflows need `contents: write` (Pages publish)

Deploy workflows that use `workflow_dispatch` need a user or PAT with enough rights; the default `GITHUB_TOKEN` for Cloud Agents may lack `actions: write` — run those manually from the Actions tab when needed.

### 5. Secrets & variables

**Settings → Secrets and variables → Actions** — fill from [`SECRETS.md`](SECRETS.md):

- [ ] Public build inputs as **Variables** (`VITE_*`, not secrets)
- [ ] Signing / Play / Firebase / LLM as **Secrets**
- [ ] Never paste real secrets into issues, PR bodies, or commit history

### 6. Pages

- [ ] Confirm GitHub Pages source matches your deploy strategy (`gh-pages` branch used by CreatorFlow / META deploy workflows)
- [ ] Live URLs:
  - META: https://carllaliberte.github.io/contract/
  - CreatorFlow: https://carllaliberte.github.io/contract/creatorflow/

### 7. Labels (optional but useful)

Create or keep: `bug`, `enhancement`, `docs`, `ci`, `security`, `creatorflow`, `meta`, `good first issue`.

Issue templates already reference `bug` and `enhancement`.

## After merge — smoke test

1. Open **Issues → New** and confirm bug / feature templates appear.
2. Open a draft PR and confirm the PR template body.
3. Visit **Security → Advisories** and confirm private reporting is available.
4. Push a no-op docs PR and verify CODEOWNERS requests `@carllaliberte` on workflow paths.

## Ownership note

[`.github/CODEOWNERS`](../.github/CODEOWNERS) assigns `@carllaliberte`. Update that file if the GitHub handle or review team changes.
