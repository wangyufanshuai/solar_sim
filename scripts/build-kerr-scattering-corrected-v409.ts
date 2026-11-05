import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrScatteringAtmosphereArtifactV407, type KerrScatteringStokesSampleV407 } from "../app/lib/kerrScatteringAtmosphereV407";
import { parseKerrScatteringOracleArtifactV408 } from "../app/lib/kerrScatteringOracleV408";
import {
  KERR_SCATTERING_CORRECTED_ARTIFACT_VERSION_V409,
  KERR_SCATTERING_CORRECTED_VERSION_V409,
  KERR_SCATTERING_ORACLE_ARTIFACT_SHA256_V408,
  parseKerrScatteringCorrectedArtifactV409,
  parseKerrScatteringCorrectedViewV409,
  type KerrScatteringCorrectedPathComparisonV409,
  type KerrScatteringCorrectedSampleV409,
  type KerrScatteringCorrectedViewV409,
} from "../app/lib/kerrScatteringCorrectedV409";

const root = process.cwd();
const v407Path = "dist/science/kerr-scattering-atmosphere-v407/short-gate.json";
const v408Path = "dist/science/kerr-scattering-oracle-v408/portable-envelope.json";
const output = "dist/science/kerr-scattering-corrected-v409/sparse-stokes.json";
const transient = new Set(["generatedAt", "artifactSha256"]);
const read = (path: string) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const periodicDifferenceDeg = (first: number, second: number) => { const delta = Math.abs(first - second) % 180; return Math.min(delta, 180 - delta); };
const evpaFromQu = (q: number, u: number) => ((0.5 * Math.atan2(u, q) * 180 / Math.PI) % 180 + 180) % 180;
const relative = (difference: number, scale: number) => Math.abs(difference) / Math.max(Math.abs(scale), 1e-300);

const v407 = parseKerrScatteringAtmosphereArtifactV407(read(v407Path));
const v408 = parseKerrScatteringOracleArtifactV408(read(v408Path));
if (v408.artifactSha256 !== KERR_SCATTERING_ORACLE_ARTIFACT_SHA256_V408) throw new Error("v409-v408-artifact-lock");
const oracleByRay = new Map(v408.view.rayComparisons.map((ray) => [ray.rayId, ray]));

