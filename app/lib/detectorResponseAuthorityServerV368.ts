import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseDetectorCalibrationManifestV361 } from "./detectorCalibrationAdmissionV361";
import { parseDetectorCalibrationAuthorityEnvelopeV367, parseDetectorCalibrationAuthorityPointerV367, resolveMeasuredDetectorResponseV368 } from "./detectorResponseAuthorityGateV368";
import { parseDetectorResponseAuthoritySnapshotV368, type DetectorResponseAuthoritySnapshotV368 } from "./detectorResponseAuthorityV368";

const ADMISSION = "dist/science/detector-calibration-v367/admission.json";
const AUTHORITY_POINTER = "dist/release/orbit-atlas-detector-calibration-authority-v367.json";
const MANIFEST = "dist/staging/detector-calibration-v361/manifest.json";
let cache: { fingerprint: string; promise: Promise<DetectorResponseAuthoritySnapshotV368> } | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => sha(JSON.stringify(canonicalize(value)));
async function metadata(path: string, maximumBytes: number) {
  try {
    const value = await stat(path);
    if (!value.isFile() || value.size <= 0 || value.size > maximumBytes) throw new Error("v368-artifact-size");
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
const unavailable = (admissionPresent: boolean, authorityPointerPresent: boolean, manifestPresent: boolean): DetectorResponseAuthoritySnapshotV368 => parseDetectorResponseAuthoritySnapshotV368({
  version: "v368-detector-response-authority-snapshot-v1",
  status: "unavailable-v367-authority-artifacts-missing",
  reason: admissionPresent || authorityPointerPresent || manifestPresent ? "authority-chain-artifact-missing" : "authority-chain-artifacts-missing",
  admissionArtifactPresent: admissionPresent,
  authorityPointerPresent,
  manifestPresent,
  authorityGranted: false,
  measuredResponseAvailable: false,
  bandResponseCount: 0,
  bandResponses: [],
  admissionArtifactSha256: null,
  authorityPointerSha256: null,
  manifestFileSha256: null,
  manifestCanonicalSha256: null,
  instrumentSerialOrCampaignId: null,
  syntheticV332Status: "separate-qualified-fixture-never-measured-fallback",
  syntheticFallbackUsed: false,
  sciencePayloadMutationAllowed: false,
  cinematicConsumerAllowed: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  browserQualification: "not-run",
  boundary: "intent-only-read-only-authority-gate-no-synthetic-measured-fallback",
});

export async function loadDetectorResponseAuthoritySnapshotV368(root = process.cwd()): Promise<DetectorResponseAuthoritySnapshotV368> {
  const admissionPath = resolve(root, ADMISSION); const manifestPath = resolve(root, MANIFEST);
  const authorityPointerPath = resolve(root, AUTHORITY_POINTER);
  const [admissionMetadata, authorityPointerMetadata, manifestMetadata] = await Promise.all([metadata(admissionPath, 512 * 1024), metadata(authorityPointerPath, 64 * 1024), metadata(manifestPath, 1024 * 1024)]);
  const fingerprint = `${admissionMetadata ? `${admissionMetadata.size}:${admissionMetadata.mtimeMs}` : "missing"}|${authorityPointerMetadata ? `${authorityPointerMetadata.size}:${authorityPointerMetadata.mtimeMs}` : "missing"}|${manifestMetadata ? `${manifestMetadata.size}:${manifestMetadata.mtimeMs}` : "missing"}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = (async () => {
    if (!admissionMetadata || !authorityPointerMetadata || !manifestMetadata) return unavailable(Boolean(admissionMetadata), Boolean(authorityPointerMetadata), Boolean(manifestMetadata));
    const [admissionBytes, authorityPointerBytes, manifestBytes] = await Promise.all([readFile(admissionPath), readFile(authorityPointerPath), readFile(manifestPath)]);
    const admission = parseDetectorCalibrationAuthorityEnvelopeV367(JSON.parse(admissionBytes.toString("utf8")));
    if (canonicalSha(admission) !== admission.artifactSha256) throw new Error("v368-admission-sha");
    const authorityPointer = parseDetectorCalibrationAuthorityPointerV367(JSON.parse(authorityPointerBytes.toString("utf8")));
    if (canonicalSha(authorityPointer) !== authorityPointer.pointerSha256) throw new Error("v368-authority-pointer-sha");
    const manifest = parseDetectorCalibrationManifestV361(JSON.parse(manifestBytes.toString("utf8")));
    const manifestFileSha256 = sha(manifestBytes); const manifestCanonicalSha256 = canonicalSha(manifest);
    if (!admission.decision.authorityGranted || admission.status !== "qualified-measured-authority-local-shadow-only") return parseDetectorResponseAuthoritySnapshotV368({ ...unavailable(true, true, true), status: "unavailable-v367-authority-not-qualified", reason: "v367-authority-not-qualified", admissionArtifactSha256: admission.artifactSha256, authorityPointerSha256: authorityPointer.pointerSha256, manifestFileSha256, manifestCanonicalSha256, instrumentSerialOrCampaignId: manifest.instrument.serialOrCampaignId });
    const bandResponses = manifest.response.bands.map((band) => resolveMeasuredDetectorResponseV368({ admission, authorityPointer, manifest, verifiedManifestFileSha256: manifestFileSha256, verifiedManifestCanonicalSha256: manifestCanonicalSha256, query: { bandId: band.bandId, wavelengthM: band.points[Math.floor(band.points.length / 2)].wavelengthM } }));
    return parseDetectorResponseAuthoritySnapshotV368({
      version: "v368-detector-response-authority-snapshot-v1",
      status: "qualified-measured-response-adapter",
      reason: "qualified",
      admissionArtifactPresent: true,
      authorityPointerPresent: true,
      manifestPresent: true,
      authorityGranted: true,
      measuredResponseAvailable: true,
      bandResponseCount: bandResponses.length,
      bandResponses,
      admissionArtifactSha256: admission.artifactSha256,
      authorityPointerSha256: authorityPointer.pointerSha256,
      manifestFileSha256,
      manifestCanonicalSha256,
      instrumentSerialOrCampaignId: manifest.instrument.serialOrCampaignId,
      syntheticV332Status: "separate-qualified-fixture-never-measured-fallback",
      syntheticFallbackUsed: false,
      sciencePayloadMutationAllowed: false,
      cinematicConsumerAllowed: false,
      formalProductPointer: "v263",
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      boundary: "intent-only-read-only-authority-gate-no-synthetic-measured-fallback",
    });
  })();
  cache = { fingerprint, promise };
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetDetectorResponseAuthorityServerV368CacheForTests(): void { cache = null; }
