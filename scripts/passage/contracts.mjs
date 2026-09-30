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

/** This file is the contract passage, not an Acorn runtime. */
export const THIS_MODULE_IS_ACORN = false;
export const EXECUTION_SURFACE = "carllaliberte/contract";

/** Provider may execute; it never holds authority or Cortex role. */
export const PROVIDER_IS_AUTHORITY = false;
export const PROVIDER_IS_CORTEX = false;

/** Human authority remains required for LIVE / promotion. */
export const HUMAN_AUTHORITY_REQUIRED = true;

/**
 * Architecture requirement (PR #715 when that repo is reachable).
 * These flags do not implement a breaker. Enforcement is separate.
 */
export const STOP_DOMINANT_REQUIRED = true;
export const HOLD_DOMINANT_REQUIRED = true;

/** Kept as the requirement name. Not proof that a call was halted. */
export const STOP_DOMINANT = STOP_DOMINANT_REQUIRED;
export const HOLD_DOMINANT = HOLD_DOMINANT_REQUIRED;

/** This module consults STOP/HOLD before a network call. It is not Cortex. */
export const AUTHORITY_ENFORCED = false;

/** Attached by the adapter only when it calls global fetch. Not JSON. */
export const NETWORK_OBSERVATION = Symbol("passage.network_observation");

export function stopRequested(env = {}) {
  const raw = String(env.PASSAGE_STOP ?? env.ACORN_STOP ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "stop";
}

/** Explicit human release. Anything other than the exact string "yes" is a hold. */
export function humanAuthorized(env = {}) {
  return env.PASSAGE_HUMAN_AUTHORIZATION === "yes";
}

/**
 * Truth level is derived from how the observation was obtained.
 * LIVE_VERIFIED is not a possible output.
 * A caller cannot upgrade an injected client to MEASURED.
 */
export function deriveTruthLevel({
  observation_mode,
  http_status,
  response_observed,
  error_code,
}) {
  if (
    observation_mode !== "network" &&
    observation_mode !== "injected" &&
    observation_mode !== "absent"
  ) {
    throw new Error(`unknown observation_mode: ${observation_mode}`);
  }
  const status = Number(http_status);
  const ok =
    !error_code &&
    response_observed === true &&
    status >= 200 &&
    status < 300;
  if (!ok) {
    if (observation_mode === "absent") return "DEFINED";
    if (observation_mode === "injected") return "CODE_VERIFIED";
    return "EXECUTED";
  }
  if (observation_mode === "injected") return "TEST_VERIFIED";
  return "MEASURED";
}

export function assertPromotionRefused(level) {
  if (level === "LIVE_VERIFIED") {
    throw new Error("LIVE_VERIFIED is refused by this module");
  }
}

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
  "observation_mode",
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
