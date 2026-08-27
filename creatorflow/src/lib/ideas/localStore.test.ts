import { beforeEach, describe, expect, it } from "vitest";
import { hasCloudMigrated, markCloudMigrated } from "./localStore";

describe("cloud migrate-once flag", () => {
  beforeEach(() => {
    localStorage.removeItem("cf-ideas-cloud-migrated");
  });

  it("starts unmigrated", () => {
    expect(hasCloudMigrated()).toBe(false);
  });

  it("locks after the first local → cloud pass", () => {
    markCloudMigrated();
    expect(hasCloudMigrated()).toBe(true);
  });
});
