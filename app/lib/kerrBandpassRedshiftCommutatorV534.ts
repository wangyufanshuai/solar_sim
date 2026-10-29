import {
  KERR_PLANCK_CONSTANT_J_S_V328,
  parseKerrSciencePhotonBandViewV328,
  type KerrSciencePhotonBandViewV328,
} from "./kerrSciencePhotonBandsV328";

export const KERR_BANDPASS_REDSHIFT_COMMUTATOR_VERSION_V534 =
  "v534-kerr-bandpass-redshift-commutator-atlas-v1" as const;
export const KERR_BANDPASS_REDSHIFT_COMMUTATOR_API_VERSION_V534 =
  "v534-kerr-bandpass-redshift-commutator-api-v1" as const;
export const KERR_BANDPASS_REDSHIFT_HUD_PROFILE_ID_V534 =
  "science-cinematic-v8r3-v534" as const;

export const V534_SPEED_OF_LIGHT_M_S = 299_792_458 as const;
export const V534_BOLTZMANN_CONSTANT_J_K = 1.380649e-23 as const;
export const V534_CROSS_DOMAIN_RELATIVE_LIMIT = 1e-7;
export const V534_UNIT_REDSHIFT_IDENTITY_LIMIT = 1e-12;
export const V534_COMMUTATOR_ABSOLUTE_LIMIT = 1e-7;

type ProfilePoint = Readonly<{ wavelengthM: number; throughput: number }>;

export type KerrBandpassRedshiftCommutatorRowV534 = Readonly<{
  rayIndex: number;
  spinA: number;
  redshiftFactor: number;
  effectiveTemperatureK: number;
  observerBandpassPhotonRadiancePerSM2Sr: number;
  frozenEmitterBandpassPhotonRadiancePerSM2Sr: number;
  signedFrozenBiasRelative: number;
  redshiftBandpassCommutatorRelative: number;
  unitRedshiftIdentityResidual: number;
  v384ObserverBandpassRelativeDifference: number;
  pythonFrequencyDomainRelativeDifference: number;
  pythonCommutatorAbsoluteDifference: number;
  electronExpectationApplicable: false;
}>;

