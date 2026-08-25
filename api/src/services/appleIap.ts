import * as crypto from "node:crypto";
import { IAP_PRODUCT_IDS } from "../limits.js";
import { env } from "../env.js";

const VALID_PRODUCT_IDS = new Set<string>(Object.values(IAP_PRODUCT_IDS));

export type VerifiedTransaction = {
  productId: string;
  originalTransactionId: string;
  transactionId: string;
  expiresAt: Date | null;
  environment: "Sandbox" | "Production";
};

type JwsHeader = {
  alg?: string;
  x5c?: string[];
};

type TransactionPayload = {
  bundleId?: string;
  productId?: string;
  originalTransactionId?: string;
  transactionId?: string;
  expiresDate?: number;
  environment?: string;
};

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function parseJws<T>(jws: string): { header: JwsHeader; payload: T } {
  const parts = jws.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid signed transaction");
  }
  const header = JSON.parse(
    decodeBase64Url(parts[0]).toString("utf8"),
  ) as JwsHeader;
  const payload = JSON.parse(
    decodeBase64Url(parts[1]).toString("utf8"),
  ) as T;
  return { header, payload };
}

function verifyJwsSignature(jws: string, header: JwsHeader): void {
  if (env.mockIap) return;

  const x5c = header.x5c;
  if (!x5c?.length) {
    throw new Error("Signed transaction missing certificate chain");
  }

  const leafDer = Buffer.from(x5c[0], "base64");
  const publicKey = crypto.createPublicKey({
    key: leafDer,
    format: "der",
    type: "spki",
  });

  const [headerB64, payloadB64, signatureB64] = jws.split(".");
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = decodeBase64Url(signatureB64);
  const valid = crypto.verify(
    "sha256",
    Buffer.from(signingInput),
    { key: publicKey, dsaEncoding: "ieee-p1363" },
    signature,
  );

  if (!valid) {
    throw new Error("Invalid signed transaction signature");
  }
}

export function verifySignedTransaction(
  signedTransaction: string,
  expectedProductId: string,
): VerifiedTransaction {
  if (!VALID_PRODUCT_IDS.has(expectedProductId)) {
    throw new Error(`Unknown product id: ${expectedProductId}`);
  }

  const { header, payload } = parseJws<TransactionPayload>(signedTransaction);
  verifyJwsSignature(signedTransaction, header);

  if (payload.bundleId && payload.bundleId !== env.appleBundleId) {
    throw new Error("Transaction bundle id mismatch");
  }

  const productId = payload.productId ?? expectedProductId;
  if (!VALID_PRODUCT_IDS.has(productId)) {
    throw new Error("Transaction product id is not allowed");
  }

  const originalTransactionId =
    payload.originalTransactionId ?? payload.transactionId;
  if (!originalTransactionId) {
    throw new Error("Transaction missing original transaction id");
  }

  const expiresAt =
    typeof payload.expiresDate === "number"
      ? new Date(payload.expiresDate)
      : null;

  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    throw new Error("Subscription has expired");
  }

  const environment =
    payload.environment === "Sandbox" ? "Sandbox" : "Production";

  return {
    productId,
    originalTransactionId,
    transactionId: payload.transactionId ?? originalTransactionId,
    expiresAt,
    environment,
  };
}

export function isActiveSubscription(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}
