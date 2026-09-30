#!/usr/bin/env node
/**
 * Local evidence classifier for the reachable passage surface.
 * Does not call providers. Does not claim Acorn-Global, LIVE, or settlement.
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  AUTHORITY_ENFORCED,
  EXECUTION_SURFACE,
  LIVE_AUTOMATIC,
  STOP_DOMINANT_REQUIRED,
  THIS_MODULE_IS_ACORN,
} from "./contracts.mjs";

const pkg = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);

const wanted = [
  "check",
  "stability:verify",
  "world-benchmark:test",
  "remaining-axes:test",
  "test:passage",
  "evidence:closure",
];

const scripts = Object.fromEntries(
  wanted.map((name) => [name, pkg.scripts?.[name] ? "DEFINED" : "ABSENT"]),
);

let headSha = "UNVERIFIED";
try {
  headSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
} catch {
  headSha = "UNVERIFIED";
}

const report = {
  execution_surface: EXECUTION_SURFACE,
  this_module_is_acorn: THIS_MODULE_IS_ACORN,
  head_sha_local: headSha,
  acorn_global_repository: "UNVERIFIED",
  live_automatic: LIVE_AUTOMATIC,
  authority_enforced: AUTHORITY_ENFORCED,
  stop_dominant_required: STOP_DOMINANT_REQUIRED,
  human_gate: "PASSAGE_HUMAN_AUTHORIZATION must equal yes before a provider call",
  stop_gate: "PASSAGE_STOP or ACORN_STOP of 1, true, or stop refuses the call",
  scripts,
  external_openai: "UNVERIFIED",
  external_reality: "UNVERIFIED",
  settlement: "UNVERIFIED",
  quantum_hardware: "UNVERIFIED",
};

console.log(JSON.stringify(report, null, 2));
