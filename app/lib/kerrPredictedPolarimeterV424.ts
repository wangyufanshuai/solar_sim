import { createHash } from "node:crypto";
import {
  parseKerrIdealPolarimeterArtifactV410,
  type KerrIdealPolarimeterArtifactV410,
} from "./kerrIdealPolarimeterV410";
import {
  parseKerrPredictedStokesArtifactV423,
  type KerrPredictedStokesArtifactV423,
} from "./kerrPredictedStokesAdmissionV423";

export const KERR_PREDICTED_POLARIMETER_VERSION_V424 =
  "v424-kerr-predicted-ideal-dual-beam-modulation-v1" as const;
export const KERR_PREDICTED_POLARIMETER_ARTIFACT_VERSION_V424 =
  "v424-kerr-predicted-ideal-dual-beam-modulation-artifact-v1" as const;
export const KERR_PREDICTED_POLARIMETER_SUMMARY_VERSION_V424 =
  "v424-kerr-predicted-ideal-dual-beam-modulation-summary-v1" as const;
export const KERR_PREDICTED_POLARIMETER_RESPONSE_VERSION_V424 =
  "v424-kerr-predicted-ideal-dual-beam-modulation-response-v1" as const;

export const KERR_V423_ARTIFACT_SHA256_V424 =
  "41a2ccb38d6199af8b831b868b42827adea1f5187be73241377d8da10f3f9b8f" as const;
export const KERR_V423_FILE_SHA256_V424 =
  "121d7ec75ae3ad5fad7f2abd0e07a32ad5181cd2e8c1decf55599364ecf25e73" as const;
export const KERR_V410_ARTIFACT_SHA256_V424 =
  "5acfc19b1c1af8ac8f63c5d1a56e39f79501138fbe3b8b57a483b8771f949a22" as const;
export const KERR_V410_FILE_SHA256_V424 =
  "fce8084abd73c90a8c087d1b7605b4d4483dc65ddefeb95198291e65b3941776" as const;

type RayIdV424 = "disk-00" | "disk-01" | "disk-02" | "disk-03";
type TransportV424 = "walker-penrose" | "independent-ks-parallel-transport";
type HwpIndexV424 = 0 | 1 | 2 | 3;
type HwpAngleV424 = 0 | 22.5 | 45 | 67.5;

export type KerrPredictedDualBeamRowV424 = Readonly<{
  rayId: RayIdV424;
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  observedFrequencyHz: number;
  transportMethod: TransportV424;
  continuousCoordinate: Readonly<{
    pixelX: number;
    pixelY: number;
    semantics: "FITS-1-based-continuous-source-coordinate-not-pixel-sample";
  }>;
  hwpIndex: HwpIndexV424;
  hwpAngleDeg: HwpAngleV424;
  predictedOrdinarySpectralRadiance: number;
  predictedExtraordinarySpectralRadiance: number;
  predictedBeamSumSpectralRadiance: number;
  predictedNormalizedFluxDifference: number;
  sourceNormalizedStokes: Readonly<{ qOverI: number; uOverI: number }>;
  provenance: Readonly<{
    source: "v423-WCS-linked-model-predicted-Stokes";
    operatorReference: "v410-ideal-HWP-Wollaston-contract";
    predictionNotMeasurement: true;
    photonOrElectronCountsProduced: false;
    measuredMuellerCalibrationApplied: false;
  }>;
}>;

export type KerrPredictedStokesReconstructionV424 = Readonly<{
  rayId: RayIdV424;
  rayIndex: 12 | 13 | 14 | 15;
  observedFrequencyHz: number;
  transportMethod: TransportV424;
  source: Readonly<{
    i: number;
    q: number;
    u: number;
    qOverI: number;
    uOverI: number;
    linearFraction: number;
    evpaDeg: number;
  }>;
  reconstructed: Readonly<{
    i: number;
    q: number;
    u: number;
    qOverI: number;
    uOverI: number;
    linearFraction: number;
    evpaDeg: number;
    circularV: "unavailable-not-modeled-or-measured";
  }>;
  residuals: Readonly<{
    intensityRelative: number;
    qNormalizedAbsolute: number;
    uNormalizedAbsolute: number;
    linearFractionAbsolute: number;
    evpaDeg: number;
    maximumBeamSumRelative: number;
    maximumFluxLawAbsolute: number;
  }>;
}>;

