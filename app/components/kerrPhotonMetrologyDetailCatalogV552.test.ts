import { describe, expect, it } from "vitest";
import { KERR_PHOTON_METROLOGY_DETAIL_IDS_V552, KERR_PHOTON_METROLOGY_DETAILS_V552, KERR_PHOTON_METROLOGY_LABELS_V552 } from "./kerrPhotonMetrologyDetailCatalogV552";

describe("v552 detail catalog", () => {
  it("contains exactly 54 lazy detail surfaces with matching labels", () => {
    expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V552).toHaveLength(54);
    expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V552)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V552));
    expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V552.at(-1)).toBe("license-confirmation-packet");
  });
});
