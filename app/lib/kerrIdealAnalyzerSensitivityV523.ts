export const KERR_IDEAL_ANALYZER_SENSITIVITY_VERSION_V523 =
  "v523-kerr-ideal-analyzer-sensitivity-projection-v1" as const;
export const KERR_IDEAL_ANALYZER_SENSITIVITY_API_VERSION_V523 =
  "v523-kerr-ideal-analyzer-sensitivity-projection-api-v1" as const;

type BandV523 = "visible" | "euv" | "soft-x-ray";
type MethodV523 = "walker-penrose" | "independent-ks-parallel-transport";
type AnalyzerV523 = "a000" | "a045" | "a090" | "a135";

type EnergyBeamsV523 = Readonly<{
  ordinaryWM2Sr: string;
  extraordinaryWM2Sr: string;
  sumWM2Sr: string;
  normalizedDifference: string;
}>;
type PhotonBeamsV523 = Readonly<{
  ordinaryPerSM2Sr: string;
  extraordinaryPerSM2Sr: string;
  sumPerSM2Sr: string;
  normalizedDifference: string;
}>;

export type KerrIdealAnalyzerModulationRowV523 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  bandId: BandV523;
  transportMethod: MethodV523;
  scenarioId: string;
  analyzerId: AnalyzerV523;
  analyzerAngleDeg: string;
  energyBeams: EnergyBeamsV523;
  photonBeams: PhotonBeamsV523;
  residuals: Readonly<{
    beamSumRelative: string;
    normalizedFluxLawAbsolute: string;
    nonnegativeBeamViolation: string;
  }>;
  applicability: "ideal-linear-analyzer-model-projection-only";
}>;

