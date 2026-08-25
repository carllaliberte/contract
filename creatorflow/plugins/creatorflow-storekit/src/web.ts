import { WebPlugin } from "@capacitor/core";
import type {
  CreatorFlowStoreKitPlugin,
  PurchaseResult,
  RestoreResult,
} from "./definitions";

export class CreatorFlowStoreKitWeb extends WebPlugin implements CreatorFlowStoreKitPlugin {
  async purchase(): Promise<PurchaseResult> {
    throw this.unavailable("StoreKit is only available on iOS");
  }

  async restore(): Promise<RestoreResult> {
    throw this.unavailable("StoreKit is only available on iOS");
  }
}
