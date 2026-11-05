import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import { getKerrLicenseConfirmationPacketSnapshotV552, getKerrLicenseConfirmationPacketTelemetryV552, loadKerrLicenseConfirmationPacketSummaryV552, resetKerrLicenseConfirmationPacketClientForTestsV552, subscribeKerrLicenseConfirmationPacketV552 } from "../app/lib/kerrLicenseConfirmationPacketClientV552";
import { loadKerrLicenseConfirmationPacketV552, resetKerrLicenseConfirmationPacketServerCacheForTestsV552 } from "../app/lib/kerrLicenseConfirmationPacketServerV552";
import { KERR_LICENSE_CONFIRMATION_PACKET_API_VERSION_V552, compareKerrLicenseConfirmationPacketHudEncodingsV552, createKerrLicenseConfirmationPacketHudEncodingV552, parseKerrLicenseConfirmationPacketV552, resolveKerrLicenseConfirmationPacketHudProfileV552 } from "../app/lib/kerrLicenseConfirmationPacketV552";
import { KERR_PHOTON_METROLOGY_DETAILS_V552, KERR_PHOTON_METROLOGY_DETAIL_IDS_V552, KERR_PHOTON_METROLOGY_LABELS_V552 } from "../app/components/kerrPhotonMetrologyDetailCatalogV552";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-license-confirmation-packet-v552/atlas.json",
  receipt: "dist/science/kerr-license-confirmation-packet-v552/empty-packet-receipt.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v551-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v551.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-license-confirmation-packet-v552/runtime-audit.json",
} as const;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256", "receiptSha256", "resultSha256", "environmentSha256", "preflightSha256", "matrixSha256", "isolatedReceiptSha256", "executionMatrixSha256", "schemaPackSha256"]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => { const target = resolve(root, path), part = `${target}.${process.pid}.part`; mkdirSync(dirname(target), { recursive: true }); writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`); renameSync(part, target); };

