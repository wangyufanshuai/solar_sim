import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrSciencePhotonBandViewV328 } from "../app/lib/kerrSciencePhotonBandsV328";
import { parseKerrScienceInstrumentResponseV332 } from "../app/lib/kerrScienceInstrumentResponseV332";
import { parseKerrSpectralShapeResponseArtifactV353 } from "../app/lib/kerrSpectralShapeResponseV353";
import {
  createKerrSpectralCorrelationResponseV354,
  parseKerrSpectralCorrelationResponseArtifactV354,
} from "../app/lib/kerrSpectralCorrelationResponseV354";

const root = process.cwd();
const paths = {
  spectralShape: "dist/science/kerr-spectral-shape-response-v353/audit.json",
  photonBands: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  instrument: "dist/science/kerr-science-instrument-response-v332/response-reference.json",
  output: "dist/science/kerr-spectral-correlation-response-v354/audit.json",
  replay: "dist/science/kerr-spectral-correlation-response-v354/replay.json",
} as const;

function bytes(path: string): Buffer {
  return readFileSync(resolve(root, path));
}

function fileSha256(path: string): string {
  return createHash("sha256").update(bytes(path)).digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

function canonicalSha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function atomicWrite(path: string, value: unknown): void {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
}

function matrixSymmetryDifference(matrix: readonly (readonly number[])[]): number {
  let maximum = 0;
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix.length; column += 1) {
      maximum = Math.max(maximum, Math.abs(matrix[row][column] - matrix[column][row]));
    }
  }
  return maximum;
}

function correlationDiagonalDifference(matrix: readonly (readonly number[])[]): number {
  return Math.max(...matrix.map((row, index) => Math.abs(row[index] - 1)));
}

const spectralShape = parseKerrSpectralShapeResponseArtifactV353(
  JSON.parse(bytes(paths.spectralShape).toString("utf8")),
);
const photonDocument = JSON.parse(bytes(paths.photonBands).toString("utf8")) as {
  artifactSha256: string;
  view: unknown;
};
const instrumentDocument = JSON.parse(bytes(paths.instrument).toString("utf8")) as {
  artifactSha256: string;
  response: unknown;
};
const photonBands = parseKerrSciencePhotonBandViewV328(photonDocument.view);
const instrument = parseKerrScienceInstrumentResponseV332(instrumentDocument.response);
const source = {
  spectralShapePath: paths.spectralShape,
  spectralShapeFileSha256: fileSha256(paths.spectralShape),
  spectralShapeArtifactSha256: spectralShape.artifactSha256,
  photonBandsPath: paths.photonBands,
  photonBandsFileSha256: fileSha256(paths.photonBands),
  photonBandsArtifactSha256: photonDocument.artifactSha256,
  instrumentPath: paths.instrument,
  instrumentFileSha256: fileSha256(paths.instrument),
  instrumentArtifactSha256: instrumentDocument.artifactSha256,
  fullShortAuthoritySha256: spectralShape.source.fullShortAuthoritySha256,
} as const;

const unsigned = createKerrSpectralCorrelationResponseV354(
  photonBands,
  instrument,
  spectralShape,
  source,
  "pending",
);
const artifact = parseKerrSpectralCorrelationResponseArtifactV354({
  ...unsigned,
  artifactSha256: canonicalSha256(unsigned),
});
atomicWrite(paths.output, artifact);

const repeated = createKerrSpectralCorrelationResponseV354(
  photonBands,
  instrument,
  spectralShape,
  source,
  "pending",
);
const covarianceSymmetry = Math.max(
  matrixSymmetryDifference(artifact.model.coefficientCovariance),
  ...artifact.rays.map((ray) => matrixSymmetryDifference(ray.responseRelativeCovariance)),
);
const correlationDiagonal = Math.max(
  ...artifact.rays.map((ray) => correlationDiagonalDifference(ray.responseRelativeCorrelation)),
);
const replayUnsigned = {
  version: "v354-kerr-correlated-spectral-shape-response-replay-v1",
  generatedAt: new Date().toISOString(),
  status: artifact.status,
  auditArtifactSha256: artifact.artifactSha256,
  deterministic: JSON.stringify(artifact.rays) === JSON.stringify(repeated.rays),
  rayCount: artifact.counts.rayCount,
  coefficientCount: artifact.counts.coefficientCount,
  perturbationExecutions: artifact.counts.perturbationExecutions,
  covarianceSymmetryDifference: covarianceSymmetry,
  correlationDiagonalDifference: correlationDiagonal,
  coefficientCovarianceMinimumCholeskyPivot:
    artifact.positiveDefiniteness.coefficientCovarianceMinimumCholeskyPivot,
  energyConservationRelativeDifference: artifact.maxima.energyConservationRelativeDifference,
  noMeasuredCovarianceClaim: artifact.fullMeasuredResponseEnvelope.startsWith("unavailable"),
  noRssIndependenceClaim:
    artifact.model.covariancePolicy ===
    "explicit-synthetic-correlation-quadratic-form-not-rss-independence-claim",
  noScienceMutation: true,
  scienceCinematicBoundary: artifact.scienceCinematicBoundary,
  denseCampaignStatus: artifact.denseCampaignStatus,
  browserQualification: artifact.browserQualification,
  boundary: "v354-explicit-synthetic-covariance-fixture-not-measured-response-authority",
};
atomicWrite(paths.replay, {
  ...replayUnsigned,
  artifactSha256: canonicalSha256(replayUnsigned),
});

console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  rays: artifact.counts.rayCount,
  coefficients: artifact.counts.coefficientCount,
  perturbationExecutions: artifact.counts.perturbationExecutions,
  energyConservation: artifact.maxima.energyConservationRelativeDifference,
  nonlinearity: artifact.maxima.centralDifferenceNonlinearity,
  responseSigma: artifact.maxima.responseRelativeSigma,
  responseCorrelation: artifact.maxima.responseCorrelationAbsoluteOffDiagonal,
  measuredEnvelope: artifact.fullMeasuredResponseEnvelope,
  dense: artifact.denseCampaignStatus,
}, null, 2));
