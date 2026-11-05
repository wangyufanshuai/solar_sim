import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrSpectralCorrelationResponseArtifactV354 } from "../app/lib/kerrSpectralCorrelationResponseV354";
import {
  createKerrSpectralEigenmodeAuditV355,
  parseKerrSpectralEigenmodeAuditArtifactV355,
} from "../app/lib/kerrSpectralEigenmodeAuditV355";

const root = process.cwd();
const paths = {
  correlation: "dist/science/kerr-spectral-correlation-response-v354/audit.json",
  output: "dist/science/kerr-spectral-eigenmode-audit-v355/audit.json",
  replay: "dist/science/kerr-spectral-eigenmode-audit-v355/replay.json",
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

const correlation = parseKerrSpectralCorrelationResponseArtifactV354(
  JSON.parse(bytes(paths.correlation).toString("utf8")),
);
const source = {
  spectralCorrelationPath: paths.correlation,
  spectralCorrelationFileSha256: fileSha256(paths.correlation),
  spectralCorrelationArtifactSha256: correlation.artifactSha256,
  fullShortAuthoritySha256: correlation.source.fullShortAuthoritySha256,
} as const;
const unsigned = createKerrSpectralEigenmodeAuditV355(correlation, source, "pending");
const artifact = parseKerrSpectralEigenmodeAuditArtifactV355({
  ...unsigned,
  artifactSha256: canonicalSha256(unsigned),
});
atomicWrite(paths.output, artifact);

const repeated = createKerrSpectralEigenmodeAuditV355(correlation, source, "pending");
const replayUnsigned = {
  version: "v355-kerr-spectral-response-eigenmode-replay-v1",
  generatedAt: new Date().toISOString(),
  status: artifact.status,
  auditArtifactSha256: artifact.artifactSha256,
  deterministic: JSON.stringify(artifact.rays) === JSON.stringify(repeated.rays),
  eigenmodeCount: artifact.counts.eigenmodeCount,
  ellipseCount: artifact.counts.ellipseCount,
  orthonormalityDeviation: artifact.maxima.orthonormalityDeviation,
  reconstructionRelativeDifference: artifact.maxima.reconstructionRelativeDifference,
  eigenResidualRelativeDifference: artifact.maxima.eigenResidualRelativeDifference,
  traceConservationRelativeDifference: artifact.maxima.traceConservationRelativeDifference,
  noMeasuredEigenmodeClaim: artifact.fullMeasuredEigenmodeAuthority.startsWith("unavailable"),
  noNewIndependenceClaim:
    artifact.decomposition.covariancePolicy ===
    "decomposition-of-v354-explicit-synthetic-covariance-no-new-independence-claim",
  noScienceMutation: true,
  scienceCinematicBoundary: artifact.scienceCinematicBoundary,
  denseCampaignStatus: artifact.denseCampaignStatus,
  browserQualification: artifact.browserQualification,
  boundary: "v355-deterministic-eigenmodes-and-ellipses-of-synthetic-v354-covariance",
};
atomicWrite(paths.replay, {
  ...replayUnsigned,
  artifactSha256: canonicalSha256(replayUnsigned),
});

console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  eigenmodes: artifact.counts.eigenmodeCount,
  ellipses: artifact.counts.ellipseCount,
  orthonormality: artifact.maxima.orthonormalityDeviation,
  reconstruction: artifact.maxima.reconstructionRelativeDifference,
  residual: artifact.maxima.eigenResidualRelativeDifference,
  trace: artifact.maxima.traceConservationRelativeDifference,
  condition: artifact.maxima.conditionNumber,
  measuredAuthority: artifact.fullMeasuredEigenmodeAuthority,
  dense: artifact.denseCampaignStatus,
}, null, 2));
