import { describe, expect, it } from "vitest";
import {
  isActiveSubscription,
  verifySignedTransaction,
} from "./appleIap.js";

function mockSignedTransaction(input: {
  productId: string;
  bundleId?: string;
  expiresDate?: number;
}): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "ES256", x5c: [] }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      bundleId: input.bundleId ?? "com.carllaliberte.creatorflow",
      productId: input.productId,
      originalTransactionId: "orig-1",
      transactionId: "txn-1",
      expiresDate:
        input.expiresDate ?? Date.now() + 30 * 24 * 60 * 60 * 1000,
      environment: "Sandbox",
    }),
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

describe("verifySignedTransaction", () => {
  it("accepts valid mock transactions in memory-store mode", () => {
    const verified = verifySignedTransaction(
      mockSignedTransaction({ productId: "cf_pro_yearly" }),
      "cf_pro_yearly",
    );
    expect(verified.productId).toBe("cf_pro_yearly");
    expect(verified.originalTransactionId).toBe("orig-1");
    expect(isActiveSubscription(verified.expiresAt)).toBe(true);
  });

  it("rejects expired subscriptions", () => {
    expect(() =>
      verifySignedTransaction(
        mockSignedTransaction({
          productId: "cf_pro_monthly",
          expiresDate: Date.now() - 1000,
        }),
        "cf_pro_monthly",
      ),
    ).toThrow(/expired/i);
  });

  it("rejects bundle id mismatch", () => {
    expect(() =>
      verifySignedTransaction(
        mockSignedTransaction({
          productId: "cf_pro_monthly",
          bundleId: "com.other.app",
        }),
        "cf_pro_monthly",
      ),
    ).toThrow(/bundle id mismatch/i);
  });
});
