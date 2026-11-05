import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrGridAxisInfluenceSnapshotV533,
  getKerrGridAxisInfluenceTelemetryV533,
  loadKerrGridAxisInfluenceSummaryV533,
  resetKerrGridAxisInfluenceClientForTestsV533,
  subscribeKerrGridAxisInfluenceV533,
} from "../app/lib/kerrGridAxisInfluenceClientV533";
import {
  KERR_GRID_AXIS_INFLUENCE_ARTIFACT_MAX_BYTES_V533,
  loadKerrGridAxisInfluenceV533,
  resetKerrGridAxisInfluenceServerCacheForTestsV533,
} from "../app/lib/kerrGridAxisInfluenceServerV533";
import {
  KERR_GRID_AXIS_INFLUENCE_API_VERSION_V533,
  compareKerrGridAxisInfluenceHudEncodingsV533,
  createKerrGridAxisInfluenceHudEncodingV533,
  parseKerrGridAxisInfluenceArtifactV533,
  resolveKerrGridAxisInfluenceHudProfileV533,
} from "../app/lib/kerrGridAxisInfluenceV533";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V533,
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V533,
  KERR_PHOTON_METROLOGY_LABELS_V533,
} from "../app/components/kerrPhotonMetrologyDetailCatalogV533";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-grid-axis-influence-v533/atlas.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v532-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v532.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-grid-axis-influence-v533/runtime-audit.json",
} as const;
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !transient.has(key))
      .sort(([a], [b]) => compare(a, b))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

