# Mega-Giga passage — runner → OpenAI → MEASURED

## Status

| Claim | Level |
| --- | --- |
| Passage contract defined | DEFINED |
| Code present under `scripts/passage/` | CODE_VERIFIED when reviewed |
| Unit tests (`node --test scripts/passage/*.test.mjs`) | TEST_VERIFIED when green |
| `RUNNER_REACHED=true` from Actions step | EXECUTED only when that step runs |
| OpenAI request + receipt | MEASURED only with real HTTP + receipt |
| LIVE | **false** — never automatic from this workflow |

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
