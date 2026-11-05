import { describe, expect, it } from "vitest";
import { KERR_PHOTON_METROLOGY_DETAILS_V540, KERR_PHOTON_METROLOGY_DETAIL_IDS_V540, KERR_PHOTON_METROLOGY_LABELS_V540 } from "./kerrPhotonMetrologyDetailCatalogV540";

describe("v540 detail catalog", () => { it("has 42 unique, label-complete, lazy details", () => { expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V540).toHaveLength(42); expect(new Set(KERR_PHOTON_METROLOGY_DETAIL_IDS_V540).size).toBe(42); expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V540)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V540)); expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V540.at(-1)).toBe("response-aware-offline-replay"); }); });
