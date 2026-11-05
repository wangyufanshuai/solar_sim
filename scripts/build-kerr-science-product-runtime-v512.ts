import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrScienceProductEligibilityGraphSnapshotV512,
  getKerrScienceProductEligibilityGraphTelemetryV512,
  loadKerrScienceProductEligibilityGraphSummaryV512,
  resetKerrScienceProductEligibilityGraphClientForTestsV512,
  subscribeKerrScienceProductEligibilityGraphV512,
} from "../app/lib/kerrScienceProductEligibilityGraphClientV512";
import { KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_API_VERSION_V512 } from "../app/lib/kerrScienceProductEligibilityGraphV512";
import { loadKerrScienceProductEligibilityGraphV512 } from "../app/lib/kerrScienceProductEligibilityGraphServerV512";

const root = process.cwd();
const paths = Object.freeze({
  graph: "dist/science/kerr-science-product-eligibility-v512/eligibility-graph.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v511-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v511.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-science-product-eligibility-v512/runtime-audit.json",
});
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(part, target); };

async function main(): Promise<void> {
  const graph = read(paths.graph), previousEvidence = read(paths.previousEvidence), previousPointer = read(paths.previousPointer), dense = read(paths.dense), formal = read(paths.formal), formalEvidence = read(formal.source);
  if (sha(graph) !== graph.artifactSha256 || previousEvidence.version !== "orbit-atlas-shadow-v511-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256 || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v511" || sha(previousPointer) !== previousPointer.pointerSha256 || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v512-runtime-upstream-boundary");
  const loaded = await loadKerrScienceProductEligibilityGraphV512();
  if (loaded.artifact.artifactSha256 !== graph.artifactSha256 || loaded.summary.nodes.length !== 10 || loaded.summary.edges.length !== 12 || loaded.summary.counts.scienceRasterRows !== 0 || loaded.summary.decision.scienceProductPromotionAllowed !== false || loaded.export.bytes.byteLength > 128 * 1024) throw new Error("v512-runtime-server-boundary");
  const body = JSON.stringify({ version: KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_API_VERSION_V512, available: true, reason: "ready", summary: loaded.summary });
  const requests: string[] = [], originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => { requests.push(String(input)); return new Response(body, { status: 200 }); }) as typeof fetch;
  resetKerrScienceProductEligibilityGraphClientForTestsV512();
  const baseline = getAtlasResourceSnapshot(); let notifications = 0;
  const release = subscribeKerrScienceProductEligibilityGraphV512(() => { notifications += 1; });
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()), automaticRequestCount = requests.length;
  const [first, second] = await Promise.all([loadKerrScienceProductEligibilityGraphSummaryV512(), loadKerrScienceProductEligibilityGraphSummaryV512()]);
  release(); release();
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()), telemetry = getKerrScienceProductEligibilityGraphTelemetryV512(), snapshot = getKerrScienceProductEligibilityGraphSnapshotV512();
  globalThis.fetch = originalFetch;
  if (automaticRequestCount !== 0 || requests.length !== 1 || first !== second || first.artifactSha256 !== graph.artifactSha256 || notifications !== 2 || peak.total !== 1 || peak.subscriptions !== 1 || telemetry.listenerCount !== 0 || telemetry.requestCount !== 1 || telemetry.status !== "ready" || telemetry.sceneRevisionDelta !== 0 || telemetry.scientificFieldMutationAllowed !== false || snapshot.status !== "ready" || finalDiff.status !== "baseline" || finalDiff.total !== 0) throw new Error("v512-runtime-client-boundary");
  resetKerrScienceProductEligibilityGraphClientForTestsV512();
  const component = text("app/components/KerrScienceProductEligibilityGraphV512.tsx"), wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV512.tsx"), workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (!component.includes('data-atlas-v512-node-count="10"') || !component.includes('data-atlas-v512-solar-first-screen-request-count="0"') || !component.includes('data-atlas-v512-detector-image-authority="false"') || component.includes("Math.random") || component.includes("<canvas") || !wrapper.includes('lazy(() => import("./KerrScienceProductEligibilityGraphV512"))') || wrapper.includes("fetch(") || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV512"') || [component, wrapper, workbench].some((source) => source.includes("�"))) throw new Error("v512-runtime-source-boundary");
  const sourcePaths = [
    "app/lib/kerrScienceProductEligibilityGraphV512.ts", "app/lib/kerrScienceProductEligibilityGraphV512.test.ts",
    "app/lib/kerrScienceProductEligibilityGraphServerV512.ts", "app/lib/kerrScienceProductEligibilityGraphServerV512.test.ts",
    "app/lib/kerrScienceProductEligibilityGraphClientV512.ts", "app/lib/kerrScienceProductEligibilityGraphClientV512.test.ts",
    "app/api/atlas/relativity-evidence/v512/science-product-eligibility/route.ts", "app/api/atlas/relativity-evidence/v512/science-product-eligibility/route.test.ts",
    "app/components/KerrScienceProductEligibilityGraphV512.tsx", "app/components/KerrScienceProductEligibilityGraphV512.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV512.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV512.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV512.tsx", "app/components/KerrPhotonMetrologyObservatoryIntentV512.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasScienceCinematicV7V457.ts", "app/lib/atlasResourceLifecycle.ts",
    "scripts/build-kerr-science-product-eligibility-graph-v512.ts", "scripts/build-kerr-science-product-runtime-v512.ts",
  ];
  const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((left, right) => left.path.localeCompare(right.path));
  const unsigned = {
    version: "v512-kerr-science-product-runtime-audit-v1", generatedAt: "2026-08-01T00:00:00Z", status: "science-product-runtime-qualified-promotion-blocked",
    source: { graphArtifactSha256: graph.artifactSha256, v511EvidenceSha256: previousEvidence.evidenceSha256, v511PointerSha256: previousPointer.pointerSha256 },
    runtime: { serverFileBytes: loaded.export.bytes.byteLength, summaryResponseBytes: Buffer.byteLength(body), automaticRequestCount, explicitRequestCount: requests.length, singleFlightConsumerCount: 2, notificationCount: notifications, peakSubscriptionCount: peak.subscriptions, finalResourceStatus: finalDiff.status, responseCachePolicy: "no-store", responseMaximumBytes: 128 * 1024, localShadowOnly: true },
    graph: { nodeCount: first.counts.nodeCount, edgeCount: first.counts.edgeCount, productCount: first.products.length, qualifiedNodeCount: first.counts.qualifiedNodeCount, blockedNodeCount: first.counts.blockedNodeCount, fitsHeaderCards: first.counts.fitsHeaderCards, wcsCoordinateRows: first.counts.wcsCoordinateRows, sparsePhotonRows: first.counts.sparsePhotonRows, scienceRasterRows: first.counts.scienceRasterRows, fitsHduCount: first.counts.fitsHduCount, pngCount: first.counts.pngCount },
    visualBoundary: first.visualBoundary, decision: first.decision, boundary: first.boundary, sourceManifest, sourceSha256: sha(sourceManifest),
  };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) }; atomic(paths.output, audit);
  console.log(JSON.stringify({ status: audit.status, artifactSha256: audit.artifactSha256, graphArtifactSha256: graph.artifactSha256, nodes: audit.graph.nodeCount, edges: audit.graph.edgeCount, products: audit.graph.productCount, coordinates: audit.graph.wcsCoordinateRows, photonRows: audit.graph.sparsePhotonRows, sciencePixels: audit.graph.scienceRasterRows, automaticRequests: audit.runtime.automaticRequestCount, explicitRequests: audit.runtime.explicitRequestCount, finalResourceStatus: audit.runtime.finalResourceStatus, promotionAllowed: audit.decision.scienceProductPromotionAllowed }, null, 2));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
