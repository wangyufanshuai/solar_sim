export const OBSERVATIONAL_ASTROPHYSICS_LAB_VERSION = "v144-observational-astrophysics-lab-v1" as const;
export const OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION = "v149-exoplanet-observation-lab-v2" as const;

export type ObservationValueKind = "reported" | "derived" | "assumption" | "display-only";

export type ObservationValue<T> = {
  value: T | null;
  kind: ObservationValueKind;
  source: string;
  field: string;
  unit: string;
  uncertaintyLower: number | null;
  uncertaintyUpper: number | null;
  reference: string | null;
  note: string | null;
};

export type ObservationProvenance = {
  kind: "measured" | "derived" | "display-assumption";
  source: string;
  field: string;
  uncertainty: number | null;
  unit: string;
};

export type TransitModelDocumentV1 = {
  version: typeof OBSERVATIONAL_ASTROPHYSICS_LAB_VERSION;
  systemId: string;
  planetId: string;
  periodDays: number;
  radiusRatio: number;
  scaledSemiMajorAxis: number;
  inclinationDeg: number;
  eccentricity: number;
  argumentOfPeriastronDeg: number;
  limbDarkening: readonly [number, number];
  sampleCount: number;
  provenance: readonly ObservationProvenance[];
  assumptions: readonly string[];
  boundary: "worker-display-model-never-writes-solar-nbody";
};

export type RadialVelocityModelDocumentV1 = {
  version: typeof OBSERVATIONAL_ASTROPHYSICS_LAB_VERSION;
  systemId: string;
  planetId: string;
  periodDays: number;
  semiAmplitudeMS: number;
  eccentricity: number;
  argumentOfPeriastronDeg: number;
  systemicVelocityMS: number;
  sampleCount: number;
  provenance: readonly ObservationProvenance[];
  assumptions: readonly string[];
  boundary: "keplerian-display-model-never-writes-solar-nbody";
};

export type TransitModelDocumentV2 = {
  version: typeof OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION;
  systemId: string;
  planetId: string;
  periodDays: ObservationValue<number>;
  radiusRatio: ObservationValue<number>;
  scaledSemiMajorAxis: ObservationValue<number>;
  inclinationDeg: ObservationValue<number>;
  eccentricity: ObservationValue<number>;
  argumentOfPeriastronDeg: ObservationValue<number>;
  transitMidpointBjd: ObservationValue<number>;
  limbDarkening: ObservationValue<readonly [number, number]>;
  sampleCount: number;
  boundary: "worker-display-model-never-writes-solar-nbody";
};

export type RadialVelocityModelDocumentV2 = {
  version: typeof OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION;
  systemId: string;
  planetId: string;
  periodDays: ObservationValue<number>;
  semiAmplitudeMS: ObservationValue<number>;
  eccentricity: ObservationValue<number>;
  argumentOfPeriastronDeg: ObservationValue<number>;
  systemicVelocityMS: ObservationValue<number>;
  sampleCount: number;
  boundary: "keplerian-display-model-never-writes-solar-nbody";
};

export type TransitModelDocument = TransitModelDocumentV1 | TransitModelDocumentV2;
export type RadialVelocityModelDocument = RadialVelocityModelDocumentV1 | RadialVelocityModelDocumentV2;

export type ExoplanetObservationRecordV2 = {
  systemId: string;
  planetId: string;
  hostName: string;
  planetName: string;
  periodDays: ObservationValue<number>;
  radiusRatio: ObservationValue<number>;
  scaledSemiMajorAxis: ObservationValue<number>;
  impactParameter: ObservationValue<number>;
  transitDepthPercent: ObservationValue<number>;
  transitDurationHours: ObservationValue<number>;
  inclinationDeg: ObservationValue<number>;
  eccentricity: ObservationValue<number>;
  argumentOfPeriastronDeg: ObservationValue<number>;
  transitMidpointBjd: ObservationValue<number>;
  rvSemiAmplitudeMS: ObservationValue<number>;
  sourceTable: "pscomppars" | "ps-default";
};

export type ExoplanetObservationManifestV2 = {
  version: typeof OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION;
  systemCount: number;
  planetCount: number;
  generatedAt: string;
  runtimePolicy: "offline-observation-shards-worker-models";
  shards: readonly { id: string; path: string; systemCount: number; planetCount: number; sha256: string }[];
  index: Record<string, string>;
  validationSystemsPath: string;
  provenance: {
    source: "NASA Exoplanet Archive";
    broadTable: "pscomppars";
    validationTable: "ps-default";
    sourceUrl: string;
    broadQuery: string;
    validationQuery: string;
    broadSha256: string;
    validationSha256: string;
  };
};

export const EXOPLANET_OBSERVATION_MANIFEST_V2_URL = "/data/exoplanet-observations-v2/manifest.json";

