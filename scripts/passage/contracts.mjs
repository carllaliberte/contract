/**
 * Mega-Giga passage contracts (diagnostic fabric).
 *
 * NOT an Acorn Cortex. NOT LIVE. NOT human authority.
 * Provider adapters are execution bridges only.
 *
 * Absolute architecture reference remains PR #715 on Acorn-Global
 * when that repository is reachable. This module only encodes the
 * measurable passage: runner → provider → receipt → MEASURED.
 */

export const PASSAGE_CONTRACT = "mega-giga-passage/v1";

export const TRUTH_LEVELS = Object.freeze([
  "DEFINED",
  "CODE_VERIFIED",
  "TEST_VERIFIED",
  "EXECUTED",
  "MEASURED",
  "LIVE_VERIFIED",
]);

/** LIVE is never automatic from this passage. */
export const LIVE_AUTOMATIC = false;

/** Provider may execute; it never holds authority or Cortex role. */
export const PROVIDER_IS_AUTHORITY = false;
export const PROVIDER_IS_CORTEX = false;

/** Human authority remains required for LIVE / promotion. */
export const HUMAN_AUTHORITY_REQUIRED = true;

/** STOP / HOLD dominate any provider success claim. */
export const STOP_DOMINANT = true;
export const HOLD_DOMINANT = true;

export const RUNNER_REACHED_REQUIRED_FIELDS = Object.freeze([
  "RUNNER_REACHED",
  "runner_os",
  "runner_arch",
  "github_sha",
  "github_run_id",
  "timestamp",
]);

export const RECEIPT_REQUIRED_FIELDS = Object.freeze([
  "contract",
  "provider",
  "model",
  "repository",
  "commit",
  "workflow",
  "run_id",
  "attempt",
  "timestamp",
  "http_status",
  "latency_ms",
  "response_observed",
  "receipt_hash",
]);

/** Forbidden in receipts / logs (substring match, case-insensitive). */
export const FORBIDDEN_RECEIPT_KEYS = Object.freeze([
  "api_key",
  "apikey",
  "authorization",
  "token",
  "secret",
  "password",
  "bearer",
]);

export function assertNoSecretsInObject(obj, path = "") {
  if (obj === null || obj === undefined) return;
  if (typeof obj !== "object") return;
  for (const [key, value] of Object.entries(obj)) {
    const next = path ? `${path}.${key}` : key;
    const lower = key.toLowerCase();
    for (const bad of FORBIDDEN_RECEIPT_KEYS) {
      if (lower.includes(bad)) {
        throw new Error(`forbidden receipt key: ${next}`);
      }
    }
    if (typeof value === "object") assertNoSecretsInObject(value, next);
  }
}

export function secretPresentLabel(raw) {
  return typeof raw === "string" && raw.trim().length > 0 ? "yes" : "no";
}
