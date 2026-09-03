# UNFORGE — issue / PR assignment

Canonical roster and holds: [`docs/UNFORGE.md`](../docs/UNFORGE.md).

Clock: **America/Montreal**.

This map is GitHub mechanics only. It does not rewrite ClapShot product spec, `LICENSE`, or NOTICE. It does not reopen `#74`.

## Seat labels

Create these labels if missing (names are the seat keys). Do not invent extra seats.

| Label | Grok Bot agent | Use on |
| --- | --- | --- |
| `quantum` | Quantum | QC, greens, physics clash, Imagine/mux/post hold questions |
| `grok-expert` | Grok Expert | Taste, assignment, explore-before-lock |
| `repo` | Repo | Cloud Agent PRs, this repo, docs/CI that execute a green |
| `files` | Files | iPhone / attach / masters / mux (mux still needs Quantum green) |
| `x-verify` | X (`@MetavArmy`) | Verify-only threads. Never “please post”. |
| `security` | Security | Defense only |
| `legal` | Legal | Copyright flags (not legal advice) |

Source of truth for color / description: [`.github/unforge-labels.yml`](unforge-labels.yml). Seed job: [`.github/workflows/unforge-seed.yml`](workflows/unforge-seed.yml).

Email is **OFF UNFORGE** — no label. New Agent / New Bot are **DELETE-CANDIDATE** — no label, do not restore.

## Who may be an assignee

GitHub assignees must be real GitHub users. Today that is `@carllaliberte`.

- Do **not** fake `quantum`, `grok-expert`, or other bot accounts.
- Put the Grok Bot agent name in the **title** and **body**.
- Apply the seat **label**.
- Carl remains the human assignee / reviewer unless he names another GitHub user.

## How a Cloud Agent PR is opened

```
Hold  →  Taste  →  Quantum-green  →  In PR  →  Done
```

1. **Hold** — work is blocked, or it sits on a standing hold (Imagine/mux/post HARD STOP, Banner ER-bridge HOLD, bio waits Carl, no X post/pin/delete).
2. **Taste** — Grok Expert explores, then locks assignment (label + what Repo may write).
3. **Quantum-green** — Quantum QC. Last word on the write / post / mux. Physics clash stops here.
4. **In PR** — Repo (Cloud Agent) opens a **small** PR against `main` on `carllaliberte/contract` **only after** taste + Quantum green.
5. **Done** — Carl merges (or Carl closes). Judgment between versions stays with Carl + Quantum.

Repo does not start a Cloud Agent because a label exists. Repo starts a Cloud Agent because Grok Expert locked taste and Quantum greened the write.

### Review and green

| Step | Who | GitHub |
| --- | --- | --- |
| Taste | Grok Expert | Label `grok-expert`. Comment “taste: lock” + scope. |
| Green | Quantum | Label `quantum`. Comment “Quantum green” on the issue (or on the intended PR). |
| Open PR | Repo / Cloud Agent | Label `repo`. PR body names both greens. |
| Review | Carl (`@carllaliberte` via CODEOWNERS) | Human merge. Legal flags go to Carl (`legal`). |
| Defense pass | Security | Label `security` when the change touches secrets, auth, or attack surface. |
| Asset pass | Files | Label `files` when masters / mux / iPhone attach are in scope. Mux still waits Quantum. |
| X pass | X | Label `x-verify` for verify-only. No post / pin / delete without a separate Quantum green. |

CODEOWNERS already routes every path to `@carllaliberte`. UNFORGE does not replace that.

### PR body (minimum)

- Grok Bot seats involved (names, not fake logins)
- Seat labels
- “Grok Expert taste: …” and “Quantum green: …” (link the issue / comment)
- Lane checkbox: UNFORGE GitHub layer **or** ClapShot product — not a second app
- Holds still in force
- No secrets
- No X post / pin / delete unless Quantum greened that action in writing

## GitHub Project: UNFORGE

User/org project named **UNFORGE**, linked to `carllaliberte/contract`.

Columns (Projects v2 Status options):

| Column | Meaning |
| --- | --- |
| Hold | Blocked, or standing hold / standing charter |
| Taste | Waiting on Grok Expert |
| Quantum-green | Taste locked; waiting on Quantum |
| In PR | Repo Cloud Agent PR is open |
| Done | Merged or explicitly closed by Carl |

The Cloud Agent that opens a docs PR cannot create a user-owned Project v2 as `cursor[bot]`. Carl (or a PAT with `project` scope) creates it once:

```bash
# America/Montreal — run as Carl
gh project create --owner carllaliberte --title "UNFORGE"
gh project link --owner carllaliberte --repo carllaliberte/contract <PROJECT_NUMBER>
```

Then in the project UI, set Status options to **Hold / Taste / Quantum-green / In PR / Done**. Add the standing charter issues below. Do not invent extra columns.

Re-seed labels / issues (idempotent) from `main` or the UNFORGE PR branch:

```bash
gh workflow run unforge-seed.yml --ref main
```

## Standing charter issues (JOIN seats)

One open issue per JOIN seat. These are charters, not work to close. Do not close them. Do not assign a fake bot.

| Title | Label | Agent name in body |
| --- | --- | --- |
| `[Quantum] UNFORGE charter — QC last word` | `quantum` | Quantum |
| `[Grok Expert] UNFORGE charter — taste + assignment` | `grok-expert` | Grok Expert |
| `[X] UNFORGE charter — @MetavArmy verify only` | `x-verify` | X |
| `[Files] UNFORGE charter — iPhone / attach / masters` | `files` | Files |
| `[Security] UNFORGE charter — defense only` | `security` | Security |
| `[Legal] UNFORGE charter — copyright flags` | `legal` | Legal |

### Meta issue

| Title | Label |
| --- | --- |
| `UNFORGE GitHub lane — Cloud Agent PRs after Quantum green` | `repo` |

This is the lane issue: Cloud Agent PRs open only after Grok Expert taste + Quantum green. Repo is the executor. Place JOIN charters on **Hold** (standing). Place the meta issue on **Taste** until the first real product write is assigned.

Issues must be **enabled** on the repo (`Settings → General → Features → Issues`). They were off when this layer was added. The seed workflow turns Issues on when it has `administration` permission, then creates the seven issues if missing.

## First develop pass

This pass is docs + labels + project + standing issues only.

- Keep PRs small
- English in repo files is OK
- No X actions
- No secrets
- No film-license text in ClapShot `LICENSE`
- Do not delete anything