export type ObservationModelSample = { phase: number; value: number };
export type ObservationWorkerRequest =
  | { type: "transit-model"; requestId: number; document: TransitModelDocument }
  | { type: "radial-velocity-model"; requestId: number; document: RadialVelocityModelDocument };
export type ObservationWorkerResponse =
  | { type: "model-result"; requestId: number; model: "transit" | "radial-velocity"; samples: readonly ObservationModelSample[] }
  | { type: "model-error"; requestId: number; message: string };

function observationNumber(value: number | ObservationValue<number>): number {
  if (typeof value === "number") return value;
  if (value.value == null || !Number.isFinite(value.value)) throw new RangeError(`Missing observation value: ${value.field}`);
  return value.value;
}

function observationTuple(
  value: readonly [number, number] | ObservationValue<readonly [number, number]>,
): readonly [number, number] {
  if (Array.isArray(value)) return value as readonly [number, number];
  const observed = (value as ObservationValue<readonly [number, number]>).value;
  if (observed == null) throw new RangeError("Missing limb-darkening display parameters");
  return observed;
}

export function observationAssumptions(
  document: TransitModelDocumentV2 | RadialVelocityModelDocumentV2,
): readonly ObservationValue<unknown>[] {
  const values = (Object.values(document) as unknown[]).filter((value): value is ObservationValue<unknown> => (
    typeof value === "object" && value !== null && "kind" in value && "field" in value
  ));
  return values.filter((value) => value.kind === "assumption" || value.kind === "display-only");
}

export function createTransitDocumentV2(
  record: ExoplanetObservationRecordV2,
  sampleCount = 360,
): TransitModelDocumentV2 | null {
  if (record.periodDays.value == null || record.radiusRatio.value == null || record.scaledSemiMajorAxis.value == null) return null;
  const assumption = (field: string, value: number, unit: string, note: string): ObservationValue<number> => ({
    value, kind: "assumption", source: "Atlas display assumption", field, unit,
    uncertaintyLower: null, uncertaintyUpper: null, reference: null, note,
  });
  return {
    version: OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
    systemId: record.systemId,
    planetId: record.planetId,
    periodDays: record.periodDays,
    radiusRatio: record.radiusRatio,
    scaledSemiMajorAxis: record.scaledSemiMajorAxis,
    inclinationDeg: record.inclinationDeg.value == null ? assumption("pl_orbincl", 90, "deg", "Edge-on display orientation; inclination is not reported.") : record.inclinationDeg,
    eccentricity: record.eccentricity.value == null ? assumption("pl_orbeccen", 0, "", "Circular display layout; eccentricity is not reported.") : record.eccentricity,
    argumentOfPeriastronDeg: record.argumentOfPeriastronDeg.value == null ? assumption("pl_orblper", 90, "deg", "Display orientation; argument of periastron is not reported.") : record.argumentOfPeriastronDeg,
    transitMidpointBjd: record.transitMidpointBjd,
    limbDarkening: {
      value: [0.3, 0.2], kind: "display-only", source: "Atlas quadratic optical profile", field: "limb_darkening",
      unit: "coefficient", uncertaintyLower: null, uncertaintyUpper: null, reference: null,
      note: "Display passband coefficients; not an archive measurement.",
    },
    sampleCount,
    boundary: "worker-display-model-never-writes-solar-nbody",
  };
}

export function createRadialVelocityDocumentV2(
  record: ExoplanetObservationRecordV2,
  sampleCount = 240,
): RadialVelocityModelDocumentV2 | null {
  if (record.periodDays.value == null || record.rvSemiAmplitudeMS.value == null) return null;
  const assumption = (field: string, value: number, unit: string, note: string): ObservationValue<number> => ({
    value, kind: "assumption", source: "Atlas display assumption", field, unit,
    uncertaintyLower: null, uncertaintyUpper: null, reference: null, note,
  });
  return {
    version: OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
    systemId: record.systemId,
    planetId: record.planetId,
    periodDays: record.periodDays,
    semiAmplitudeMS: record.rvSemiAmplitudeMS,
    eccentricity: record.eccentricity.value == null ? assumption("pl_orbeccen", 0, "", "Circular display curve; eccentricity is not reported.") : record.eccentricity,
    argumentOfPeriastronDeg: record.argumentOfPeriastronDeg.value == null ? assumption("pl_orblper", 0, "deg", "Display phase origin; argument of periastron is not reported.") : record.argumentOfPeriastronDeg,
    systemicVelocityMS: assumption("systemic_velocity", 0, "m/s", "Comparative curve is zero-centered."),
    sampleCount,
    boundary: "keplerian-display-model-never-writes-solar-nbody",
  };
}

function solveEccentricAnomaly(meanAnomaly: number, eccentricity: number): number {
  let eccentricAnomaly = meanAnomaly;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const delta = (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }
  return eccentricAnomaly;
}

function trueAnomalyAtPhase(phase: number, eccentricity: number): number {
  const meanAnomaly = phase * Math.PI * 2;
  const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, eccentricity);
  return 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2),
  );
}

