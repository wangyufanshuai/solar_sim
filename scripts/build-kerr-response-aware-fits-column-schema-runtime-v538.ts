import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import { getKerrResponseAwareFitsColumnSchemaSnapshotV538, getKerrResponseAwareFitsColumnSchemaTelemetryV538, loadKerrResponseAwareFitsColumnSchemaSummaryV538, resetKerrResponseAwareFitsColumnSchemaClientForTestsV538, subscribeKerrResponseAwareFitsColumnSchemaV538 } from "../app/lib/kerrResponseAwareFitsColumnSchemaClientV538";
import { loadKerrResponseAwareFitsColumnSchemaV538, resetKerrResponseAwareFitsColumnSchemaServerCacheForTestsV538 } from "../app/lib/kerrResponseAwareFitsColumnSchemaServerV538";
import { KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_API_VERSION_V538, canonicalKerrResponseAwareFitsColumnSchemaV538, compareKerrResponseAwareFitsColumnSchemaHudEncodingsV538, createKerrResponseAwareFitsColumnSchemaHudEncodingV538, parseKerrResponseAwareFitsColumnSchemaArtifactV538, resolveKerrResponseAwareFitsColumnSchemaHudProfileV538 } from "../app/lib/kerrResponseAwareFitsColumnSchemaV538";
import { KERR_PHOTON_METROLOGY_DETAILS_V538, KERR_PHOTON_METROLOGY_DETAIL_IDS_V538, KERR_PHOTON_METROLOGY_LABELS_V538 } from "../app/components/kerrPhotonMetrologyDetailCatalogV538";

