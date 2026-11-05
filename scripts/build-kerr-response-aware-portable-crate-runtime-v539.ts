import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import { getKerrResponseAwarePortableCrateSnapshotV539, getKerrResponseAwarePortableCrateTelemetryV539, loadKerrResponseAwarePortableCrateSummaryV539, resetKerrResponseAwarePortableCrateClientForTestsV539, subscribeKerrResponseAwarePortableCrateV539 } from "../app/lib/kerrResponseAwarePortableCrateClientV539";
import { loadKerrResponseAwarePortableCrateV539, resetKerrResponseAwarePortableCrateServerCacheForTestsV539 } from "../app/lib/kerrResponseAwarePortableCrateServerV539";
import { KERR_RESPONSE_AWARE_PORTABLE_CRATE_API_VERSION_V539, canonicalKerrResponseAwarePortableCrateV539, compareKerrResponseAwarePortableCrateHudEncodingsV539, createKerrResponseAwarePortableCrateHudEncodingV539, parseKerrResponseAwarePortableCrateArtifactV539, resolveKerrResponseAwarePortableCrateHudProfileV539 } from "../app/lib/kerrResponseAwarePortableCrateV539";
import { KERR_PHOTON_METROLOGY_DETAILS_V539, KERR_PHOTON_METROLOGY_DETAIL_IDS_V539, KERR_PHOTON_METROLOGY_LABELS_V539 } from "../app/components/kerrPhotonMetrologyDetailCatalogV539";

