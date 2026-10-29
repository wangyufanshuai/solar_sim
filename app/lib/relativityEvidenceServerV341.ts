import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { loadAtlasRelativityEvidenceSnapshotV338 } from "./relativityEvidenceServerV338";
import type { AtlasRelativityEvidenceSnapshotV341, RelativityObservationEvidenceV341, RelativityVisualEvidenceV341 } from "./relativityWorkbenchEvidenceV341";

const FILES = ["dist/science/orbit-atlas-shadow-v340-evidence.json", "dist/science/orbit-atlas-shadow-v341-evidence.json"] as const;
const LIMIT = 128 * 1024;
type Document = Record<string, unknown>;
type CacheEntry = { fingerprint: string; promise: Promise<readonly Document[]> };
const cache = new Map<string, CacheEntry>();
function record(value: unknown): Document { return value && typeof value === "object" && !Array.isArray(value) ? value as Document : {}; }
function number(value: unknown, fallback = 0): number { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function bool(value: unknown): boolean { return value === true; }
function sha(value: unknown): string | null { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value) ? value : null; }
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Document).filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
}
function canonicalSha(value: unknown): string { return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex"); }
async function loadDocuments(root: string): Promise<readonly Document[]> {
  const paths = FILES.map((relative) => resolve(root, relative));
  const metadata = await Promise.all(paths.map((path) => stat(path)));
  if (metadata.some((entry) => !entry.isFile() || entry.size <= 0 || entry.size > LIMIT)) throw new Error("v341-evidence-input-boundary");
  const fingerprint = metadata.map((entry) => `${entry.size}:${entry.mtimeMs}`).join("|");
  const cacheKey = resolve(root); const cached = cache.get(cacheKey);
  if (cached?.fingerprint === fingerprint) return cached.promise;
  const promise = Promise.all(paths.map(async (path, index) => {
    const bytes = await readFile(path);
    if (bytes.byteLength !== metadata[index].size) throw new Error("v341-evidence-changed-during-read");
    const document = JSON.parse(bytes.toString("utf8")) as Document;
    const unsigned = { ...document }; delete unsigned.evidenceSha256;
    if (canonicalSha(unsigned) !== document.evidenceSha256) throw new Error("v341-evidence-sha-mismatch");
    return document;
  }));
  cache.set(cacheKey, { fingerprint, promise });
  try { return await promise; } catch (error) { if (cache.get(cacheKey)?.promise === promise) cache.delete(cacheKey); throw error; }
}

export async function loadAtlasRelativityEvidenceSnapshotV341(root = process.cwd()): Promise<AtlasRelativityEvidenceSnapshotV341> {
  try {
    const [base, documents] = await Promise.all([loadAtlasRelativityEvidenceSnapshotV338(root), loadDocuments(root)]);
    if (base.status !== "ready") throw new Error("v341-base-evidence-unavailable");
    const visualDoc = documents[0]; const observationDoc = documents[1];
    const visual = record(visualDoc.visual); const observation = record(observationDoc.observation); const audit = record(observationDoc.profileAudit); const campaign = record(observationDoc.correctedCampaign);
    if (visualDoc.status !== "visual-v7-v340-wired-browser-pending-dense-incomplete-0-of-49"
      || observationDoc.status !== "sparse-observation-product-v341-qualified-browser-pending-dense-incomplete-0-of-49"
      || visual.runtimeMatrixRows !== 24 || visual.defaultApplied !== false
      || observation.bandMeasurementCount !== 12 || observation.applicableDiskRayCount !== 4 || observation.unavailableRayCount !== 12
      || observation.instrumentStatus !== "synthetic-audit-fixture-not-calibrated-observatory"
      || audit.scienceProfileInvariant !== true || audit.cinematicPairwiseDistinct !== true || audit.sourceProductByteIdentical !== true || audit.presentationCopiesDisjoint !== true
      || campaign.namespace !== "v314" || campaign.status !== "incomplete-0-of-49" || campaign.completedShardCount !== 0 || campaign.attemptConsumed !== false || campaign.aggregateAvailable !== false) throw new Error("v341-evidence-boundary");
    const v340: RelativityVisualEvidenceV341 = { status: "visual-v7-v340-wired-browser-pending-dense-incomplete-0-of-49", profile: typeof visual.profile === "string" ? visual.profile : "science-cinematic-v7-v340", runtimeMatrixRows: number(visual.runtimeMatrixRows), scienceDigest: typeof (visualDoc.science as Document)?.outputDigest === "string" ? (visualDoc.science as Document).outputDigest as string : null, cinematicDigests: typeof (visualDoc.cinematic as Document)?.digests === "object" ? (visualDoc.cinematic as Document).digests as Record<string, string> : {}, assetSelector: typeof visual.licensedAssetSelector === "string" ? visual.licensedAssetSelector : "unavailable", defaultApplied: false, browserQualification: "not-run" };
    const v341: RelativityObservationEvidenceV341 = { status: "qualified-sparse-observation-product-science-profile-invariant", artifactSha256: sha(observationDoc.dependency && (observationDoc.dependency as Document).productArtifactSha256), authorityKind: typeof observation.authorityKind === "string" ? observation.authorityKind : "unavailable", authorityRayCount: number(observation.authorityRayCount), applicableDiskRayCount: number(observation.applicableDiskRayCount), unavailableRayCount: number(observation.unavailableRayCount), bandMeasurementCount: number(observation.bandMeasurementCount), polarizationMeasurementCount: number(observation.polarizationMeasurementCount), maximumEnvelope: number(observation.maximumEnvelope, NaN), maximumInstrumentQuadrature: number(observation.maximumInstrumentQuadrature, NaN), maximumEvpaDifferenceDeg: number(observation.maximumEvpaDifferenceDeg, NaN), instrumentModel: typeof observation.instrumentModel === "string" ? observation.instrumentModel : "unavailable", instrumentStatus: typeof observation.instrumentStatus === "string" ? observation.instrumentStatus : "unavailable", scienceDigest: typeof audit.scienceDigest === "string" ? audit.scienceDigest : null, cinematicDigests: typeof audit.cinematicDigests === "object" ? audit.cinematicDigests as Record<string, string> : {}, scienceProfileInvariant: bool(audit.scienceProfileInvariant), cinematicPairwiseDistinct: bool(audit.cinematicPairwiseDistinct), sourceProductByteIdentical: bool(audit.sourceProductByteIdentical), presentationCopiesDisjoint: bool(audit.presentationCopiesDisjoint), denseStatus: "incomplete-0-of-49", browserQualification: "not-run" };
    return { version: "v341-relativity-evidence-snapshot", status: "ready", base, current: { v340, v341 } };
  } catch {
    const base = await loadAtlasRelativityEvidenceSnapshotV338(root);
    return { version: "v341-relativity-evidence-snapshot", status: "corrupt", base, current: { v340: { status: "unavailable", profile: "unavailable", runtimeMatrixRows: 0, scienceDigest: null, cinematicDigests: {}, assetSelector: "unavailable", defaultApplied: false, browserQualification: "not-run" }, v341: { status: "unavailable", artifactSha256: null, authorityKind: "unavailable", authorityRayCount: 0, applicableDiskRayCount: 0, unavailableRayCount: 0, bandMeasurementCount: 0, polarizationMeasurementCount: 0, maximumEnvelope: null, maximumInstrumentQuadrature: null, maximumEvpaDifferenceDeg: null, instrumentModel: "unavailable", instrumentStatus: "unavailable", scienceDigest: null, cinematicDigests: {}, scienceProfileInvariant: false, cinematicPairwiseDistinct: false, sourceProductByteIdentical: false, presentationCopiesDisjoint: false, denseStatus: "incomplete-0-of-49", browserQualification: "not-run" } } };
  }
}
export function resetRelativityEvidenceServerV341CacheForTests(): void { cache.clear(); }
