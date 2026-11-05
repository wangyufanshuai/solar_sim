export const KERR_OBSERVER_EMITTER_REPLAY_VERSION_V301 = "v301-kerr-observer-emitter-redshift-replay-v1" as const;
export const KERR_GEOMETRY_EVIDENCE_SHA256_V301 = "76d2d4d3b803104ba477da627c428ed51d7b62b9691d2dc81e53f1e5bb8e81f7" as const;
export const KERR_GEOMETRY_FILE_SHA256_V301 = "29d17ba84b6017e6f5c5e50c131497abc306f4817689b366676eab7b6f8fbd69" as const;
export const KERR_POLARIZATION_EVIDENCE_SHA256_V301 = "a3ac11de0ad8dc48c742507f8aee169c53a3c983cb7a38fbf41eb580b4d58854" as const;
export const KERR_POLARIZATION_FILE_SHA256_V301 = "c30589b114d2d6b8f4ab4ca85814e5f0524c22613df3aab2b44d8928e712f778" as const;
export const KERR_OBSERVER_SOURCE_SHA256_V301 = "03b609562dad3efb149976b17fee81b5bbd865ef8ca90d2a9b64eb79a3848884" as const;
export const KERR_EMITTER_SOURCE_SHA256_V301 = "9af38d3306febbb6d2becd1a7a65d8c8fa970262bf7a3d2dd6aae441beda8326" as const;
export const KERR_RAY_PLAN_SHA256_V301 = "832f9086f8a4d5a4546879034481096510685efbcf51c6abfe5d83ddbcb3c850" as const;
export const KERR_RAY_PLAN_FILE_SHA256_V301 = "9f1cd9b0d9e739d7e79952e9b3fd5228e29571d7acdb53f4ea235269fb66bdee" as const;

export const KERR_OBSERVER_RADIUS_M_V301 = 30 as const;
export const KERR_OBSERVER_INCLINATION_DEG_V301 = 70 as const;
export const KERR_DISK_OUTER_RADIUS_M_V301 = 20 as const;
export const KERR_OBSERVER_TETRAD_LIMIT_V301 = 1e-12;
export const KERR_EMITTER_NORM_LIMIT_V301 = 1e-12;
export const KERR_REDSHIFT_REPLAY_LIMIT_V301 = 1e-12;
export const KERR_FORMULA_REDSHIFT_LIMIT_V301 = 0.005;

export type KerrVector4V301 = readonly [number, number, number, number];

export type KerrZamoObserverReplayV301 = Readonly<{
  model: "finite-distance-zamo";
  radiusM: typeof KERR_OBSERVER_RADIUS_M_V301;
  inclinationDeg: typeof KERR_OBSERVER_INCLINATION_DEG_V301;
  sourceSha256: typeof KERR_OBSERVER_SOURCE_SHA256_V301;
  lapse: number;
  frameDraggingAngularVelocity: number;
  contravariantBasis: Readonly<{
    time: KerrVector4V301;
    radial: KerrVector4V301;
    polar: KerrVector4V301;
    azimuthal: KerrVector4V301;
  }>;
  replayOrthonormalResidual: number;
  carterArtifactResidual: number;
  kerrSchildArtifactResidual: number;
}>;

export type KerrEmitterRedshiftReplayV301 = Readonly<{
  model: "equatorial-circular-geodesic-bl";
  sourceSha256: typeof KERR_EMITTER_SOURCE_SHA256_V301;
  radiusM: number;
  photonEnergy: number;
  photonAngularMomentumZ: number;
  angularVelocity: number;
  uT: number;
  uPhi: number;
  photonFrequencyMinusKDotU: number;
  fourVelocityNormResidual: number;
  storedRedshiftFactor: number;
  replayedRedshiftFactor: number;
  replayDifference: number;
  kerrSchildRedshiftFactor: number;
  formulationDifference: number;
}>;

export type KerrObserverEmitterRayReplayV301 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  alphaM: number;
  betaM: number;
  classification: "disk-hit";
  selectedEventParameter: number;
  imageOrder: number;
  observer: KerrZamoObserverReplayV301;
  emitter: KerrEmitterRedshiftReplayV301;
}>;

