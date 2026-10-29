import {
  KERR_CLASSIFICATION_V299,
  createSparseKerrSciencePayloadV299,
  validateKerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";
import {
  KERR_EMITTER_SOURCE_SHA256_V301,
  KERR_GEOMETRY_EVIDENCE_SHA256_V301,
  KERR_GEOMETRY_FILE_SHA256_V301,
  KERR_OBSERVER_EMITTER_REPLAY_VERSION_V301,
  KERR_OBSERVER_SOURCE_SHA256_V301,
  KERR_POLARIZATION_EVIDENCE_SHA256_V301,
  KERR_POLARIZATION_FILE_SHA256_V301,
  KERR_RAY_PLAN_FILE_SHA256_V301,
  KERR_RAY_PLAN_SHA256_V301,
  parseKerrObserverEmitterReplayViewV301,
  resolveKerrZamoObserverFrameV301,
  type KerrObserverEmitterRayReplayV301,
  type KerrObserverEmitterReplayViewV301,
} from "./kerrObserverEmitterReplayV301";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v301-server-${label}-invalid`);
  return value as UnknownRecord;
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`v301-server-${label}-non-finite`);
  return value;
}

export function createKerrObserverEmitterReplayViewV301(
  geometryDocument: unknown,
  polarizationDocument: unknown,
  rayPlanDocument: unknown,
): KerrObserverEmitterReplayViewV301 {
  const geometry = record(geometryDocument, "geometry");
  const polarization = record(polarizationDocument, "polarization");
  const rayPlan = record(rayPlanDocument, "ray-plan");
  if (geometry.evidenceSha256 !== KERR_GEOMETRY_EVIDENCE_SHA256_V301
    || polarization.evidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
    || rayPlan.planSha256 !== KERR_RAY_PLAN_SHA256_V301
    || !Array.isArray(rayPlan.rays) || rayPlan.rays.length !== 3097) {
    throw new Error("v301-server-authority-lock-mismatch");
  }
  const canonicalRays = rayPlan.rays.slice(0, 16).map((entry) => record(entry, "canonical-ray"));
  const canonicalRayView = {
    version: "v299-kerr-canonical-ray-view-v1",
    planSha256: KERR_RAY_PLAN_SHA256_V301,
    planFileSha256: KERR_RAY_PLAN_FILE_SHA256_V301,
    canonicalRays,
  };
  const payload = createSparseKerrSciencePayloadV299(geometry, polarization, canonicalRayView);
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed) throw new Error(`v301-server-sparse-payload-failed:${validation.failures.join(",")}`);

  const records = [12, 13, 14, 15].map((index, localIndex) => {
    const ray = canonicalRays[index];
    const expectedRayId = `disk-0${localIndex}` as KerrObserverEmitterRayReplayV301["rayId"];
    if (ray.rayId !== expectedRayId || ray.rayIndex !== index || ray.expectedFamily !== "disk-hit"
      || payload.classification[index] !== KERR_CLASSIFICATION_V299["disk-hit"]
      || payload.kerrSchildClassification[index] !== KERR_CLASSIFICATION_V299["disk-hit"]
      || payload.redshiftApplicable[index] !== 1
      || payload.imageOrderApplicable[index] !== 1) {
      throw new Error("v301-server-disk-ray-conservation-failed");
    }
    const spinA = finite(payload.spinA[index], "spin");
    const observerReplay = resolveKerrZamoObserverFrameV301(spinA);
    const storedRedshiftFactor = finite(payload.redshiftFactor[index], "stored-redshift");
    const replayedRedshiftFactor = 1 / finite(payload.emitterPhotonFrequency[index], "emitter-frequency");
    const kerrSchildRedshiftFactor = finite(payload.kerrSchildRedshiftFactor[index], "ks-redshift");
    return Object.freeze({
      rayId: expectedRayId,
      rayIndex: index as KerrObserverEmitterRayReplayV301["rayIndex"],
      spinA,
      alphaM: finite(payload.alphaM[index], "alpha"),
      betaM: finite(payload.betaM[index], "beta"),
      classification: "disk-hit" as const,
      selectedEventParameter: finite(payload.selectedEventParameter[index], "selected-event-parameter"),
      imageOrder: payload.imageOrder[index],
      observer: Object.freeze({
        ...observerReplay,
        carterArtifactResidual: finite(payload.tetradResidual[index], "carter-tetrad-residual"),
        kerrSchildArtifactResidual: finite(payload.kerrSchildTetradResidual[index], "ks-tetrad-residual"),
      }),
      emitter: Object.freeze({
        model: "equatorial-circular-geodesic-bl" as const,
        sourceSha256: KERR_EMITTER_SOURCE_SHA256_V301,
        radiusM: finite(payload.emissionRadiusM[index], "emission-radius"),
        photonEnergy: finite(payload.photonEnergy[index], "photon-energy"),
        photonAngularMomentumZ: finite(payload.photonAngularMomentumZ[index], "photon-lz"),
        angularVelocity: finite(payload.emitterAngularVelocity[index], "emitter-omega"),
        uT: finite(payload.emitterUt[index], "emitter-ut"),
        uPhi: finite(payload.emitterUphi[index], "emitter-uphi"),
        photonFrequencyMinusKDotU: finite(payload.emitterPhotonFrequency[index], "emitter-frequency"),
        fourVelocityNormResidual: finite(payload.emitterFourVelocityNormResidual[index], "emitter-norm-residual"),
        storedRedshiftFactor,
        replayedRedshiftFactor,
        replayDifference: Math.abs(storedRedshiftFactor - replayedRedshiftFactor),
        kerrSchildRedshiftFactor,
        formulationDifference: Math.abs(storedRedshiftFactor - kerrSchildRedshiftFactor),
      }),
    });
  });
  const maxima = Object.freeze({
    observerOrthonormalResidual: Math.max(...records.map((entry) => entry.observer.replayOrthonormalResidual)),
    artifactTetradResidual: Math.max(...records.flatMap((entry) => [entry.observer.carterArtifactResidual, entry.observer.kerrSchildArtifactResidual])),
    emitterFourVelocityNormResidual: Math.max(...records.map((entry) => entry.emitter.fourVelocityNormResidual)),
    redshiftReplayDifference: Math.max(...records.map((entry) => entry.emitter.replayDifference)),
    formulationRedshiftDifference: Math.max(...records.map((entry) => entry.emitter.formulationDifference)),
  });
  return parseKerrObserverEmitterReplayViewV301({
    version: KERR_OBSERVER_EMITTER_REPLAY_VERSION_V301,
    status: "observer-emitter-redshift-replay-qualified",
    authority: {
      geometryEvidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
      geometryFileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
      polarizationEvidenceSha256: KERR_POLARIZATION_EVIDENCE_SHA256_V301,
      polarizationFileSha256: KERR_POLARIZATION_FILE_SHA256_V301,
      rayPlanSha256: KERR_RAY_PLAN_SHA256_V301,
      rayPlanFileSha256: KERR_RAY_PLAN_FILE_SHA256_V301,
      observerSourceSha256: KERR_OBSERVER_SOURCE_SHA256_V301,
      emitterSourceSha256: KERR_EMITTER_SOURCE_SHA256_V301,
    },
    rayCount: 4,
    records,
    maxima,
    boundary: "four-canonical-disk-rays-not-dense-transfer-map",
  });
}
