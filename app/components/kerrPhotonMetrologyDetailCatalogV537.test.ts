import { describe, expect, it } from "vitest";

import { KERR_PHOTON_METROLOGY_DETAILS_V537, KERR_PHOTON_METROLOGY_DETAIL_IDS_V537, KERR_PHOTON_METROLOGY_LABELS_V537 } from "./kerrPhotonMetrologyDetailCatalogV537";

describe("v537 detail catalog", () => {
  it("has 39 unique, label-complete, lazy details", () => {
    expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V537).toHaveLength(39);
    expect(new Set(KERR_PHOTON_METROLOGY_DETAIL_IDS_V537).size).toBe(39);
    expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V537)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V537));
    expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V537.at(-1)).toBe("response-aware-sparse-fits");
  });
});
