import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrObservableUncertaintyPayloadV473,
  KERR_OBSERVABLE_UNCERTAINTY_ARTIFACT_VERSION_V473,
  parseKerrObservableUncertaintyArtifactV473,
  type KerrObservableUncertaintyEntryV473,
  type KerrUncertaintyAcceptanceV473,
  type KerrUncertaintyComponentV473,
} from "../app/lib/kerrObservableUncertaintyV473";

type Json = Record<string, unknown>;

const root = process.cwd();
const paths = Object.freeze({
  v312: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  v313: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  v419: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json",
  v420: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json",
  v422: "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json",
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v467: "dist/science/kerr-thin-disk-analytic-v467/thin-disk-analytic.json",
  v468: "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
  v471: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalSha = (value: unknown) =>
  createHash("sha256")
    .update(canonicalKerrObservableUncertaintyPayloadV473(value))
    .digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;

const docs = {
  v312: read(paths.v312),
  v313: read(paths.v313),
  v419: read(paths.v419),
  v420: read(paths.v420),
  v422: read(paths.v422),
  v466: read(paths.v466),
  v467: read(paths.v467),
  v468: read(paths.v468),
  v471: read(paths.v471),
  dense: read(paths.dense),
  formal: read(paths.formal),
};
const formalEvidence = read(String(docs.formal.source));
const t312 = nested(docs.v312, "thresholds");
const t313 = nested(docs.v313, "thresholds");
const view419 = nested(docs.v419, "view");
const view420 = nested(docs.v420, "view");
const view422 = nested(docs.v422, "view");
const m419 = nested(view419, "maxima");
const l419 = nested(view419, "thresholds");
const m420 = nested(view420, "maxima");
const l420 = nested(view420, "thresholds");
const m422 = nested(view422, "maxima");
const l422 = nested(view422, "thresholds");
const f466 = nested(docs.v466, "fixtureExecution");
const f467 = nested(docs.v467, "fixtureExecution");
const f468 = nested(docs.v468, "fixtureExecution");

if (
  docs.v312.status !== "corrected-authority-qualified" ||
  docs.v313.status !== "full-kerr-short-authority-qualified" ||
  docs.v419.status !== "qualified-four-ray-screen-coordinate-provenance-not-a-dense-image" ||
  docs.v420.status !== "qualified-linear-observer-plane-WCS-and-four-source-catalog-no-raster-values" ||
  docs.v422.status !== "qualified-four-source-mask-aware-orientation-basis-no-stokes-or-raster-values" ||
  docs.v466.status !== "radiative-transfer-invariant-qualified-measured-input-blocked" ||
  docs.v467.status !== "thin-disk-analytic-derivative-qualified-measured-input-blocked" ||
  docs.v468.status !== "thin-disk-radiative-coupling-qualified-measured-input-blocked" ||
  docs.v471.status !== "observable-provenance-qualified-production-blocked-browser-pending" ||
  nested(docs.v471, "summary").productionAuthorityGrantedRowCount !== 0 ||
  docs.dense.status !== "incomplete-0-of-49" ||
  docs.dense.completedShardCount !== 0 ||
  docs.dense.attemptConsumed !== false ||
  docs.dense.aggregateAvailable !== false ||
  docs.formal.version !== "v263-current-product-evidence-pointer" ||
  nested(formalEvidence, "science").defaultKernel !== "legacy-eih-1pn" ||
  nested(formalEvidence, "contracts").singleCanvas !== true ||
  nested(formalEvidence, "contracts").legacyRootAttributes !== 603 ||
  nested(formalEvidence, "contracts").evidenceLedgerClaims !== 84
) {
  throw new Error("v473-upstream-boundary");
}

const component = (
  id: string,
  category: KerrUncertaintyComponentV473["category"],
  value: number,
  units: string,
  sourceId: string,
  correlationGroup: string,
  independentlyEstimated: boolean,
): KerrUncertaintyComponentV473 =>
  Object.freeze({
    id,
    category,
    value,
    units,
    sourceId,
    correlationGroup,
    independentlyEstimated,
  });
const acceptance = (
  metric: string,
  observed: number,
  limit: number,
  relation: NonNullable<KerrUncertaintyAcceptanceV473>["relation"],
): KerrUncertaintyAcceptanceV473 =>
  Object.freeze({ metric, observed, limit, relation, passed: true as const });
const entry = (
  value: Omit<
    KerrObservableUncertaintyEntryV473,
    "independenceProven" | "productionBudgetClosed"
  >,
): KerrObservableUncertaintyEntryV473 =>
  Object.freeze({
    ...value,
    independenceProven: false as const,
    productionBudgetClosed: false as const,
  });

const classificationError = 1 - Number(t312.classificationAgreement);
const screenLinear = Number(m419.coordinateReplayResidualM) + Number(m419.pythonOracleDifference);
const wcsLinear =
  Number(m420.tsWorldPixelWorldRoundtripResidualM) +
  Number(m420.pythonAstropyWorldRoundtripResidualM);
const basisLinear =
  Number(m422.basisNormResidual) +
  Number(m422.pythonOracleDifference) +
  Number(m422.v421TensorDifference);
const evpaMaximum = Math.max(
  Number(t313.maxReleaseEvpaDifferenceDeg),
  Number(t313.maxInternalEvpaDifferenceDeg),
);
const radianceMaximum = Math.max(
  Number(f466.maxLiouvilleInvariantRelativeError),
  Number(f468.maxSpectralInverseRelativeError),
  Number(f468.maxBolometricInverseRelativeError),
);

const entries = Object.freeze([
  entry({ observableId: "geometry-classification", status: "qualified-short-budget", components: [component("uClassificationFormula", "formulation-difference", classificationError, "fraction", "v312", "carter-vs-ks-classification", true)], combinationPolicy: "single-component", combinedValue: classificationError, combinedUnits: "fraction", acceptance: acceptance("classificationDisagreementFraction", classificationError, 0.001, "<="), sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["dense-sampling", "model-discrepancy"], unavailableReason: null }),
  entry({ observableId: "emission-radius", status: "qualified-short-budget", components: [component("uDiskRadiusFormula", "formulation-difference", Number(t312.maxDiskRadiusDifferenceM), "geometrized-M", "v312", "carter-vs-ks-radius", true)], combinationPolicy: "single-component", combinedValue: Number(t312.maxDiskRadiusDifferenceM), combinedUnits: "geometrized-M", acceptance: null, sourceQualifiedWithoutNumericLimit: true, missingProductionComponents: ["dense-sampling", "model-discrepancy"], unavailableReason: null }),
  entry({ observableId: "redshift-factor", status: "qualified-short-budget", components: [component("uRedshiftFormula", "formulation-difference", Number(t312.maxRedshiftDifference), "dimensionless", "v312", "carter-vs-ks-redshift", true)], combinationPolicy: "single-component", combinedValue: Number(t312.maxRedshiftDifference), combinedUnits: "dimensionless", acceptance: acceptance("maxRedshiftDifference", Number(t312.maxRedshiftDifference), 0.005, "<"), sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["dense-sampling", "model-discrepancy"], unavailableReason: null }),
  entry({ observableId: "evpa", status: "qualified-short-budget", components: [component("uEvpaRelease", "tolerance-convergence", Number(t313.maxReleaseEvpaDifferenceDeg), "degree", "v313", "nested-WP-PT-tolerances", false), component("uEvpaInternal", "tolerance-convergence", Number(t313.maxInternalEvpaDifferenceDeg), "degree", "v313", "nested-WP-PT-tolerances", false)], combinationPolicy: "maximum-correlated-tolerances", combinedValue: evpaMaximum, combinedUnits: "degree", acceptance: acceptance("maxEvpaDifferenceDeg", evpaMaximum, 0.5, "<"), sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["dense-sampling", "instrument-polarization-response"], unavailableReason: null }),
  entry({ observableId: "screen-alpha-beta", status: "qualified-coordinate-budget", components: [component("uCoordinateReplay", "coordinate-replay", Number(m419.coordinateReplayResidualM), "geometrized-M", "v419", "screen-coordinate-audit", true), component("uPythonCoordinateOracle", "independent-oracle", Number(m419.pythonOracleDifference), "geometrized-M", "v419", "screen-coordinate-audit", true)], combinationPolicy: "linear-sum-no-independence-proof", combinedValue: screenLinear, combinedUnits: "geometrized-M", acceptance: acceptance("linearCoordinateAuditBoundM", screenLinear, Number(l419.coordinateReplayResidualM), "<"), sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["dense-sampling", "plate-scale-calibration"], unavailableReason: null }),
  entry({ observableId: "continuous-wcs-coordinate", status: "qualified-coordinate-budget", components: [component("uTypeScriptWcsRoundtrip", "coordinate-replay", Number(m420.tsWorldPixelWorldRoundtripResidualM), "geometrized-M", "v420", "wcs-roundtrip-audit", true), component("uAstropyWcsRoundtrip", "independent-oracle", Number(m420.pythonAstropyWorldRoundtripResidualM), "geometrized-M", "v420", "wcs-roundtrip-audit", true)], combinationPolicy: "linear-sum-no-independence-proof", combinedValue: wcsLinear, combinedUnits: "geometrized-M", acceptance: acceptance("linearWcsAuditBoundM", wcsLinear, Number(l420.tsWorldPixelWorldRoundtripResidualM), "<"), sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["dense-sampling", "measured-plate-scale-distortion"], unavailableReason: null }),
  entry({ observableId: "orientation-basis", status: "qualified-coordinate-budget", components: [component("uBasisNorm", "coordinate-replay", Number(m422.basisNormResidual), "dimensionless", "v422", "orientation-basis-audit", false), component("uPythonBasisOracle", "independent-oracle", Number(m422.pythonOracleDifference), "dimensionless", "v422", "orientation-basis-audit", true), component("uV421TensorCrossCheck", "tensor-cross-check", Number(m422.v421TensorDifference), "dimensionless", "v422", "orientation-basis-audit", true)], combinationPolicy: "linear-sum-no-independence-proof", combinedValue: basisLinear, combinedUnits: "dimensionless", acceptance: acceptance("linearOrientationBasisBound", basisLinear, Number(l422.basisNormResidual), "<"), sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["polarization-amplitude", "instrument-angle-calibration"], unavailableReason: null }),
  entry({ observableId: "thin-disk-local-emission", status: "qualified-analytic-partial-budget", components: [component("uAnalyticDerivativeAudit", "derivative-audit", Number(f467.maxDerivativeFiniteDifferenceAuditRelativeError), "relative", "v467", "analytic-vs-finite-difference-audit", true)], combinationPolicy: "single-component", combinedValue: Number(f467.maxDerivativeFiniteDifferenceAuditRelativeError), combinedUnits: "relative", acceptance: null, sourceQualifiedWithoutNumericLimit: true, missingProductionComponents: ["model-discrepancy", "measured-accretion-parameters"], unavailableReason: null }),
  entry({ observableId: "observed-radiance", status: "qualified-analytic-partial-budget", components: [component("uLiouvilleInvariant", "invariant-residual", Number(f466.maxLiouvilleInvariantRelativeError), "relative-spectral-invariant", "v466", "spectral-invariant-channel", true), component("uSpectralInverseCoupling", "inverse-coupling", Number(f468.maxSpectralInverseRelativeError), "relative-spectral-radiance", "v468", "spectral-inverse-channel", true), component("uBolometricInverseCoupling", "inverse-coupling", Number(f468.maxBolometricInverseRelativeError), "relative-bolometric-intensity", "v468", "bolometric-inverse-channel", true)], combinationPolicy: "separate-physical-channels", combinedValue: null, combinedUnits: null, acceptance: acceptance("maxSeparateChannelResidual", radianceMaximum, 1e-12, "<"), sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["model-discrepancy", "detector-throughput", "background-read-noise"], unavailableReason: null }),
  entry({ observableId: "detector-response", status: "unavailable-production-budget", components: [], combinationPolicy: "unavailable", combinedValue: null, combinedUnits: null, acceptance: null, sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["measured-detector-calibration", "independent-validation"], unavailableReason: "production-calibration-unavailable" }),
  entry({ observableId: "stokes-iquv", status: "unavailable-production-budget", components: [], combinationPolicy: "unavailable", combinedValue: null, combinedUnits: null, acceptance: null, sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["measured-polarimeter-response", "polarization-amplitude"], unavailableReason: "no-I-Q-U-V-measurements" }),
  entry({ observableId: "science-raster-pixel", status: "unavailable-production-budget", components: [], combinationPolicy: "unavailable", combinedValue: null, combinedUnits: null, acceptance: null, sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["dense-sampling", "payload-admission", "detector-response"], unavailableReason: "science-raster-unavailable" }),
  entry({ observableId: "fits-science-image", status: "unavailable-production-budget", components: [], combinationPolicy: "unavailable", combinedValue: null, combinedUnits: null, acceptance: null, sourceQualifiedWithoutNumericLimit: false, missingProductionComponents: ["science-raster-pixel-uncertainty"], unavailableReason: "no-raster-science-values" }),
]);

const source = Object.fromEntries(
  Object.entries(paths)
    .filter(([key]) => !["formal", "output"].includes(key))
    .map(([key, path]) => [key, fileSha(path)]),
);
const unsigned = {
  version: KERR_OBSERVABLE_UNCERTAINTY_ARTIFACT_VERSION_V473,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "observable-uncertainty-qualified-production-ledger-open-browser-pending" as const,
  source,
  contract: {
    entryCount: 13 as const,
    quantifiedEntryCount: 9 as const,
    unavailableEntryCount: 4 as const,
    componentCount: 16 as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    noRssWithoutIndependenceProof: true as const,
    linearAdditionRequiredWithoutIndependence: true as const,
    separatePhysicalChannelsNotCombined: true as const,
    unavailableIsNotZero: true as const,
    formalProductPointer: "v263" as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
  },
  entries,
  summary: {
    quantifiedEntryCount: 9 as const,
    combinedEntryCount: 8 as const,
    separateChannelEntryCount: 1 as const,
    unavailableEntryCount: 4 as const,
    componentCount: 16 as const,
    numericAcceptanceCount: 7 as const,
    sourceQualifiedWithoutNumericLimitCount: 2 as const,
    linearSumEntryCount: 3 as const,
    maximumEntryCount: 1 as const,
    singleComponentEntryCount: 4 as const,
    rssEntryCount: 0 as const,
    productionBudgetClosedCount: 0 as const,
  },
  productionLedger: {
    status: "open" as const,
    measuredDetectorCalibrationAvailable: false as const,
    denseSamplingAvailable: false as const,
    modelDiscrepancyQuantified: false as const,
    instrumentResponseQuantified: false as const,
    backgroundReadNoiseQuantified: false as const,
    productionPixelUncertaintyAvailable: false as const,
    missingComponentIds: [
      "measured-detector-calibration",
      "dense-sampling",
      "model-discrepancy",
      "instrument-background-read-noise",
    ] as const,
  },
  lifecycle: {
    existingCanvasCount: 1 as const,
    newCanvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    workers: 0 as const,
    gpuBuffers: 0 as const,
    pipelines: 0 as const,
    textures: 0 as const,
    renderTargets: 0 as const,
    typedArrayCaches: 0 as const,
    objectUrls: 0 as const,
    cameraLeases: 0 as const,
    subscriptions: 0 as const,
    allResourcesAtBaseline: true as const,
  },
  boundary: {
    productionAuthorityGranted: false as const,
    sciencePixelRows: 0 as const,
    stokesMeasurementRows: 0 as const,
    fitsImageRows: 0 as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
    imageProductsGenerated: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseShardRunAllowed: false as const,
    browserQualification: "not-run" as const,
    visualMatrixQualification: "not-run" as const,
    soakQualification: "not-run" as const,
    rtxWebGpuQualification: "not-run" as const,
  },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};
const artifact = parseKerrObservableUncertaintyArtifactV473({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomic(paths.output, artifact);

console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      entryCount: artifact.entries.length,
      componentCount: artifact.summary.componentCount,
      quantified: artifact.summary.quantifiedEntryCount,
      combined: artifact.summary.combinedEntryCount,
      separateChannels: artifact.summary.separateChannelEntryCount,
      unavailable: artifact.summary.unavailableEntryCount,
      rssUsed: 0,
      productionLedger: "open",
      productionAuthority: false,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
