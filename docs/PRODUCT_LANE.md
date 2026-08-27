# One product, one lane

Public product: **CreatorFlow**.

Loop that counts: **idée → pack → tourner**.

Everything else is either support for that loop or archived.

## Frozen face

The first screen shipped in `#82` (`8c18219`) stays frozen:

- ExtraBold hero
- One CTA (`On commence.` / `Let’s go.`)
- Apple-first card on native
- Dashboard = one phrase + one next action

Do not restyle, rewrite, or “improve” that face in a parallel PR.

## Off

| Track | Status |
| --- | --- |
| Quantum / AgentBus UI (`#74`) | **OFF**. Closed. Do not reopen. |
| Pack-as-CTA / session / iOS tag dump (`#75`) | **Closed**. Do not merge. |
| META token dashboard (`google-app/`, `meta.sol`) | **Archived surface**. No new product work. |
| Dependabot on `google-app` | **Removed**. Do not merge leftover PRs. |
| Parallel agent tracks | **Forbidden**. One owner, one lane. |

## Allowed work

1. Keep CreatorFlow web CI green.
2. Deploy CreatorFlow to Pages (`/contract/creatorflow/`).
3. Pages **root** must redirect to CreatorFlow — never serve META as the homepage.
4. iOS / Android for **CreatorFlow only** (`com.carllaliberte.creatorflow`).
5. API / Supabase only when they serve idée → pack → tourner.

## Not allowed

- A second public app in this repo
- Shipping a token, wallet, or Play listing for META while CreatorFlow is the face
- Opening Quantum, Web3, or agent-bus PRs “on the side”
- Merging Dependabot with product PRs
- A third “launch” branch

## Repo name

The GitHub repo is still `carllaliberte/contract` for history. That name is not the product name. The product is CreatorFlow. Do not rename the repo in this lane.