function correctSample(sample: KerrScatteringStokesSampleV407): KerrScatteringCorrectedSampleV409 {
  const oracle = oracleByRay.get(sample.rayId);
  if (!oracle || Math.abs(oracle.muEmission - sample.muEmission) >= 1e-14 || Math.abs(oracle.v407ApproximationFraction - sample.linearPolarizationFraction) >= 1e-14) throw new Error(`v409-ray-lock-${sample.rayId}`);
  const p = oracle.v408DiscreteOrdinatesFraction;
  const correction = p / sample.linearPolarizationFraction;
  const angle = 2 * sample.evpaDeg * Math.PI / 180;
  const emittedQ = sample.emittedStokes.i * p;
  const observedQ = sample.observedStokes.i * p * Math.cos(angle);
  const observedU = sample.observedStokes.i * p * Math.sin(angle);
  const observedAmplitude = Math.hypot(observedQ, observedU);
  const scaledQ = sample.observedStokes.q * correction;
  const scaledU = sample.observedStokes.u * correction;
  const scaledDifference = Math.hypot(observedQ - scaledQ, observedU - scaledU);
  const observedUncertaintyAmplitude = sample.observedStokes.i * oracle.numericalUncertainty.linearSumAbsolute;
  return Object.freeze({
    rayId: sample.rayId,
    rayIndex: sample.rayIndex,
    spinA: sample.spinA,
    muEmission: sample.muEmission,
    observedFrequencyHz: sample.observedFrequencyHz,
    emittedFrequencyHz: sample.emittedFrequencyHz,
    redshiftFactor: sample.redshiftFactor,
    transportMethod: sample.transportMethod,
    evpaDeg: sample.evpaDeg,
    sourceFractions: Object.freeze({ v407Approximation: sample.linearPolarizationFraction, v408DiscreteOrdinates: p, multiplicativeCorrection: correction, relativeApproximationError: oracle.relativeApproximationError }),
    emittedStokes: Object.freeze({ i: sample.emittedStokes.i, q: emittedQ, u: 0 as const, linearAmplitude: emittedQ, linearFraction: p }),
    observedStokes: Object.freeze({ i: sample.observedStokes.i, q: observedQ, u: observedU, linearAmplitude: observedAmplitude, linearFraction: observedAmplitude / sample.observedStokes.i }),
    numericalUncertainty: Object.freeze({ polarizationFractionAbsolute: oracle.numericalUncertainty.linearSumAbsolute, polarizationFractionRelative: oracle.numericalUncertainty.linearSumRelative, emittedQAbsolute: sample.emittedStokes.i * oracle.numericalUncertainty.linearSumAbsolute, observedQAbsolute: Math.abs(Math.cos(angle)) * observedUncertaintyAmplitude, observedUAbsolute: Math.abs(Math.sin(angle)) * observedUncertaintyAmplitude, observedLinearAmplitudeAbsolute: observedUncertaintyAmplitude, combination: "linear-no-rss-no-independence-claim" as const }),
    inheritedUncertainty: sample.sourceUncertainty,
    residuals: Object.freeze({ observedLinearFractionAbsolute: Math.abs(observedAmplitude / sample.observedStokes.i - p), emittedLinearFractionAbsolute: Math.abs(emittedQ / sample.emittedStokes.i - p), scaledOriginalQuRelative: relative(scaledDifference, observedAmplitude), intensityDifferenceFromV407: 0 as const, evpaReconstructionDeg: periodicDifferenceDeg(evpaFromQu(observedQ, observedU), sample.evpaDeg) }),
  });
}

