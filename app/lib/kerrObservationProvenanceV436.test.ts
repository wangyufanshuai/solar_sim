import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createCinematicPresentationV436, createKerrObservationSummaryV436, createScienceObservationPayloadV436, parseKerrObservationOracleV436 } from "./kerrObservationProvenanceV436";

const oracle = JSON.parse(readFileSync("dist/science/kerr-observation-provenance-v436/observation-provenance-oracle.json", "utf8"));

describe("v436 observation provenance", () => {
  it("accepts only the four joined disk payloads and preserves unavailable boundaries", () => {
    const parsed = parseKerrObservationOracleV436(oracle);
    const summary = createKerrObservationSummaryV436(parsed);
    expect(summary.payloads).toHaveLength(4);
    expect(summary.counts.captureEscapeNotApplicableCount).toBe(96);
    expect(summary.boundary).toMatchObject({ sciencePayloadReadOnly: true, cinematicWritebackForbidden: true, denseAuthority: false });
    expect(() => parseKerrObservationOracleV436({ ...oracle, payloads: [] })).toThrow("v436-oracle-identity");
  });

  it("freezes science payloads while keeping cinematic values separate and deterministic", () => {
    const payload = createScienceObservationPayloadV436(oracle.payloads[0]);
    expect(Object.isFrozen(payload)).toBe(true);
    expect(Object.isFrozen(payload.errorBudget)).toBe(true);
    expect(createCinematicPresentationV436(436)).toEqual(createCinematicPresentationV436(436));
    expect(() => createCinematicPresentationV436(-1)).toThrow("v436-seed");
  });
});
