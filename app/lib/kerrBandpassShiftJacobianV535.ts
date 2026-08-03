import { KERR_PLANCK_CONSTANT_J_S_V328, parseKerrSciencePhotonBandViewV328, type KerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";
import { parseKerrBandpassRedshiftCommutatorArtifactV534, type KerrBandpassRedshiftCommutatorArtifactV534 } from "./kerrBandpassRedshiftCommutatorV534";

export const KERR_BANDPASS_SHIFT_JACOBIAN_VERSION_V535 = "v535-kerr-bandpass-shift-jacobian-atlas-v1" as const;
export const KERR_BANDPASS_SHIFT_JACOBIAN_API_VERSION_V535 = "v535-kerr-bandpass-shift-jacobian-api-v1" as const;
export const KERR_BANDPASS_SHIFT_HUD_PROFILE_ID_V535 = "science-cinematic-v8r4-v535" as const;
export const V535_SPEED_OF_LIGHT_M_S = 299_792_458 as const;
export const V535_BOLTZMANN_CONSTANT_J_K = 1.380649e-23 as const;
export const V535_JACOBIAN_ABSOLUTE_LIMIT = 2e-6;

type ProfilePoint = Readonly<{ wavelengthM: number; throughput: number }>;
export type KerrBandpassShiftJacobianRowV535 = Readonly<{
  rayIndex: number;
  spinA: number;
  redshiftFactor: number;
  effectiveTemperatureK: number;
  analyticResponseShiftLogJacobian: number;
  pythonResponseShiftLogJacobian: number;
  jacobianAbsoluteDifference: number;
  centralDifferenceConvergenceAbsolute: number;
  finiteShiftLnG: number;
  actualFiniteShiftSignedBiasRelative: number;
  firstOrderSignedBiasRelative: number;
  nonlinearRemainderSignedRelative: number;
  nonlinearRemainderFractionOfActual: number;
  measuredWavelengthCalibrationSigmaLn: null;
  projectedInstrumentUncertaintyRelative: null;
  totalScientificUncertaintyRelative: "unavailable";
}>;

export type KerrBandpassShiftJacobianArtifactV535 = Readonly<{
  version: typeof KERR_BANDPASS_SHIFT_JACOBIAN_VERSION_V535;
  generatedAt: string;
  status: "bandpass-shift-jacobian-qualified-absolute-instrument-uncertainty-unavailable";
  source: Readonly<{
    v328PhotonArtifactSha256: string;
    v383RawProfileSha256: string;
    v534BandpassRedshiftArtifactSha256: string;
    v535PythonOracleSha256: string;
    denseAggregateSha256: null;
  }>;
  definition: Readonly<{
    quantity: "d-ln-band-photon-radiance-over-d-ln-response-wavelength";
    responsePerturbation: "eta(exp(delta)-times-lambda-observer)";
    analyticDerivative: "integral-N-lambda-times-lambda-times-d-eta-d-lambda-over-integral-N-lambda-times-eta";
    finiteDisplacement: "delta-equals-ln-redshift-factor";
    uncertaintyProjection: "absolute-J-times-sigma-ln-lambda-only-after-measured-sigma-exists";
    rssApplied: false;
    unavailableTreatedAsZero: false;
  }>;
  rows: readonly KerrBandpassShiftJacobianRowV535[];
  uncertaintyLedger: Readonly<{
    quantifiedComputationalComponents: readonly string[];
    unavailablePhysicalComponents: readonly Readonly<{ id: string; reason: string; numericalPlaceholderUsed: false }>[];
    combinationRule: "linear-sum-without-independence-proof";
    totalScientificUncertaintyAvailable: false;
  }>;
  counts: Readonly<{
    authorityDiskRayCount: 4;
    analyticJacobianCount: 4;
    independentOracleJacobianCount: 4;
    nonlinearRemainderCount: 4;
    physicalUncertaintyIntervalCount: 0;
    electronExpectationRowCount: 0;
    observedCountRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<{
    jacobianAbsoluteDifference: number;
    centralDifferenceConvergenceAbsolute: number;
    nonlinearRemainderFractionOfActual: number;
  }>;
  qualification: Readonly<{
    analyticResponseShiftJacobianQualified: true;
    independentFrequencyDomainOracleQualified: true;
    finiteShiftNonlinearityQuantified: true;
    computationalErrorBudgetQualified: true;
    absoluteInstrumentUncertaintyQualified: false;
    measuredDetectorAuthorityGranted: false;
    scienceRasterQualified: false;
  }>;
  boundary: Readonly<{
    candidateThroughputOnly: true;
    sourceDossierStatus: "incomplete-1-of-7";
    measuredWavelengthCalibrationSigmaAvailable: false;
    measuredCalibrationFiles: 0;
    requiredMeasuredCalibrationFiles: 6;
    electronExpectationAvailable: false;
    observedCountsAvailable: false;
    scienceRasterAvailable: false;
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrBandpassShiftJacobianSummaryV535 = Omit<KerrBandpassShiftJacobianArtifactV535, "generatedAt" | "sourceManifest" | "sourceSha256">;
export type KerrBandpassShiftJacobianApiV535 = Readonly<{
  version: typeof KERR_BANDPASS_SHIFT_JACOBIAN_API_VERSION_V535;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrBandpassShiftJacobianSummaryV535 | null;
}>;
export type KerrBandpassShiftHudModeV535 = "science" | "cinematic";
export type KerrBandpassShiftHudProfileV535 = Readonly<{
  id: typeof KERR_BANDPASS_SHIFT_HUD_PROFILE_ID_V535;
  mode: KerrBandpassShiftHudModeV535;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  jacobian: string;
  remainder: string;
  unavailable: string;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    jacobianDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

const scienceProfile: KerrBandpassShiftHudProfileV535 = Object.freeze({
  id: KERR_BANDPASS_SHIFT_HUD_PROFILE_ID_V535,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#02080b",
  panelRaised: "#07131a",
  ink: "#effdff",
  muted: "#7c989f",
  jacobian: "#79e7ff",
  remainder: "#e7bc79",
  unavailable: "#ff91ad",
  scienceBoundary: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    numericScientificStyleInputCount: 0,
    jacobianDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: null,
});
const cinematicProfile: KerrBandpassShiftHudProfileV535 = Object.freeze({
  ...scienceProfile,
  mode: "cinematic",
  panel: "#100a07",
  panelRaised: "#1b130f",
  ink: "#fff7ea",
  muted: "#b09a84",
  jacobian: "#a0efff",
  remainder: "#ffc77f",
  unavailable: "#ff96b2",
  scienceBoundary: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.055,
    colorGradeIntensity: 0.038,
    numericScientificStyleInputCount: 0,
    jacobianDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: "orbit-atlas-v535-bandpass-shift-jacobian-hud-seed-01",
});
export const resolveKerrBandpassShiftHudProfileV535 = (mode: KerrBandpassShiftHudModeV535) =>
  mode === "science" ? scienceProfile : cinematicProfile;

function parseProfile(xml: string): readonly ProfilePoint[] {
  const points = [...xml.matchAll(/<TR>\s*<TD>([^<]+)<\/TD>\s*<TD>([^<]+)<\/TD>\s*<\/TR>/gi)]
    .map((match) => Object.freeze({ wavelengthM: Number(match[1]) * 1e-10, throughput: Number(match[2]) }));
  if (Buffer.byteLength(xml, "utf8") <= 0 || Buffer.byteLength(xml, "utf8") > 4 * 1024 * 1024
    || points.length !== 8705
    || points.some((point, index) => !Number.isFinite(point.wavelengthM)
      || !Number.isFinite(point.throughput)
      || point.wavelengthM <= 0
      || point.throughput < 0
      || point.throughput > 1
      || (index > 0 && point.wavelengthM <= points[index - 1].wavelengthM))) {
    throw new Error("v535-profile-identity");
  }
  return Object.freeze(points);
}

function photonPerWavelength(wavelengthM: number, temperatureK: number, redshiftFactor: number): number {
  const observedFrequency = V535_SPEED_OF_LIGHT_M_S / wavelengthM;
  const emittedFrequency = observedFrequency / redshiftFactor;
  const exponent = KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequency / (V535_BOLTZMANN_CONSTANT_J_K * temperatureK);
  const emittedEnergy = 2 * KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequency ** 3
    / (V535_SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
  const observedEnergy = redshiftFactor ** 3 * emittedEnergy;
  const value = observedEnergy / (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequency)
    * V535_SPEED_OF_LIGHT_M_S / wavelengthM ** 2;
  if (!Number.isFinite(value) || value <= 0) throw new Error("v535-photon-radiance");
  return value;
}

function analyticLogResponseShiftJacobian(
  points: readonly ProfilePoint[],
  temperatureK: number,
  redshiftFactor: number,
  normalization: number,
): number {
  const visible = points.filter((point) => point.wavelengthM >= 4e-7 * (1 - 1e-15)
    && point.wavelengthM <= 7e-7 * (1 + 1e-15));
  if (visible.length !== 3301) throw new Error("v535-visible-count");
  let sum = 0;
  let correction = 0;
  for (let index = 1; index < visible.length; index += 1) {
    const left = visible[index - 1];
    const right = visible[index];
    const slope = (right.throughput - left.throughput) / (right.wavelengthM - left.wavelengthM);
    const leftValue = photonPerWavelength(left.wavelengthM, temperatureK, redshiftFactor) * left.wavelengthM * slope;
    const rightValue = photonPerWavelength(right.wavelengthM, temperatureK, redshiftFactor) * right.wavelengthM * slope;
    const term = 0.5 * (right.wavelengthM - left.wavelengthM) * (leftValue + rightValue);
    const next = sum + term;
    correction += Math.abs(sum) >= Math.abs(term) ? sum - next + term : term - next + sum;
    sum = next;
  }
  const value = (sum + correction) / normalization;
  if (!Number.isFinite(value)) throw new Error("v535-jacobian");
  return value;
}

export function computeKerrBandpassShiftJacobianV535(
  photonViewValue: KerrSciencePhotonBandViewV328,
  rawProfileXml: string,
  v534Value: KerrBandpassRedshiftCommutatorArtifactV534,
) {
  const photonView = parseKerrSciencePhotonBandViewV328(photonViewValue);
  const v534 = parseKerrBandpassRedshiftCommutatorArtifactV534(v534Value);
  const points = parseProfile(rawProfileXml);
  return Object.freeze(photonView.rays.map((ray) => {
    const source = v534.rows.find((row) => row.rayIndex === ray.rayIndex);
    if (!source) throw new Error(`v535-source-row:${ray.rayIndex}`);
    const jacobian = analyticLogResponseShiftJacobian(
      points,
      ray.effectiveTemperatureK,
      ray.redshiftFactor,
      source.observerBandpassPhotonRadiancePerSM2Sr,
    );
    const finiteShiftLnG = Math.log(ray.redshiftFactor);
    const firstOrderSignedBiasRelative = jacobian * finiteShiftLnG;
    const nonlinearRemainderSignedRelative = source.signedFrozenBiasRelative - firstOrderSignedBiasRelative;
    return Object.freeze({
      rayIndex: ray.rayIndex,
      spinA: ray.spinA,
      redshiftFactor: ray.redshiftFactor,
      effectiveTemperatureK: ray.effectiveTemperatureK,
      analyticResponseShiftLogJacobian: jacobian,
      finiteShiftLnG,
      actualFiniteShiftSignedBiasRelative: source.signedFrozenBiasRelative,
      firstOrderSignedBiasRelative,
      nonlinearRemainderSignedRelative,
      nonlinearRemainderFractionOfActual: Math.abs(nonlinearRemainderSignedRelative) / Math.abs(source.signedFrozenBiasRelative),
    });
  }));
}

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !TRANSIENT.has(key))
    .sort(([a], [b]) => compare(a, b)).map(([key, entry]) => [key, canonicalize(entry)]));
};
export const canonicalKerrBandpassShiftJacobianV535 = (value: unknown) => JSON.stringify(canonicalize(value));

function validateCore(value: Partial<KerrBandpassShiftJacobianArtifactV535>): boolean {
  return value.version === KERR_BANDPASS_SHIFT_JACOBIAN_VERSION_V535
    && value.status === "bandpass-shift-jacobian-qualified-absolute-instrument-uncertainty-unavailable"
    && Object.values(value.source ?? {}).filter((entry) => entry !== null).every((entry) => SHA.test(String(entry)))
    && value.rows?.length === 4
    && value.rows.every((row) => [
      row.analyticResponseShiftLogJacobian,
      row.pythonResponseShiftLogJacobian,
      row.jacobianAbsoluteDifference,
      row.centralDifferenceConvergenceAbsolute,
      row.finiteShiftLnG,
      row.actualFiniteShiftSignedBiasRelative,
      row.firstOrderSignedBiasRelative,
      row.nonlinearRemainderSignedRelative,
      row.nonlinearRemainderFractionOfActual,
    ].every(Number.isFinite)
      && row.jacobianAbsoluteDifference < V535_JACOBIAN_ABSOLUTE_LIMIT
      && row.measuredWavelengthCalibrationSigmaLn === null
      && row.projectedInstrumentUncertaintyRelative === null
      && row.totalScientificUncertaintyRelative === "unavailable")
    && value.counts?.analyticJacobianCount === 4
    && value.counts.independentOracleJacobianCount === 4
    && value.counts.physicalUncertaintyIntervalCount === 0
    && value.counts.electronExpectationRowCount === 0
    && value.counts.observedCountRowCount === 0
    && value.counts.sciencePixelRowCount === 0
    && Number(value.maxima?.jacobianAbsoluteDifference) < V535_JACOBIAN_ABSOLUTE_LIMIT
    && value.uncertaintyLedger?.totalScientificUncertaintyAvailable === false
    && value.uncertaintyLedger.unavailablePhysicalComponents.every((entry) => entry.numericalPlaceholderUsed === false)
    && value.qualification?.analyticResponseShiftJacobianQualified === true
    && value.qualification.absoluteInstrumentUncertaintyQualified === false
    && value.boundary?.measuredWavelengthCalibrationSigmaAvailable === false
    && value.boundary.measuredCalibrationFiles === 0
    && value.boundary.denseCampaignStatus === "incomplete-0-of-49"
    && value.boundary.formalProductPointer === "v263"
    && value.boundary.formalDefaultKernel === "legacy-eih-1pn"
    && SHA.test(value.artifactSha256 ?? "");
}

export function parseKerrBandpassShiftJacobianArtifactV535(value: unknown): KerrBandpassShiftJacobianArtifactV535 {
  if (!isRecord(value) || !validateCore(value as Partial<KerrBandpassShiftJacobianArtifactV535>)) {
    throw new Error("v535-bandpass-shift-boundary");
  }
  const artifact = value as unknown as KerrBandpassShiftJacobianArtifactV535;
  if (!Array.isArray(artifact.sourceManifest)
    || artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256))
    || !SHA.test(artifact.sourceSha256)) {
    throw new Error("v535-bandpass-shift-manifest");
  }
  return artifact;
}

export function createKerrBandpassShiftJacobianSummaryV535(value: unknown): KerrBandpassShiftJacobianSummaryV535 {
  const artifact = parseKerrBandpassShiftJacobianArtifactV535(value);
  const summary = { ...artifact } as Record<string, unknown>;
  delete summary.generatedAt;
  delete summary.sourceManifest;
  delete summary.sourceSha256;
  return Object.freeze(summary) as unknown as KerrBandpassShiftJacobianSummaryV535;
}

export function parseKerrBandpassShiftJacobianApiV535(value: unknown): KerrBandpassShiftJacobianApiV535 {
  if (!isRecord(value)
    || value.version !== KERR_BANDPASS_SHIFT_JACOBIAN_API_VERSION_V535
    || typeof value.available !== "boolean"
    || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) {
    throw new Error("v535-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) throw new Error("v535-api-summary");
  } else if (value.summary !== null) throw new Error("v535-api-unavailable-summary");
  return value as unknown as KerrBandpassShiftJacobianApiV535;
}

export function createKerrBandpassShiftHudEncodingV535(summary: KerrBandpassShiftJacobianSummaryV535, mode: KerrBandpassShiftHudModeV535) {
  if (!SHA.test(summary.artifactSha256)) throw new Error("v535-hud-source");
  return Object.freeze({
    version: "v535-kerr-bandpass-shift-hud-encoding-v1" as const,
    profileId: KERR_BANDPASS_SHIFT_HUD_PROFILE_ID_V535,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    scientificRows: summary.rows,
    scientificGeometryInputCount: 4 as const,
    numericScientificStyleInputCount: 0 as const,
    jacobianDrivesStyle: false as const,
    scientificFieldMutation: false as const,
  });
}

export function compareKerrBandpassShiftHudEncodingsV535(
  science: ReturnType<typeof createKerrBandpassShiftHudEncodingV535>,
  cinematic: ReturnType<typeof createKerrBandpassShiftHudEncodingV535>,
) {
  if (science.mode !== "science" || cinematic.mode !== "cinematic"
    || science.scientificPayloadKey !== cinematic.scientificPayloadKey
    || JSON.stringify(science.scientificRows) !== JSON.stringify(cinematic.scientificRows)) {
    throw new Error("v535-hud-boundary");
  }
  return Object.freeze({
    scientificPayloadStable: true as const,
    scientificGeometryStable: true as const,
    scientificGeometryInputCount: 4 as const,
    numericScientificStyleInputCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}
