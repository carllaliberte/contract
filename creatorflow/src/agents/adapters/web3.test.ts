import { describe, expect, it, vi } from "vitest";
import { isNativePlatform } from "../../lib/platform";
import { web3Adapter } from "./web3";

vi.mock("../../lib/platform", () => ({
  isNativePlatform: vi.fn(() => false),
}));

describe("web3 adapter", () => {
  it("is unavailable when the flag is off", () => {
    vi.mocked(isNativePlatform).mockReturnValue(false);
    expect(web3Adapter.available()).toBe(false);
  });

  it("never exposes a wallet payload", async () => {
    const result = await web3Adapter.run({
      ideaId: "x",
      prompt: "test",
    } as never);
    expect(result.text.toLowerCase()).not.toMatch(/0x|wallet|meta|rpc/);
    expect(result.text).toMatch(/connecteur/i);
  });
});
