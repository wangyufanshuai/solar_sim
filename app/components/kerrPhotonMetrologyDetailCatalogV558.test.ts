import { describe, expect, it } from "vitest";
import { KERR_PHOTON_METROLOGY_DETAIL_IDS_V558, KERR_PHOTON_METROLOGY_DETAILS_V558, KERR_PHOTON_METROLOGY_LABELS_V558 } from "./kerrPhotonMetrologyDetailCatalogV558";
describe("v558 detail catalog", () => { it("contains 59 matching lazy surfaces", () => { expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V558).toHaveLength(59); expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V558)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V558)); expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V558.at(-1)).toBe("response-provenance-pack"); }); });
