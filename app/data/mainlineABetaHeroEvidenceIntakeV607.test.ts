import { describe, expect, it } from "vitest";
import { MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE } from "./mainlineABetaHeroEvidenceIntakeV607";

describe("Mainline A Beta hero evidence intake", () => {
  it("keeps all pending heroes source-addressable but measurement-unadmitted", () => {
    expect(MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.map((hero) => hero.id)).toEqual(["acrux", "spica", "regulus", "polaris"]);
    expect(MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.every((hero) => hero.status === "awaiting-snapshot-ingest")).toBe(true);
    expect(MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.every((hero) => hero.measurementAdmission === "not-admitted")).toBe(true);
    expect(MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.every((hero) => hero.simbadUrl.includes("simbad.cds.unistra.fr/simbad/sim-id?Ident="))).toBe(true);
  });
});
