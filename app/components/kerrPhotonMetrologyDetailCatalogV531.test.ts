import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { KERR_PHOTON_METROLOGY_DETAIL_IDS_V531, KERR_PHOTON_METROLOGY_DETAILS_V531, KERR_PHOTON_METROLOGY_LABELS_V531 } from "./kerrPhotonMetrologyDetailCatalogV531";
const source = readFileSync("app/components/kerrPhotonMetrologyDetailCatalogV531.ts", "utf8");
describe("v531 shared photon-metrology catalog", () => {
  it("extends the thirty-two-detail catalog by exactly one lazy surface", () => { expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V531).toHaveLength(33); expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V531)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V531)); expect(Object.isFrozen(KERR_PHOTON_METROLOGY_DETAILS_V531)).toBe(true); expect(source).toContain("...KERR_PHOTON_METROLOGY_DETAILS_V530"); expect((source.match(/lazy\(/g) ?? []).length).toBe(1); });
  it("remains request-free before explicit selection", () => { expect(source).not.toContain("fetch("); expect(source).not.toContain("useEffect"); });
});
