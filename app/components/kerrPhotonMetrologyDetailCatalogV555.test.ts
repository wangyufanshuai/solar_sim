import { describe, expect, it } from "vitest";
import { KERR_PHOTON_METROLOGY_DETAIL_IDS_V555, KERR_PHOTON_METROLOGY_DETAILS_V555, KERR_PHOTON_METROLOGY_LABELS_V555 } from "./kerrPhotonMetrologyDetailCatalogV555";
describe("v555 detail catalog", () => { it("contains 56 matching lazy surfaces", () => { expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V555).toHaveLength(56); expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V555)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V555)); expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V555.at(-1)).toBe("sparse-science-image"); }); });
