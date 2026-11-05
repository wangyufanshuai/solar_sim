import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createKerrScienceBandUncertaintyProvenanceV326,
  parseKerrScienceBandUncertaintyProvenanceV326,
  serializeKerrScienceBandUncertaintyProvenanceCsvV326,
  serializeKerrScienceBandUncertaintyProvenanceJsonV326,
} from "./kerrScienceBandUncertaintyProvenanceV326";
import { parseKerrScienceBandUncertaintyViewV325 } from "./kerrScienceBandUncertaintyV325";

const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-band-uncertainty-v325/componentwise-envelope.json"), "utf8"));
const view = parseKerrScienceBandUncertaintyViewV325(artifact.view);

describe("v326 uncertainty provenance", () => {
  it("exports one sanitized row per authority ray and fixed band", async () => {
    const first = await createKerrScienceBandUncertaintyProvenanceV326(view);
    const second = await createKerrScienceBandUncertaintyProvenanceV326(view);
    expect(first.canonicalSha256).toBe(second.canonicalSha256);
    expect(first.rows).toHaveLength(12);
    expect(new Set(first.rows.map((row) => row.rayIndex))).toEqual(new Set([12, 13, 14, 15]));
    expect(new Set(first.rows.map((row) => row.bandId))).toEqual(new Set(["visible", "euv", "soft-x-ray"]));
    expect(parseKerrScienceBandUncertaintyProvenanceV326(JSON.parse(serializeKerrScienceBandUncertaintyProvenanceJsonV326(first)))).toEqual(first);
    const csv = serializeKerrScienceBandUncertaintyProvenanceCsvV326(first);
    expect(csv.trim().split("\n")).toHaveLength(13);
    expect(csv).toContain("linear-sum-without-independence-claim-no-rss");
    expect(csv).not.toContain("absolutePath");
    expect(csv).not.toContain("rayBuffer");
    expect(csv).not.toContain("screenshot");
  });

  it("rejects injected raw buffers or an invalid dense claim", async () => {
    const provenance = await createKerrScienceBandUncertaintyProvenanceV326(view);
    expect(() => parseKerrScienceBandUncertaintyProvenanceV326({ ...provenance, rayBuffer: [] })).toThrow("v326-uncertainty-provenance-identity");
    expect(() => parseKerrScienceBandUncertaintyProvenanceV326({ ...provenance, source: { ...provenance.source, denseAggregateSha256: "a".repeat(64) } })).toThrow("v326-uncertainty-provenance-identity");
  });
});
