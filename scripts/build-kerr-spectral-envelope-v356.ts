import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrSpectralCorrelationResponseArtifactV354 } from "../app/lib/kerrSpectralCorrelationResponseV354";
import { parseKerrSpectralEigenmodeAuditArtifactV355 } from "../app/lib/kerrSpectralEigenmodeAuditV355";
import {
  createKerrSpectralEnvelopeV356,
  parseKerrSpectralEnvelopeArtifactV356,
  serializeKerrSpectralEnvelopeCsvV356,
  serializeKerrSpectralEnvelopeJsonV356,
} from "../app/lib/kerrSpectralEnvelopeV356";

const root = process.cwd();
const paths = {
  eigenmode: "dist/science/kerr-spectral-eigenmode-audit-v355/audit.json",
  correlation: "dist/science/kerr-spectral-correlation-response-v354/audit.json",
  output: "dist/science/kerr-spectral-envelope-v356/audit.json",
  replay: "dist/science/kerr-spectral-envelope-v356/replay.json",
  json: "dist/science/kerr-spectral-envelope-v356/export.json",
  csv: "dist/science/kerr-spectral-envelope-v356/export.csv",
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

function atomicWrite(path: string, value: string | unknown): void {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
}

const eigenmode = parseKerrSpectralEigenmodeAuditArtifactV355(
  JSON.parse(bytes(paths.eigenmode).toString("utf8")),
);
const correlation = parseKerrSpectralCorrelationResponseArtifactV354(
  JSON.parse(bytes(paths.correlation).toString("utf8")),
);
const source = {
  eigenmodePath: paths.eigenmode,
  eigenmodeFileSha256: fileSha256(paths.eigenmode),
  eigenmodeArtifactSha256: eigenmode.artifactSha256,
  correlationArtifactSha256: correlation.artifactSha256,
  fullShortAuthoritySha256: eigenmode.source.fullShortAuthoritySha256,
} as const;
const unsigned = createKerrSpectralEnvelopeV356(eigenmode, correlation, source, "pending");
const artifact = parseKerrSpectralEnvelopeArtifactV356({
  ...unsigned,
  artifactSha256: canonicalSha256(unsigned),
});
const json = serializeKerrSpectralEnvelopeJsonV356(artifact);
const csv = serializeKerrSpectralEnvelopeCsvV356(artifact);
if (
  createHash("sha256").update(json).digest("hex") !== artifact.exports.jsonSha256 ||
  createHash("sha256").update(csv).digest("hex") !== artifact.exports.csvSha256
) throw new Error("v356-export-sha");
atomicWrite(paths.output, artifact);
atomicWrite(paths.json, json);
atomicWrite(paths.csv, csv);

const repeated = createKerrSpectralEnvelopeV356(eigenmode, correlation, source, "pending");
const replayUnsigned = {
  version: "v356-kerr-spectral-provenance-envelope-replay-v1",
  generatedAt: new Date().toISOString(),
  status: artifact.status,
  auditArtifactSha256: artifact.artifactSha256,
  deterministic: JSON.stringify(artifact.rays) === JSON.stringify(repeated.rays),
  jsonSha256: artifact.exports.jsonSha256,
  csvSha256: artifact.exports.csvSha256,
  jsonByteLength: artifact.exports.jsonByteLength,
  csvByteLength: artifact.exports.csvByteLength,
  envelope2DCount: artifact.counts.envelope2DCount,
  envelope3DPointCount: artifact.counts.envelope3DPointCount,
  reconstructionRelativeDifference: artifact.maxima.reconstructionRelativeDifference,
  maximumMahalanobisRadiusDifference: artifact.maxima.maximumMahalanobisRadiusDifference,
  absolutePathsExcluded: artifact.exports.absolutePathsExcluded,
  generatedAtExcluded: artifact.exports.generatedAtExcluded,
  pidExcluded: artifact.exports.pidExcluded,
  noMeasuredEnvelopeClaim: artifact.fullMeasuredEnvelopeAuthority.startsWith("unavailable"),
  noScienceMutation: true,
  scienceCinematicBoundary: artifact.scienceCinematicBoundary,
  denseCampaignStatus: artifact.denseCampaignStatus,
  browserQualification: artifact.browserQualification,
};
atomicWrite(paths.replay, {
  ...replayUnsigned,
  artifactSha256: canonicalSha256(replayUnsigned),
});

console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  jsonSha256: artifact.exports.jsonSha256,
  csvSha256: artifact.exports.csvSha256,
  jsonBytes: artifact.exports.jsonByteLength,
  csvBytes: artifact.exports.csvByteLength,
  envelope2D: artifact.counts.envelope2DCount,
  envelope3DPoints: artifact.counts.envelope3DPointCount,
  reconstruction: artifact.maxima.reconstructionRelativeDifference,
  mahalaRadius: artifact.maxima.maximumMahalanobisRadiusDifference,
  measuredAuthority: artifact.fullMeasuredEnvelopeAuthority,
  dense: artifact.denseCampaignStatus,
}, null, 2));