async function main() {
  const artifact = parseKerrGridAxisInfluenceArtifactV533(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const intake = read(paths.intake);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (sha(artifact) !== artifact.artifactSha256
    || previousEvidence.version !== "orbit-atlas-shadow-v532-evidence-v1"
    || sha(previousEvidence) !== previousEvidence.evidenceSha256
    || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v532"
    || sha(previousPointer) !== previousPointer.pointerSha256
    || detector.counts.measuredCalibrationFiles !== 0
    || intake.inspect.readyFileCount !== 0
    || dense.status !== "incomplete-0-of-49"
    || dense.completedShardCount !== 0
    || dense.attemptConsumed !== false
    || formal.version !== "v263-current-product-evidence-pointer"
    || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
    || formalEvidence.contracts?.singleCanvas !== true
    || formalEvidence.contracts?.legacyRootAttributes !== 603
    || formalEvidence.contracts?.evidenceLedgerClaims !== 84) {
    throw new Error("v533-runtime-upstream-boundary");
  }

  resetKerrGridAxisInfluenceServerCacheForTestsV533();
  const firstServerLoad = await loadKerrGridAxisInfluenceV533();
  const secondServerLoad = await loadKerrGridAxisInfluenceV533();
  if (firstServerLoad !== secondServerLoad
    || firstServerLoad.export.bytes.byteLength > KERR_GRID_AXIS_INFLUENCE_ARTIFACT_MAX_BYTES_V533) {
    throw new Error("v533-runtime-server-boundary");
  }
  const body = JSON.stringify({
    version: KERR_GRID_AXIS_INFLUENCE_API_VERSION_V533,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v533-runtime-summary-size");

  const scienceEncoding = createKerrGridAxisInfluenceHudEncodingV533(firstServerLoad.summary, "science");
  const cinematicEncoding = createKerrGridAxisInfluenceHudEncodingV533(firstServerLoad.summary, "cinematic");
  const encodingAudit = compareKerrGridAxisInfluenceHudEncodingsV533(scienceEncoding, cinematicEncoding);
  const scienceProfile = resolveKerrGridAxisInfluenceHudProfileV533("science");
  const cinematicProfile = resolveKerrGridAxisInfluenceHudProfileV533("cinematic");
  if (scienceProfile.scienceBoundary.bloomIntensity !== 0
    || scienceProfile.scienceBoundary.colorGradeIntensity !== 0
    || cinematicProfile.cinematicSeed === null
    || encodingAudit.scientificGeometryInputCount !== 46
    || encodingAudit.numericScientificStyleInputCount !== 0) {
    throw new Error("v533-runtime-profile-boundary");
  }

  const detailIds = [...KERR_PHOTON_METROLOGY_DETAIL_IDS_V533];
  if (detailIds.length !== 35
    || new Set(detailIds).size !== 35
    || JSON.stringify(detailIds) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V533))
    || JSON.stringify(detailIds) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V533))) {
    throw new Error("v533-runtime-catalog-boundary");
  }

  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrGridAxisInfluenceClientForTestsV533();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrGridAxisInfluenceV533(() => { notifications += 1; }),
    subscribeKerrGridAxisInfluenceV533(() => { notifications += 1; }),
  ];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const automaticRequestCount = requests.length;
  let first: Awaited<ReturnType<typeof loadKerrGridAxisInfluenceSummaryV533>> | undefined;
  let second: Awaited<ReturnType<typeof loadKerrGridAxisInfluenceSummaryV533>> | undefined;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    [first, second] = await Promise.all([
      loadKerrGridAxisInfluenceSummaryV533(),
      loadKerrGridAxisInfluenceSummaryV533(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrGridAxisInfluenceTelemetryV533();
  const snapshot = getKerrGridAxisInfluenceSnapshotV533();
  if (automaticRequestCount !== 0
    || requests.length !== 1
    || first !== second
    || notifications !== 4
    || peak.subscriptions !== 2
    || telemetry.listenerCount !== 0
    || telemetry.requestCount !== 1
    || telemetry.status !== "ready"
    || snapshot.status !== "ready"
    || finalDiff.status !== "baseline") {
    throw new Error("v533-runtime-client-boundary");
  }
  resetKerrGridAxisInfluenceClientForTestsV533();

  const component = text("app/components/KerrGridAxisInfluenceV533.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV533.tsx");
  const catalog = text("app/components/kerrPhotonMetrologyDetailCatalogV533.ts");
  const route = text("app/api/atlas/relativity-evidence/v533/grid-axis-influence/route.ts");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (!component.includes("这不是实测优先级，也不是推荐")
    || !component.includes("No metric utility, axis prior, probability")
    || component.includes("Math.random")
    || component.includes("<canvas")
    || !wrapper.includes("KERR_PHOTON_METROLOGY_DETAILS_V533[detail]")
    || wrapper.includes("fetch(")
    || (catalog.match(/lazy\(/g) ?? []).length !== 1
    || !catalog.includes("...KERR_PHOTON_METROLOGY_DETAILS_V532")
    || !route.includes('delivery !== "local-shadow"')
    || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV533"')) {
    throw new Error("v533-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.intake,
    paths.dense,
    paths.formal,
    "app/lib/kerrGridAxisInfluenceV533.ts",
    "app/lib/kerrGridAxisInfluenceV533.test.ts",
    "app/lib/kerrGridAxisInfluenceServerV533.ts",
    "app/lib/kerrGridAxisInfluenceServerV533.test.ts",
    "app/lib/kerrGridAxisInfluenceClientV533.ts",
    "app/lib/kerrGridAxisInfluenceClientV533.test.ts",
    "app/api/atlas/relativity-evidence/v533/grid-axis-influence/route.ts",
    "app/api/atlas/relativity-evidence/v533/grid-axis-influence/route.test.ts",
    "app/components/KerrGridAxisInfluenceV533.tsx",
    "app/components/KerrGridAxisInfluenceV533.test.tsx",
    "app/components/kerrPhotonMetrologyDetailCatalogV533.ts",
    "app/components/kerrPhotonMetrologyDetailCatalogV533.test.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV533.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV533.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV533.test.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV532.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-grid-axis-influence-v533.py",
    "scripts/test-kerr-grid-axis-influence-v533.py",
    "scripts/build-kerr-grid-axis-influence-runtime-v533.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => compare(a.path, b.path));
  const unsigned = {
    version: "v533-kerr-grid-axis-influence-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "grid-axis-influence-runtime-qualified-v8r2-science-cinematic-geometry-stable",
    source: {
      axisInfluenceArtifactSha256: artifact.artifactSha256,
      v532EvidenceSha256: previousEvidence.evidenceSha256,
      v532PointerSha256: previousPointer.pointerSha256,
      v314StateSha256: dense.stateSha256,
    },
    runtime: {
      serverFileBytes: firstServerLoad.export.bytes.byteLength,
      summaryResponseBytes: Buffer.byteLength(body),
      serverFingerprintCacheHit: firstServerLoad === secondServerLoad,
      automaticRequestCount,
      explicitRequestCount: requests.length,
      singleFlightConsumerCount: 2,
      notificationCount: notifications,
      peakSubscriptionCount: peak.subscriptions,
      finalSubscriptionCount: finalDiff.subscriptions,
      finalObjectUrlCount: finalDiff.objectUrls,
      finalResourceStatus: finalDiff.status,
      responseCachePolicy: "no-store",
      localShadowOnly: true,
    },
    detailCatalog: {
      detailCount: 35,
      inheritedDetailCount: 34,
      newLazyImportCount: 1,
      concurrentDetailSurfaceBudget: 1,
      automaticDetailRequestCount: 0,
      workbenchCurrentBinding: "v533",
    },
    visualProfile: {
      profileId: scienceProfile.id,
      scientificPayloadStable: encodingAudit.scientificPayloadStable,
      scientificGeometryStable: encodingAudit.scientificGeometryStable,
      scientificGeometryInputCount: 46,
      numericScientificStyleInputCount: 0,
      scientificFieldMutation: false,
    },
    counts: artifact.counts,
    influenceDefinition: artifact.influenceDefinition,
    influenceAudits: artifact.influenceAudits,
    selectionBoundary: artifact.selectionBoundary,
    acquisitionBoundary: artifact.acquisitionBoundary,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    sourceManifest,
    sourceSha256: sha(sourceManifest),
  };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, audit);
  console.log(JSON.stringify({
    status: audit.status,
    artifactSha256: audit.artifactSha256,
    axisInfluenceSha256: artifact.artifactSha256,
    scientificGeometryInputs: 46,
    detailCatalogSize: 35,
    automaticRequests: 0,
    explicitRequests: 1,
    finalResourceStatus: audit.runtime.finalResourceStatus,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