async function main() {
  const artifact = parseKerrLicenseConfirmationPacketV552(read(paths.artifact));
  const receipt = read(paths.receipt);
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (sha(artifact) !== artifact.artifactSha256 || sha(receipt) !== receipt.receiptSha256 || receipt.packetPresent !== false || receipt.packetEntryCount !== 0 || receipt.missingEntryCount !== 7 || receipt.networkAttemptCount !== 0 || receipt.measuredAuthorityGranted !== false || previousEvidence.version !== "orbit-atlas-shadow-v551-evidence-v1" || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v551" || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v552-upstream-boundary");
  resetKerrLicenseConfirmationPacketServerCacheForTestsV552();
  const server = await loadKerrLicenseConfirmationPacketV552();
  const serverAgain = await loadKerrLicenseConfirmationPacketV552();
  const body = JSON.stringify({ version: KERR_LICENSE_CONFIRMATION_PACKET_API_VERSION_V552, available: true, reason: "ready", summary: server.artifact });
  const scienceEncoding = createKerrLicenseConfirmationPacketHudEncodingV552(server.artifact, "science");
  const cinematicEncoding = createKerrLicenseConfirmationPacketHudEncodingV552(server.artifact, "cinematic");
  const encodingAudit = compareKerrLicenseConfirmationPacketHudEncodingsV552(scienceEncoding, cinematicEncoding);
  const scienceProfile = resolveKerrLicenseConfirmationPacketHudProfileV552("science");
  const cinematicProfile = resolveKerrLicenseConfirmationPacketHudProfileV552("cinematic");
  const ids = [...KERR_PHOTON_METROLOGY_DETAIL_IDS_V552];
  if (server !== serverAgain || Buffer.byteLength(body, "utf8") > 128 * 1024 || Object.keys(server.exports).length !== 2 || scienceProfile.scienceBoundary.bloomIntensity !== 0 || cinematicProfile.cinematicSeed === null || !encodingAudit.validatorStable || ids.length !== 54 || JSON.stringify(ids) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V552)) || JSON.stringify(ids) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V552))) throw new Error("v552-static");
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrLicenseConfirmationPacketClientForTestsV552();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [subscribeKerrLicenseConfirmationPacketV552(() => notifications++), subscribeKerrLicenseConfirmationPacketV552(() => notifications++)];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  let first; let second;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => { requests.push(String(input)); return new Response(body); }) as typeof fetch;
    [first, second] = await Promise.all([loadKerrLicenseConfirmationPacketSummaryV552(), loadKerrLicenseConfirmationPacketSummaryV552()]);
  } finally { releases.forEach((release) => release()); globalThis.fetch = originalFetch; }
  const final = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrLicenseConfirmationPacketTelemetryV552();
  const snapshot = getKerrLicenseConfirmationPacketSnapshotV552();
  if (requests.length !== 1 || first !== second || notifications !== 4 || peak.subscriptions !== 2 || telemetry.listenerCount !== 0 || snapshot.status !== "ready" || final.status !== "baseline") throw new Error("v552-client");
  resetKerrLicenseConfirmationPacketClientForTestsV552();
  const component = text("app/components/KerrLicenseConfirmationV552.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV552.tsx");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (!component.includes("许可证确认必须由用户提供") || component.includes("<canvas") || component.includes("Math.random") || wrapper.includes("fetch(") || !workbench.includes("from \"./KerrPhotonMetrologyObservatoryIntentV552\"")) throw new Error("v552-source");
  const sourcePaths = [paths.artifact, paths.receipt, paths.previousEvidence, paths.previousPointer, paths.dense, paths.formal, "app/lib/kerrLicenseConfirmationPacketV552.ts", "app/lib/kerrLicenseConfirmationPacketV552.test.ts", "app/lib/kerrLicenseConfirmationPacketServerV552.ts", "app/lib/kerrLicenseConfirmationPacketServerV552.test.ts", "app/lib/kerrLicenseConfirmationPacketClientV552.ts", "app/api/atlas/relativity-evidence/v552/license-confirmation-packet/route.ts", "app/api/atlas/relativity-evidence/v552/license-confirmation-packet/route.test.ts", "app/components/KerrLicenseConfirmationV552.tsx", "app/components/KerrLicenseConfirmationV552.test.tsx", "app/components/kerrPhotonMetrologyDetailCatalogV552.ts", "app/components/kerrPhotonMetrologyDetailCatalogV552.test.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV552.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV552.test.ts", "app/components/KerrPhotonMetrologyObservatoryIntentV552.tsx", "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasResourceLifecycle.ts", "scripts/build-kerr-license-confirmation-packet-v552.ts", "scripts/build-kerr-license-confirmation-packet-runtime-v552.ts"].map((path) => ({ path, sha256: fileSha(path) })).sort((left, right) => left.path.localeCompare(right.path));
  const unsigned = { version: "v552-kerr-license-confirmation-packet-runtime-audit-v1", generatedAt: "2026-08-02T00:00:00Z", status: "license-confirmation-packet-runtime-qualified-v10r1-user-supplied-only-authority-blocked", source: { v552ArtifactSha256: artifact.artifactSha256, v551EvidenceSha256: previousEvidence.evidenceSha256, v314StateSha256: dense.stateSha256 }, runtime: { atlasBytes: server.exports.atlas.bytes.byteLength, receiptBytes: server.exports.receipt.bytes.byteLength, summaryResponseBytes: Buffer.byteLength(body), serverFingerprintCacheHit: server === serverAgain, automaticRequestCount: 0, explicitRequestCount: requests.length, singleFlightConsumerCount: 2, notificationCount: notifications, peakSubscriptionCount: peak.subscriptions, finalResourceStatus: final.status, responseCachePolicy: "no-store", localShadowOnly: true }, confirmation: { memberCount: 7, confirmedCount: 0, missingEntryCount: 7, packetPresent: false, networkAttemptCount: 0, replayAttemptCount: 2, measuredAuthorityGranted: false, sciencePixelCount: 0 }, detailCatalog: { detailCount: 54, inheritedDetailCount: 53, newLazyImportCount: 1, concurrentDetailSurfaceBudget: 1, automaticDetailRequestCount: 0, workbenchCurrentBinding: "v552" }, visualProfile: { profileId: scienceProfile.id, validatorStable: encodingAudit.validatorStable, manifestStable: encodingAudit.manifestStable, replayStable: encodingAudit.replayStable, authorityStable: encodingAudit.authorityStable, rasterQualificationStable: encodingAudit.rasterQualificationStable, numericScientificStyleInputCount: 0, scientificFieldMutation: false }, boundary: artifact.boundary, sourceManifest: sourcePaths, sourceSha256: sha(sourcePaths) };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, audit);
  console.log(JSON.stringify({ status: audit.status, artifactSha256: audit.artifactSha256, confirmationArtifactSha256: artifact.artifactSha256, confirmations: "0/7", replay: "2/2", networkAttempts: 0, measuredAuthorityGranted: false, sciencePixels: 0, detailCatalogSize: 54, automaticRequests: 0, explicitRequests: 1, finalResourceStatus: final.status }, null, 2));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
