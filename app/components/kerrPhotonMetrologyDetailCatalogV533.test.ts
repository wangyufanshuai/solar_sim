import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V533,
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V533,
  KERR_PHOTON_METROLOGY_LABELS_V533,
} from "./kerrPhotonMetrologyDetailCatalogV533";

const source = readFileSync("app/components/kerrPhotonMetrologyDetailCatalogV533.ts", "utf8");

describe("v533 shared detail catalog", () => {
  it("extends v532 by exactly one lazy detail", () => {
    expect(KERR_PHOTON_METROLOGY_DETAIL_IDS_V533).toHaveLength(35);
    expect(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V533)).toEqual(
      Object.keys(KERR_PHOTON_METROLOGY_LABELS_V533),
    );
    expect(source).toContain("...KERR_PHOTON_METROLOGY_DETAILS_V532");
    expect((source.match(/lazy\(/g) ?? []).length).toBe(1);
  });

  it("is request-free until explicit detail intent", () => {
    expect(source).not.toContain("fetch(");
  });
});
