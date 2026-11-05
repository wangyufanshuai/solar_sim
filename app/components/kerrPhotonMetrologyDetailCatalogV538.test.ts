import { describe, expect, it } from "vitest";
import { KERR_PHOTON_METROLOGY_DETAILS_V538, KERR_PHOTON_METROLOGY_DETAIL_IDS_V538, KERR_PHOTON_METROLOGY_LABELS_V538 } from "./kerrPhotonMetrologyDetailCatalogV538";

describe("v538 detail catalog", () => { it("has 40 unique, label-complete, lazy details", () => { expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V538).toHaveLength(40); expect(new Set(KERR_PHOTON_METROLOGY_DETAIL_IDS_V538).size).toBe(40); expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V538)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V538)); expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V538.at(-1)).toBe("response-aware-fits-column-schema"); }); });
