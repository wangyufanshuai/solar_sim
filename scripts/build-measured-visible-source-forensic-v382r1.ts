import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { auditSvoVisibleProfileV382 } from "../app/lib/measuredVisibleSourceDossierV382";
import { parseMeasuredVisibleSourceForensicV382R1 } from "../app/lib/measuredVisibleSourceForensicV382R1";

const root = process.cwd();
const rawPath =
  "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml" as const;
const negativePath =
  "dist/staging/measured-authority-v382-visible/attempt-1-negative.json";
const checkpointPath =
  "dist/staging/measured-authority-v382-visible/checkpoint.json";
const parserPath = "app/lib/measuredVisibleSourceDossierV382.ts";
const output = "dist/science/measured-visible-source-v382r1/forensic.json";
const shaBytes = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value: unknown) =>
  shaBytes(JSON.stringify(canonicalize(value)));
const bounded = (path: string, maximumBytes: number) => {
  const target = resolve(root, path);
  const metadata = statSync(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximumBytes) {
    throw new Error(`v382r1-input-size:${path}`);
  }
  return readFileSync(target);
};
const raw = bounded(rawPath, 4 * 1024 * 1024);
const negative = JSON.parse(bounded(negativePath, 64 * 1024).toString("utf8"));
const checkpoint = JSON.parse(
  bounded(checkpointPath, 64 * 1024).toString("utf8"),
);
if (
  negative.status !== "attempt-1-failed-no-automatic-retry" ||
  negative.reason !== "v382-votable-provenance" ||
  negative.attemptConsumed !== true ||
  negative.networkAttempted !== true ||
  negative.automaticRetryApplied !== false ||
  checkpoint.status !== "attempt-1-failed-no-automatic-retry" ||
  checkpoint.attemptConsumed !== true ||
  checkpoint.networkAttempted !== true
) {
  throw new Error("v382r1-negative-evidence-boundary");
}
const profile = auditSvoVisibleProfileV382(raw.toString("utf8"));
const sourceSha256 = shaBytes(raw);
const sidecar = {
  version: "v382r1-offline-source-sidecar-v1",
  sourceId: "svo-f350lp-profile",
  path: rawPath,
  bytes: raw.byteLength,
  sha256: sourceSha256,
  offlineRevalidation: true,
  networkAttemptedDuringCorrection: false,
};
const sidecarPath = `${rawPath}.sha256.json`;
mkdirSync(dirname(resolve(root, sidecarPath)), { recursive: true });
const sidecarTemporary = `${resolve(root, sidecarPath)}.${process.pid}.part`;
writeFileSync(sidecarTemporary, `${JSON.stringify(sidecar, null, 2)}\n`);
renameSync(sidecarTemporary, resolve(root, sidecarPath));
const unsigned = {
  version: "v382r1-visible-source-offline-forensic-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "parser-corrected-offline-source-qualified-1-of-7-attempt-1-failed-no-retry" as const,
  attempt1: Object.freeze({
    status: "attempt-1-failed-no-automatic-retry" as const,
    reason: "v382-votable-provenance" as const,
    attemptConsumed: true as const,
    networkAttempted: true as const,
    automaticRetryApplied: false as const,
    historicalNegativeEvidencePreserved: true as const,
  }),
  correction: Object.freeze({
    cause:
      "xml-double-quoted-attribute-contained-apostrophe-and-legacy-parser-stopped-early" as const,
    parserSourceSha256: shaBytes(bounded(parserPath, 256 * 1024)),
    parserRegressionTestAdded: true as const,
    sourceRevalidatedOffline: true as const,
    networkAttemptedDuringCorrection: false as const,
  }),
  recoveredSource: Object.freeze({
    id: "svo-f350lp-profile" as const,
    path: rawPath,
    bytes: raw.byteLength,
    sha256: sourceSha256,
    profile,
    validated: true as const,
  }),
  progress: Object.freeze({
    qualifiedSourceCount: 1 as const,
    plannedSourceCount: 7 as const,
    remainingSourceCount: 6 as const,
    sourceDossierAvailable: false as const,
    visibleMeasuredAuthorityAvailable: false as const,
    resumeRequiresExplicitAuthorization: true as const,
  }),
  authorityGranted: false as const,
  measuredBandAuthorityCount: 0 as const,
  observedCountsAvailable: false as const,
  runtimePackagingAllowed: false as const,
  syntheticFallbackUsed: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseMeasuredVisibleSourceForensicV382R1({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      sourceSha256: artifact.recoveredSource.sha256,
      profileRows: artifact.recoveredSource.profile.rowCount,
      visibleCoverage400To700Nm:
        artifact.recoveredSource.profile.visibleCoverage400To700Nm,
      progress: `${artifact.progress.qualifiedSourceCount}/${artifact.progress.plannedSourceCount}`,
      automaticRetryApplied: artifact.attempt1.automaticRetryApplied,
      authorityGranted: artifact.authorityGranted,
    },
    null,
    2,
  ),
);
