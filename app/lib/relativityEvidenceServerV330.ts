import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { loadAtlasRelativityEvidenceSnapshotV324 } from "./relativityEvidenceServerV324";
import type { AtlasRelativityEvidenceSnapshotV330, RelativityWorkbenchEvidenceV330 } from "./relativityWorkbenchEvidenceV330";

const INPUT_MAX_BYTES = 512 * 1024;
const CACHE_LIMIT = 4;
const FILES = [325, 326, 327, 328, 329].map((version) => `dist/science/orbit-atlas-shadow-v${version}-evidence.json`);
type Document = Record<string, unknown>;
type LoadedDocument = Readonly<{ document: Document; evidenceSha256: string }>;
type CacheEntry = { fingerprint: string; lastAccess: number; promise: Promise<readonly LoadedDocument[]> };
const bundleCache = new Map<string, CacheEntry>();
let cacheAccess = 0;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Document)
    .filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

function canonicalSha(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function record(value: unknown): Document {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Document : {};
}

function isSha(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function integer(value: unknown, minimum: number, maximum: number): number {
  return Number.isSafeInteger(value) ? Math.min(maximum, Math.max(minimum, Number(value))) : 0;
}

function finite(value: unknown, minimum = 0, maximum = Number.MAX_VALUE): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : null;
}

async function loadBundle(root: string): Promise<readonly LoadedDocument[]> {
  const absolutePaths = FILES.map((relative) => resolve(root, relative));
  const metadata = await Promise.all(absolutePaths.map((path) => stat(path)));
  if (metadata.some((entry) => !entry.isFile() || entry.size <= 0 || entry.size > INPUT_MAX_BYTES)) throw new Error("v330-evidence-input-boundary");
  const fingerprint = metadata.map((entry) => `${entry.size}:${entry.mtimeMs}`).join("|");
  const cacheKey = resolve(root);
  const cached = bundleCache.get(cacheKey);
  if (cached?.fingerprint === fingerprint) {
    cached.lastAccess = ++cacheAccess;
    return cached.promise;
  }
  const promise = Promise.all(absolutePaths.map(async (path, index) => {
    const bytes = await readFile(path);
    if (bytes.byteLength !== metadata[index].size) throw new Error("v330-evidence-changed-during-read");
    const document = JSON.parse(bytes.toString("utf8")) as Document;
    const expected = document.evidenceSha256;
    if (!isSha(expected)) throw new Error("v330-evidence-sha-missing");
    const unsigned = { ...document };
    delete unsigned.evidenceSha256;
    if (canonicalSha(unsigned) !== expected) throw new Error("v330-evidence-sha-mismatch");
    return { document, evidenceSha256: expected };
  }));
  bundleCache.set(cacheKey, { fingerprint, lastAccess: ++cacheAccess, promise });
  if (bundleCache.size > CACHE_LIMIT) {
    const oldest = [...bundleCache.entries()].sort((left, right) => left[1].lastAccess - right[1].lastAccess)[0]?.[0];
    if (oldest && oldest !== cacheKey) bundleCache.delete(oldest);
  }
  try {
    return await promise;
  } catch (error) {
    if (bundleCache.get(cacheKey)?.promise === promise) bundleCache.delete(cacheKey);
    throw error;
  }
}

function unavailable(): RelativityWorkbenchEvidenceV330 {
  return {
    v325: { status: "unavailable", applicableDiskRayCount: 0, bandMeasurementCount: 0, maximumLinearRelativeEnvelope: null, combinationPolicy: "unavailable", artifactSha256: null },
    v326: { status: "unavailable", jsonExport: false, csvExport: false, bandMeasurementCount: 0, noRawRayBuffer: false, noHostPathPid: false, canonicalSha256: null, artifactSha256: null },
    v327: { status: "unavailable", swatchCount: 0, profileTokenSources: [], scienceValuesUnchanged: false, buffersDisjoint: false, cinematicOutputsDistinct: false, artifactSha256: null },
    v328: { status: "unavailable", applicableDiskRayCount: 0, bandMeasurementCount: 0, maximumQuadratureRelativeDifference: null, photonRadianceUnit: "unavailable", detectorIndependent: false, artifactSha256: null },
    v329: { status: "unavailable", consumerCountFixture: 0, acquisitionCountFixture: 0, derivationCountFixture: 0, derivedModelCount: 0, directConsumerFetches: 0, idempotentRelease: false, resourceBaselineReturnTested: false, artifactSha256: null },
  };
}

function validateChain(bundle: readonly LoadedDocument[]): void {
  const expectedVersions = [325, 326, 327, 328, 329];
  for (const [index, loaded] of bundle.entries()) {
    if (loaded.document.version !== `orbit-atlas-shadow-v${expectedVersions[index]}-evidence-v1`) throw new Error("v330-evidence-version-mismatch");
    const campaign = record(loaded.document.correctedCampaign);
    if (campaign.namespace !== "v314" || campaign.status !== "incomplete-0-of-49" || campaign.completedShardCount !== 0 || campaign.plannedShardCount !== 49 || campaign.attemptConsumed !== false || campaign.aggregateAvailable !== false) throw new Error("v330-dense-boundary-mismatch");
    if (index > 0 && record(loaded.document.dependency)[`v${expectedVersions[index - 1]}EvidenceSha256`] !== bundle[index - 1].evidenceSha256) throw new Error("v330-evidence-dependency-mismatch");
  }
  const statuses = [
    "componentwise-uncertainty-wired-browser-pending-dense-incomplete-0-of-49",
    "uncertainty-provenance-wired-browser-pending-dense-incomplete-0-of-49",
    "science-cinematic-ab-wired-browser-pending-dense-incomplete-0-of-49",
    "photon-observables-wired-browser-pending-dense-incomplete-0-of-49",
    "science-observatory-single-flight-wired-browser-pending-dense-incomplete-0-of-49",
  ];
  if (bundle.some((loaded, index) => loaded.document.status !== statuses[index])) throw new Error("v330-evidence-status-mismatch");
}

export async function loadAtlasRelativityEvidenceSnapshotV330(root = process.cwd()): Promise<AtlasRelativityEvidenceSnapshotV330> {
  try {
    const [base, bundle] = await Promise.all([loadAtlasRelativityEvidenceSnapshotV324(root), loadBundle(root)]);
    if (base.status !== "ready") throw new Error("v330-base-evidence-unavailable");
    validateChain(bundle);
    const [e325, e326, e327, e328, e329] = bundle.map((entry) => entry.document);
    const science325 = record(e325.science);
    const dependency325 = record(e325.dependency);
    const provenance326 = record(e326.provenance);
    const dependency326 = record(e326.dependency);
    const visual327 = record(e327.visual);
    const science327 = record(e327.science);
    const dependency327 = record(e327.dependency);
    const science328 = record(e328.science);
    const units328 = record(science328.units);
    const dependency328 = record(e328.dependency);
    const runtime329 = record(e329.runtime);
    const derivedModels = Array.isArray(runtime329.derivedModels) ? runtime329.derivedModels.filter((entry): entry is string => typeof entry === "string").slice(0, 4) : [];
    const profiles = Array.isArray(visual327.profiles)
      ? visual327.profiles.flatMap((entry) => entry === "science-cinematic-v5-v299" ? ["v5" as const] : entry === "science-cinematic-v6-v300" ? ["v6" as const] : []).slice(0, 2)
      : [];
    if (science325.combinationPolicy !== "linear-sum-without-independence-claim-no-rss"
      || provenance326.noRawRayBuffer !== true || provenance326.noScreenshot !== true || provenance326.noAbsolutePath !== true || provenance326.noHost !== true || provenance326.noPid !== true
      || science327.valuesUnchanged !== true || science327.buffersDisjoint !== true || visual327.profileOutputsDistinct !== true
      || units328.photonRadiance !== "photons s^-1 m^-2 sr^-1" || science328.detectorAssumption !== "per-unit-area-per-unit-solid-angle-no-throughput-no-collecting-area-no-exposure-time"
      || runtime329.directConsumerFetches !== 0 || runtime329.idempotentRelease !== true || runtime329.resourceBaselineReturnTested !== true) throw new Error("v330-science-boundary-mismatch");
    return {
      ...base,
      version: "v330-relativity-evidence-snapshot",
      current: {
        ...base.current,
        v325: {
          status: "componentwise-uncertainty-qualified-browser-pending",
          applicableDiskRayCount: integer(science325.applicableDiskRayCount, 0, 4),
          bandMeasurementCount: integer(science325.bandMeasurementCount, 0, 12),
          maximumLinearRelativeEnvelope: finite(record(science325.maxima).conservativeLinearRelativeEnvelope, 0, 1),
          combinationPolicy: "linear-sum-without-independence-claim-no-rss",
          artifactSha256: isSha(dependency325.uncertaintyArtifactSha256) ? dependency325.uncertaintyArtifactSha256 : null,
        },
        v326: {
          status: "sanitized-provenance-qualified-browser-pending",
          jsonExport: provenance326.jsonExport === true,
          csvExport: provenance326.csvExport === true,
          bandMeasurementCount: integer(provenance326.bandMeasurementCount, 0, 12),
          noRawRayBuffer: provenance326.noRawRayBuffer === true,
          noHostPathPid: provenance326.noAbsolutePath === true && provenance326.noHost === true && provenance326.noPid === true,
          canonicalSha256: isSha(dependency326.provenanceCanonicalSha256) ? dependency326.provenanceCanonicalSha256 : null,
          artifactSha256: isSha(dependency326.provenanceArtifactSha256) ? dependency326.provenanceArtifactSha256 : null,
        },
        v327: {
          status: "science-cinematic-ab-qualified-browser-pending",
          swatchCount: integer(visual327.swatchCount, 0, 4),
          profileTokenSources: profiles,
          scienceValuesUnchanged: science327.valuesUnchanged === true,
          buffersDisjoint: science327.buffersDisjoint === true && science327.cinematicBuffersDisjoint === true,
          cinematicOutputsDistinct: visual327.profileOutputsDistinct === true,
          artifactSha256: isSha(dependency327.abArtifactSha256) ? dependency327.abArtifactSha256 : null,
        },
        v328: {
          status: "photon-observables-qualified-browser-pending",
          applicableDiskRayCount: integer(science328.applicableDiskRayCount, 0, 4),
          bandMeasurementCount: integer(science328.bandMeasurementCount, 0, 12),
          maximumQuadratureRelativeDifference: finite(science328.maximumQuadratureRelativeDifference, 0, 1),
          photonRadianceUnit: "photons s^-1 m^-2 sr^-1",
          detectorIndependent: true,
          artifactSha256: isSha(dependency328.photonArtifactSha256) ? dependency328.photonArtifactSha256 : null,
        },
        v329: {
          status: "single-flight-lifecycle-qualified-browser-pending",
          consumerCountFixture: integer(runtime329.consumerCountFixture, 0, 3),
          acquisitionCountFixture: integer(runtime329.v321AcquisitionCountFixture, 0, 1),
          derivationCountFixture: integer(runtime329.derivationCountFixture, 0, 1),
          derivedModelCount: derivedModels.length,
          directConsumerFetches: integer(runtime329.directConsumerFetches, 0, 3),
          idempotentRelease: runtime329.idempotentRelease === true,
          resourceBaselineReturnTested: runtime329.resourceBaselineReturnTested === true,
          artifactSha256: bundle[4].evidenceSha256,
        },
      },
    };
  } catch {
    const base = await loadAtlasRelativityEvidenceSnapshotV324(root);
    return {
      ...base,
      version: "v330-relativity-evidence-snapshot",
      status: "corrupt",
      current: { ...base.current, ...unavailable() },
    };
  }
}

export function resetRelativityEvidenceServerV330CacheForTests(): void {
  bundleCache.clear();
  cacheAccess = 0;
}