function occultedFlux(
  projectedSeparation: number,
  radiusRatio: number,
  limbDarkening: readonly [number, number],
  radialSteps = 2_048,
): number {
  const [u1, u2] = limbDarkening;
  let total = 0;
  let visible = 0;
  for (let index = 0; index < radialSteps; index += 1) {
    const radius = (index + 0.5) / radialSteps;
    const mu = Math.sqrt(Math.max(0, 1 - radius * radius));
    const intensity = Math.max(0, 1 - u1 * (1 - mu) - u2 * (1 - mu) ** 2);
    const ringWeight = radius * intensity;
    let coveredFraction = 0;
    if (projectedSeparation < 1e-12) {
      coveredFraction = radius <= radiusRatio ? 1 : 0;
    } else {
      const cosine = (radius * radius + projectedSeparation ** 2 - radiusRatio ** 2) /
        (2 * radius * projectedSeparation);
      coveredFraction = cosine <= -1 ? 1 : cosine >= 1 ? 0 : Math.acos(cosine) / Math.PI;
    }
    total += ringWeight;
    visible += ringWeight * (1 - coveredFraction);
  }
  return total > 0 ? visible / total : 1;
}

export function createTransitModelSamples(document: TransitModelDocument): readonly ObservationModelSample[] {
  validateTransitDocument(document);
  const inclinationDeg = observationNumber(document.inclinationDeg);
  const eccentricity = observationNumber(document.eccentricity);
  const argumentOfPeriastronDeg = observationNumber(document.argumentOfPeriastronDeg);
  const scaledSemiMajorAxis = observationNumber(document.scaledSemiMajorAxis);
  const radiusRatio = observationNumber(document.radiusRatio);
  const limbDarkening = observationTuple(document.limbDarkening);
  const inclination = inclinationDeg * Math.PI / 180;
  const omega = argumentOfPeriastronDeg * Math.PI / 180;
  return Array.from({ length: document.sampleCount }, (_, index) => {
    const phase = (index / Math.max(1, document.sampleCount - 1) - 0.5) * 0.3;
    const anomaly = trueAnomalyAtPhase(phase + 0.25 - omega / (Math.PI * 2), eccentricity);
    const radius = scaledSemiMajorAxis * (1 - eccentricity ** 2) /
      (1 + eccentricity * Math.cos(anomaly));
    const longitude = anomaly + omega;
    const separation = radius * Math.sqrt(
      Math.cos(longitude) ** 2 + Math.sin(longitude) ** 2 * Math.cos(inclination) ** 2,
    );
    return { phase, value: occultedFlux(separation, radiusRatio, limbDarkening) };
  });
}

export function createRadialVelocitySamples(document: RadialVelocityModelDocument): readonly ObservationModelSample[] {
  validateRadialVelocityDocument(document);
  const eccentricity = observationNumber(document.eccentricity);
  const omega = observationNumber(document.argumentOfPeriastronDeg) * Math.PI / 180;
  const systemicVelocityMS = observationNumber(document.systemicVelocityMS);
  const semiAmplitudeMS = observationNumber(document.semiAmplitudeMS);
  return Array.from({ length: document.sampleCount }, (_, index) => {
    const phase = index / Math.max(1, document.sampleCount - 1);
    const anomaly = trueAnomalyAtPhase(phase, eccentricity);
    const value = systemicVelocityMS + semiAmplitudeMS *
      (Math.cos(anomaly + omega) + eccentricity * Math.cos(omega));
    return { phase, value };
  });
}

function validateTransitDocument(document: TransitModelDocument): void {
  const radiusRatio = observationNumber(document.radiusRatio);
  const scaledSemiMajorAxis = observationNumber(document.scaledSemiMajorAxis);
  const eccentricity = observationNumber(document.eccentricity);
  if (!(radiusRatio > 0 && radiusRatio < 1)) throw new RangeError("Transit radius ratio must be in (0, 1)");
  if (!(scaledSemiMajorAxis > 1)) throw new RangeError("Scaled semi-major axis must exceed one stellar radius");
  if (!(eccentricity >= 0 && eccentricity < 1)) throw new RangeError("Transit eccentricity must be in [0, 1)");
  if (document.sampleCount < 16 || document.sampleCount > 4_096) throw new RangeError("Transit sample count must be 16-4096");
}

function validateRadialVelocityDocument(document: RadialVelocityModelDocument): void {
  const periodDays = observationNumber(document.periodDays);
  const eccentricity = observationNumber(document.eccentricity);
  if (!(periodDays > 0)) throw new RangeError("RV period must be positive");
  if (!(eccentricity >= 0 && eccentricity < 1)) throw new RangeError("RV eccentricity must be in [0, 1)");
  if (document.sampleCount < 16 || document.sampleCount > 4_096) throw new RangeError("RV sample count must be 16-4096");
}
