import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Mainline A local-shadow browser resource baseline", () => {
  it("keeps the corrected Round 37 receipt anchored to a healthy asset delivery run", () => {
    const receipt = JSON.parse(
      readFileSync("docs/release/v607/mainline-a-art-round-37-20260913.json", "utf8"),
    ) as {
      status: string;
      browser: {
        deliveryProfile: string;
        contentPackAssetCount: number;
        requestFailures: number;
        assetTransferBytes: number;
      };
    };
    expect(receipt.status).toBe("verified-browser-performance-baseline");
    expect(receipt.browser.deliveryProfile).toBe("local-shadow");
    expect(receipt.browser.contentPackAssetCount).toBe(14);
    expect(receipt.browser.requestFailures).toBe(0);
    expect(receipt.browser.assetTransferBytes).toBe(25566471);
  });
});