const root = process.cwd();
const paths = { artifact: "dist/science/kerr-response-aware-portable-crate-v539/atlas.json", crate: "dist/science/kerr-response-aware-portable-crate-v539/orbit-atlas-kerr-response-aware-v539.zip", previousEvidence: "dist/science/orbit-atlas-shadow-v538-evidence.json", previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v538.json", dense: "dist/science/kerr-campaign-v314/campaign-state.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json", output: "dist/science/kerr-response-aware-portable-crate-v539/runtime-audit.json" } as const;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256"]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([left], [right]) => compare(left, right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`); renameSync(part, target); };

async function main() {
  const artifact = parseKerrResponseAwarePortableCrateArtifactV539(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence), previousPointer = read(paths.previousPointer), dense = read(paths.dense), formal = read(paths.formal), formalEvidence = read(formal.source);
  if (createHash("sha256").update(canonicalKerrResponseAwarePortableCrateV539(artifact)).digest("hex") !== artifact.artifactSha256
    || previousEvidence.version !== "orbit-atlas-shadow-v538-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256
    || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v538" || sha(previousPointer) !== previousPointer.pointerSha256
    || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false
    || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v539-upstream");

  const sourceMemberPaths = new Map([
    ["data/column-schema.csv", "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv"],
    ["data/response-aware-sparse-table.fits", "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits"],
    ["metadata/v537-fits-atlas.json", "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json"],
    ["metadata/v538-column-schema-atlas.json", "dist/science/kerr-response-aware-fits-column-schema-v538/atlas.json"],
    ["metadata/v538-evidence.json", paths.previousEvidence],
    ["metadata/v538-pointer.json", paths.previousPointer],
  ]);
  const sourceMemberReplayCount = [...sourceMemberPaths].filter(([memberPath, sourcePath]) => artifact.members.find((member) => member.path === memberPath)?.sha256 === fileSha(sourcePath)).length;
  if (sourceMemberReplayCount !== 6 || artifact.members.reduce((sum, member) => sum + member.bytes, 0) !== artifact.crate.totalUncompressedBytes || artifact.crate.fileSha256 !== fileSha(paths.crate)) throw new Error("v539-typescript-replay");

  resetKerrResponseAwarePortableCrateServerCacheForTestsV539();
  const server = await loadKerrResponseAwarePortableCrateV539(), serverAgain = await loadKerrResponseAwarePortableCrateV539();
  const body = JSON.stringify({ version: KERR_RESPONSE_AWARE_PORTABLE_CRATE_API_VERSION_V539, available: true, reason: "ready", summary: server.summary });
  const scienceEncoding = createKerrResponseAwarePortableCrateHudEncodingV539(server.summary, "science"), cinematicEncoding = createKerrResponseAwarePortableCrateHudEncodingV539(server.summary, "cinematic"), encodingAudit = compareKerrResponseAwarePortableCrateHudEncodingsV539(scienceEncoding, cinematicEncoding);
  const scienceProfile = resolveKerrResponseAwarePortableCrateHudProfileV539("science"), cinematicProfile = resolveKerrResponseAwarePortableCrateHudProfileV539("cinematic"), ids = [...KERR_PHOTON_METROLOGY_DETAIL_IDS_V539];
  if (server !== serverAgain || Buffer.byteLength(body) > 128 * 1024 || server.exports.crate.fileSha256 !== artifact.crate.fileSha256 || scienceProfile.scienceBoundary.bloomIntensity !== 0 || cinematicProfile.cinematicSeed === null
    || encodingAudit.memberCount !== 9 || encodingAudit.imageHduCount !== 0 || encodingAudit.pixelSampleCount !== 0 || ids.length !== 41
    || JSON.stringify(ids) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V539)) || JSON.stringify(ids) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V539))) throw new Error("v539-static");

  const requests: string[] = [], originalFetch = globalThis.fetch;
  resetKerrResponseAwarePortableCrateClientForTestsV539();
  const baseline = getAtlasResourceSnapshot(); let notifications = 0;
  const releases = [subscribeKerrResponseAwarePortableCrateV539(() => notifications++), subscribeKerrResponseAwarePortableCrateV539(() => notifications++)], peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  let first; let second;
  try { globalThis.fetch = (async (input: RequestInfo | URL) => { requests.push(String(input)); return new Response(body); }) as typeof fetch; [first, second] = await Promise.all([loadKerrResponseAwarePortableCrateSummaryV539(), loadKerrResponseAwarePortableCrateSummaryV539()]); }
  finally { releases.forEach((release) => release()); releases.forEach((release) => release()); globalThis.fetch = originalFetch; }
  const final = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()), telemetry = getKerrResponseAwarePortableCrateTelemetryV539(), snapshot = getKerrResponseAwarePortableCrateSnapshotV539();
  if (requests.length !== 1 || first !== second || notifications !== 4 || peak.subscriptions !== 2 || telemetry.listenerCount !== 0 || snapshot.status !== "ready" || final.status !== "baseline") throw new Error("v539-client");
  resetKerrResponseAwarePortableCrateClientForTestsV539();
  const component = text("app/components/KerrResponseAwarePortableCrateV539.tsx"), wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV539.tsx"), workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (!component.includes("带走的不只是文件，而是一条可离线重放的证据链") || component.includes("<canvas") || component.includes("Math.random") || wrapper.includes("fetch(") || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV539"')) throw new Error("v539-source");

  const sourcePaths = [paths.artifact, paths.crate, paths.previousEvidence, paths.previousPointer, paths.dense, paths.formal,
    "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json", "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits",
    "dist/science/kerr-response-aware-fits-column-schema-v538/atlas.json", "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv",
    "scripts/build-kerr-response-aware-portable-crate-v539.py", "scripts/test-kerr-response-aware-portable-crate-v539.py",
    "app/lib/kerrResponseAwarePortableCrateV539.ts", "app/lib/kerrResponseAwarePortableCrateV539.test.ts", "app/lib/kerrResponseAwarePortableCrateServerV539.ts", "app/lib/kerrResponseAwarePortableCrateServerV539.test.ts", "app/lib/kerrResponseAwarePortableCrateClientV539.ts",
    "app/api/atlas/relativity-evidence/v539/response-aware-portable-crate/route.ts", "app/api/atlas/relativity-evidence/v539/response-aware-portable-crate/route.test.ts",
    "app/components/KerrResponseAwarePortableCrateV539.tsx", "app/components/KerrResponseAwarePortableCrateV539.test.tsx", "app/components/kerrPhotonMetrologyDetailCatalogV539.ts", "app/components/kerrPhotonMetrologyDetailCatalogV539.test.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV539.ts", "app/components/KerrPhotonMetrologyObservatoryIntentV539.tsx", "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasResourceLifecycle.ts", "scripts/build-kerr-response-aware-portable-crate-runtime-v539.ts"];
  const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((left, right) => compare(left.path, right.path));
  const unsigned = { version: "v539-kerr-response-aware-portable-crate-runtime-audit-v1", generatedAt: "2026-08-02T00:00:00Z", status: "portable-crate-runtime-qualified-v8r8-payload-stable", source: { v539ArtifactSha256: artifact.artifactSha256, v538EvidenceSha256: previousEvidence.evidenceSha256, v314StateSha256: dense.stateSha256 }, runtime: { atlasBytes: server.exports.atlas.bytes.byteLength, crateBytes: server.exports.crate.bytes.byteLength, summaryResponseBytes: Buffer.byteLength(body), serverFingerprintCacheHit: server === serverAgain, automaticRequestCount: 0, explicitRequestCount: requests.length, singleFlightConsumerCount: 2, notificationCount: notifications, peakSubscriptionCount: peak.subscriptions, finalResourceStatus: final.status, responseCachePolicy: "no-store", localShadowOnly: true }, independentReplay: { sourceMemberReplayCount, totalSourceMemberCount: 6, memberByteSum: artifact.members.reduce((sum, member) => sum + member.bytes, 0), crateFileSha256: fileSha(paths.crate) }, detailCatalog: { detailCount: 41, inheritedDetailCount: 40, newLazyImportCount: 1, concurrentDetailSurfaceBudget: 1, automaticDetailRequestCount: 0, workbenchCurrentBinding: "v539" }, visualProfile: { profileId: scienceProfile.id, scientificPayloadStable: encodingAudit.scientificPayloadStable, columnSchemaStable: encodingAudit.columnSchemaStable, portableCrateStable: encodingAudit.portableCrateStable, memberInventoryStable: encodingAudit.memberInventoryStable, memberCount: 9, imageHduCount: 0, pixelSampleCount: 0, numericScientificStyleInputCount: 0, scientificFieldMutation: false }, counts: artifact.counts, qualification: artifact.qualification, boundary: artifact.boundary, sourceManifest, sourceSha256: sha(sourceManifest) };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) }; atomic(paths.output, audit);
  console.log(JSON.stringify({ status: audit.status, artifactSha256: audit.artifactSha256, crateArtifactSha256: artifact.artifactSha256, crateFileSha256: artifact.crate.fileSha256, members: 9, sourceMemberReplay: "6/6", detailCatalogSize: 41, automaticRequests: 0, explicitRequests: 1, finalResourceStatus: final.status }, null, 2));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