export type KerrPredictedPolarimeterViewV424 = Readonly<{
  version: typeof KERR_PREDICTED_POLARIMETER_VERSION_V424;
  status: "qualified-ideal-model-predicted-dual-beam-modulation-measurement-and-detector-authority-unavailable";
  source: Readonly<{
    v423PredictedStokesArtifactSha256: typeof KERR_V423_ARTIFACT_SHA256_V424;
    v410OperatorReferenceArtifactSha256: typeof KERR_V410_ARTIFACT_SHA256_V424;
  }>;
  operator: Readonly<{
    device: "ideal-half-wave-plate-plus-ideal-Wollaston-dual-beam";
    hwpAnglesDeg: readonly [0, 22.5, 45, 67.5];
    ordinaryLaw: "fO=0.5*(I+Q*cos(4theta)+U*sin(4theta))";
    extraordinaryLaw: "fE=0.5*(I-Q*cos(4theta)-U*sin(4theta))";
    normalizedDifferenceLaw: "F=(fO-fE)/(fO+fE)=q*cos(4theta)+u*sin(4theta)";
    reconstruction: "q=0.5*(F0-F2),u=0.5*(F1-F3),I=mean(fO+fE)";
    outputUnit: "W m^-2 sr^-1 Hz^-1";
  }>;
  counts: Readonly<{
    sourcePredictionCount: 24;
    rayCount: 4;
    frequencyCount: 3;
    transportMethodCount: 2;
    hwpStateCount: 4;
    modulationRowCount: 96;
    predictedBeamSpectralRadianceCount: 192;
    reconstructionCount: 24;
    measuredRowCount: 0;
    photonCount: 0;
    electronCount: 0;
  }>;
  modulationRows: readonly KerrPredictedDualBeamRowV424[];
  reconstructions: readonly KerrPredictedStokesReconstructionV424[];
  maxima: Readonly<{
    beamSumRelative: number;
    nonnegativeBeamViolation: number;
    normalizedFluxLawAbsolute: number;
    intensityReconstructionRelative: number;
    qNormalizedAbsolute: number;
    uNormalizedAbsolute: number;
    linearFractionAbsolute: number;
    evpaDeg: number;
    pythonOracleDifference: number;
    deterministicReplayDifference: 0;
  }>;
  thresholds: Readonly<{
    beamSumRelative: 1e-12;
    nonnegativeBeamViolation: 0;
    normalizedFluxLawAbsolute: 1e-12;
    normalizedStokesAbsolute: 1e-12;
    linearFractionAbsolute: 1e-12;
    evpaDeg: 1e-10;
    pythonOracleDifference: 1e-12;
  }>;
  qualification: Readonly<{
    idealModelModulationQualified: true;
    fourAngleReconstructionQualified: true;
    wpAndKsPathsPreserved: true;
    measuredPolarimeterQualified: false;
    measuredMuellerCalibrationQualified: false;
    throughputGainNoiseQualified: false;
    photonOrElectronCountsQualified: false;
    detectorCovarianceQualified: false;
    pixelRasterQualified: false;
    denseAuthorityQualified: false;
  }>;
  authorityBoundary: Readonly<{
    modelPredictionQualified: true;
    measurementAuthorityGranted: false;
    detectorAuthorityGranted: false;
    pixelAuthorityGranted: false;
    rasterAuthorityGranted: false;
    denseAuthorityGranted: false;
    unavailableIsNotZero: true;
  }>;
  products: Readonly<{
    json: "available-96-row-ideal-model-modulation-catalog";
    csv: "available-96-row-ideal-model-modulation-catalog";
    fitsBinaryTable: "available-predicted-dual-beam-table-no-image-data";
    png: "available-modulation-diagnostic-not-detector-image";
    fitsImage: "unavailable-no-pixel-raster-authority";
    measuredCounts: "unavailable-no-detector-calibration-or-observation";
  }>;
  scienceCinematicBoundary: Readonly<{
    science: "immutable-ideal-model-predicted-dual-beam-spectral-radiance-and-provenance";
    cinematic: "may-style-modulation-curves-and-instrument-glyphs-only";
    predictedValueMutationAllowed: false;
    measurementClaimAllowed: false;
    detectorImageClaimAllowed: false;
  }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "ideal-model-predicted-HWP-Wollaston-modulation-only-no-measurement-calibrated-Mueller-throughput-gain-noise-counts-detector-pixel-raster-or-dense-authority";
}>;

