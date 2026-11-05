import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  STRONG_GRAVITY_RENDERER_BOUNDARY_V299,
  KERR_SCIENCE_DISK_INNER_EDGE_MODEL_V299,
  KERR_SCIENCE_DISK_OUTER_RADIUS_M_V299,
  KERR_SCIENCE_EMITTER_FRAME_VERSION_V299,
  KERR_SCIENCE_EMITTER_SOURCE_SHA256_V299,
  KERR_SCIENCE_OBSERVER_FRAME_VERSION_V299,
  KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299,
  KERR_SCIENCE_PARALLEL_TRANSPORT_MODEL_V299,
  KERR_SCIENCE_PARALLEL_TRANSPORT_RELEASE_TOLERANCE_V299,
  KERR_SCIENCE_RELEASE_EVPA_DIFFERENCE_LIMIT_DEG_V299,
  KERR_SCIENCE_RELEASE_POLARIZATION_ENDPOINT_LIMIT_V299,
  KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299,
  KERR_SCIENCE_FORMULA_DISK_RADIUS_DIFFERENCE_LIMIT_M_V299,
  KERR_SCIENCE_FORMULA_REDSHIFT_DIFFERENCE_LIMIT_V299,
  KERR_SCIENCE_KS_METRIC_DERIVATIVE_LIMIT_V299,
  KERR_SCIENCE_RELEASE_RESIDUAL_LIMIT_V299,
  KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299,
  KERR_SCIENCE_WALKER_PENROSE_MODEL_V299,
  cloneKerrScienceTransferPayloadV299,
  createSparseKerrSciencePayloadV299,
  encodeKerrSciencePixelV299,
  evpaDifferenceDegV299,
  observedThinDiskIntensityV299,
  replayProjectedDiskNormalPolarizationV299,
  resolveKerrCircularEmitterV299,
  validateKerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";
import { KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1 } from "./kerrCampaignV298R1";

