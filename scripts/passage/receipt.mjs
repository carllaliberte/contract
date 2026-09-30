import { createHash } from "node:crypto";
import {
  PASSAGE_CONTRACT,
  RECEIPT_REQUIRED_FIELDS,
  EXECUTION_SURFACE,
  assertNoSecretsInObject,
  assertPromotionRefused,
  deriveTruthLevel,
  NETWORK_OBSERVATION,
} from "./contracts.mjs";

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
    .join(",")}}`;
}

export function hashReceiptBody(bodyWithoutHash) {
  return createHash("sha256").update(stableStringify(bodyWithoutHash)).digest("hex");
}

/**
 * Build a deterministic, secret-free measurement receipt.
 * @param {object} input
 */
export function buildReceipt(input) {
  assertPromotionRefused(input.truth_level);
  const observation_mode = input.observation_mode;
  const truth_level = deriveTruthLevel({
    observation_mode,
    http_status: input.http_status,
    response_observed: input.response_observed,
    error_code: input.error_code,
  });
  if (input.truth_level && input.truth_level !== truth_level) {
    throw new Error(
      `truth_level ${input.truth_level} does not match observation ${truth_level}`,
    );
  }
  if (
    observation_mode === "network" &&
    input.observation_witness !== NETWORK_OBSERVATION
  ) {
    throw new Error("network observation requires the adapter witness");
  }

  const body = {
    contract: input.contract ?? PASSAGE_CONTRACT,
    provider: input.provider,
    model: input.model,
    repository: input.repository,
    commit: input.commit,
    workflow: input.workflow,
    run_id: String(input.run_id ?? ""),
    attempt: Number(input.attempt ?? 1),
    timestamp: input.timestamp,
    http_status: Number(input.http_status),
    latency_ms: Number(input.latency_ms),
    response_observed: Boolean(input.response_observed),
    observation_mode,
    truth_level,
    live_automatic: false,
    this_module_is_acorn: false,
    execution_surface: EXECUTION_SURFACE,
    authority_enforced: false,
    stop_requested: input.stop_requested === true,
    human_authorized: input.human_authorized === true,
    provider_is_authority: false,
    provider_is_cortex: false,
  };

  for (const field of RECEIPT_REQUIRED_FIELDS) {
    if (field === "receipt_hash") continue;
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      throw new Error(`receipt missing required field: ${field}`);
    }
  }

  assertNoSecretsInObject(body);
  const receipt_hash = hashReceiptBody(body);
  const receipt = { ...body, receipt_hash };
  assertNoSecretsInObject(receipt);
  return receipt;
}
