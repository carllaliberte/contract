export interface PurchaseResult {
  productId: string;
  signedTransaction: string;
}

export interface RestoreResult {
  activeProductId: string | null;
  signedTransaction?: string;
}

export interface CreatorFlowStoreKitPlugin {
  purchase(options: { productId: string }): Promise<PurchaseResult>;
  restore(): Promise<RestoreResult>;
}
