import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canonicalIxpeMetadataProbeV563, parseIxpeMetadataProbeApiV563, parseIxpeMetadataProbeV563 } from "./ixpeMetadataProbeV563";

describe("IXPE metadata probe v563", () => {
  it("parses a blocked metadata-only receipt", () => {
    const artifact = JSON.parse(readFileSync("dist/science/ixpe-metadata-probe-v563/metadata-probe.json", "utf8"));
    const parsed = parseIxpeMetadataProbeV563(artifact);
    expect(parsed.probe.method).toBe("HEAD-only");
    expect(parsed.probe.payloadRead).toBe(false);
    expect(parsed.qualification.measuredAuthorityGranted).toBe(false);
    expect(canonicalIxpeMetadataProbeV563(parsed)).toContain("v563-ixpe-metadata-probe-v1");
  });
  it("rejects payload-read mutations", () => {
    const artifact = JSON.parse(readFileSync("dist/science/ixpe-metadata-probe-v563/metadata-probe.json", "utf8"));
    artifact.probe.payloadRead = true;
    expect(() => parseIxpeMetadataProbeV563(artifact)).toThrow();
  });
  it("keeps non-local-shadow profiles unavailable", () => {
    expect(parseIxpeMetadataProbeApiV563({ version: "v563-ixpe-metadata-probe-api-v1", available: false, reason: "lite-boundary", summary: null }).available).toBe(false);
  });
});
