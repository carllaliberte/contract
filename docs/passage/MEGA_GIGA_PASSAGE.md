# Mega-Giga passage — runner → OpenAI → MEASURED

## Status

| Claim | Level |
| --- | --- |
| Passage contract defined | DEFINED |
| Code present under `scripts/passage/` | CODE_VERIFIED when reviewed |
| Unit tests (`node --test scripts/passage/*.test.mjs`) | TEST_VERIFIED when green |
| `RUNNER_REACHED=true` from Actions step | EXECUTED only when that step runs |
| OpenAI request + receipt | MEASURED only when `observation_mode=network` and HTTP succeeded |
| Injected client receipt | TEST_VERIFIED — cannot be upgraded to MEASURED |
| LIVE | **refused** — `LIVE_VERIFIED` throws |
| STOP | refuses the provider call when `PASSAGE_STOP` or `ACORN_STOP` is `1`, `true`, or `stop` |
| HOLD_HUMAN | refuses the provider call unless `PASSAGE_HUMAN_AUTHORIZATION` is exactly `yes` |
| Acorn-Global | UNVERIFIED from this repository |

## Absolute reference

PR **#715** on `carllaliberte/Acorn-Global` remains the architecture contract:

- one Cortex
- one runtime
- one runner architecture
- provider independent
- STOP dominant / HOLD dominant
- human authority dominant
- LIVE automatic = false
- proof before claims

This repository (`contract`) is a **reachable execution surface** used only because
`Acorn-Global` was not in the Cursor GitHub App installation at implementation time.

This fabric is **not** a second Cortex and **not** LIVE.

## Path

```
GitHub Actions
  → job runner_reach (no checkout / npm / OpenAI)
  → RUNNER_REACHED=true (+ os, arch, sha, run_id, timestamp)
  → job openai_measure (needs runner)
  → openai_secret_present=yes|no  (never print the key)
  → provider adapter (openai)
  → receipt (secret-free)
  → truth_level=MEASURED
```

## SHA identity

On `pull_request`, `github.sha` is the synthetic merge commit. The run recorded on 2026-09-29 checked out `27f671aa29209455b6275d71fdf60d2467f6abe4` while the pull request head was `6a35f8fb35b0bc7107756d19fac03b4cb519696c`.

The measure job now checks out `pull_request.head.sha` (or `github.sha` on push) and fails if `git rev-parse HEAD` differs.

A push to `main` that does not change `scripts/passage/**`, `docs/passage/**`, or this workflow does not start this workflow. That is a path filter, not a canonical gate for every main SHA.

## Failure classes (must stay distinct)

| Class | Where | Example |
| --- | --- | --- |
| Runner | `runner_reach` job | queued / startup / unavailable / step fail |
| Application secret | `openai_measure` | `OPENAI_SECRET_MISSING` |
| Application provider | `openai_measure` | `OPENAI_HTTP_FAILURE` |

No `continue-on-error`. No synthetic `RUNNER_REACHED` without the step executing.

## Provider independence

```
host → scripts/passage/provider-adapter.mjs → openai | (future grok)
```

Cortex / authority / STOP / HOLD are not implemented in the adapter.

## External Grok Bot evidence

Public probe (not this runtime):

- https://github.com/carllaliberte/acorn-hosted-runner-probe
- Run proving hosted runner allocation:
  https://github.com/carllaliberte/acorn-hosted-runner-probe/actions/runs/36608877332

## Human bridge (if Acorn-Global remains the target)

1. Install Cursor GitHub App on `carllaliberte/Acorn-Global`.
2. Relaunch this mission against that repository.
3. Ensure `OPENAI_API_KEY` exists as an Actions secret (value never logged).