export type KerrObserverEmitterReplayViewV301 = Readonly<{
  version: typeof KERR_OBSERVER_EMITTER_REPLAY_VERSION_V301;
  status: "observer-emitter-redshift-replay-qualified";
  authority: Readonly<{
    geometryEvidenceSha256: typeof KERR_GEOMETRY_EVIDENCE_SHA256_V301;
    geometryFileSha256: typeof KERR_GEOMETRY_FILE_SHA256_V301;
    polarizationEvidenceSha256: typeof KERR_POLARIZATION_EVIDENCE_SHA256_V301;
    polarizationFileSha256: typeof KERR_POLARIZATION_FILE_SHA256_V301;
    rayPlanSha256: typeof KERR_RAY_PLAN_SHA256_V301;
    rayPlanFileSha256: typeof KERR_RAY_PLAN_FILE_SHA256_V301;
    observerSourceSha256: typeof KERR_OBSERVER_SOURCE_SHA256_V301;
    emitterSourceSha256: typeof KERR_EMITTER_SOURCE_SHA256_V301;
  }>;
  rayCount: 4;
  records: readonly KerrObserverEmitterRayReplayV301[];
  maxima: Readonly<{
    observerOrthonormalResidual: number;
    artifactTetradResidual: number;
    emitterFourVelocityNormResidual: number;
    redshiftReplayDifference: number;
    formulationRedshiftDifference: number;
  }>;
  boundary: "four-canonical-disk-rays-not-dense-transfer-map";
}>;

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v301-${label}-invalid`);
  return value as UnknownRecord;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`v301-${label}-non-finite`);
  return value;
}

function vector4(value: unknown, label: string): KerrVector4V301 {
  if (!Array.isArray(value) || value.length !== 4) throw new Error(`v301-${label}-invalid`);
  return Object.freeze(value.map((entry, index) => finite(entry, `${label}-${index}`))) as unknown as KerrVector4V301;
}

function kerrMetricCovariantV301(radiusM: number, theta: number, spinA: number): readonly KerrVector4V301[] {
  const sigma = radiusM * radiusM + spinA * spinA * Math.cos(theta) ** 2;
  const delta = radiusM * radiusM - 2 * radiusM + spinA * spinA;
  const sine2 = Math.max(1e-15, Math.sin(theta) ** 2);
  const gTt = -(1 - 2 * radiusM / sigma);
  const gTPhi = -2 * spinA * radiusM * sine2 / sigma;
  const gRr = sigma / delta;
  const gThetaTheta = sigma;
  const gPhiPhi = sine2 * (radiusM * radiusM + spinA * spinA + 2 * spinA * spinA * radiusM * sine2 / sigma);
  return Object.freeze([
    Object.freeze([gTt, 0, 0, gTPhi]),
    Object.freeze([0, gRr, 0, 0]),
    Object.freeze([0, 0, gThetaTheta, 0]),
    Object.freeze([gTPhi, 0, 0, gPhiPhi]),
  ] as KerrVector4V301[]);
}

function metricDotV301(metric: readonly KerrVector4V301[], left: KerrVector4V301, right: KerrVector4V301): number {
  let sum = 0;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) sum += left[row] * metric[row][column] * right[column];
  }
  return sum;
}

export function resolveKerrZamoObserverFrameV301(spinA: number): Omit<KerrZamoObserverReplayV301, "carterArtifactResidual" | "kerrSchildArtifactResidual"> {
  if (!Number.isFinite(spinA) || Math.abs(spinA) > 0.998) throw new Error("v301-observer-spin-invalid");
  const radiusM = KERR_OBSERVER_RADIUS_M_V301;
  const theta = KERR_OBSERVER_INCLINATION_DEG_V301 * Math.PI / 180;
  const sigma = radiusM * radiusM + spinA * spinA * Math.cos(theta) ** 2;
  const delta = radiusM * radiusM - 2 * radiusM + spinA * spinA;
  const sine2 = Math.max(1e-15, Math.sin(theta) ** 2);
  const area = (radiusM * radiusM + spinA * spinA) ** 2 - spinA * spinA * delta * sine2;
  const lapse = Math.sqrt(sigma * delta / area);
  const frameDraggingAngularVelocity = 2 * spinA * radiusM / area;
  const gPhiPhi = area * sine2 / sigma;
  const time = Object.freeze([1 / lapse, 0, 0, frameDraggingAngularVelocity / lapse]) as KerrVector4V301;
  const radial = Object.freeze([0, Math.sqrt(delta / sigma), 0, 0]) as KerrVector4V301;
  const polar = Object.freeze([0, 0, 1 / Math.sqrt(sigma), 0]) as KerrVector4V301;
  const azimuthal = Object.freeze([0, 0, 0, 1 / Math.sqrt(gPhiPhi)]) as KerrVector4V301;
  const basis = [time, radial, polar, azimuthal] as const;
  const metric = kerrMetricCovariantV301(radiusM, theta, spinA);
  let replayOrthonormalResidual = 0;
  for (let left = 0; left < 4; left += 1) {
    for (let right = 0; right < 4; right += 1) {
      const expected = left === right ? (left === 0 ? -1 : 1) : 0;
      replayOrthonormalResidual = Math.max(replayOrthonormalResidual, Math.abs(metricDotV301(metric, basis[left], basis[right]) - expected));
    }
  }
  if (replayOrthonormalResidual >= KERR_OBSERVER_TETRAD_LIMIT_V301) throw new Error("v301-observer-tetrad-replay-failed");
  return Object.freeze({
    model: "finite-distance-zamo",
    radiusM,
    inclinationDeg: KERR_OBSERVER_INCLINATION_DEG_V301,
    sourceSha256: KERR_OBSERVER_SOURCE_SHA256_V301,
    lapse,
    frameDraggingAngularVelocity,
    contravariantBasis: Object.freeze({ time, radial, polar, azimuthal }),
    replayOrthonormalResidual,
  });
}

export function resolveKerrEmitterRedshiftV301(
  spinA: number,
  radiusM: number,
  photonEnergy: number,
  photonAngularMomentumZ: number,
): Omit<KerrEmitterRedshiftReplayV301, "storedRedshiftFactor" | "replayDifference" | "kerrSchildRedshiftFactor" | "formulationDifference"> {
  if (![spinA, radiusM, photonEnergy, photonAngularMomentumZ].every(Number.isFinite)
    || Math.abs(spinA) > 0.998 || radiusM <= 0 || radiusM > KERR_DISK_OUTER_RADIUS_M_V301) throw new Error("v301-emitter-input-invalid");
  const gTt = -(1 - 2 / radiusM);
  const gTPhi = -2 * spinA / radiusM;
  const gPhiPhi = radiusM * radiusM + spinA * spinA + 2 * spinA * spinA / radiusM;
  const angularVelocity = 1 / (radiusM ** 1.5 + spinA);
  const normalization = -(gTt + 2 * angularVelocity * gTPhi + angularVelocity * angularVelocity * gPhiPhi);
  if (!(normalization > 0)) throw new Error("v301-emitter-four-velocity-nonphysical");
  const uT = 1 / Math.sqrt(normalization);
  const uPhi = angularVelocity * uT;
  const photonFrequencyMinusKDotU = uT * (photonEnergy - angularVelocity * photonAngularMomentumZ);
  if (!(photonFrequencyMinusKDotU > 0)) throw new Error("v301-emitter-frequency-nonphysical");
  const fourVelocityNorm = gTt * uT * uT + 2 * gTPhi * uT * uPhi + gPhiPhi * uPhi * uPhi;
  const fourVelocityNormResidual = Math.abs(fourVelocityNorm + 1);
  if (fourVelocityNormResidual >= KERR_EMITTER_NORM_LIMIT_V301) throw new Error("v301-emitter-norm-replay-failed");
  return Object.freeze({
    model: "equatorial-circular-geodesic-bl",
    sourceSha256: KERR_EMITTER_SOURCE_SHA256_V301,
    radiusM,
    photonEnergy,
    photonAngularMomentumZ,
    angularVelocity,
    uT,
    uPhi,
    photonFrequencyMinusKDotU,
    fourVelocityNormResidual,
    replayedRedshiftFactor: 1 / photonFrequencyMinusKDotU,
  });
}

function parseRayRecordV301(value: unknown, expectedIndex: number): KerrObserverEmitterRayReplayV301 {
  const candidate = record(value, `ray-${expectedIndex}`);
  const expectedRayIndex = 12 + expectedIndex;
  const expectedRayId = `disk-0${expectedIndex}` as KerrObserverEmitterRayReplayV301["rayId"];
  if (candidate.rayId !== expectedRayId || candidate.rayIndex !== expectedRayIndex || candidate.classification !== "disk-hit") {
    throw new Error("v301-ray-identity-conservation-failed");
  }
  const spinA = finite(candidate.spinA, "spin");
  const alphaM = finite(candidate.alphaM, "alpha");
  const betaM = finite(candidate.betaM, "beta");
  const selectedEventParameter = finite(candidate.selectedEventParameter, "event-parameter");
  const imageOrder = finite(candidate.imageOrder, "image-order");
  if (!Number.isSafeInteger(imageOrder) || imageOrder < 0) throw new Error("v301-image-order-invalid");

  const observerCandidate = record(candidate.observer, "observer");
  const observerReplay = resolveKerrZamoObserverFrameV301(spinA);
  const basisCandidate = record(observerCandidate.contravariantBasis, "observer-basis");
  const basisKeys = ["time", "radial", "polar", "azimuthal"] as const;
  if (observerCandidate.model !== observerReplay.model
    || observerCandidate.radiusM !== observerReplay.radiusM
    || observerCandidate.inclinationDeg !== observerReplay.inclinationDeg
    || observerCandidate.sourceSha256 !== observerReplay.sourceSha256
    || Math.abs(finite(observerCandidate.lapse, "observer-lapse") - observerReplay.lapse) > 1e-15
    || Math.abs(finite(observerCandidate.frameDraggingAngularVelocity, "observer-omega") - observerReplay.frameDraggingAngularVelocity) > 1e-15
    || Math.abs(finite(observerCandidate.replayOrthonormalResidual, "observer-replay-residual") - observerReplay.replayOrthonormalResidual) > 1e-15
    || basisKeys.some((key) => vector4(basisCandidate[key], `observer-${key}`).some((entry, index) => Math.abs(entry - observerReplay.contravariantBasis[key][index]) > 1e-15))) {
    throw new Error("v301-observer-replay-conservation-failed");
  }
  const carterArtifactResidual = finite(observerCandidate.carterArtifactResidual, "carter-tetrad-residual");
  const kerrSchildArtifactResidual = finite(observerCandidate.kerrSchildArtifactResidual, "ks-tetrad-residual");
  if (carterArtifactResidual < 0 || carterArtifactResidual >= KERR_OBSERVER_TETRAD_LIMIT_V301
    || kerrSchildArtifactResidual < 0 || kerrSchildArtifactResidual >= KERR_OBSERVER_TETRAD_LIMIT_V301) {
    throw new Error("v301-observer-artifact-residual-failed");
  }

  const emitterCandidate = record(candidate.emitter, "emitter");
  const emitterReplay = resolveKerrEmitterRedshiftV301(
    spinA,
    finite(emitterCandidate.radiusM, "emitter-radius"),
    finite(emitterCandidate.photonEnergy, "photon-energy"),
    finite(emitterCandidate.photonAngularMomentumZ, "photon-lz"),
  );
  const compare = (key: "angularVelocity" | "uT" | "uPhi" | "photonFrequencyMinusKDotU" | "fourVelocityNormResidual" | "replayedRedshiftFactor") => (
    Math.abs(finite(emitterCandidate[key], `emitter-${key}`) - emitterReplay[key]) <= 1e-12
  );
  if (emitterCandidate.model !== emitterReplay.model
    || emitterCandidate.sourceSha256 !== emitterReplay.sourceSha256
    || !compare("angularVelocity") || !compare("uT") || !compare("uPhi")
    || !compare("photonFrequencyMinusKDotU") || !compare("fourVelocityNormResidual") || !compare("replayedRedshiftFactor")) {
    throw new Error("v301-emitter-replay-conservation-failed");
  }
  const storedRedshiftFactor = finite(emitterCandidate.storedRedshiftFactor, "stored-redshift");
  const replayDifference = finite(emitterCandidate.replayDifference, "redshift-replay-difference");
  const kerrSchildRedshiftFactor = finite(emitterCandidate.kerrSchildRedshiftFactor, "ks-redshift");
  const formulationDifference = finite(emitterCandidate.formulationDifference, "formula-redshift-difference");
  if (Math.abs(Math.abs(storedRedshiftFactor - emitterReplay.replayedRedshiftFactor) - replayDifference) > 1e-15
    || replayDifference >= KERR_REDSHIFT_REPLAY_LIMIT_V301
    || Math.abs(Math.abs(storedRedshiftFactor - kerrSchildRedshiftFactor) - formulationDifference) > 1e-15
    || formulationDifference >= KERR_FORMULA_REDSHIFT_LIMIT_V301) {
    throw new Error("v301-redshift-replay-conservation-failed");
  }

  return Object.freeze({
    rayId: expectedRayId,
    rayIndex: expectedRayIndex as KerrObserverEmitterRayReplayV301["rayIndex"],
    spinA,
    alphaM,
    betaM,
    classification: "disk-hit",
    selectedEventParameter,
    imageOrder,
    observer: Object.freeze({ ...observerReplay, carterArtifactResidual, kerrSchildArtifactResidual }),
    emitter: Object.freeze({ ...emitterReplay, storedRedshiftFactor, replayDifference, kerrSchildRedshiftFactor, formulationDifference }),
  });
}

export function parseKerrObserverEmitterReplayViewV301(source: unknown): KerrObserverEmitterReplayViewV301 {
  const candidate = record(source, "view");
  const authority = record(candidate.authority, "authority");
  if (candidate.version !== KERR_OBSERVER_EMITTER_REPLAY_VERSION_V301
    || candidate.status !== "observer-emitter-redshift-replay-qualified"
    || candidate.rayCount !== 4
    || candidate.boundary !== "four-canonical-disk-rays-not-dense-transfer-map"
    || authority.geometryEvidenceSha256 !== KERR_GEOMETRY_EVIDENCE_SHA256_V301
    || authority.geometryFileSha256 !== KERR_GEOMETRY_FILE_SHA256_V301
    || authority.polarizationEvidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
    || authority.polarizationFileSha256 !== KERR_POLARIZATION_FILE_SHA256_V301
    || authority.rayPlanSha256 !== KERR_RAY_PLAN_SHA256_V301
    || authority.rayPlanFileSha256 !== KERR_RAY_PLAN_FILE_SHA256_V301
    || authority.observerSourceSha256 !== KERR_OBSERVER_SOURCE_SHA256_V301
    || authority.emitterSourceSha256 !== KERR_EMITTER_SOURCE_SHA256_V301
    || !Array.isArray(candidate.records) || candidate.records.length !== 4) {
    throw new Error("v301-replay-authority-lock-mismatch");
  }
  const records = candidate.records.map(parseRayRecordV301);
  const maxima = Object.freeze({
    observerOrthonormalResidual: Math.max(...records.map((entry) => entry.observer.replayOrthonormalResidual)),
    artifactTetradResidual: Math.max(...records.flatMap((entry) => [entry.observer.carterArtifactResidual, entry.observer.kerrSchildArtifactResidual])),
    emitterFourVelocityNormResidual: Math.max(...records.map((entry) => entry.emitter.fourVelocityNormResidual)),
    redshiftReplayDifference: Math.max(...records.map((entry) => entry.emitter.replayDifference)),
    formulationRedshiftDifference: Math.max(...records.map((entry) => entry.emitter.formulationDifference)),
  });
  const sourceMaxima = record(candidate.maxima, "maxima");
  if (Object.entries(maxima).some(([key, value]) => sourceMaxima[key] !== value)) {
    throw new Error("v301-replay-maxima-conservation-failed");
  }
  return Object.freeze({
    version: KERR_OBSERVER_EMITTER_REPLAY_VERSION_V301,
    status: "observer-emitter-redshift-replay-qualified",
    authority: Object.freeze({
      geometryEvidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
      geometryFileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
      polarizationEvidenceSha256: KERR_POLARIZATION_EVIDENCE_SHA256_V301,
      polarizationFileSha256: KERR_POLARIZATION_FILE_SHA256_V301,
      rayPlanSha256: KERR_RAY_PLAN_SHA256_V301,
      rayPlanFileSha256: KERR_RAY_PLAN_FILE_SHA256_V301,
      observerSourceSha256: KERR_OBSERVER_SOURCE_SHA256_V301,
      emitterSourceSha256: KERR_EMITTER_SOURCE_SHA256_V301,
    }),
    rayCount: 4,
    records: Object.freeze(records),
    maxima,
    boundary: "four-canonical-disk-rays-not-dense-transfer-map",
  });
}
