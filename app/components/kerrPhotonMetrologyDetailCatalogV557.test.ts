import { describe, expect, it } from "vitest";
import { KERR_PHOTON_METROLOGY_DETAIL_IDS_V557, KERR_PHOTON_METROLOGY_DETAILS_V557, KERR_PHOTON_METROLOGY_LABELS_V557 } from "./kerrPhotonMetrologyDetailCatalogV557";
describe("v557 detail catalog", () => { it("contains 58 matching lazy surfaces", () => { expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V557).toHaveLength(58); expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V557)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V557)); expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V557.at(-1)).toBe("sparse-coordinate-products"); }); });