describe("v299 strong-gravity science/cinematic boundary", () => {
  const geometry = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"), "utf8"));
  const polarization = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v297/polarization-short-gate.json"), "utf8"));
  const rayPlan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/ray-plan.json"), "utf8"));
  const canonicalRayView = {
    version: "v299-kerr-canonical-ray-view-v1",
    planSha256: rayPlan.planSha256,
    planFileSha256: KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1,
    canonicalRays: rayPlan.rays.slice(0, 16),
  };

  it("creates only the qualified sparse 16-ray science payload", () => {
    const payload = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
    expect(payload.sampleCount).toBe(16);
    expect(payload.authorityKind).toBe("v296-v297-short-gate-sparse");
    expect(payload.denseCampaignComplete).toBe(false);
    expect([...payload.classification].filter((value) => value === 1)).toHaveLength(6);
    expect([...payload.classification].filter((value) => value === 2)).toHaveLength(6);
    expect([...payload.classification].filter((value) => value === 3)).toHaveLength(4);
    expect([...payload.evpaApplicable].filter(Boolean)).toHaveLength(4);
    expect(Math.max(...payload.evpaDifferenceDeg.filter(Number.isFinite))).toBeLessThan(KERR_SCIENCE_RELEASE_EVPA_DIFFERENCE_LIMIT_DEG_V299);
    expect(validateKerrScienceTransferPayloadV299(payload)).toEqual({ passed: true, failures: [] });
  });

  it("locks the finite-distance ZAMO observer and both tetrad residuals", () => {
    const payload = cloneKerrScienceTransferPayloadV299(createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView));
    expect(payload).toMatchObject({
      observerFrameVersion: KERR_SCIENCE_OBSERVER_FRAME_VERSION_V299,
      observerRadiusM: 30,
      observerInclinationDeg: 70,
      observerSourceSha256: KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299,
    });
    expect(Math.max(...payload.tetradResidual)).toBeLessThan(KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299);
    expect(Math.max(...payload.kerrSchildTetradResidual)).toBeLessThan(KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299);

    payload.tetradResidual[0] = KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299;
    payload.kerrSchildTetradResidual[1] = KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toEqual(expect.arrayContaining([
      "carter-tetrad-residual",
      "ks-tetrad-residual",
    ]));
  });

  it("rejects observer identity or authority-source drift", () => {
    const payload = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
    const tamperedObserver = {
      ...payload,
      observerSourceSha256: "a".repeat(64),
    } as unknown as typeof payload;
    expect(validateKerrScienceTransferPayloadV299(tamperedObserver).failures).toContain("observer-frame-identity");

    const tamperedGeometry = structuredClone(geometry);
    tamperedGeometry.baseAuthoritySourceSha256 = "a".repeat(64);
    expect(() => createSparseKerrSciencePayloadV299(tamperedGeometry, polarization, canonicalRayView))
      .toThrow("v299 observer authority source mismatch");
  });

  it("replays the frozen circular emitter and k.u redshift sample by sample", () => {
    const payload = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
    expect(payload).toMatchObject({
      emitterFrameVersion: KERR_SCIENCE_EMITTER_FRAME_VERSION_V299,
      emitterSourceSha256: KERR_SCIENCE_EMITTER_SOURCE_SHA256_V299,
      diskInnerEdgeModel: KERR_SCIENCE_DISK_INNER_EDGE_MODEL_V299,
      diskOuterRadiusM: KERR_SCIENCE_DISK_OUTER_RADIUS_M_V299,
    });
    const emitterSourceSha256 = createHash("sha256")
      .update(readFileSync(resolve(process.cwd(), "scripts/run-kerr-polarization-v297.py")))
      .digest("hex");
    expect(emitterSourceSha256).toBe(KERR_SCIENCE_EMITTER_SOURCE_SHA256_V299);

    for (let index = 0; index < payload.sampleCount; index += 1) {
      if (payload.classification[index] !== 3) {
        expect(payload.emitterUt[index]).toBe(Number.NaN);
        expect(payload.emitterPhotonFrequency[index]).toBe(Number.NaN);
        continue;
      }
      const replay = resolveKerrCircularEmitterV299(
        payload.spinA[index],
        payload.emissionRadiusM[index],
        payload.photonEnergy[index],
        payload.photonAngularMomentumZ[index],
      );
      expect(payload.emitterAngularVelocity[index]).toBeCloseTo(replay.angularVelocity, 14);
      expect(payload.emitterUt[index]).toBeCloseTo(replay.uT, 14);
      expect(payload.emitterUphi[index]).toBeCloseTo(replay.uPhi, 14);
      expect(payload.emitterPhotonFrequency[index]).toBeCloseTo(replay.photonFrequency, 14);
      expect(payload.redshiftFactor[index]).toBeCloseTo(1 / replay.photonFrequency, 14);
      expect(payload.emitterFourVelocityNormResidual[index]).toBeLessThan(KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299);
      expect(payload.emitterWaveOrthogonalityResidual[index]).toBeLessThan(KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299);
      expect(payload.emitterPolarizationOrthogonalityResidual[index]).toBeLessThan(KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299);
      expect(payload.emitterPolarizationNormResidual[index]).toBeLessThan(KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299);
    }
  });

  it("fails closed on emitter identity, four-velocity, disk-boundary or projection drift", () => {
    const payload = cloneKerrScienceTransferPayloadV299(createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView));
    const diskIndex = [...payload.classification].findIndex((value) => value === 3);
    const tamperedIdentity = {
      ...payload,
      emitterSourceSha256: "a".repeat(64),
    } as unknown as typeof payload;
    expect(validateKerrScienceTransferPayloadV299(tamperedIdentity).failures).toContain("emitter-frame-identity");

    payload.emitterUt[diskIndex] += 0.01;
    payload.emitterPolarizationNormResidual[diskIndex] = KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299;
    payload.emissionRadiusM[diskIndex] = KERR_SCIENCE_DISK_OUTER_RADIUS_M_V299 + 1;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toEqual(expect.arrayContaining([
      "disk-radius-boundary",
      "emitter-four-velocity-conservation",
      "emitter-polarization-projection",
    ]));
  });

  it("replays the disk event, projected polarization vector and complex WP constant", () => {
    const payload = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
    for (let index = 0; index < payload.sampleCount; index += 1) {
      if (payload.classification[index] !== 3) continue;
      const replay = replayProjectedDiskNormalPolarizationV299(
        payload.spinA[index],
        [payload.diskEventCoordinateT[index], payload.emissionRadiusM[index], payload.diskEventCoordinateTheta[index], payload.diskEventCoordinatePhi[index]],
        [payload.photonWavevectorT[index], payload.photonWavevectorR[index], payload.photonWavevectorTheta[index], payload.photonWavevectorPhi[index]],
      );
      expect([
        payload.polarizationVectorT[index],
        payload.polarizationVectorR[index],
        payload.polarizationVectorTheta[index],
        payload.polarizationVectorPhi[index],
      ]).toEqual(replay.polarization);
      expect(payload.photonEnergy[index]).toBeCloseTo(replay.photonEnergy, 14);
      expect(payload.photonAngularMomentumZ[index]).toBeCloseTo(replay.photonAngularMomentumZ, 14);
      expect(payload.walkerPenroseConstantReal[index]).toBeCloseTo(replay.walkerPenroseConstantReal, 12);
      expect(payload.walkerPenroseConstantImaginary[index]).toBeCloseTo(replay.walkerPenroseConstantImaginary, 12);
    }
  });

  it("rejects disk seed, polarization vector or WP constant drift", () => {
    const source = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
    const payload = cloneKerrScienceTransferPayloadV299(source);
    const diskIndex = [...payload.classification].findIndex((value) => value === 3);
    payload.photonWavevectorR[diskIndex] += 0.05;
    payload.polarizationVectorTheta[diskIndex] += 0.05;
    payload.walkerPenroseConstantReal[diskIndex] += 1;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toContain("polarization-projection-replay");
    expect(source.photonWavevectorR[diskIndex]).not.toBe(payload.photonWavevectorR[diskIndex]);

    const tamperedGeometry = structuredClone(geometry);
    const diskRow = tamperedGeometry.executions.find((row: { rayId: string; formulation: string; toleranceClass: string; branch: string }) => row.rayId === "disk-00"
      && row.formulation === "carter-mino-dop853-constraint-stabilized-v296"
      && row.toleranceClass === "release"
      && row.branch === "A");
    diskRow.polarizationSeed.wavevectorBl[1] += 0.05;
    expect(() => createSparseKerrSciencePayloadV299(tamperedGeometry, polarization, canonicalRayView))
      .toThrow("v299 sparse polarization mismatch");
  });

  it("retains the independent KS parallel-transport execution provenance", () => {
    const payload = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
    expect(payload.walkerPenroseModel).toBe(KERR_SCIENCE_WALKER_PENROSE_MODEL_V299);
    expect(payload.parallelTransportModel).toBe(KERR_SCIENCE_PARALLEL_TRANSPORT_MODEL_V299);
    for (let index = 0; index < payload.sampleCount; index += 1) {
      if (payload.classification[index] !== 3) {
        expect(payload.parallelTransportSolverTolerance[index]).toBe(Number.NaN);
        expect(payload.parallelTransportStepCount[index]).toBe(0);
        expect(payload.parallelTransportSampleCount[index]).toBe(0);
        expect(payload.parallelTransportFinalKsNormResidual[index]).toBe(Number.NaN);
        continue;
      }
      expect(payload.parallelTransportSolverTolerance[index]).toBe(KERR_SCIENCE_PARALLEL_TRANSPORT_RELEASE_TOLERANCE_V299);
      expect(payload.parallelTransportStepCount[index]).toBeGreaterThan(0);
      expect(payload.parallelTransportSampleCount[index]).toBeGreaterThanOrEqual(2);
      expect(payload.parallelTransportFinalKsNormResidual[index]).toBeLessThan(KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299);
    }
  });

  it("rejects PT model, tolerance, execution-count or endpoint norm drift", () => {
    const source = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
    const diskIndex = [...source.classification].findIndex((value) => value === 3);
    const payload = cloneKerrScienceTransferPayloadV299(source);
    payload.parallelTransportSolverTolerance[diskIndex] *= 10;
    payload.parallelTransportStepCount[diskIndex] = 0;
    payload.parallelTransportFinalKsNormResidual[diskIndex] = KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toContain("parallel-transport-execution");
    const tamperedModel = {
      ...source,
      parallelTransportModel: "legacy-rk4-preview",
    } as unknown as typeof source;
    expect(validateKerrScienceTransferPayloadV299(tamperedModel).failures).toContain("polarization-model-identity");

    const tamperedPolarization = structuredClone(polarization);
    tamperedPolarization.science.parallelTransportModel = "legacy-rk4-preview";
    expect(() => createSparseKerrSciencePayloadV299(geometry, tamperedPolarization, canonicalRayView))
      .toThrow("v299 polarization authority model mismatch");
  });

  it("keeps science buffers immutable from cinematic decoration", () => {
    const payload = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
    const clone = cloneKerrScienceTransferPayloadV299(payload);
    clone.classification[0] = 3;
    expect(payload.classification[0]).toBe(1);
    expect(STRONG_GRAVITY_RENDERER_BOUNDARY_V299.science.bloom).toBe(false);
    expect(STRONG_GRAVITY_RENDERER_BOUNDARY_V299.science.partialDenseAggregateAccepted).toBe(false);
    expect(STRONG_GRAVITY_RENDERER_BOUNDARY_V299.cinematic.scientificBuffersMutable).toBe(false);
  });

  it("fails closed when disk and non-disk observable applicability is corrupted", () => {
    const payload = cloneKerrScienceTransferPayloadV299(createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView));
    const diskIndex = [...payload.classification].findIndex((value) => value === 3);
    const escapeIndex = [...payload.classification].findIndex((value) => value === 2);
    payload.redshiftApplicable[diskIndex] = 0;
    payload.evpaApplicable[diskIndex] = 0;
    payload.imageOrderApplicable[escapeIndex] = 1;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toEqual(expect.arrayContaining([
      "disk-redshift-unavailable",
      "disk-evpa-unavailable",
      "nondisk-observable-applicability",
    ]));
  });

  it("encodes missing redshift explicitly and clamps valid science colors", () => {
    expect(encodeKerrSciencePixelV299(3, Number.NaN, false)).toEqual([255, 191, 0, 255]);
    expect(encodeKerrSciencePixelV299(3, 0.01, true)).toEqual([2, 255, 54, 255]);
    for (const channel of encodeKerrSciencePixelV299(3, 20, true)) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });

  it("rejects canonical coordinate, spin and plan identity drift", () => {
    expect(() => createSparseKerrSciencePayloadV299(geometry, polarization, {
      ...canonicalRayView,
      planSha256: "a".repeat(64),
    })).toThrow("canonical ray-plan authority");
    expect(() => createSparseKerrSciencePayloadV299(geometry, polarization, {
      ...canonicalRayView,
      planFileSha256: "a".repeat(64),
    })).toThrow("canonical ray-plan authority");
    expect(() => createSparseKerrSciencePayloadV299(geometry, polarization, {
      ...canonicalRayView,
      canonicalRays: canonicalRayView.canonicalRays.map((ray: { rayId: string; spinA: number }) => ray.rayId === "capture-00" ? { ...ray, spinA: ray.spinA + 0.1 } : ray),
    })).toThrow("canonical spin mismatch");
  });

  it("prevents incomplete data from masquerading as dense authority", () => {
    const sparse = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
    expect(validateKerrScienceTransferPayloadV299({
      ...sparse,
      authorityKind: "v298r1-dense-complete",
      denseCampaignComplete: false,
      denseAggregateSha256: null,
    }).failures).toContain("dense-authority-incomplete");
    expect(validateKerrScienceTransferPayloadV299({
      ...sparse,
      denseCampaignComplete: true,
      denseAggregateSha256: "a".repeat(64),
    }).failures).toContain("sparse-authority-boundary");
    expect(sparse).toMatchObject({
      authorityKind: "v296-v297-short-gate-sparse",
      sampleCount: 16,
      denseCampaignComplete: false,
      denseAggregateSha256: null,
    });
  });

  it("recomputes sparse disk intensity and rejects hidden non-disk observables", () => {
    const payload = cloneKerrScienceTransferPayloadV299(createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView));
    const diskIndex = [...payload.classification].findIndex((value) => value === 3);
    const escapeIndex = [...payload.classification].findIndex((value) => value === 2);
    const expected = observedThinDiskIntensityV299(payload.spinA[diskIndex], payload.emissionRadiusM[diskIndex], payload.redshiftFactor[diskIndex]);
    expect(payload.intensity[diskIndex]).toBe(expected);
    payload.intensity[diskIndex] = expected + Math.max(1e-12, expected * 0.01);
    payload.redshiftFactor[escapeIndex] = 1;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toEqual(expect.arrayContaining([
      "disk-intensity-conservation",
      "nondisk-observable-value",
    ]));
  });

  it("enforces the versioned release residual budget sample by sample", () => {
    const payload = cloneKerrScienceTransferPayloadV299(createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView));
    expect(payload.errorBudgetVersion).toBe("v299-sparse-release-residual-budget-v1");
    payload.massShellResidualNormalized[0] = KERR_SCIENCE_RELEASE_RESIDUAL_LIMIT_V299;
    payload.carterResidualNormalized[1] = -1e-15;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toEqual(expect.arrayContaining([
      "mass-shell-residual",
      "carter-residual",
    ]));
    expect(validateKerrScienceTransferPayloadV299({
      ...payload,
      massShellResidualNormalized: createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView).massShellResidualNormalized,
      carterResidualNormalized: createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView).carterResidualNormalized,
      errorBudgetVersion: "v298r1-dense-kerr-error-budget-v1",
    }).failures).toContain("error-budget-identity");
  });

  it("retains independent WP/PT angles and enforces the periodic EVPA difference", () => {
    const payload = cloneKerrScienceTransferPayloadV299(createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView));
    const diskIndex = [...payload.classification].findIndex((value) => value === 3);
    expect(payload.evpaDifferenceDeg[diskIndex]).toBeCloseTo(evpaDifferenceDegV299(
      payload.evpaDeg[diskIndex],
      payload.parallelTransportEvpaDeg[diskIndex],
    ), 12);
    payload.parallelTransportEvpaDeg[diskIndex] = payload.evpaDeg[diskIndex] + 1;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toContain("disk-evpa-conservation");
    expect(evpaDifferenceDegV299(179.9, 0.1)).toBeCloseTo(0.2, 12);
  });

  it("retains and enforces parallel-transport and WP invariant residuals", () => {
    const payload = cloneKerrScienceTransferPayloadV299(createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView));
    const diskIndex = [...payload.classification].findIndex((value) => value === 3);
    expect(payload.polarizationOrthogonalityResidualNormalized[diskIndex]).toBeLessThan(KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299);
    expect(payload.walkerPenroseInvariantDrift[diskIndex]).toBeLessThan(KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299);
    expect(payload.polarizationEndpointResidual[diskIndex]).toBeLessThan(KERR_SCIENCE_RELEASE_POLARIZATION_ENDPOINT_LIMIT_V299);
    payload.polarizationOrthogonalityResidualNormalized[diskIndex] = KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299;
    payload.polarizationEndpointResidual[diskIndex] = KERR_SCIENCE_RELEASE_POLARIZATION_ENDPOINT_LIMIT_V299;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toEqual(expect.arrayContaining([
      "disk-polarization-invariant",
      "disk-polarization-endpoint",
    ]));
  });

  it("retains independent Kerr-Schild geometry and enforces formula agreement", () => {
    const payload = cloneKerrScienceTransferPayloadV299(createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView));
    const diskIndex = [...payload.classification].findIndex((value) => value === 3);
    expect([...payload.kerrSchildClassification]).toEqual([...payload.classification]);
    expect(payload.geometryDiskRadiusDifferenceM[diskIndex]).toBeLessThan(KERR_SCIENCE_FORMULA_DISK_RADIUS_DIFFERENCE_LIMIT_M_V299);
    expect(payload.geometryRedshiftDifference[diskIndex]).toBeLessThan(KERR_SCIENCE_FORMULA_REDSHIFT_DIFFERENCE_LIMIT_V299);
    payload.kerrSchildClassification[0] = 2;
    payload.geometryRedshiftDifference[diskIndex] = KERR_SCIENCE_FORMULA_REDSHIFT_DIFFERENCE_LIMIT_V299;
    payload.metricDerivativeAuditResidual[1] = KERR_SCIENCE_KS_METRIC_DERIVATIVE_LIMIT_V299;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toEqual(expect.arrayContaining([
      "formula-classification-agreement",
      "formula-redshift-agreement",
      "ks-metric-derivative-residual",
    ]));
  });

  it("reconstructs the earliest valid event and keeps image order conserved", () => {
    const payload = cloneKerrScienceTransferPayloadV299(createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView));
    const diskIndex = [...payload.classification].findIndex((value) => value === 3);
    const captureWithInvalidCrossing = 2;
    expect(payload.invalidEventCount[captureWithInvalidCrossing]).toBeGreaterThan(0);
    expect(payload.selectedEventKind[captureWithInvalidCrossing]).toBe(payload.classification[captureWithInvalidCrossing]);
    expect(payload.validDiskCrossingCount[diskIndex]).toBe(1);
    expect(payload.imageOrder[diskIndex]).toBe(0);
    payload.selectedEventKind[0] = 2;
    payload.validDiskCrossingCount[diskIndex] = 2;
    expect(validateKerrScienceTransferPayloadV299(payload).failures).toEqual(expect.arrayContaining([
      "selected-event-classification",
      "disk-event-order-conservation",
    ]));

    const reordered = structuredClone(geometry);
    const capture02 = reordered.executions.find((row: { rayId: string; formulation: string; toleranceClass: string; branch: string }) => row.rayId === "capture-02"
      && row.formulation === "carter-mino-dop853-constraint-stabilized-v296"
      && row.toleranceClass === "release"
      && row.branch === "A");
    capture02.events[0].valid = true;
    expect(() => createSparseKerrSciencePayloadV299(reordered, polarization, canonicalRayView)).toThrow("earliest valid event mismatch");
  });

  it("keeps Science linear while Cinematic may use display encoding", () => {
    const source = readFileSync(resolve(process.cwd(), "app/components/KerrStrongGravityRendererV299.tsx"), "utf8");
    const visualContract = readFileSync(resolve(process.cwd(), "app/lib/kerrStrongGravityVisualV305.ts"), "utf8");
    expect(source).toContain("texture.colorSpace = THREE.NoColorSpace");
    expect(source).toContain("atlasDisplayTransform: contract.displayTransform");
    expect(source).toContain("texture.colorSpace = THREE.SRGBColorSpace");
    expect(source).toContain("toneMapped={contract.toneMapped}");
    expect(visualContract).toContain('displayTransform: "linear-no-grade"');
    expect(visualContract).toContain("scienceBufferMutationAllowed: false");
    expect(visualContract).toContain("toneMapped: false");
    const gate = readFileSync(resolve(process.cwd(), "app/components/PostProcessingGate.tsx"), "utf8");
    const scene = readFileSync(resolve(process.cwd(), "app/components/AtlasUniverseSceneRuntime.tsx"), "utf8");
    expect(gate).toContain("if (!ready || scienceDisplayMode) return null");
    expect(scene).toContain("scienceDisplayMode={showKerrSceneVisual");
  });
});
