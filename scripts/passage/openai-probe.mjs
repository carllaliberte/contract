#!/usr/bin/env node
/**
 * OpenAI probe — runs ONLY after RUNNER_REACHED=true.
 * Prints secret presence as yes/no only. Never prints the key.
 * Emits a secret-free receipt. truth_level comes from the receipt, never a hardcoded MEASURED.
 */

import { buildReceipt } from "./receipt.mjs";
import { getProviderAdapter } from "./provider-adapter.mjs";
import {
  secretPresentLabel,
  PASSAGE_CONTRACT,
  stopRequested,
  humanAuthorized,
} from "./contracts.mjs";

function env(name, fallback = "") {
  return process.env[name] ?? fallback;
}

async function main() {
  const gateEnv = {
    PASSAGE_STOP: env("PASSAGE_STOP"),
    ACORN_STOP: env("ACORN_STOP"),
    PASSAGE_HUMAN_AUTHORIZATION: env("PASSAGE_HUMAN_AUTHORIZATION"),
  };
  const stopped = stopRequested(gateEnv);
  const authorized = humanAuthorized(gateEnv);
  console.log(`stop_requested=${stopped ? "yes" : "no"}`);
  console.log(`human_authorized=${authorized ? "yes" : "no"}`);

  if (stopped) {
    console.error("STOP_DOMINANT — external provider call refused");
    process.exit(5);
  }

  const apiKey = env("OPENAI_API_KEY");
  const present = secretPresentLabel(apiKey);
  console.log(`openai_secret_present=${present}`);

  if (present !== "yes") {
    console.error("OPENAI_SECRET_MISSING — application failure (not runner failure)");
    process.exit(2);
  }

  if (!authorized) {
    console.error("HOLD_HUMAN — external provider call refused");
    process.exit(6);
  }

  const model = env("OPENAI_MODEL", "gpt-4o-mini");
  const adapter = getProviderAdapter("openai");
  const result = await adapter.invoke(
    {
      model,
      prompt: "Reply with exactly: ok",
      max_tokens: 8,
    },
    { apiKey },
  );

  console.log(`provider=${result.provider}`);
  console.log(`model=${result.model}`);
  console.log(`http_status=${result.http_status}`);
  console.log(`latency_ms=${result.latency_ms}`);
  console.log(`response_observed=${result.response_observed}`);
  if (result.error_code) {
    console.error(`${result.error_code} — ${result.error_kind}`);
    process.exit(3);
  }

  const receipt = buildReceipt({
    contract: PASSAGE_CONTRACT,
    provider: result.provider,
    model: result.model,
    repository: env("GITHUB_REPOSITORY", "local/passage"),
    commit: env("GITHUB_SHA", "local"),
    workflow: env("GITHUB_WORKFLOW", "passage-runner-openai"),
    run_id: env("GITHUB_RUN_ID", "0"),
    attempt: env("GITHUB_RUN_ATTEMPT", "1"),
    timestamp: new Date().toISOString(),
    http_status: result.http_status,
    latency_ms: result.latency_ms,
    response_observed: result.response_observed,
    observation_mode: result.observation_mode,
    observation_witness: result.observation_witness,
    error_code: result.error_code,
    stop_requested: stopped,
    human_authorized: authorized,
  });

  console.log("RECEIPT_BEGIN");
  console.log(JSON.stringify(receipt, null, 2));
  console.log("RECEIPT_END");
  console.log(`truth_level=${receipt.truth_level}`);
}

main().catch((err) => {
  console.error("OPENAI_PROBE_CRASH — application failure (not runner failure)");
  console.error(String(err?.message ?? err));
  process.exit(4);
});