export type KerrPredictedPolarimeterArtifactV424 = Readonly<{
  version: typeof KERR_PREDICTED_POLARIMETER_ARTIFACT_VERSION_V424;
  generatedAt: string;
  status: KerrPredictedPolarimeterViewV424["status"];
  sourceFiles: Readonly<{
    v423FileSha256: typeof KERR_V423_FILE_SHA256_V424;
    v410FileSha256: typeof KERR_V410_FILE_SHA256_V424;
    pythonOracleFileSha256: string;
  }>;
  pythonOracleArtifactSha256: string;
  view: KerrPredictedPolarimeterViewV424;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  measurementAuthorityGranted: false;
  detectorAuthorityGranted: false;
  artifactSha256: string;
}>;

export type KerrPredictedPolarimeterSummaryV424 = Readonly<{
  version: typeof KERR_PREDICTED_POLARIMETER_SUMMARY_VERSION_V424;
  status: KerrPredictedPolarimeterViewV424["status"];
  artifactSha256: string;
  operator: KerrPredictedPolarimeterViewV424["operator"];
  counts: KerrPredictedPolarimeterViewV424["counts"];
  referenceFrequencyHz: 1e17;
  referenceModulationRows: readonly KerrPredictedDualBeamRowV424[];
  representativeReconstructions: readonly KerrPredictedStokesReconstructionV424[];
  maxima: KerrPredictedPolarimeterViewV424["maxima"];
  qualification: KerrPredictedPolarimeterViewV424["qualification"];
  authorityBoundary: KerrPredictedPolarimeterViewV424["authorityBoundary"];
  products: KerrPredictedPolarimeterViewV424["products"];
  denseCampaignStatus: "incomplete-0-of-49";
  fullArtifactAvailable: true;
  boundary: "bounded-reference-frequency-modulation-and-reconstruction-summary-no-full-96-row-array-in-react-state";
}>;

export type KerrPredictedPolarimeterResponseV424 = Readonly<{
  version: typeof KERR_PREDICTED_POLARIMETER_RESPONSE_VERSION_V424;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrPredictedPolarimeterSummaryV424 | null;
}>;

