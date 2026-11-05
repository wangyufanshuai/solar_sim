import { describe, expect, it } from "vitest";
import { buildPack } from "../../scripts/build-mainline-a-canonical-coverage-v622";
import { coverageFreezeCandidateV622, coverageGateOpenReasonsV622, coverageKindCoveragePercentV622, coverageManifestSummaryV622, coveragePackValidationErrorsV622, coverageReportJsonlV622, coverageRowsByKindV622, normalizeCoverageIdV622 } from "./mainlineACanonicalCoverageV622";

const pack = buildPack();

describe("typed canonical coverage helpers", () => {
  it("normalizes ids and retains exact target counts", () => {
    expect(normalizeCoverageIdV622(" Alpha_Centauri A ")).toBe("alpha-centauri-a");
    expect(coverageKindCoveragePercentV622(pack as never, "star")).toBe(100);
  });
  it("groups each kind deterministically", () => {
    expect(coverageRowsByKindV622(pack as never, "nebula")).toHaveLength(12);
    expect(coverageRowsByKindV622(pack as never, "constellation")[0].kind).toBe("constellation");
  });
  it("reports the pending freeze gates", () => {
    const summary = coverageManifestSummaryV622(pack as never);
    expect(summary.pending).toBe(36);
    expect(coverageGateOpenReasonsV622(pack as never)).toContain("constellation visual signoff pending");
    expect(coverageFreezeCandidateV622(pack as never).eligible).toBe(false);
  });
  it("serializes a stable row report", () => {
    const jsonl = coverageReportJsonlV622(pack as never);
    expect(jsonl.split("\n").filter(Boolean)).toHaveLength(37);
    expect(jsonl).toContain('"section":"summary"');
  });
  it("fails closed for a tampered route", () => {
    const tampered = { ...pack, records: [{ ...pack.records[0], route: { ...pack.records[0].route, route: "../escape" } }, ...pack.records.slice(1)] };
    expect(coveragePackValidationErrorsV622(tampered as never)).toContain("star:alpha-centauri-a:route-invalid");
  });
});