export type KerrBandpassRedshiftCommutatorArtifactV534 = Readonly<{
  version: typeof KERR_BANDPASS_REDSHIFT_COMMUTATOR_VERSION_V534;
  generatedAt: string;
  status: "candidate-bandpass-redshift-commutator-qualified-measured-authority-withheld";
  source: Readonly<{
    v328PhotonArtifactSha256: string;
    v328FullShortAuthoritySha256: string;
    v383ThroughputArtifactSha256: string;
    v383RawProfileSha256: string;
    v384ObservableArtifactSha256: string;
    v534PythonOracleSha256: string;
    denseAggregateSha256: null;
  }>;
  operator: Readonly<{
    observerResponse: "eta(lambda_observer)";
    frozenEmitterApproximation: "eta(g-times-lambda_observer)";
    photonFrequencyTransform: "N_nu_observer=g_squared-times-N_nu_emitter(nu_observer/g)";
    photonWavelengthTransform: "N_lambda_observer=g_fourth-times-N_lambda_emitter(g-times-lambda_observer)";
    exactVariableSubstitution: "d-lambda-emitter=g-times-d-lambda-observer-total-photon-factor-g-cubed";
    commutatorMeaning: "response-redshift-ordering-bias-under-frozen-emitter-bandpass";
    responseAppliedExactlyOnce: true;
  }>;
  rows: readonly KerrBandpassRedshiftCommutatorRowV534[];
  counts: Readonly<{
    authorityDiskRayCount: 4;
    observerBandpassIntegralCount: 4;
    frozenBandpassIntegralCount: 4;
    unitRedshiftIdentityFixtureCount: 4;
    commutatorRowCount: 4;
    electronExpectationRowCount: 0;
    observedCountRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<{
    v384ObserverBandpassRelativeDifference: number;
    pythonFrequencyDomainRelativeDifference: number;
    pythonCommutatorAbsoluteDifference: number;
    unitRedshiftIdentityResidual: number;
    redshiftBandpassCommutatorRelative: number;
  }>;
  minima: Readonly<{ redshiftBandpassCommutatorRelative: number }>;
  algorithms: Readonly<{
    typescript: "observer-wavelength-irregular-trapezoid-neumaier";
    python: "observer-frequency-fixed-simpson-262144";
    integrationDomainIndependent: true;
    parserIndependent: true;
    deterministicReplay: true;
    randomnessUsed: false;
  }>;
  qualification: Readonly<{
    bandpassRedshiftOperatorQualified: true;
    crossDomainOracleQualified: true;
    unitRedshiftIdentityQualified: true;
    nonCommutativityDetected: true;
    physicalInterpretationQualified: true;
    measuredDetectorAuthorityGranted: false;
    productionInstrumentResponseQualified: false;
    scienceRasterQualified: false;
  }>;
  boundary: Readonly<{
    candidateThroughputOnly: true;
    sourceDossierStatus: "incomplete-1-of-7";
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

export type KerrBandpassRedshiftCommutatorSummaryV534 = Omit<
  KerrBandpassRedshiftCommutatorArtifactV534,
  "generatedAt" | "sourceManifest" | "sourceSha256"
>;

export type KerrBandpassRedshiftCommutatorApiV534 = Readonly<{
  version: typeof KERR_BANDPASS_REDSHIFT_COMMUTATOR_API_VERSION_V534;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrBandpassRedshiftCommutatorSummaryV534 | null;
}>;

export type KerrBandpassRedshiftHudModeV534 = "science" | "cinematic";
export type KerrBandpassRedshiftHudProfileV534 = Readonly<{
  id: typeof KERR_BANDPASS_REDSHIFT_HUD_PROFILE_ID_V534;
  mode: KerrBandpassRedshiftHudModeV534;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  exact: string;
  frozen: string;
  unavailable: string;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    commutatorDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

const scienceProfile: KerrBandpassRedshiftHudProfileV534 = Object.freeze({
  id: KERR_BANDPASS_REDSHIFT_HUD_PROFILE_ID_V534,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#02080a",
  panelRaised: "#071217",
  ink: "#effdff",
  muted: "#7e9aa0",
  exact: "#72e6ff",
  frozen: "#f3b777",
  unavailable: "#ff91ad",
  scienceBoundary: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    numericScientificStyleInputCount: 0,
    commutatorDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: null,
});

const cinematicProfile: KerrBandpassRedshiftHudProfileV534 = Object.freeze({
  ...scienceProfile,
  mode: "cinematic",
  panel: "#100906",
  panelRaised: "#1a120e",
  ink: "#fff6e9",
  muted: "#b19a84",
  exact: "#9deeff",
  frozen: "#ffc17d",
  unavailable: "#ff96b2",
  scienceBoundary: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.06,
    colorGradeIntensity: 0.04,
    numericScientificStyleInputCount: 0,
    commutatorDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: "orbit-atlas-v534-bandpass-redshift-hud-seed-01",
});

export const resolveKerrBandpassRedshiftHudProfileV534 = (mode: KerrBandpassRedshiftHudModeV534) =>
  mode === "science" ? scienceProfile : cinematicProfile;

function parseRawProfile(xml: string): readonly ProfilePoint[] {
  if (Buffer.byteLength(xml, "utf8") <= 0 || Buffer.byteLength(xml, "utf8") > 4 * 1024 * 1024) {
    throw new Error("v534-profile-size");
  }
  const points = [...xml.matchAll(/<TR>\s*<TD>([^<]+)<\/TD>\s*<TD>([^<]+)<\/TD>\s*<\/TR>/gi)]
    .map((match) => Object.freeze({ wavelengthM: Number(match[1]) * 1e-10, throughput: Number(match[2]) }));
  if (points.length !== 8705
    || points.some((point, index) => !Number.isFinite(point.wavelengthM)
      || !Number.isFinite(point.throughput)
      || point.wavelengthM <= 0
      || point.throughput < 0
      || point.throughput > 1
      || (index > 0 && point.wavelengthM <= points[index - 1].wavelengthM))) {
    throw new Error("v534-profile-identity");
  }
  return Object.freeze(points);
}

function interpolate(points: readonly ProfilePoint[], wavelengthM: number): number {
  if (wavelengthM < points[0].wavelengthM || wavelengthM > points[points.length - 1].wavelengthM) {
    throw new Error("v534-throughput-outside-profile");
  }
  let lower = 0;
  let upper = points.length - 1;
  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2);
    if (points[middle].wavelengthM < wavelengthM) lower = middle + 1;
    else upper = middle;
  }
  const right = lower;
  if (points[right].wavelengthM === wavelengthM || right === 0) return points[right].throughput;
  const left = right - 1;
  const fraction = (wavelengthM - points[left].wavelengthM)
    / (points[right].wavelengthM - points[left].wavelengthM);
  return points[left].throughput + fraction * (points[right].throughput - points[left].throughput);
}

function observedPhotonPerWavelength(wavelengthM: number, temperatureK: number, redshiftFactor: number): number {
  const observedFrequency = V534_SPEED_OF_LIGHT_M_S / wavelengthM;
  const emittedFrequency = observedFrequency / redshiftFactor;
  const exponent = KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequency
    / (V534_BOLTZMANN_CONSTANT_J_K * temperatureK);
  const emittedEnergy = 2 * KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequency ** 3
    / (V534_SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
  const observedEnergy = redshiftFactor ** 3 * emittedEnergy;
  const photonPerHz = observedEnergy / (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequency);
  const value = photonPerHz * V534_SPEED_OF_LIGHT_M_S / wavelengthM ** 2;
  if (!Number.isFinite(value) || value <= 0) throw new Error("v534-photon-radiance");
  return value;
}

function integrate(
  allPoints: readonly ProfilePoint[],
  observerPoints: readonly ProfilePoint[],
  temperatureK: number,
  redshiftFactor: number,
  frozenResponse: boolean,
): number {
  const integrationPoints = frozenResponse
    ? Array.from(new Set([
        ...observerPoints.map((point) => point.wavelengthM),
        ...allPoints
          .map((point) => point.wavelengthM / redshiftFactor)
          .filter((wavelengthM) => wavelengthM >= observerPoints[0].wavelengthM
            && wavelengthM <= observerPoints[observerPoints.length - 1].wavelengthM),
      ])).sort((left, right) => left - right)
    : observerPoints.map((point) => point.wavelengthM);
  let sum = 0;
  let correction = 0;
  for (let index = 1; index < integrationPoints.length; index += 1) {
    const left = integrationPoints[index - 1];
    const right = integrationPoints[index];
    const response = (wavelengthM: number) => interpolate(
      allPoints,
      frozenResponse ? redshiftFactor * wavelengthM : wavelengthM,
    );
    const leftValue = observedPhotonPerWavelength(left, temperatureK, redshiftFactor) * response(left);
    const rightValue = observedPhotonPerWavelength(right, temperatureK, redshiftFactor) * response(right);
    const term = 0.5 * (right - left) * (leftValue + rightValue);
    const next = sum + term;
    correction += Math.abs(sum) >= Math.abs(term) ? sum - next + term : term - next + sum;
    sum = next;
  }
  const result = sum + correction;
  if (!Number.isFinite(result) || result <= 0) throw new Error("v534-integral");
  return result;
}

const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

export function computeKerrBandpassRedshiftCommutatorV534(
  photonViewValue: KerrSciencePhotonBandViewV328,
  rawProfileXml: string,
) {
  const photonView = parseKerrSciencePhotonBandViewV328(photonViewValue);
  const allPoints = parseRawProfile(rawProfileXml);
  const observerPoints = allPoints.filter(
    (point) => point.wavelengthM >= 4e-7 * (1 - 1e-15) && point.wavelengthM <= 7e-7 * (1 + 1e-15),
  );
  if (observerPoints.length !== 3301) throw new Error("v534-visible-profile-count");
  const rows = photonView.rays.map((ray) => {
    const exact = integrate(allPoints, observerPoints, ray.effectiveTemperatureK, ray.redshiftFactor, false);
    const frozen = integrate(allPoints, observerPoints, ray.effectiveTemperatureK, ray.redshiftFactor, true);
    const unitExact = integrate(allPoints, observerPoints, ray.effectiveTemperatureK, 1, false);
    const unitFrozen = integrate(allPoints, observerPoints, ray.effectiveTemperatureK, 1, true);
    const commutator = Math.abs(exact - frozen) / exact;
    if (!(commutator > 0 && Number.isFinite(commutator))) throw new Error(`v534-commutator:${ray.rayIndex}`);
    return Object.freeze({
      rayIndex: ray.rayIndex,
      spinA: ray.spinA,
      redshiftFactor: ray.redshiftFactor,
      effectiveTemperatureK: ray.effectiveTemperatureK,
      observerBandpassPhotonRadiancePerSM2Sr: exact,
      frozenEmitterBandpassPhotonRadiancePerSM2Sr: frozen,
      signedFrozenBiasRelative: (frozen - exact) / exact,
      redshiftBandpassCommutatorRelative: commutator,
      unitRedshiftIdentityResidual: relativeDifference(unitExact, unitFrozen),
      electronExpectationApplicable: false as const,
    });
  });
  if (rows.length !== 4) throw new Error("v534-row-count");
  return Object.freeze(rows);
}

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256",
]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !TRANSIENT.has(key))
    .sort(([a], [b]) => compare(a, b))
    .map(([key, entry]) => [key, canonicalize(entry)]));
};
export const canonicalKerrBandpassRedshiftCommutatorV534 = (value: unknown) => JSON.stringify(canonicalize(value));

