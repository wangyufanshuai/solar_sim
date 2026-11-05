import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packJson from "../data/mainlineABetaStellarRosterEvidenceV642.generated.json";
import {
  MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642,
  MAINLINE_A_BETA_STELLAR_EVIDENCE_PLAN_V642,
  canonicalEvidenceValueV642,
  evidenceNegativeMutationV642,
  evidenceSummaryV642,
  validateMainlineABetaStellarRosterEvidenceV642,
  type MainlineABetaStellarEvidencePackV642,
} from "./mainlineABetaStellarRosterEvidenceV642";

const pack = packJson as unknown as MainlineABetaStellarEvidencePackV642;

describe("Mainline A Beta stellar evidence V642", () => {
  it("keeps the six evidence classes separate", () => {
    expect(MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642).toEqual(["static", "http", "visual", "browser", "performance", "external-source"]);
    expect(pack.records.map((record) => record.id)).toEqual(MAINLINE_A_BETA_STELLAR_EVIDENCE_PLAN_V642.map((record) => record.id));
    expect(pack.records.map((record) => record.evidenceClass)).toContain("external-source");
  });

  it("validates the generated plan and keeps the candidate boundary closed", () => {
    expect(validateMainlineABetaStellarRosterEvidenceV642(pack)).toEqual([]);
    expect(pack.roster.total).toBe(24);
    expect(pack.roster.runtimeExisting).toBe(20);
    expect(pack.roster.candidateHold).toBe(4);
    expect(pack.roster.componentConfirmed).toBe(0);
    expect(pack.boundary).toMatchObject({ candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false });
    expect(pack.claims).toMatchObject({ browserAcceptance: false, productionPerformance: false, copyrightApproval: false });
  });

  it("does not change the canonical value when object insertion order changes", () => {
    const left = canonicalEvidenceValueV642({ z: 1, a: { d: false, c: [2, 1] } });
    const right = canonicalEvidenceValueV642({ a: { c: [2, 1], d: false }, z: 1 });
    expect(JSON.stringify(left)).toBe(JSON.stringify(right));
  });

  it("rejects build mismatches, unsafe claims, external promotion and missing rows", () => {
    expect(validateMainlineABetaStellarRosterEvidenceV642(evidenceNegativeMutationV642(pack, "wrong-build"))).toContain("static-v641-roster:buildId");
    expect(validateMainlineABetaStellarRosterEvidenceV642(evidenceNegativeMutationV642(pack, "visual-claim"))).toContain("visual-desktop:unverified-claim");
    expect(validateMainlineABetaStellarRosterEvidenceV642(evidenceNegativeMutationV642(pack, "external-pass"))).toContain("external-stellar-identity:external-pass-forbidden");
    expect(validateMainlineABetaStellarRosterEvidenceV642(evidenceNegativeMutationV642(pack, "missing-record"))).toContain("record-count-invalid");
  });

  it("reports plan-only counts without inventing observations", () => {
    const summary = evidenceSummaryV642(pack);
    expect(summary.total).toBe(11);
    expect(summary.required).toBe(10);
    expect(summary.observed).toBe(0);
    expect(summary.pending).toBe(9);
    expect(summary.blocked).toBe(2);
    expect(summary.buildBound).toBe(false);
    expect(readFileSync("app/data/mainlineABetaStellarRosterEvidenceV642.generated.json", "utf8")).toContain("scientificPayloadWriteback");
  });
});
