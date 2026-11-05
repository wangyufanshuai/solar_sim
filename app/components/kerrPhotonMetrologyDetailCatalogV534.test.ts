import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V534,
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V534,
  KERR_PHOTON_METROLOGY_LABELS_V534,
} from "./kerrPhotonMetrologyDetailCatalogV534";

const source = readFileSync("app/components/kerrPhotonMetrologyDetailCatalogV534.ts", "utf8");

describe("v534 shared detail catalog", () => {
  it("extends v533 by exactly one lazy detail", () => {
    expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V534).toHaveLength(36);
    expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V534)).toEqual(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V534));
    expect(source).toContain("...KERR_PHOTON_METROLOGY_DETAILS_V533");
    expect((source.match(/lazy\(/g) ?? []).length).toBe(1);
  });

  it("is request-free before explicit detail intent", () => {
    expect(source).not.toContain("fetch(");
  });
});
