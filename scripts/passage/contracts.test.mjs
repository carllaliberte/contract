import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  LIVE_AUTOMATIC,
  PROVIDER_IS_AUTHORITY,
  PROVIDER_IS_CORTEX,
  HUMAN_AUTHORITY_REQUIRED,
  STOP_DOMINANT_REQUIRED,
  HOLD_DOMINANT_REQUIRED,
  THIS_MODULE_IS_ACORN,
  AUTHORITY_ENFORCED,
  RUNNER_REACHED_REQUIRED_FIELDS,
  secretPresentLabel,
  assertNoSecretsInObject,
  stopRequested,
  humanAuthorized,
  deriveTruthLevel,
} from "./contracts.mjs";
import { buildReceipt, hashReceiptBody } from "./receipt.mjs";
import { getProviderAdapter, openaiAdapter } from "./provider-adapter.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const workflowPath = join(
  root,
  ".github/workflows/passage-runner-openai.yml",
);
const probePath = join(root, "scripts/passage/openai-probe.mjs");

describe("governance — #715-aligned passage invariants", () => {
  it("requires STOP and HOLD, and does not pretend this module is Cortex", () => {
    assert.equal(STOP_DOMINANT_REQUIRED, true);
    assert.equal(HOLD_DOMINANT_REQUIRED, true);
    assert.equal(LIVE_AUTOMATIC, false);
    assert.equal(HUMAN_AUTHORITY_REQUIRED, true);
    assert.equal(THIS_MODULE_IS_ACORN, false);
    assert.equal(AUTHORITY_ENFORCED, false);
  });

  it("consults STOP before any human release", () => {
    assert.equal(stopRequested({ PASSAGE_STOP: "1", PASSAGE_HUMAN_AUTHORIZATION: "yes" }), true);
    assert.equal(stopRequested({ ACORN_STOP: "stop" }), true);
    assert.equal(stopRequested({}), false);
    assert.equal(humanAuthorized({ PASSAGE_HUMAN_AUTHORIZATION: "yes" }), true);
    assert.equal(humanAuthorized({ PASSAGE_HUMAN_AUTHORIZATION: "YES" }), false);
    assert.equal(humanAuthorized({}), false);
  });

  it("derives truth from observation mode and refuses upgrades", () => {
    assert.equal(
      deriveTruthLevel({
        observation_mode: "injected",
        http_status: 200,
        response_observed: true,
      }),
      "TEST_VERIFIED",
    );
    assert.equal(
      deriveTruthLevel({
        observation_mode: "network",
        http_status: 200,
        response_observed: true,
      }),
      "MEASURED",
    );
    assert.equal(
      deriveTruthLevel({
        observation_mode: "network",
        http_status: 401,
        response_observed: true,
        error_code: "OPENAI_HTTP_FAILURE",
      }),
      "EXECUTED",
    );
    assert.throws(
      () =>
        deriveTruthLevel({
          observation_mode: "LIVE",
          http_status: 200,
          response_observed: true,
        }),
      /unknown observation_mode/,
    );
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

  it("checks out the head SHA and records both event SHAs", () => {
    assert.match(yaml, /pull_request\.head\.sha/);
    assert.match(yaml, /expected_sha=/);
    assert.match(yaml, /tested_sha=/);
    assert.match(yaml, /head_sha=/);
    assert.doesNotMatch(yaml, /truth_level:\s*["']?MEASURED/);
    assert.doesNotMatch(yaml, /LIVE_VERIFIED/);
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

describe("probe — STOP and HOLD precede the provider call", () => {
  const probe = readFileSync(probePath, "utf8");

  it("refuses the network call until STOP is clear and a human said yes", () => {
    const stopAt = probe.indexOf("stopRequested(");
    const holdAt = probe.indexOf("humanAuthorized(");
    const invokeAt = probe.indexOf("adapter.invoke");
    assert.ok(stopAt > 0 && holdAt > stopAt && invokeAt > holdAt);
    assert.match(probe, /observation_mode:\s*result\.observation_mode/);
    assert.match(probe, /observation_witness:\s*result\.observation_witness/);
    assert.doesNotMatch(probe, /truth_level=MEASURED/);
    assert.doesNotMatch(probe, /LIVE_VERIFIED/);
  });

  it("exits on STOP before a provider call", () => {
    const result = spawnSync(process.execPath, [probePath], {
      env: {
        ...process.env,
        PASSAGE_STOP: "1",
        PASSAGE_HUMAN_AUTHORIZATION: "yes",
        OPENAI_API_KEY: "sk-test",
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 5);
    assert.match(result.stderr, /STOP_DOMINANT/);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /http_status=/);
  });

  it("exits on HOLD_HUMAN when a key is present and STOP is clear", () => {
    const env = { ...process.env, OPENAI_API_KEY: "sk-test" };
    delete env.PASSAGE_STOP;
    delete env.ACORN_STOP;
    delete env.PASSAGE_HUMAN_AUTHORIZATION;
    const result = spawnSync(process.execPath, [probePath], {
      env,
      encoding: "utf8",
    });
    assert.equal(result.status, 6);
    assert.match(result.stderr, /HOLD_HUMAN/);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /http_status=/);
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
    assert.equal(result.observation_mode, "injected");
    assert.equal(result.error_code, undefined);

    const receiptInput = {
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
      observation_mode: result.observation_mode,
      human_authorized: false,
      stop_requested: false,
    };
    const receipt = buildReceipt(receiptInput);
    assert.equal(receipt.truth_level, "TEST_VERIFIED");
    assert.equal(receipt.live_automatic, false);
    assert.equal(receipt.this_module_is_acorn, false);
    assert.equal(receipt.authority_enforced, false);
    assert.equal(receipt.provider_is_cortex, false);
    assert.match(receipt.receipt_hash, /^[a-f0-9]{64}$/);
    assert.throws(
      () => buildReceipt({ ...receiptInput, truth_level: "MEASURED" }),
      /does not match observation/,
    );
    assert.throws(
      () => buildReceipt({ ...receiptInput, truth_level: "LIVE_VERIFIED" }),
      /LIVE_VERIFIED is refused/,
    );
    assert.throws(
      () =>
        buildReceipt({
          ...receiptInput,
          observation_mode: "network",
        }),
      /adapter witness/,
    );

    const again = buildReceipt(receiptInput);
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
        observation_mode: receipt.observation_mode,
        truth_level: receipt.truth_level,
        live_automatic: receipt.live_automatic,
        this_module_is_acorn: receipt.this_module_is_acorn,
        execution_surface: receipt.execution_surface,
        authority_enforced: receipt.authority_enforced,
        stop_requested: receipt.stop_requested,
        human_authorized: receipt.human_authorized,
        provider_is_authority: receipt.provider_is_authority,
        provider_is_cortex: receipt.provider_is_cortex,
      }),
      receipt.receipt_hash,
    );
  });
});
