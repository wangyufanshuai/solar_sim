import { describe, expect, it } from "vitest";
import { KERR_PHOTON_METROLOGY_DETAIL_IDS_V556, KERR_PHOTON_METROLOGY_DETAILS_V556, KERR_PHOTON_METROLOGY_LABELS_V556 } from "./kerrPhotonMetrologyDetailCatalogV556";
describe("v556 detail catalog", () => { it("contains 57 matching lazy surfaces", () => { expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V556).toHaveLength(57); expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V556)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V556)); expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V556.at(-1)).toBe("sparse-science-products"); }); });
