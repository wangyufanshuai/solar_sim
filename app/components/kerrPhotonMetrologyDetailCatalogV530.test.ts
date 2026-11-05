import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V530,
  KERR_PHOTON_METROLOGY_DETAILS_V530,
  KERR_PHOTON_METROLOGY_LABELS_V530,
} from "./kerrPhotonMetrologyDetailCatalogV530";

const source = readFileSync("app/components/kerrPhotonMetrologyDetailCatalogV530.ts", "utf8");
describe("v530 shared photon-metrology catalog", () => {
  it("extends the thirty-one-detail catalog by exactly one lazy surface", () => {
    expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V530).toHaveLength(32);
    expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V530)).toEqual(
      Object.keys(KERR_PHOTON_METROLOGY_LABELS_V530),
    );
    expect(Object.isFrozen(KERR_PHOTON_METROLOGY_DETAILS_V530)).toBe(true);
    expect(source).toContain("...KERR_PHOTON_METROLOGY_DETAILS_V529");
    expect((source.match(/lazy\(/g) ?? []).length).toBe(1);
  });
  it("remains request-free before explicit selection", () => {
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });
});
