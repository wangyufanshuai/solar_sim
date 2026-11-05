import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V529,
  KERR_PHOTON_METROLOGY_DETAILS_V529,
  KERR_PHOTON_METROLOGY_LABELS_V529,
} from "./kerrPhotonMetrologyDetailCatalogV529";

const source = readFileSync("app/components/kerrPhotonMetrologyDetailCatalogV529.ts", "utf8");
describe("v529 shared photon-metrology catalog", () => {
  it("extends the thirty-detail catalog by exactly one lazy surface", () => {
    expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V529).toHaveLength(31);
    expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V529)).toEqual(
      Object.keys(KERR_PHOTON_METROLOGY_LABELS_V529),
    );
    expect(Object.isFrozen(KERR_PHOTON_METROLOGY_DETAILS_V529)).toBe(true);
    expect(source).toContain("...KERR_PHOTON_METROLOGY_DETAILS_V528");
    expect((source.match(/lazy\(/g) ?? []).length).toBe(1);
  });
  it("remains request-free before explicit selection", () => {
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });
});
