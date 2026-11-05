import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import {
  getKerrResponseAwareSparseFitsSnapshotV537,
  getKerrResponseAwareSparseFitsTelemetryV537,
  loadKerrResponseAwareSparseFitsSummaryV537,
  resetKerrResponseAwareSparseFitsClientForTestsV537,
  subscribeKerrResponseAwareSparseFitsV537,
} from "../app/lib/kerrResponseAwareSparseFitsClientV537";
import { loadKerrResponseAwareSparseFitsV537, resetKerrResponseAwareSparseFitsServerCacheForTestsV537 } from "../app/lib/kerrResponseAwareSparseFitsServerV537";
import {
  KERR_RESPONSE_AWARE_SPARSE_FITS_API_VERSION_V537,
  canonicalKerrResponseAwareSparseFitsV537,
  compareKerrResponseAwareSparseFitsHudEncodingsV537,
  createKerrResponseAwareSparseFitsHudEncodingV537,
  parseKerrResponseAwareSparseFitsArtifactV537,
  resolveKerrResponseAwareSparseFitsHudProfileV537,
} from "../app/lib/kerrResponseAwareSparseFitsV537";
import { KERR_PHOTON_METROLOGY_DETAILS_V537, KERR_PHOTON_METROLOGY_DETAIL_IDS_V537, KERR_PHOTON_METROLOGY_LABELS_V537 } from "../app/components/kerrPhotonMetrologyDetailCatalogV537";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json",
  fits: "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits",
  previousEvidence: "dist/science/orbit-atlas-shadow-v536-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v536.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-response-aware-sparse-fits-v537/runtime-audit.json",
} as const;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([left], [right]) => compare(left, right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`); renameSync(part, target); };

async function main() {
  const artifact = parseKerrResponseAwareSparseFitsArtifactV537(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (createHash("sha256").update(canonicalKerrResponseAwareSparseFitsV537(artifact)).digest("hex") !== artifact.artifactSha256
    || previousEvidence.version !== "orbit-atlas-shadow-v536-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256
    || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v536"
    || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false
    || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
    || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v537-upstream");

  resetKerrResponseAwareSparseFitsServerCacheForTestsV537();
  const server = await loadKerrResponseAwareSparseFitsV537();
  const serverAgain = await loadKerrResponseAwareSparseFitsV537();
  const body = JSON.stringify({ version: KERR_RESPONSE_AWARE_SPARSE_FITS_API_VERSION_V537, available: true, reason: "ready", summary: server.summary });
  const scienceEncoding = createKerrResponseAwareSparseFitsHudEncodingV537(server.summary, "science");
  const cinematicEncoding = createKerrResponseAwareSparseFitsHudEncodingV537(server.summary, "cinematic");
  const encodingAudit = compareKerrResponseAwareSparseFitsHudEncodingsV537(scienceEncoding, cinematicEncoding);
  const scienceProfile = resolveKerrResponseAwareSparseFitsHudProfileV537("science");
  const cinematicProfile = resolveKerrResponseAwareSparseFitsHudProfileV537("cinematic");
  const ids = [...KERR_PHOTON_METROLOGY_DETAIL_IDS_V537];
  if (server !== serverAgain || Buffer.byteLength(body) > 128 * 1024 || server.exports.fits.fileSha256 !== artifact.fits.fileSha256
    || scienceProfile.scienceBoundary.bloomIntensity !== 0 || cinematicProfile.cinematicSeed === null
    || encodingAudit.rowCount !== 4 || encodingAudit.columnCount !== 17 || encodingAudit.imageHduCount !== 0
    || ids.length !== 39 || JSON.stringify(ids) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V537))
    || JSON.stringify(ids) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V537))) throw new Error("v537-static");

  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrResponseAwareSparseFitsClientForTestsV537();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [subscribeKerrResponseAwareSparseFitsV537(() => notifications++), subscribeKerrResponseAwareSparseFitsV537(() => notifications++)];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  let first;
  let second;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => { requests.push(String(input)); return new Response(body); }) as typeof fetch;
    [first, second] = await Promise.all([loadKerrResponseAwareSparseFitsSummaryV537(), loadKerrResponseAwareSparseFitsSummaryV537()]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const final = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrResponseAwareSparseFitsTelemetryV537();
  const snapshot = getKerrResponseAwareSparseFitsSnapshotV537();
  if (requests.length !== 1 || first !== second || notifications !== 4 || peak.subscriptions !== 2 || telemetry.listenerCount !== 0 || snapshot.status !== "ready" || final.status !== "baseline") throw new Error("v537-client");
  resetKerrResponseAwareSparseFitsClientForTestsV537();

  const component = text("app/components/KerrResponseAwareSparseFitsV537.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV537.tsx");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (!component.includes("四行标准 FITS 表，不是科学图像") || component.includes("<canvas") || wrapper.includes("fetch(") || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV537"')) throw new Error("v537-source");

  const sourcePaths = [
    paths.artifact, paths.fits, paths.previousEvidence, paths.previousPointer, paths.dense, paths.formal,
    "scripts/export-kerr-response-aware-sparse-fits-v537.py",
    "scripts/test-kerr-response-aware-sparse-fits-v537.py",
    "app/lib/kerrResponseAwareSparseFitsV537.ts", "app/lib/kerrResponseAwareSparseFitsV537.test.ts",
    "app/lib/kerrResponseAwareSparseFitsServerV537.ts", "app/lib/kerrResponseAwareSparseFitsServerV537.test.ts",
    "app/lib/kerrResponseAwareSparseFitsClientV537.ts",
    "app/api/atlas/relativity-evidence/v537/response-aware-sparse-fits/route.ts",
    "app/api/atlas/relativity-evidence/v537/response-aware-sparse-fits/route.test.ts",
    "app/components/KerrResponseAwareSparseFitsV537.tsx", "app/components/KerrResponseAwareSparseFitsV537.test.tsx",
    "app/components/kerrPhotonMetrologyDetailCatalogV537.ts", "app/components/kerrPhotonMetrologyDetailCatalogV537.test.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV537.ts", "app/components/KerrPhotonMetrologyObservatoryIntentV537.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasResourceLifecycle.ts",
    "scripts/build-kerr-response-aware-sparse-fits-runtime-v537.ts",
  ];
  const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((left, right) => compare(left.path, right.path));
  const unsigned = {
    version: "v537-kerr-response-aware-sparse-fits-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "response-aware-sparse-fits-runtime-qualified-v8r6-payload-stable",
    source: { v537ArtifactSha256: artifact.artifactSha256, v536EvidenceSha256: previousEvidence.evidenceSha256, v314StateSha256: dense.stateSha256 },
    runtime: {
      atlasBytes: server.exports.atlas.bytes.byteLength,
      fitsBytes: server.exports.fits.bytes.byteLength,
      summaryResponseBytes: Buffer.byteLength(body),
      serverFingerprintCacheHit: server === serverAgain,
      automaticRequestCount: 0,
      explicitRequestCount: requests.length,
      singleFlightConsumerCount: 2,
      notificationCount: notifications,
      peakSubscriptionCount: peak.subscriptions,
      finalResourceStatus: final.status,
      responseCachePolicy: "no-store",
      localShadowOnly: true,
    },
    detailCatalog: { detailCount: 39, inheritedDetailCount: 38, newLazyImportCount: 1, concurrentDetailSurfaceBudget: 1, automaticDetailRequestCount: 0, workbenchCurrentBinding: "v537" },
    visualProfile: { profileId: scienceProfile.id, scientificPayloadStable: encodingAudit.scientificPayloadStable, binaryTableStable: encodingAudit.binaryTableStable, rowCount: 4, columnCount: 17, imageHduCount: 0, numericScientificStyleInputCount: 0, scientificFieldMutation: false },
    counts: artifact.counts,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    sourceManifest,
    sourceSha256: sha(sourceManifest),
  };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, audit);
  console.log(JSON.stringify({ status: audit.status, artifactSha256: audit.artifactSha256, fitsFileSha256: artifact.fits.fileSha256, fitsBytes: artifact.fits.bytes, detailCatalogSize: 39, automaticRequests: 0, explicitRequests: 1, finalResourceStatus: final.status }, null, 2));
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