type OracleV424 = Readonly<{
  version: "v424-kerr-predicted-ideal-dual-beam-python-oracle-v1";
  status: "qualified-ideal-model-predicted-modulation-no-measurement-authority";
  counts: Readonly<{ modulationRowCount: 96; reconstructionCount: 24 }>;
  rows: readonly Readonly<{
    rayId: string;
    observedFrequencyHz: number;
    transportMethod: string;
    hwpIndex: number;
    ordinary: number;
    extraordinary: number;
    normalizedDifference: number;
  }>[];
  reconstructions: readonly Readonly<{
    rayId: string;
    observedFrequencyHz: number;
    transportMethod: string;
    i: number;
    qOverI: number;
    uOverI: number;
  }>[];
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256"]);
const ANGLES = [0, 22.5, 45, 67.5] as const;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export const canonicalShaV424 = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const relative = (difference: number, scale: number) =>
  Math.abs(difference) / Math.max(Math.abs(scale), 1e-300);
const finite = (...values: number[]) => values.every(Number.isFinite);
const evpa = (q: number, u: number) =>
  ((0.5 * Math.atan2(u, q) * 180 / Math.PI) % 180 + 180) % 180;
const axialDifference = (left: number, right: number) => {
  const difference = Math.abs(left - right) % 180;
  return Math.min(difference, 180 - difference);
};

function sourceKey(value: {
  rayId: string;
  observedFrequencyHz: number;
  transportMethod: string;
}) {
  return `${value.rayId}:${value.observedFrequencyHz}:${value.transportMethod}`;
}

export function createKerrPredictedPolarimeterViewV424(
  v423Value: unknown,
  v410Value: unknown,
  oracleValue: unknown,
): KerrPredictedPolarimeterViewV424 {
  const v423: KerrPredictedStokesArtifactV423 = parseKerrPredictedStokesArtifactV423(v423Value);
  const v410: KerrIdealPolarimeterArtifactV410 = parseKerrIdealPolarimeterArtifactV410(v410Value);
  const oracle = oracleValue as OracleV424;
  if (
    v423.artifactSha256 !== KERR_V423_ARTIFACT_SHA256_V424 ||
    v410.artifactSha256 !== KERR_V410_ARTIFACT_SHA256_V424 ||
    oracle.version !== "v424-kerr-predicted-ideal-dual-beam-python-oracle-v1" ||
    oracle.status !== "qualified-ideal-model-predicted-modulation-no-measurement-authority" ||
    oracle.counts?.modulationRowCount !== 96 ||
    oracle.counts.reconstructionCount !== 24 ||
    oracle.rows?.length !== 96 ||
    oracle.reconstructions?.length !== 24 ||
    !SHA.test(oracle.artifactSha256)
  ) throw new Error("v424-source-lock");
  if (
    v410.view.operator.device !== "ideal-half-wave-plate-plus-ideal-wollaston-dual-beam" ||
    JSON.stringify(v410.view.operator.hwpAnglesDeg) !== "[0,22.5,45,67.5]" ||
    v410.view.operator.photonOrElectronCountsProduced !== false
  ) throw new Error("v424-v410-operator-contract");

  let pythonOracleDifference = 0;
  const modulationRows = v423.view.rows.flatMap((source): readonly KerrPredictedDualBeamRowV424[] => {
    const stokes = source.predictedSpectralStokes;
    return ANGLES.map((hwpAngleDeg, hwpIndex) => {
      const phase = 4 * hwpAngleDeg * Math.PI / 180;
      const analyzerSignal = stokes.q * Math.cos(phase) + stokes.u * Math.sin(phase);
      const predictedOrdinarySpectralRadiance = 0.5 * (stokes.i + analyzerSignal);
      const predictedExtraordinarySpectralRadiance = 0.5 * (stokes.i - analyzerSignal);
      const predictedBeamSumSpectralRadiance =
        predictedOrdinarySpectralRadiance + predictedExtraordinarySpectralRadiance;
      const predictedNormalizedFluxDifference =
        (predictedOrdinarySpectralRadiance - predictedExtraordinarySpectralRadiance) /
        predictedBeamSumSpectralRadiance;
      const oracleRow = oracle.rows.find((entry) =>
        entry.rayId === source.rayId &&
        entry.observedFrequencyHz === source.observedFrequencyHz &&
        entry.transportMethod === source.transportMethod &&
        entry.hwpIndex === hwpIndex);
      if (!oracleRow) throw new Error(`v424-oracle-row:${sourceKey(source)}:${hwpIndex}`);
      pythonOracleDifference = Math.max(
        pythonOracleDifference,
        Math.abs(predictedOrdinarySpectralRadiance - oracleRow.ordinary),
        Math.abs(predictedExtraordinarySpectralRadiance - oracleRow.extraordinary),
        Math.abs(predictedNormalizedFluxDifference - oracleRow.normalizedDifference),
      );
      return Object.freeze({
        rayId: source.rayId,
        rayIndex: source.rayIndex,
        spinA: source.spinA,
        observedFrequencyHz: source.observedFrequencyHz,
        transportMethod: source.transportMethod,
        continuousCoordinate: source.continuousCoordinate,
        hwpIndex: hwpIndex as HwpIndexV424,
        hwpAngleDeg,
        predictedOrdinarySpectralRadiance,
        predictedExtraordinarySpectralRadiance,
        predictedBeamSumSpectralRadiance,
        predictedNormalizedFluxDifference,
        sourceNormalizedStokes: Object.freeze({
          qOverI: source.normalizedOrientation.qOverI,
          uOverI: source.normalizedOrientation.uOverI,
        }),
        provenance: Object.freeze({
          source: "v423-WCS-linked-model-predicted-Stokes" as const,
          operatorReference: "v410-ideal-HWP-Wollaston-contract" as const,
          predictionNotMeasurement: true as const,
          photonOrElectronCountsProduced: false as const,
          measuredMuellerCalibrationApplied: false as const,
        }),
      });
    });
  });

  const reconstructions = v423.view.rows.map((source): KerrPredictedStokesReconstructionV424 => {
    const rows = modulationRows.filter((row) => sourceKey(row) === sourceKey(source));
    if (rows.length !== 4) throw new Error(`v424-four-state:${sourceKey(source)}`);
    const flux = rows.map((row) => row.predictedNormalizedFluxDifference);
    const i = rows.reduce((sum, row) => sum + row.predictedBeamSumSpectralRadiance, 0) / 4;
    const qOverI = 0.5 * (flux[0] - flux[2]);
    const uOverI = 0.5 * (flux[1] - flux[3]);
    const q = i * qOverI;
    const u = i * uOverI;
    const linearFraction = Math.hypot(qOverI, uOverI);
    const reconstructedEvpa = evpa(q, u);
    const oracleReconstruction = oracle.reconstructions.find((entry) => sourceKey(entry) === sourceKey(source));
    if (!oracleReconstruction) throw new Error(`v424-oracle-reconstruction:${sourceKey(source)}`);
    pythonOracleDifference = Math.max(
      pythonOracleDifference,
      Math.abs(i - oracleReconstruction.i),
      Math.abs(qOverI - oracleReconstruction.qOverI),
      Math.abs(uOverI - oracleReconstruction.uOverI),
    );
    const maximumBeamSumRelative = Math.max(...rows.map((row) =>
      relative(row.predictedBeamSumSpectralRadiance - source.predictedSpectralStokes.i, source.predictedSpectralStokes.i)));
    const maximumFluxLawAbsolute = Math.max(...rows.map((row) => {
      const phase = 4 * row.hwpAngleDeg * Math.PI / 180;
      const expected = source.normalizedOrientation.qOverI * Math.cos(phase) +
        source.normalizedOrientation.uOverI * Math.sin(phase);
      return Math.abs(row.predictedNormalizedFluxDifference - expected);
    }));
    return Object.freeze({
      rayId: source.rayId,
      rayIndex: source.rayIndex,
      observedFrequencyHz: source.observedFrequencyHz,
      transportMethod: source.transportMethod,
      source: Object.freeze({
        i: source.predictedSpectralStokes.i,
        q: source.predictedSpectralStokes.q,
        u: source.predictedSpectralStokes.u,
        qOverI: source.normalizedOrientation.qOverI,
        uOverI: source.normalizedOrientation.uOverI,
        linearFraction: source.predictedSpectralStokes.linearFraction,
        evpaDeg: source.evpaDeg,
      }),
      reconstructed: Object.freeze({
        i,
        q,
        u,
        qOverI,
        uOverI,
        linearFraction,
        evpaDeg: reconstructedEvpa,
        circularV: "unavailable-not-modeled-or-measured" as const,
      }),
      residuals: Object.freeze({
        intensityRelative: relative(i - source.predictedSpectralStokes.i, source.predictedSpectralStokes.i),
        qNormalizedAbsolute: Math.abs(qOverI - source.normalizedOrientation.qOverI),
        uNormalizedAbsolute: Math.abs(uOverI - source.normalizedOrientation.uOverI),
        linearFractionAbsolute: Math.abs(linearFraction - source.predictedSpectralStokes.linearFraction),
        evpaDeg: axialDifference(reconstructedEvpa, source.evpaDeg),
        maximumBeamSumRelative,
        maximumFluxLawAbsolute,
      }),
    });
  });

  const maxima = Object.freeze({
    beamSumRelative: Math.max(...reconstructions.map((row) => row.residuals.maximumBeamSumRelative)),
    nonnegativeBeamViolation: Math.max(0, ...modulationRows.map((row) =>
      Math.max(-row.predictedOrdinarySpectralRadiance, -row.predictedExtraordinarySpectralRadiance))),
    normalizedFluxLawAbsolute: Math.max(...reconstructions.map((row) => row.residuals.maximumFluxLawAbsolute)),
    intensityReconstructionRelative: Math.max(...reconstructions.map((row) => row.residuals.intensityRelative)),
    qNormalizedAbsolute: Math.max(...reconstructions.map((row) => row.residuals.qNormalizedAbsolute)),
    uNormalizedAbsolute: Math.max(...reconstructions.map((row) => row.residuals.uNormalizedAbsolute)),
    linearFractionAbsolute: Math.max(...reconstructions.map((row) => row.residuals.linearFractionAbsolute)),
    evpaDeg: Math.max(...reconstructions.map((row) => row.residuals.evpaDeg)),
    pythonOracleDifference,
    deterministicReplayDifference: 0 as const,
  });
  if (
    modulationRows.length !== 96 ||
    reconstructions.length !== 24 ||
    modulationRows.some((row) => !finite(
      row.predictedOrdinarySpectralRadiance,
      row.predictedExtraordinarySpectralRadiance,
      row.predictedBeamSumSpectralRadiance,
      row.predictedNormalizedFluxDifference,
    ) || row.predictedOrdinarySpectralRadiance < 0 || row.predictedExtraordinarySpectralRadiance < 0) ||
    maxima.beamSumRelative >= 1e-12 ||
    maxima.nonnegativeBeamViolation !== 0 ||
    maxima.normalizedFluxLawAbsolute >= 1e-12 ||
    maxima.intensityReconstructionRelative >= 1e-12 ||
    maxima.qNormalizedAbsolute >= 1e-12 ||
    maxima.uNormalizedAbsolute >= 1e-12 ||
    maxima.linearFractionAbsolute >= 1e-12 ||
    maxima.evpaDeg >= 1e-10 ||
    maxima.pythonOracleDifference >= 1e-12
  ) throw new Error(`v424-modulation-gate:${JSON.stringify(maxima)}`);

  return Object.freeze({
    version: KERR_PREDICTED_POLARIMETER_VERSION_V424,
    status: "qualified-ideal-model-predicted-dual-beam-modulation-measurement-and-detector-authority-unavailable",
    source: Object.freeze({
      v423PredictedStokesArtifactSha256: KERR_V423_ARTIFACT_SHA256_V424,
      v410OperatorReferenceArtifactSha256: KERR_V410_ARTIFACT_SHA256_V424,
    }),
    operator: Object.freeze({
      device: "ideal-half-wave-plate-plus-ideal-Wollaston-dual-beam",
      hwpAnglesDeg: ANGLES,
      ordinaryLaw: "fO=0.5*(I+Q*cos(4theta)+U*sin(4theta))",
      extraordinaryLaw: "fE=0.5*(I-Q*cos(4theta)-U*sin(4theta))",
      normalizedDifferenceLaw: "F=(fO-fE)/(fO+fE)=q*cos(4theta)+u*sin(4theta)",
      reconstruction: "q=0.5*(F0-F2),u=0.5*(F1-F3),I=mean(fO+fE)",
      outputUnit: "W m^-2 sr^-1 Hz^-1",
    }),
    counts: Object.freeze({
      sourcePredictionCount: 24,
      rayCount: 4,
      frequencyCount: 3,
      transportMethodCount: 2,
      hwpStateCount: 4,
      modulationRowCount: 96,
      predictedBeamSpectralRadianceCount: 192,
      reconstructionCount: 24,
      measuredRowCount: 0,
      photonCount: 0,
      electronCount: 0,
    }),
    modulationRows: Object.freeze(modulationRows),
    reconstructions: Object.freeze(reconstructions),
    maxima,
    thresholds: Object.freeze({
      beamSumRelative: 1e-12,
      nonnegativeBeamViolation: 0,
      normalizedFluxLawAbsolute: 1e-12,
      normalizedStokesAbsolute: 1e-12,
      linearFractionAbsolute: 1e-12,
      evpaDeg: 1e-10,
      pythonOracleDifference: 1e-12,
    }),
    qualification: Object.freeze({
      idealModelModulationQualified: true,
      fourAngleReconstructionQualified: true,
      wpAndKsPathsPreserved: true,
      measuredPolarimeterQualified: false,
      measuredMuellerCalibrationQualified: false,
      throughputGainNoiseQualified: false,
      photonOrElectronCountsQualified: false,
      detectorCovarianceQualified: false,
      pixelRasterQualified: false,
      denseAuthorityQualified: false,
    }),
    authorityBoundary: Object.freeze({
      modelPredictionQualified: true,
      measurementAuthorityGranted: false,
      detectorAuthorityGranted: false,
      pixelAuthorityGranted: false,
      rasterAuthorityGranted: false,
      denseAuthorityGranted: false,
      unavailableIsNotZero: true,
    }),
    products: Object.freeze({
      json: "available-96-row-ideal-model-modulation-catalog",
      csv: "available-96-row-ideal-model-modulation-catalog",
      fitsBinaryTable: "available-predicted-dual-beam-table-no-image-data",
      png: "available-modulation-diagnostic-not-detector-image",
      fitsImage: "unavailable-no-pixel-raster-authority",
      measuredCounts: "unavailable-no-detector-calibration-or-observation",
    }),
    scienceCinematicBoundary: Object.freeze({
      science: "immutable-ideal-model-predicted-dual-beam-spectral-radiance-and-provenance",
      cinematic: "may-style-modulation-curves-and-instrument-glyphs-only",
      predictedValueMutationAllowed: false,
      measurementClaimAllowed: false,
      detectorImageClaimAllowed: false,
    }),
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    boundary: "ideal-model-predicted-HWP-Wollaston-modulation-only-no-measurement-calibrated-Mueller-throughput-gain-noise-counts-detector-pixel-raster-or-dense-authority",
  });
}

export function parseKerrPredictedPolarimeterArtifactV424(value: unknown): KerrPredictedPolarimeterArtifactV424 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrPredictedPolarimeterArtifactV424>
    : null;
  if (
    !source ||
    source.version !== KERR_PREDICTED_POLARIMETER_ARTIFACT_VERSION_V424 ||
    source.status !== "qualified-ideal-model-predicted-dual-beam-modulation-measurement-and-detector-authority-unavailable" ||
    source.sourceFiles?.v423FileSha256 !== KERR_V423_FILE_SHA256_V424 ||
    source.sourceFiles.v410FileSha256 !== KERR_V410_FILE_SHA256_V424 ||
    !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") ||
    !SHA.test(source.pythonOracleArtifactSha256 ?? "") ||
    source.view?.modulationRows?.length !== 96 ||
    source.view.reconstructions.length !== 24 ||
    source.view.counts.predictedBeamSpectralRadianceCount !== 192 ||
    source.view.counts.measuredRowCount !== 0 ||
    source.view.counts.photonCount !== 0 ||
    source.view.counts.electronCount !== 0 ||
    source.view.authorityBoundary.measurementAuthorityGranted !== false ||
    source.view.authorityBoundary.detectorAuthorityGranted !== false ||
    source.view.modulationRows.some((row) =>
      row.provenance.predictionNotMeasurement !== true ||
      row.provenance.photonOrElectronCountsProduced !== false ||
      row.provenance.measuredMuellerCalibrationApplied !== false) ||
    source.deterministicReplay !== true ||
    source.networkAttempted !== false ||
    source.denseShardExecuted !== false ||
    source.measurementAuthorityGranted !== false ||
    source.detectorAuthorityGranted !== false ||
    !SHA.test(source.artifactSha256 ?? "")
  ) throw new Error("v424-artifact-identity");
  return value as KerrPredictedPolarimeterArtifactV424;
}