function createView(): KerrScatteringCorrectedViewV409 {
  const samples = Object.freeze(v407.view.samples.map(correctSample));
  const comparisons: KerrScatteringCorrectedPathComparisonV409[] = [];
  for (const rayId of ["disk-00", "disk-01", "disk-02", "disk-03"] as const) for (const observedFrequencyHz of [1e16, 1e17, 1e18] as const) {
    const wp = samples.find((sample) => sample.rayId === rayId && sample.observedFrequencyHz === observedFrequencyHz && sample.transportMethod === "walker-penrose");
    const pt = samples.find((sample) => sample.rayId === rayId && sample.observedFrequencyHz === observedFrequencyHz && sample.transportMethod === "independent-ks-parallel-transport");
    if (!wp || !pt) throw new Error(`v409-path-pair-${rayId}-${observedFrequencyHz}`);
    comparisons.push(Object.freeze({ rayId, observedFrequencyHz, evpaDifferenceDeg: periodicDifferenceDeg(wp.evpaDeg, pt.evpaDeg), normalizedStokesQuDifference: Math.hypot(wp.observedStokes.q / wp.observedStokes.linearAmplitude - pt.observedStokes.q / pt.observedStokes.linearAmplitude, wp.observedStokes.u / wp.observedStokes.linearAmplitude - pt.observedStokes.u / pt.observedStokes.linearAmplitude) }));
  }
  const maxima = Object.freeze({
    correctionFactor: Math.max(...samples.map((sample) => sample.sourceFractions.multiplicativeCorrection)),
    numericalPolarizationFractionAbsolute: Math.max(...samples.map((sample) => sample.numericalUncertainty.polarizationFractionAbsolute)),
    observedLinearFractionAbsolute: Math.max(...samples.map((sample) => sample.residuals.observedLinearFractionAbsolute)),
    emittedLinearFractionAbsolute: Math.max(...samples.map((sample) => sample.residuals.emittedLinearFractionAbsolute)),
    scaledOriginalQuRelative: Math.max(...samples.map((sample) => sample.residuals.scaledOriginalQuRelative)),
    intensityDifferenceFromV407: 0 as const,
    evpaReconstructionDeg: Math.max(...samples.map((sample) => sample.residuals.evpaReconstructionDeg)),
    pathEvpaDifferenceDeg: Math.max(...comparisons.map((comparison) => comparison.evpaDifferenceDeg)),
    normalizedStokesQuDifference: Math.max(...comparisons.map((comparison) => comparison.normalizedStokesQuDifference)),
    deterministicReplayDifference: 0 as const,
  });
  return parseKerrScatteringCorrectedViewV409(Object.freeze({
    version: KERR_SCATTERING_CORRECTED_VERSION_V409,
    status: "qualified-v408-error-envelope-applied-to-24-sparse-stokes-samples" as const,
    authority: Object.freeze({ v407ScatteringAtmosphereArtifactSha256: v407.artifactSha256, v408PythonOracleEvidenceSha256: v408.sourcePythonEvidenceSha256, v408PortableOracleArtifactSha256: v408.artifactSha256, denseAggregateSha256: null }),
    model: Object.freeze({ correction: "replace-v407-closed-form-fraction-with-v408-discrete-ordinates-four-ray-reference" as const, propagation: "vacuum-geometric-optics-preserve-v407-intensity-redshift-and-evpa" as const, stokesReconstruction: "Q=I*p*cos(2*EVPA),U=I*p*sin(2*EVPA)" as const, uncertaintyCombination: "linear-no-rss-no-independence-claim" as const, interpolationApplied: false as const, exactHFunctionTableAuthority: false as const, endpointMuZeroOrOneQualified: false as const, denseImageAuthority: false as const }),
    counts: Object.freeze({ diskRayCount: 4 as const, frequencyCount: 3 as const, transportMethodCount: 2 as const, stokesSampleCount: 24 as const, pathComparisonCount: 12 as const, curveSampleCountConsumedByPayload: 0 as const }),
    samples,
    pathComparisons: Object.freeze(comparisons),
    maxima,
    thresholds: Object.freeze({ stokesReconstruction: 1e-12 as const, intensityPreservation: 1e-15 as const, evpaReconstructionDeg: 1e-9 as const, pathEvpaReleaseDeg: 0.5 as const, normalizedStokesQuDifference: 1e-10 as const }),
    gates: Object.freeze({ authorityLocks: true as const, rayIdentity: true as const, fractionReplacement: true as const, stokesReconstruction: true as const, intensityPreservation: true as const, evpaPreservation: true as const, pathAgreement: true as const, uncertaintyPropagation: true as const, deterministicReplay: true as const, releaseBoundary: true as const }),
    release: Object.freeze({ formalProductPointer: "v263" as const, formalProductPointerAdvanced: false as const, defaultKernel: "legacy-eih-1pn" as const, workerPhysicsMutation: "not-applied" as const, localShadowDefaultApplied: false as const }),
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseShardExecuted: false as const,
    boundary: "four-ray-24-sample-corrected-science-payload-not-181-point-dense-image-or-exact-h-table" as const,
  }));
}

const first = createView();
const second = createView();
if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("v409-corrected-view-nondeterminism");
const unsigned = { version: KERR_SCATTERING_CORRECTED_ARTIFACT_VERSION_V409, generatedAt: v408.generatedAt, view: first, deterministicReplay: true as const, v407HistoricalArtifactMutated: false as const, networkAttemptedByBuild: false as const, denseShardExecuted: false as const };
const artifact = parseKerrScatteringCorrectedArtifactV409({ ...unsigned, artifactSha256: canonicalSha(unsigned) });
const target = resolve(root, output); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`, "utf8"); renameSync(temporary, target);
console.log(JSON.stringify({ status: artifact.view.status, artifactSha256: artifact.artifactSha256, samples: artifact.view.counts.stokesSampleCount, comparisons: artifact.view.counts.pathComparisonCount, correctionFactorMax: artifact.view.maxima.correctionFactor, polarizationUncertaintyMax: artifact.view.maxima.numericalPolarizationFractionAbsolute, residuals: artifact.view.maxima, denseAggregate: artifact.view.authority.denseAggregateSha256, output }, null, 2));
