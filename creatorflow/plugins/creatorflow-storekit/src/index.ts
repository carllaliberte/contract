import { registerPlugin } from "@capacitor/core";
import type { CreatorFlowStoreKitPlugin } from "./definitions";

const CreatorFlowStoreKit = registerPlugin<CreatorFlowStoreKitPlugin>(
  "CreatorFlowStoreKit",
  {
    web: () => import("./web").then((m) => new m.CreatorFlowStoreKitWeb()),
  },
);

export * from "./definitions";
export { CreatorFlowStoreKit };