function validateCore(value: Partial<KerrBandpassRedshiftCommutatorArtifactV534>): boolean {
  return value.version === KERR_BANDPASS_REDSHIFT_COMMUTATOR_VERSION_V534
    && value.status === "candidate-bandpass-redshift-commutator-qualified-measured-authority-withheld"
    && Object.values(value.source ?? {}).filter((entry) => entry !== null).every((entry) => SHA.test(String(entry)))
    && value.rows?.length === 4
    && value.rows.every((row) => [
      row.observerBandpassPhotonRadiancePerSM2Sr,
      row.frozenEmitterBandpassPhotonRadiancePerSM2Sr,
      row.signedFrozenBiasRelative,
      row.redshiftBandpassCommutatorRelative,
      row.unitRedshiftIdentityResidual,
      row.v384ObserverBandpassRelativeDifference,
      row.pythonFrequencyDomainRelativeDifference,
      row.pythonCommutatorAbsoluteDifference,
    ].every(Number.isFinite)
      && row.redshiftBandpassCommutatorRelative > 0
      && row.unitRedshiftIdentityResidual < V534_UNIT_REDSHIFT_IDENTITY_LIMIT
      && row.v384ObserverBandpassRelativeDifference < V534_CROSS_DOMAIN_RELATIVE_LIMIT
      && row.pythonFrequencyDomainRelativeDifference < V534_CROSS_DOMAIN_RELATIVE_LIMIT
      && row.pythonCommutatorAbsoluteDifference < V534_COMMUTATOR_ABSOLUTE_LIMIT
      && row.electronExpectationApplicable === false)
    && value.counts?.authorityDiskRayCount === 4
    && value.counts.commutatorRowCount === 4
    && value.counts.electronExpectationRowCount === 0
    && value.counts.observedCountRowCount === 0
    && value.counts.sciencePixelRowCount === 0
    && Number(value.maxima?.v384ObserverBandpassRelativeDifference) < V534_CROSS_DOMAIN_RELATIVE_LIMIT
    && Number(value.maxima?.pythonFrequencyDomainRelativeDifference) < V534_CROSS_DOMAIN_RELATIVE_LIMIT
    && Number(value.maxima?.pythonCommutatorAbsoluteDifference) < V534_COMMUTATOR_ABSOLUTE_LIMIT
    && Number(value.maxima?.unitRedshiftIdentityResidual) < V534_UNIT_REDSHIFT_IDENTITY_LIMIT
    && value.algorithms?.integrationDomainIndependent === true
    && value.algorithms.parserIndependent === true
    && value.qualification?.bandpassRedshiftOperatorQualified === true
    && value.qualification.nonCommutativityDetected === true
    && value.qualification.measuredDetectorAuthorityGranted === false
    && value.boundary?.sourceDossierStatus === "incomplete-1-of-7"
    && value.boundary.measuredCalibrationFiles === 0
    && value.boundary.electronExpectationAvailable === false
    && value.boundary.observedCountsAvailable === false
    && value.boundary.scienceRasterAvailable === false
    && value.boundary.denseCampaignStatus === "incomplete-0-of-49"
    && value.boundary.browserQualification === "not-run"
    && value.boundary.formalProductPointer === "v263"
    && value.boundary.formalDefaultKernel === "legacy-eih-1pn"
    && SHA.test(value.artifactSha256 ?? "");
}

