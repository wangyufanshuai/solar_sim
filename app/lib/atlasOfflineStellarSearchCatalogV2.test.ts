import { describe, expect, it } from "vitest";
import { createAtlasOfflineStellarSearchCatalogV2Summary } from "./atlasOfflineStellarSearchCatalogV2";

describe("v116 offline stellar search catalog v2", () => {
  it("keeps search capacity separate from the frozen render catalog", () => {
    const summary = createAtlasOfflineStellarSearchCatalogV2Summary();
    expect(summary.searchRowCount).toBe(100000);
    expect(summary.renderRowCount).toBe(5000);
    expect(summary.shardCount).toBe(16);
    expect(summary.runtimePolicy).toBe("offline-sharded-no-runtime-network");
    expect(summary.protectedMutation).toBe("not-applied");
  });
});
