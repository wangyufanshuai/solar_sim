import { createHash } from "node:crypto";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadDetectorResponseAuthoritySnapshotV368 } from "../app/lib/detectorResponseAuthorityServerV368";

const root = process.cwd();
const output = "dist/science/detector-response-v368/inspect.json";
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
async function main() {
const snapshot = await loadDetectorResponseAuthoritySnapshotV368(root);
const unsigned = {
  version: "v368-detector-response-authority-inspect-v1",
  generatedAt: new Date().toISOString(),
  status: snapshot.status,
  adapterImplemented: true,
  requestPolicy: "local-shadow-research-instrument-intent-only",
  admissionArtifactPresent: snapshot.admissionArtifactPresent,
  authorityPointerPresent: snapshot.authorityPointerPresent,
  manifestPresent: snapshot.manifestPresent,
  authorityGranted: snapshot.authorityGranted,
  measuredResponseAvailable: snapshot.measuredResponseAvailable,
  bandResponseCount: snapshot.bandResponseCount,
  syntheticFallbackUsed: snapshot.syntheticFallbackUsed,
  syntheticV332Status: snapshot.syntheticV332Status,
  sciencePayloadMutationAllowed: snapshot.sciencePayloadMutationAllowed,
  cinematicConsumerAllowed: snapshot.cinematicConsumerAllowed,
  formalProductPointer: snapshot.formalProductPointer,
  denseCampaignStatus: snapshot.denseCampaignStatus,
  browserQualification: snapshot.browserQualification,
  networkAttempted: false,
  attemptConsumed: false,
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, admissionArtifactPresent: artifact.admissionArtifactPresent, authorityPointerPresent: artifact.authorityPointerPresent, manifestPresent: artifact.manifestPresent, authorityGranted: artifact.authorityGranted, measuredResponseAvailable: artifact.measuredResponseAvailable, syntheticFallbackUsed: artifact.syntheticFallbackUsed, attemptConsumed: artifact.attemptConsumed }, null, 2));
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