export function parseKerrBandpassRedshiftCommutatorArtifactV534(value: unknown): KerrBandpassRedshiftCommutatorArtifactV534 {
  if (!isRecord(value) || !validateCore(value as Partial<KerrBandpassRedshiftCommutatorArtifactV534>)) {
    throw new Error("v534-bandpass-redshift-boundary");
  }
  const artifact = value as unknown as KerrBandpassRedshiftCommutatorArtifactV534;
  if (!Array.isArray(artifact.sourceManifest)
    || artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256))
    || !SHA.test(artifact.sourceSha256)) {
    throw new Error("v534-bandpass-redshift-manifest");
  }
  return artifact;
}

export function createKerrBandpassRedshiftCommutatorSummaryV534(value: unknown): KerrBandpassRedshiftCommutatorSummaryV534 {
  const artifact = parseKerrBandpassRedshiftCommutatorArtifactV534(value);
  const summary = { ...artifact } as Record<string, unknown>;
  delete summary.generatedAt;
  delete summary.sourceManifest;
  delete summary.sourceSha256;
  return Object.freeze(summary) as unknown as KerrBandpassRedshiftCommutatorSummaryV534;
}

export function parseKerrBandpassRedshiftCommutatorApiV534(value: unknown): KerrBandpassRedshiftCommutatorApiV534 {
  if (!isRecord(value)
    || value.version !== KERR_BANDPASS_REDSHIFT_COMMUTATOR_API_VERSION_V534
    || typeof value.available !== "boolean"
    || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) {
    throw new Error("v534-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) throw new Error("v534-api-summary");
  } else if (value.summary !== null) {
    throw new Error("v534-api-unavailable-summary");
  }
  return value as unknown as KerrBandpassRedshiftCommutatorApiV534;
}

export function createKerrBandpassRedshiftHudEncodingV534(
  summary: KerrBandpassRedshiftCommutatorSummaryV534,
  mode: KerrBandpassRedshiftHudModeV534,
) {
  if (!SHA.test(summary.artifactSha256)) throw new Error("v534-hud-source");
  return Object.freeze({
    version: "v534-kerr-bandpass-redshift-hud-encoding-v1" as const,
    profileId: KERR_BANDPASS_REDSHIFT_HUD_PROFILE_ID_V534,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    scientificRows: summary.rows,
    scientificGeometryInputCount: 4 as const,
    numericScientificStyleInputCount: 0 as const,
    commutatorDrivesStyle: false as const,
    scientificFieldMutation: false as const,
  });
}

export function compareKerrBandpassRedshiftHudEncodingsV534(
  science: ReturnType<typeof createKerrBandpassRedshiftHudEncodingV534>,
  cinematic: ReturnType<typeof createKerrBandpassRedshiftHudEncodingV534>,
) {
  if (science.mode !== "science"
    || cinematic.mode !== "cinematic"
    || science.scientificPayloadKey !== cinematic.scientificPayloadKey
    || JSON.stringify(science.scientificRows) !== JSON.stringify(cinematic.scientificRows)) {
    throw new Error("v534-hud-boundary");
  }
  return Object.freeze({
    scientificPayloadStable: true as const,
    scientificGeometryStable: true as const,
    scientificGeometryInputCount: 4 as const,
    numericScientificStyleInputCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}
