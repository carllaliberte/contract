import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  LIVE_AUTOMATIC,
  PROVIDER_IS_AUTHORITY,
  PROVIDER_IS_CORTEX,
  HUMAN_AUTHORITY_REQUIRED,
  STOP_DOMINANT,
  HOLD_DOMINANT,
  RUNNER_REACHED_REQUIRED_FIELDS,
  secretPresentLabel,
  assertNoSecretsInObject,
} from "./contracts.mjs";
import { buildReceipt, hashReceiptBody } from "./receipt.mjs";
import { getProviderAdapter, openaiAdapter } from "./provider-adapter.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const workflowPath = join(
  root,
  ".github/workflows/passage-runner-openai.yml",
);

describe("governance — #715-aligned passage invariants", () => {
  it("STOP and HOLD dominate; LIVE is never automatic", () => {
    assert.equal(STOP_DOMINANT, true);
    assert.equal(HOLD_DOMINANT, true);
    assert.equal(LIVE_AUTOMATIC, false);
    assert.equal(HUMAN_AUTHORITY_REQUIRED, true);
  });

  it("provider is neither authority nor Cortex", () => {
    assert.equal(PROVIDER_IS_AUTHORITY, false);
    assert.equal(PROVIDER_IS_CORTEX, false);
    assert.equal(openaiAdapter.id, "openai");
    assert.notEqual(openaiAdapter.id, "cortex");
    assert.notEqual(openaiAdapter.id, "authority");
  });
});

describe("runner — workflow contract", () => {
  const yaml = readFileSync(workflowPath, "utf8");

  it("has valid workflow syntax markers and required jobs", () => {
    assert.match(yaml, /^name:\s+/m);
    assert.match(yaml, /runs-on:\s+ubuntu-latest/);
    assert.match(yaml, /runner_reach:/);
    assert.match(yaml, /openai_measure:/);
    assert.match(yaml, /needs:\s*runner_reach/);
  });

  it("runner job does not depend on checkout/npm/node project deps", () => {
    const runnerBlock = yaml.split("openai_measure:")[0];
    assert.doesNotMatch(runnerBlock, /actions\/checkout/);
    assert.doesNotMatch(runnerBlock, /npm\s+(ci|install)/);
    assert.doesNotMatch(runnerBlock, /setup-node/);
    assert.match(runnerBlock, /RUNNER_REACHED=true/);
  });

  it("forbids fake success patterns on runner path", () => {
    assert.doesNotMatch(yaml, /continue-on-error:\s*true/);
    // Synthetic proof without a step would be a bare env assignment outside run — require step name.
    assert.match(yaml, /- name:\s*RUNNER_REACHED/);
  });

  it("declares RUNNER_REACHED required fields", () => {
    for (const field of RUNNER_REACHED_REQUIRED_FIELDS) {
      if (field === "timestamp") {
        assert.match(yaml, /timestamp=/);
      } else {
        assert.match(yaml, new RegExp(field));
      }
    }
  });
});

describe("openai — secret presence is not disclosure", () => {
  it("labels presence as yes/no only", () => {
    assert.equal(secretPresentLabel("sk-test"), "yes");
    assert.equal(secretPresentLabel(""), "no");
    assert.equal(secretPresentLabel("   "), "no");
    assert.equal(secretPresentLabel(undefined), "no");
  });

  it("rejects secret-like keys in receipt objects", () => {
    assert.throws(
      () => assertNoSecretsInObject({ api_key: "x" }),
      /forbidden receipt key/,
    );
  });
});

describe("openai — request path, failure handling, receipt", () => {
  it("resolves openai adapter from registry (provider independence)", () => {
    assert.equal(getProviderAdapter("openai").id, "openai");
    assert.throws(() => getProviderAdapter("not-a-provider"), /unknown/);
  });

  it("handles missing secret as application failure", async () => {
    const result = await openaiAdapter.invoke(
      { model: "gpt-4o-mini", prompt: "ok" },
      { apiKey: "" },
    );
    assert.equal(result.error_code, "OPENAI_SECRET_MISSING");
    assert.equal(result.error_kind, "application_secret");
    assert.equal(result.response_observed, false);
  });

  it("handles HTTP failure without claiming response success", async () => {
    const result = await openaiAdapter.invoke(
      { model: "gpt-4o-mini", prompt: "ok" },
      {
        apiKey: "sk-test",
        fetchImpl: async () =>
          new Response(JSON.stringify({ error: { message: "nope" } }), {
            status: 401,
          }),
      },
    );
    assert.equal(result.http_status, 401);
    assert.equal(result.error_code, "OPENAI_HTTP_FAILURE");
    assert.equal(result.error_kind, "application_provider");
    assert.equal(result.response_observed, true);
  });

  it("measures successful response and builds deterministic receipt", async () => {
    const result = await openaiAdapter.invoke(
      { model: "gpt-4o-mini", prompt: "ok" },
      {
        apiKey: "sk-test",
        fetchImpl: async () =>
          new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), {
            status: 200,
          }),
      },
    );
    assert.equal(result.http_status, 200);
    assert.equal(result.response_observed, true);
    assert.equal(result.error_code, undefined);

    const receipt = buildReceipt({
      provider: result.provider,
      model: result.model,
      repository: "carllaliberte/contract",
      commit: "abc",
      workflow: "passage",
      run_id: "1",
      attempt: 1,
      timestamp: "2026-09-29T00:00:00.000Z",
      http_status: result.http_status,
      latency_ms: result.latency_ms,
      response_observed: true,
    });
    assert.equal(receipt.truth_level, "MEASURED");
    assert.equal(receipt.live_automatic, false);
    assert.equal(receipt.provider_is_cortex, false);
    assert.match(receipt.receipt_hash, /^[a-f0-9]{64}$/);

    const again = buildReceipt({
      provider: result.provider,
      model: result.model,
      repository: "carllaliberte/contract",
      commit: "abc",
      workflow: "passage",
      run_id: "1",
      attempt: 1,
      timestamp: "2026-09-29T00:00:00.000Z",
      http_status: result.http_status,
      latency_ms: result.latency_ms,
      response_observed: true,
    });
    assert.equal(again.receipt_hash, receipt.receipt_hash);
    assert.equal(
      hashReceiptBody({
        contract: receipt.contract,
        provider: receipt.provider,
        model: receipt.model,
        repository: receipt.repository,
        commit: receipt.commit,
        workflow: receipt.workflow,
        run_id: receipt.run_id,
        attempt: receipt.attempt,
        timestamp: receipt.timestamp,
        http_status: receipt.http_status,
        latency_ms: receipt.latency_ms,
        response_observed: receipt.response_observed,
        truth_level: receipt.truth_level,
        live_automatic: receipt.live_automatic,
        provider_is_authority: receipt.provider_is_authority,
        provider_is_cortex: receipt.provider_is_cortex,
      }),
      receipt.receipt_hash,
    );
  });
});
