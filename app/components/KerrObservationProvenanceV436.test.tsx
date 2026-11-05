import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseKerrObservationOracleV436 } from "../lib/kerrObservationProvenanceV436";

describe("v436 workbench boundary", () => {
  it("keeps the scientific/cinematic contract explicit", () => {
    const oracle = parseKerrObservationOracleV436(JSON.parse(readFileSync("dist/science/kerr-observation-provenance-v436/observation-provenance-oracle.json", "utf8")));
    expect(oracle.contract.scienceRenderer.bloom).toBe(false);
    expect(oracle.contract.cinematicRenderer.seedRequired).toBe(true);
    expect(oracle.contract.cinematicRenderer.writebackForbidden).toBe(true);
  });
});
