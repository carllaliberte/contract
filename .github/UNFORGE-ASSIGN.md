# UNFORGE — issue / PR assignment

Canonical roster and holds: [`docs/UNFORGE.md`](../docs/UNFORGE.md).

Clock: **America/Montreal**.

This map is GitHub mechanics only. It does not rewrite ClapShot product spec, `LICENSE`, or NOTICE. It does not reopen `#74`.

Grok Expert **ASSIGNMENT GO** with two HOLDs (canonical text: [`docs/UNFORGE.md`](../docs/UNFORGE.md)):

| | Status |
| --- | --- |
| This PR (docs + labels + project + issues) | **GO** |
| HOLD 1 — Imagine | **HOLD** — Experiments ≠ Imagine. ClapShot Imagine stays closed. Grok Expert tastes; not an unbounded prototype seat. |
| HOLD 2 — User machine | **HOLD** — Do not check out onto a user machine. Cloud Agent / GitHub only. |

Do **not** rename any seat to Figma Bro, Motion God, or Experiments. SpaceXAI analog is docs-only. **Judgment = Carl.** Quantum is QC last word on physics / post / Imagine, not a substitute for Carl. Legal flags first. No `LICENSE` / NOTICE changes.

## Seat labels

Create these labels if missing (names are the seat keys). Do not invent extra seats.

| Label | Grok Bot agent | Use on |
| --- | --- | --- |
| `quantum` | Quantum | QC last word on physics / post / Imagine — not a substitute for Carl |
| `grok-expert` | Grok Expert | Taste + assignment. Not Experiments-the-seat. Not Imagine. |
| `repo` | Repo | Cloud Agent PRs, this repo, docs/CI that execute a green |
| `files` | Files | iPhone / attach / masters / mux (mux still needs Quantum green) |
| `x-verify` | X (`@MetavArmy`) | Verify-only threads. Never “please post”. |
| `security` | Security | Defense only |
| `legal` | Legal | Copyright flags first (not legal advice). No LICENSE / NOTICE edits. |

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

1. **Hold** — work is blocked, or it sits on a standing hold (Imagine HARD STOP, Banner ER-bridge HOLD, bio waits Carl, no X post/pin/delete, no user-machine checkout).
2. **Taste** — Grok Expert explores **inside the assignment**, then locks (label + what Repo may write). Not an unbounded prototype seat. Not Imagine.
3. **Quantum-green** — Quantum QC last word on physics / post / Imagine. Not a substitute for Carl. Physics clash stops here.
4. **In PR** — Repo (Cloud Agent on GitHub, not a user machine) opens a **small** PR against `main` on `carllaliberte/contract` **only after** taste + Quantum green.
5. **Done** — **Carl** judges and merges (or Carl closes). Quantum does not replace Carl.

Repo does not start a Cloud Agent because a label exists. Repo starts a Cloud Agent because Grok Expert locked taste and Quantum greened the write.

### Review and green

| Step | Who | GitHub |
| --- | --- | --- |
| Taste | Grok Expert | Label `grok-expert`. Comment “taste: lock” + scope. |
| Green | Quantum | Label `quantum`. Comment “Quantum green” on the issue (or on the intended PR). |
| Open PR | Repo / Cloud Agent | Label `repo`. PR body names both greens. |
| Review / judgment | Carl (`@carllaliberte` via CODEOWNERS) | **Judgment = Carl.** Human merge. Legal flags go to Carl first (`legal`). |
| Defense pass | Security | Label `security` when the change touches secrets, auth, or attack surface. |
| Asset pass | Files | Label `files` when masters / mux / iPhone attach are in scope. Mux still waits Quantum. |
| X pass | X | Label `x-verify` for verify-only. No post / pin / delete without a separate Quantum green. |

CODEOWNERS already routes every path to `@carllaliberte`. UNFORGE does not replace that.

### PR body (minimum)

- Grok Bot seats involved (names, not fake logins)
- Seat labels
- “Grok Expert taste: …” and “Quantum green: …” (link the issue / comment)
- Lane checkbox: UNFORGE GitHub layer **or** ClapShot product — not a second app
- Holds still in force (Imagine closed; no user-machine checkout; no seat rename to Figma Bro / Motion God / Experiments)
- Legal flags first; no `LICENSE` / NOTICE changes
- No secrets
- No X post / pin / delete unless Quantum greened that action in writing
- Cloud Agent / GitHub only — do not check out onto a user machine

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

Issues must be **enabled** on the repo (`Settings → General → Features → Issues`). They were off when this layer was added. `GITHUB_TOKEN` cannot flip that setting (`administration` is not a valid workflow permission). Carl turns Issues on, then re-runs `unforge-seed.yml` to create the seven issues if missing. Labels can seed on the PR without Issues.

## First develop pass

This pass is docs + labels + project + standing issues only. Grok Expert **GO** with Imagine HOLD + user-machine HOLD.

- Keep PRs small
- English in repo files is OK
- No X actions
- No secrets
- Legal flags first — no `LICENSE` / NOTICE changes, no film-license text in ClapShot `LICENSE`
- Do not delete anything
- Do not rename seats to Figma Bro, Motion God, or Experiments
- Do not open Imagine; Experiments ≠ Imagine
- Do not check out onto a user machine
- Judgment = Carl; Quantum is QC, not a substitute