export type KerrIdealAnalyzerSensitivityArtifactV523 = Readonly<{
  version: typeof KERR_IDEAL_ANALYZER_SENSITIVITY_VERSION_V523;
  generatedAt: string;
  status: "ideal-four-angle-analyzer-projection-qualified-no-detector-authority";
  source: Readonly<{
    v410ArtifactSha256: string;
    v522ArtifactSha256: string;
    v522ScenarioPlanSha256: string;
  }>;
  operator: Readonly<{
    device: "ideal-linear-analyzer-dual-beam";
    analyzerAnglesDeg: readonly string[];
    ordinaryLaw: string;
    extraordinaryLaw: string;
    reconstruction: string;
    equivalentV410HwpAnglesDeg: readonly string[];
    idealOnly: true;
  }>;
  analyzerPlan: readonly Readonly<{
    analyzerId: AnalyzerV523;
    analyzerAngleDeg: string;
  }>[];
  analyzerPlanSha256: string;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 80;
    independentForwardProjectionAndClosedFormInverse: true;
    randomnessUsed: false;
  }>;
  counts: Readonly<{
    sourceScenarioRowCount: 216;
    analyzerStateCount: 4;
    modulationRowCount: 864;
    energyBeamValueCount: 1728;
    photonBeamValueCount: 1728;
    reconstructionCount: 216;
    channelEnvelopeCount: 96;
    expectedElectronCountRowCount: 0;
    observedCountRowCount: 0;
    measuredCalibrationFileCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<Record<string, string>>;
  limits: Readonly<{
    idealAlgebraResidual: string;
    nonnegativeBeamViolation: string;
  }>;
  modulationRows: readonly KerrIdealAnalyzerModulationRowV523[];
  reconstructions: readonly Readonly<Record<string, unknown>>[];
  channelEnvelopes: readonly Readonly<Record<string, unknown>>[];
  qualification: Readonly<{
    idealForwardProjectionQualified: true;
    idealInverseReconstructionQualified: true;
    energyAndPhotonChannelsQualified: true;
    deterministicChannelEnvelopesQualified: true;
    crossLanguageCanonicalShaQualified: true;
    measuredInstrumentQualified: false;
    detectorProjectionQualified: false;
    scienceAuthorityPromotionAllowed: false;
  }>;
  boundary: Readonly<{
    idealModelOnly: true;
    v522StressTestOnly: true;
    physicalPriorAvailable: false;
    instrumentMuellerMatrixAvailable: false;
    wavelengthDependentRetardanceAvailable: false;
    beamThroughputCalibrationAvailable: false;
    detectorGainNoiseAvailable: false;
    expectedElectronCountsAvailable: false;
    observedCountsAvailable: false;
    scienceRasterAuthorityAvailable: false;
    cinematicScienceWritebackAllowed: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrIdealAnalyzerSensitivitySummaryV523 = Pick<
  KerrIdealAnalyzerSensitivityArtifactV523,
  | "version"
  | "status"
  | "source"
  | "operator"
  | "analyzerPlan"
  | "analyzerPlanSha256"
  | "oracle"
  | "counts"
  | "maxima"
  | "limits"
  | "qualification"
  | "boundary"
  | "artifactSha256"
>;

export type KerrIdealAnalyzerSensitivityApiV523 = Readonly<{
  version: typeof KERR_IDEAL_ANALYZER_SENSITIVITY_API_VERSION_V523;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrIdealAnalyzerSensitivitySummaryV523 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !isRecord(value)
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
export const canonicalKerrIdealAnalyzerSensitivityV523 = (value: unknown) =>
  JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));

function validateCore(value: Partial<KerrIdealAnalyzerSensitivityArtifactV523>) {
  const maxima = value.maxima ?? {};
  return (
    value.version === KERR_IDEAL_ANALYZER_SENSITIVITY_VERSION_V523 &&
    value.status === "ideal-four-angle-analyzer-projection-qualified-no-detector-authority" &&
    Boolean(value.source) &&
    Object.values(value.source ?? {}).every((entry) => SHA.test(entry)) &&
    value.operator?.device === "ideal-linear-analyzer-dual-beam" &&
    value.operator.analyzerAnglesDeg?.join(",") === "0.0,45.0,90.0,135.0" &&
    value.operator.equivalentV410HwpAnglesDeg?.join(",") === "0.0,22.5,45.0,67.5" &&
    value.operator.idealOnly === true &&
    Array.isArray(value.analyzerPlan) &&
    value.analyzerPlan.length === 4 &&
    SHA.test(value.analyzerPlanSha256 ?? "") &&
    value.oracle?.backend === "mpmath-1.3.0" &&
    value.oracle.decimalDigits === 80 &&
    value.oracle.independentForwardProjectionAndClosedFormInverse === true &&
    value.oracle.randomnessUsed === false &&
    value.counts?.sourceScenarioRowCount === 216 &&
    value.counts.analyzerStateCount === 4 &&
    value.counts.modulationRowCount === 864 &&
    value.counts.energyBeamValueCount === 1728 &&
    value.counts.photonBeamValueCount === 1728 &&
    value.counts.reconstructionCount === 216 &&
    value.counts.channelEnvelopeCount === 96 &&
    value.counts.expectedElectronCountRowCount === 0 &&
    value.counts.observedCountRowCount === 0 &&
    value.counts.measuredCalibrationFileCount === 0 &&
    value.counts.sciencePixelRowCount === 0 &&
    validDecimal(value.limits?.idealAlgebraResidual) &&
    Object.entries(maxima).every(([key, entry]) =>
      key === "nonnegativeBeamViolation"
        ? Number(entry) === 0
        : validDecimal(entry) && Number(entry) < Number(value.limits?.idealAlgebraResidual),
    ) &&
    value.qualification?.idealForwardProjectionQualified === true &&
    value.qualification.idealInverseReconstructionQualified === true &&
    value.qualification.energyAndPhotonChannelsQualified === true &&
    value.qualification.deterministicChannelEnvelopesQualified === true &&
    value.qualification.crossLanguageCanonicalShaQualified === true &&
    value.qualification.measuredInstrumentQualified === false &&
    value.qualification.detectorProjectionQualified === false &&
    value.qualification.scienceAuthorityPromotionAllowed === false &&
    value.boundary?.idealModelOnly === true &&
    value.boundary.v522StressTestOnly === true &&
    value.boundary.physicalPriorAvailable === false &&
    value.boundary.instrumentMuellerMatrixAvailable === false &&
    value.boundary.wavelengthDependentRetardanceAvailable === false &&
    value.boundary.beamThroughputCalibrationAvailable === false &&
    value.boundary.detectorGainNoiseAvailable === false &&
    value.boundary.expectedElectronCountsAvailable === false &&
    value.boundary.observedCountsAvailable === false &&
    value.boundary.scienceRasterAuthorityAvailable === false &&
    value.boundary.cinematicScienceWritebackAllowed === false &&
    value.boundary.denseCampaignStatus === "incomplete-0-of-49" &&
    value.boundary.browserQualification === "not-run" &&
    value.boundary.formalProductPointer === "v263" &&
    value.boundary.formalDefaultKernel === "legacy-eih-1pn" &&
    SHA.test(value.artifactSha256 ?? "")
  );
}

export function parseKerrIdealAnalyzerSensitivityArtifactV523(
  value: unknown,
): KerrIdealAnalyzerSensitivityArtifactV523 {
  if (!isRecord(value)) throw new Error("v523-analyzer-shape");
  const artifact = value as Partial<KerrIdealAnalyzerSensitivityArtifactV523>;
  const analyzerIds = new Set((artifact.analyzerPlan ?? []).map((row) => row.analyzerId));
  const scenarioIds = new Set(
    (artifact.modulationRows ?? []).map((row) => row.scenarioId),
  );
  const expectedModulation = new Set(
    [12, 13, 14, 15].flatMap((rayIndex) =>
      ["visible", "euv", "soft-x-ray"].flatMap((bandId) =>
        ["walker-penrose", "independent-ks-parallel-transport"].flatMap((method) =>
          [...scenarioIds].flatMap((scenarioId) =>
            [...analyzerIds].map(
              (analyzerId) => `${rayIndex}:${bandId}:${method}:${scenarioId}:${analyzerId}`,
            ),
          ),
        ),
      ),
    ),
  );
  if (
    !validateCore(artifact) ||
    analyzerIds.size !== 4 ||
    scenarioIds.size !== 9 ||
    !Array.isArray(artifact.modulationRows) ||
    artifact.modulationRows.length !== 864 ||
    artifact.modulationRows.some((row) => {
      const key = `${row.rayIndex}:${row.bandId}:${row.transportMethod}:${row.scenarioId}:${row.analyzerId}`;
      if (!expectedModulation.delete(key)) return true;
      return (
        !validDecimal(row.analyzerAngleDeg) ||
        Object.values(row.energyBeams).some((entry) => !validDecimal(entry)) ||
        Object.values(row.photonBeams).some((entry) => !validDecimal(entry)) ||
        Object.values(row.residuals).some((entry) => !validDecimal(entry)) ||
        Number(row.energyBeams.ordinaryWM2Sr) < 0 ||
        Number(row.energyBeams.extraordinaryWM2Sr) < 0 ||
        Number(row.photonBeams.ordinaryPerSM2Sr) < 0 ||
        Number(row.photonBeams.extraordinaryPerSM2Sr) < 0 ||
        row.applicability !== "ideal-linear-analyzer-model-projection-only"
      );
    }) ||
    expectedModulation.size !== 0 ||
    !Array.isArray(artifact.reconstructions) ||
    artifact.reconstructions.length !== 216 ||
    !Array.isArray(artifact.channelEnvelopes) ||
    artifact.channelEnvelopes.length !== 96 ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) ||
    !SHA.test(artifact.sourceSha256 ?? "")
  ) {
    throw new Error("v523-analyzer-boundary");
  }
  return artifact as KerrIdealAnalyzerSensitivityArtifactV523;
}

export function createKerrIdealAnalyzerSensitivitySummaryV523(
  value: unknown,
): KerrIdealAnalyzerSensitivitySummaryV523 {
  const artifact = parseKerrIdealAnalyzerSensitivityArtifactV523(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    operator: artifact.operator,
    analyzerPlan: artifact.analyzerPlan,
    analyzerPlanSha256: artifact.analyzerPlanSha256,
    oracle: artifact.oracle,
    counts: artifact.counts,
    maxima: artifact.maxima,
    limits: artifact.limits,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

export function parseKerrIdealAnalyzerSensitivityApiV523(
  value: unknown,
): KerrIdealAnalyzerSensitivityApiV523 {
  if (
    !isRecord(value) ||
    value.version !== KERR_IDEAL_ANALYZER_SENSITIVITY_API_VERSION_V523 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v523-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) {
      throw new Error("v523-api-summary");
    }
  } else if (value.summary !== null) {
    throw new Error("v523-api-unavailable-summary");
  }
  return value as unknown as KerrIdealAnalyzerSensitivityApiV523;
}
