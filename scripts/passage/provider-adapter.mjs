/**
 * Provider-neutral adapter surface.
 *
 * Acorn (or any host) → provider adapter → OpenAI | Grok | …
 * Cortex / authority / STOP / HOLD are never implemented here.
 */

import { NETWORK_OBSERVATION } from "./contracts.mjs";

/**
 * @typedef {object} ProviderRequest
 * @property {string} model
 * @property {string} prompt
 * @property {number} [max_tokens]
 */

/**
 * @typedef {object} ProviderResult
 * @property {string} provider
 * @property {string} model
 * @property {number} http_status
 * @property {number} latency_ms
 * @property {boolean} response_observed
 * @property {string} [error_code]
 * @property {string} [error_kind] - application failure class (never runner)
 */

/**
 * @typedef {object} ProviderAdapter
 * @property {string} id
 * @property {(req: ProviderRequest, env: { apiKey: string, fetchImpl?: typeof fetch }) => Promise<ProviderResult>} invoke
 */

/** @type {ProviderAdapter} */
export const openaiAdapter = {
  id: "openai",
  async invoke(req, env) {
    const observation_mode = env.fetchImpl ? "injected" : "network";
    const observation_witness =
      observation_mode === "network" ? NETWORK_OBSERVATION : undefined;
    const fetchImpl = env.fetchImpl ?? globalThis.fetch;
    if (!env.apiKey) {
      return {
        provider: "openai",
        model: req.model,
        http_status: 0,
        latency_ms: 0,
        response_observed: false,
        observation_mode,
        observation_witness,
        error_code: "OPENAI_SECRET_MISSING",
        error_kind: "application_secret",
      };
    }

    const started = Date.now();
    let http_status = 0;
    let response_observed = false;
    try {
      const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: req.model,
          messages: [{ role: "user", content: req.prompt }],
          max_tokens: req.max_tokens ?? 8,
          temperature: 0,
        }),
      });
      http_status = res.status;
      const text = await res.text();
      response_observed = text.length > 0;
      const latency_ms = Date.now() - started;
      if (!res.ok) {
        return {
          provider: "openai",
          model: req.model,
          http_status,
          latency_ms,
          response_observed,
          observation_mode,
          observation_witness,
          error_code: "OPENAI_HTTP_FAILURE",
          error_kind: "application_provider",
        };
      }
      return {
        provider: "openai",
        model: req.model,
        http_status,
        latency_ms,
        response_observed,
        observation_mode,
        observation_witness,
      };
    } catch {
      return {
        provider: "openai",
        model: req.model,
        http_status,
        latency_ms: Date.now() - started,
        response_observed: false,
        observation_mode,
        observation_witness,
        error_code: "OPENAI_TRANSPORT_FAILURE",
        error_kind: "application_provider",
      };
    }
  },
};

/** Registry keeps Cortex free of provider hardcoding. */
export const PROVIDER_ADAPTERS = Object.freeze({
  openai: openaiAdapter,
});

export function getProviderAdapter(id) {
  const adapter = PROVIDER_ADAPTERS[id];
  if (!adapter) {
    throw new Error(`unknown provider adapter: ${id}`);
  }
  return adapter;
}
