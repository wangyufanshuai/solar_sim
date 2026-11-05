import { describe, expect, it } from "vitest";
import {
  RELATIVITY_REFERENCE_V276_BOUNDARY,
  RELATIVITY_REFERENCE_V276_CODE_SHA,
  RELATIVITY_REFERENCE_V276_SCREEN_SHA,
  RELATIVITY_REFERENCE_V276_VERSION,
  canonicalRelativityReferenceJsonV276,
  canonicalRelativityReferenceShaJsonV276,
  compareReferenceTargetIdentityV276,
  validateRelativityReferenceV276,
  type RelativityReferenceArtifactV276,
} from "./relativityReferenceV276";

const artifact = (): RelativityReferenceArtifactV276 => ({
  version: RELATIVITY_REFERENCE_V276_VERSION,
  generatedAt: "2026-01-01T00:00:00.000Z",
  manifestSha256: "a".repeat(64),
  manifest: {
    version: RELATIVITY_REFERENCE_V276_VERSION,
    authority: "offline-cpu-reference",
    primarySolver: "scipy-dop853",
    independentSolver: "rebound-ias15",
    precision: "float64",
    stateDimension: 72,
    variationalParameterDimension: 66,
    integratedStateAndPhiDimension: 4824,
    targetIdentityRule: "target-kind-and-origin-must-match-before-comparison",
    models: [
      "barycentric-nbody-eih-1pn-v276",
      "barycentric-nbody-eih-1pn+solar-j2-v276",
      "barycentric-nbody-eih-1pn+solar-monopole-2pn+solar-lt-v276",
    ],
    canonicalShaExcludes: ["generatedAt", "host", "pid", "absolutePath"],
  },
  targets: [{
    id: "jupiter-barycenter",
    label: "Jupiter system barycenter",
    naifTargetId: 5,
    horizonsCommand: "COMMAND='@5'",
    targetKind: "planetary-system-barycenter",
    frame: "ICRF/J2000",
    origin: "solar-system-barycenter",
    tdbEpoch: "2000-01-01T12:00:00Z",
    units: { position: "m", velocity: "m/s", gravitationalParameter: "m^3/s^2" },
    gmSource: "DE440s",
    gmSI: 1.2668653491037e17,
  }],
  forceModel: {
    kernelId: "barycentric-nbody-eih-1pn-v276",
    bodyCount: 12,
    coordinateGauge: "harmonic-barycentric",
    primaryFrame: "ICRF/J2000",
    origin: "solar-system-barycenter",
    includesNewtonianNBody: true,
    includesEihOnePn: true,
    includesSolarJ2: false,
    includesSolarMonopole2Pn: false,
    includesSolarLenseThirring: false,
    claimsGrmhd: false,
  },
  window: { calibrationDays: [0, 30], fitRuns: 3, blindHoldoutDays: [365, 3652.5], checkpointSchema: "relativity-reference-checkpoint-v276" },
  uncertaintyBudget: {
    uDiscretization: 1,
    uSolver: 2,
    uReference: 3,
    uInitialState: 4,
    uFit: 5,
    uConstants: 6,
    uModel: 7,
    unit: "m",
    aggregation: "linear-no-independence-proof",
    total: 28,
  },
  oracle: {
    id: "mp-oracle-v276",
    backend: "python-decimal",
    decimalDigits: 80,
    scope: ["two-body", "schwarzschild-analytic", "kerr-critical-curve"],
    status: "not-run",
    fixtureCount: 0,
    outputSha256: null,
    lowMemoryMode: true,
    fullNBodyAuthority: false,
  },
  provenance: {
    scienceCodeSha256: RELATIVITY_REFERENCE_V276_CODE_SHA,
    screenSha256: RELATIVITY_REFERENCE_V276_SCREEN_SHA,
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrMutation: "not-applied",
  },
  boundary: RELATIVITY_REFERENCE_V276_BOUNDARY,
});

describe("v276 relativity reference contracts", () => {
  it("validates the immutable, target-identity-aware schema", () => {
    const result = validateRelativityReferenceV276(artifact(), "a".repeat(64));
    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it("fails closed when barycenter and body-center identities are compared", () => {
    const base = artifact().targets[0];
    const comparison = compareReferenceTargetIdentityV276(base, {
      ...base,
      targetKind: "body-center",
      origin: "body-center",
    });
    expect(comparison.comparable).toBe(false);
    expect(comparison.reasons).toContain("target-kind-mismatch");
    expect(comparison.reasons).toContain("origin-mismatch");
  });

  it("uses sorted canonical JSON and keeps protected SHA fields visible", () => {
    const first = canonicalRelativityReferenceJsonV276({ b: 1, a: { z: 2, y: 3 } });
    const second = canonicalRelativityReferenceJsonV276({ a: { y: 3, z: 2 }, b: 1 });
    expect(first).toBe(second);
    expect(artifact().provenance.scienceCodeSha256).toBe(RELATIVITY_REFERENCE_V276_CODE_SHA);
    expect(artifact().provenance.screenSha256).toBe(RELATIVITY_REFERENCE_V276_SCREEN_SHA);
    expect(canonicalRelativityReferenceShaJsonV276({ generatedAt: "a", value: { z: 1, y: 2 } }))
      .toBe(canonicalRelativityReferenceShaJsonV276({ generatedAt: "b", value: { y: 2, z: 1 } }));
  });

  it("rejects invalid uncertainty totals and force-model boundaries", () => {
    const base = artifact();
    const invalid = {
      ...base,
      uncertaintyBudget: { ...base.uncertaintyBudget, total: 1 },
      forceModel: { ...base.forceModel, claimsGrmhd: true },
    } as unknown as RelativityReferenceArtifactV276;
    const result = validateRelativityReferenceV276(invalid);
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(expect.arrayContaining(["uncertainty-budget-invalid", "force-model-contract-invalid"]));
  });
});
