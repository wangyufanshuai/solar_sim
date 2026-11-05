import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { KERR_PHOTON_METROLOGY_DETAIL_IDS_V528, KERR_PHOTON_METROLOGY_DETAILS_V528, KERR_PHOTON_METROLOGY_LABELS_V528 } from "./kerrPhotonMetrologyDetailCatalogV528";
const source = readFileSync("app/components/kerrPhotonMetrologyDetailCatalogV528.ts", "utf8");
describe("v528 shared photon-metrology catalog", () => {
  it("freezes thirty complete lazy details", () => {
    expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V528).toHaveLength(30);
    expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V528)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V528));
    expect(Object.isFrozen(KERR_PHOTON_METROLOGY_DETAILS_V528)).toBe(true);
  });
  it("keeps all components lazy and request-free", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(30);
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });
});