export function createKerrPredictedPolarimeterSummaryV424(value: unknown): KerrPredictedPolarimeterSummaryV424 {
  const artifact = parseKerrPredictedPolarimeterArtifactV424(value);
  return Object.freeze({
    version: KERR_PREDICTED_POLARIMETER_SUMMARY_VERSION_V424,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    operator: artifact.view.operator,
    counts: artifact.view.counts,
    referenceFrequencyHz: 1e17,
    referenceModulationRows: Object.freeze(artifact.view.modulationRows.filter((row) =>
      row.observedFrequencyHz === 1e17 && row.transportMethod === "walker-penrose")),
    representativeReconstructions: Object.freeze(artifact.view.reconstructions.filter((row) =>
      row.observedFrequencyHz === 1e17)),
    maxima: artifact.view.maxima,
    qualification: artifact.view.qualification,
    authorityBoundary: artifact.view.authorityBoundary,
    products: artifact.view.products,
    denseCampaignStatus: "incomplete-0-of-49",
    fullArtifactAvailable: true,
    boundary: "bounded-reference-frequency-modulation-and-reconstruction-summary-no-full-96-row-array-in-react-state",
  });
}

export function parseKerrPredictedPolarimeterSummaryV424(value: unknown): KerrPredictedPolarimeterSummaryV424 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrPredictedPolarimeterSummaryV424>
    : null;
  if (
    !source ||
    source.version !== KERR_PREDICTED_POLARIMETER_SUMMARY_VERSION_V424 ||
    !SHA.test(source.artifactSha256 ?? "") ||
    source.counts?.modulationRowCount !== 96 ||
    source.counts.predictedBeamSpectralRadianceCount !== 192 ||
    source.counts.measuredRowCount !== 0 ||
    source.referenceModulationRows?.length !== 16 ||
    source.representativeReconstructions?.length !== 8 ||
    source.authorityBoundary?.measurementAuthorityGranted !== false ||
    source.fullArtifactAvailable !== true ||
    source.boundary !== "bounded-reference-frequency-modulation-and-reconstruction-summary-no-full-96-row-array-in-react-state" ||
    Object.hasOwn(source, "modulationRows") ||
    Object.hasOwn(source, "reconstructions")
  ) throw new Error("v424-summary-identity");
  return value as KerrPredictedPolarimeterSummaryV424;
}