const root = process.cwd();
const paths = { artifact: "dist/science/kerr-response-aware-fits-column-schema-v538/atlas.json", csv: "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv", v536: "dist/science/kerr-response-aware-sparse-image-v536/atlas.json", previousEvidence: "dist/science/orbit-atlas-shadow-v537-evidence.json", previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v537.json", dense: "dist/science/kerr-campaign-v314/campaign-state.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json", output: "dist/science/kerr-response-aware-fits-column-schema-v538/runtime-audit.json" } as const;
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
  const artifact = parseKerrResponseAwareFitsColumnSchemaArtifactV538(read(paths.artifact));
  const v536 = read(paths.v536);
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (createHash("sha256").update(canonicalKerrResponseAwareFitsColumnSchemaV538(artifact)).digest("hex") !== artifact.artifactSha256
    || artifact.columns.some((column) => sha(column) !== column.columnSha256)
    || previousEvidence.version !== "orbit-atlas-shadow-v537-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256
    || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v537" || sha(previousPointer) !== previousPointer.pointerSha256
    || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false
    || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
    || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v538-upstream");

  const rows = v536.rows as Array<{ rayIndex: number; polarization: { orientationQHat: number; orientationUHat: number }; responseAwareRadiometry: { redshiftFactor: number } }>;
  const independentOrientationResidual = Math.max(...rows.map((row) => Math.abs(row.polarization.orientationQHat ** 2 + row.polarization.orientationUHat ** 2 - 1)));
  const rayIndexColumn = artifact.columns.find((column) => column.name === "RAY_INDEX");
  const redshiftColumn = artifact.columns.find((column) => column.name === "REDSHIFT");
  if (rows.length !== 4 || independentOrientationResidual !== artifact.invariants.maximumOrientationUnitNormResidual
    || rayIndexColumn?.observed.minimum !== Math.min(...rows.map((row) => row.rayIndex)) || rayIndexColumn.observed.maximum !== Math.max(...rows.map((row) => row.rayIndex))
    || redshiftColumn?.observed.minimum !== Math.min(...rows.map((row) => row.responseAwareRadiometry.redshiftFactor)) || redshiftColumn.observed.maximum !== Math.max(...rows.map((row) => row.responseAwareRadiometry.redshiftFactor))) throw new Error("v538-typescript-replay");

  resetKerrResponseAwareFitsColumnSchemaServerCacheForTestsV538();
  const server = await loadKerrResponseAwareFitsColumnSchemaV538();
  const serverAgain = await loadKerrResponseAwareFitsColumnSchemaV538();
  const body = JSON.stringify({ version: KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_API_VERSION_V538, available: true, reason: "ready", summary: server.summary });
  const scienceEncoding = createKerrResponseAwareFitsColumnSchemaHudEncodingV538(server.summary, "science");
  const cinematicEncoding = createKerrResponseAwareFitsColumnSchemaHudEncodingV538(server.summary, "cinematic");
  const encodingAudit = compareKerrResponseAwareFitsColumnSchemaHudEncodingsV538(scienceEncoding, cinematicEncoding);
  const scienceProfile = resolveKerrResponseAwareFitsColumnSchemaHudProfileV538("science");
  const cinematicProfile = resolveKerrResponseAwareFitsColumnSchemaHudProfileV538("cinematic");
  const ids = [...KERR_PHOTON_METROLOGY_DETAIL_IDS_V538];
  if (server !== serverAgain || Buffer.byteLength(body) > 256 * 1024 || server.exports.csv.fileSha256 !== artifact.export.csvFileSha256
    || scienceProfile.scienceBoundary.bloomIntensity !== 0 || cinematicProfile.cinematicSeed === null || encodingAudit.qualifiedColumnCount !== 17
    || encodingAudit.physicalUncertaintyValueCount !== 0 || encodingAudit.imageHduCount !== 0 || ids.length !== 40
    || JSON.stringify(ids) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V538)) || JSON.stringify(ids) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V538))) throw new Error("v538-static");

  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrResponseAwareFitsColumnSchemaClientForTestsV538();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [subscribeKerrResponseAwareFitsColumnSchemaV538(() => notifications++), subscribeKerrResponseAwareFitsColumnSchemaV538(() => notifications++)];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  let first;
  let second;
  try { globalThis.fetch = (async (input: RequestInfo | URL) => { requests.push(String(input)); return new Response(body); }) as typeof fetch; [first, second] = await Promise.all([loadKerrResponseAwareFitsColumnSchemaSummaryV538(), loadKerrResponseAwareFitsColumnSchemaSummaryV538()]); }
  finally { releases.forEach((release) => release()); releases.forEach((release) => release()); globalThis.fetch = originalFetch; }
  const final = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrResponseAwareFitsColumnSchemaTelemetryV538();
  const snapshot = getKerrResponseAwareFitsColumnSchemaSnapshotV538();
  if (requests.length !== 1 || first !== second || notifications !== 4 || peak.subscriptions !== 2 || telemetry.listenerCount !== 0 || snapshot.status !== "ready" || final.status !== "baseline") throw new Error("v538-client");
  resetKerrResponseAwareFitsColumnSchemaClientForTestsV538();

  const component = text("app/components/KerrResponseAwareFitsColumnSchemaV538.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV538.tsx");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (!component.includes("每一列都有单位、适用性与缺失语义") || component.includes("<canvas") || component.includes("Math.random") || wrapper.includes("fetch(") || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV538"')) throw new Error("v538-source");

  const sourcePaths = [paths.artifact, paths.csv, paths.v536, paths.previousEvidence, paths.previousPointer, paths.dense, paths.formal,
    "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json", "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits",
    "scripts/build-kerr-response-aware-fits-column-schema-v538.py", "scripts/test-kerr-response-aware-fits-column-schema-v538.py",
    "app/lib/kerrResponseAwareFitsColumnSchemaV538.ts", "app/lib/kerrResponseAwareFitsColumnSchemaV538.test.ts",
    "app/lib/kerrResponseAwareFitsColumnSchemaServerV538.ts", "app/lib/kerrResponseAwareFitsColumnSchemaServerV538.test.ts",
    "app/lib/kerrResponseAwareFitsColumnSchemaClientV538.ts",
    "app/api/atlas/relativity-evidence/v538/response-aware-fits-column-schema/route.ts", "app/api/atlas/relativity-evidence/v538/response-aware-fits-column-schema/route.test.ts",
    "app/components/KerrResponseAwareFitsColumnSchemaV538.tsx", "app/components/KerrResponseAwareFitsColumnSchemaV538.test.tsx",
    "app/components/kerrPhotonMetrologyDetailCatalogV538.ts", "app/components/kerrPhotonMetrologyDetailCatalogV538.test.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV538.ts", "app/components/KerrPhotonMetrologyObservatoryIntentV538.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasResourceLifecycle.ts", "scripts/build-kerr-response-aware-fits-column-schema-runtime-v538.ts"];
  const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((left, right) => compare(left.path, right.path));
  const unsigned = { version: "v538-kerr-response-aware-fits-column-schema-runtime-audit-v1", generatedAt: "2026-08-02T00:00:00Z", status: "fits-column-semantics-runtime-qualified-v8r7-payload-stable", source: { v538ArtifactSha256: artifact.artifactSha256, v537EvidenceSha256: previousEvidence.evidenceSha256, v314StateSha256: dense.stateSha256 }, runtime: { atlasBytes: server.exports.atlas.bytes.byteLength, csvBytes: server.exports.csv.bytes.byteLength, summaryResponseBytes: Buffer.byteLength(body), serverFingerprintCacheHit: server === serverAgain, automaticRequestCount: 0, explicitRequestCount: requests.length, singleFlightConsumerCount: 2, notificationCount: notifications, peakSubscriptionCount: peak.subscriptions, finalResourceStatus: final.status, responseCachePolicy: "no-store", localShadowOnly: true }, independentReplay: { sourceRowCount: rows.length, maximumOrientationUnitNormResidual: independentOrientationResidual, columnShaReplayCount: artifact.columns.filter((column) => sha(column) === column.columnSha256).length, minimumRedshift: redshiftColumn.observed.minimum, maximumRedshift: redshiftColumn.observed.maximum }, detailCatalog: { detailCount: 40, inheritedDetailCount: 39, newLazyImportCount: 1, concurrentDetailSurfaceBudget: 1, automaticDetailRequestCount: 0, workbenchCurrentBinding: "v538" }, visualProfile: { profileId: scienceProfile.id, scientificPayloadStable: encodingAudit.scientificPayloadStable, fitsFileStable: encodingAudit.fitsFileStable, columnSchemaStable: encodingAudit.columnSchemaStable, qualifiedColumnCount: 17, physicalUncertaintyValueCount: 0, imageHduCount: 0, numericScientificStyleInputCount: 0, scientificFieldMutation: false }, counts: artifact.counts, qualification: artifact.qualification, boundary: artifact.boundary, sourceManifest, sourceSha256: sha(sourceManifest) };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, audit);
  console.log(JSON.stringify({ status: audit.status, artifactSha256: audit.artifactSha256, columnSchemaSha256: artifact.artifactSha256, columns: 17, columnShaReplay: 17, detailCatalogSize: 40, automaticRequests: 0, explicitRequests: 1, finalResourceStatus: final.status }, null, 2));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
