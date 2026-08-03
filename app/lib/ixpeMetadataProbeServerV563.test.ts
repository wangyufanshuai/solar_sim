import { afterEach, describe, expect, it } from "vitest";
import { loadIxpeMetadataProbeV563, resetIxpeMetadataProbeServerCacheForTestsV563 } from "./ixpeMetadataProbeServerV563";

describe("IXPE metadata probe server v563", () => {
  afterEach(() => resetIxpeMetadataProbeServerCacheForTestsV563());
  it("loads the immutable fail-closed receipt", async () => {
    const artifact = await loadIxpeMetadataProbeV563();
    expect(["blocked-no-metadata-manifest", "blocked-metadata-identity-conflict"]).toContain(artifact.status);
    expect(artifact.boundary.eventPayloadRead).toBe(false);
  });
});