export function parseKerrPredictedPolarimeterResponseV424(value: unknown): KerrPredictedPolarimeterResponseV424 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrPredictedPolarimeterResponseV424>
    : null;
  if (!source || source.version !== KERR_PREDICTED_POLARIMETER_RESPONSE_VERSION_V424) {
    throw new Error("v424-response-version");
  }
  if (source.available === true && source.reason === "ready" && source.summary) {
    return Object.freeze({ ...source, summary: parseKerrPredictedPolarimeterSummaryV424(source.summary) }) as KerrPredictedPolarimeterResponseV424;
  }
  if (
    source.available === false &&
    source.summary === null &&
    ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")
  ) return source as KerrPredictedPolarimeterResponseV424;
  throw new Error("v424-response-identity");
}

export function serializeKerrPredictedPolarimeterCsvV424(view: KerrPredictedPolarimeterViewV424): string {
  const header = [
    "ray_id", "ray_index", "spin_a", "observed_frequency_Hz", "transport_method",
    "continuous_pixel_x_fits1", "continuous_pixel_y_fits1", "hwp_index", "hwp_angle_deg",
    "predicted_ordinary_spectral_radiance", "predicted_extraordinary_spectral_radiance",
    "predicted_beam_sum_spectral_radiance", "predicted_normalized_flux_difference",
    "source_q_over_I", "source_u_over_I", "unit", "model_prediction", "measurement_authority",
    "photon_counts_available", "electron_counts_available", "measured_mueller_calibration",
  ];
  const rows = view.modulationRows.map((row) => [
    row.rayId, row.rayIndex, row.spinA, row.observedFrequencyHz, row.transportMethod,
    row.continuousCoordinate.pixelX, row.continuousCoordinate.pixelY, row.hwpIndex, row.hwpAngleDeg,
    row.predictedOrdinarySpectralRadiance, row.predictedExtraordinarySpectralRadiance,
    row.predictedBeamSumSpectralRadiance, row.predictedNormalizedFluxDifference,
    row.sourceNormalizedStokes.qOverI, row.sourceNormalizedStokes.uOverI,
    view.operator.outputUnit, true, false, false, false, false,
  ]);
  return `${[header, ...rows].map((row) => row.join(",")).join("\n")}\n`;
}
