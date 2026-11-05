import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import {
  getKerrBandpassRedshiftCommutatorSnapshotV534,
  getKerrBandpassRedshiftCommutatorTelemetryV534,
  loadKerrBandpassRedshiftCommutatorSummaryV534,
  resetKerrBandpassRedshiftCommutatorClientForTestsV534,
  subscribeKerrBandpassRedshiftCommutatorV534,
} from "../app/lib/kerrBandpassRedshiftCommutatorClientV534";
import {
  KERR_BANDPASS_REDSHIFT_ARTIFACT_MAX_BYTES_V534,
  loadKerrBandpassRedshiftCommutatorV534,
  resetKerrBandpassRedshiftCommutatorServerCacheForTestsV534,
} from "../app/lib/kerrBandpassRedshiftCommutatorServerV534";
import {
  KERR_BANDPASS_REDSHIFT_COMMUTATOR_API_VERSION_V534,
  compareKerrBandpassRedshiftHudEncodingsV534,
  createKerrBandpassRedshiftHudEncodingV534,
  parseKerrBandpassRedshiftCommutatorArtifactV534,
  resolveKerrBandpassRedshiftHudProfileV534,
} from "../app/lib/kerrBandpassRedshiftCommutatorV534";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V534,
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V534,
  KERR_PHOTON_METROLOGY_LABELS_V534,
} from "../app/components/kerrPhotonMetrologyDetailCatalogV534";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v533-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v533.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-bandpass-redshift-commutator-v534/runtime-audit.json",
} as const;
const transient = new Set([
  "generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256",
]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !transient.has(key))
    .sort(([a], [b]) => compare(a, b))
    .map(([key, entry]) => [key, canonicalize(entry)]));
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
  const artifact = parseKerrBandpassRedshiftCommutatorArtifactV534(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const intake = read(paths.intake);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (sha(artifact) !== artifact.artifactSha256
    || previousEvidence.version !== "orbit-atlas-shadow-v533-evidence-v1"
    || sha(previousEvidence) !== previousEvidence.evidenceSha256
    || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v533"
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
    throw new Error("v534-runtime-upstream-boundary");
  }

  resetKerrBandpassRedshiftCommutatorServerCacheForTestsV534();
  const firstServerLoad = await loadKerrBandpassRedshiftCommutatorV534();
  const secondServerLoad = await loadKerrBandpassRedshiftCommutatorV534();
  if (firstServerLoad !== secondServerLoad
    || firstServerLoad.export.bytes.byteLength > KERR_BANDPASS_REDSHIFT_ARTIFACT_MAX_BYTES_V534) {
    throw new Error("v534-runtime-server-boundary");
  }
  const body = JSON.stringify({
    version: KERR_BANDPASS_REDSHIFT_COMMUTATOR_API_VERSION_V534,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v534-runtime-summary-size");

  const scienceEncoding = createKerrBandpassRedshiftHudEncodingV534(firstServerLoad.summary, "science");
  const cinematicEncoding = createKerrBandpassRedshiftHudEncodingV534(firstServerLoad.summary, "cinematic");
  const encodingAudit = compareKerrBandpassRedshiftHudEncodingsV534(scienceEncoding, cinematicEncoding);
  const scienceProfile = resolveKerrBandpassRedshiftHudProfileV534("science");
  const cinematicProfile = resolveKerrBandpassRedshiftHudProfileV534("cinematic");
  if (scienceProfile.scienceBoundary.bloomIntensity !== 0
    || scienceProfile.scienceBoundary.colorGradeIntensity !== 0
    || cinematicProfile.cinematicSeed === null
    || encodingAudit.scientificGeometryInputCount !== 4
    || encodingAudit.numericScientificStyleInputCount !== 0) {
    throw new Error("v534-runtime-profile-boundary");
  }

  const detailIds = [...KERR_PHOTON_METROLOGY_DETAIL_IDS_V534];
  if (detailIds.length !== 36
    || new Set(detailIds).size !== 36
    || JSON.stringify(detailIds) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V534))
    || JSON.stringify(detailIds) !== JSON.stringify(Object.keys(KERR_PHOTON_METROLOGY_LABELS_V534))) {
    throw new Error("v534-runtime-catalog-boundary");
  }

  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrBandpassRedshiftCommutatorClientForTestsV534();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrBandpassRedshiftCommutatorV534(() => { notifications += 1; }),
    subscribeKerrBandpassRedshiftCommutatorV534(() => { notifications += 1; }),
  ];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const automaticRequestCount = requests.length;
  let first: Awaited<ReturnType<typeof loadKerrBandpassRedshiftCommutatorSummaryV534>> | undefined;
  let second: Awaited<ReturnType<typeof loadKerrBandpassRedshiftCommutatorSummaryV534>> | undefined;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    [first, second] = await Promise.all([
      loadKerrBandpassRedshiftCommutatorSummaryV534(),
      loadKerrBandpassRedshiftCommutatorSummaryV534(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrBandpassRedshiftCommutatorTelemetryV534();
  const snapshot = getKerrBandpassRedshiftCommutatorSnapshotV534();
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
    throw new Error("v534-runtime-client-boundary");
  }
  resetKerrBandpassRedshiftCommutatorClientForTestsV534();

  const component = text("app/components/KerrBandpassRedshiftCommutatorV534.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV534.tsx");
  const catalog = text("app/components/kerrPhotonMetrologyDetailCatalogV534.ts");
  const route = text("app/api/atlas/relativity-evidence/v534/bandpass-redshift/route.ts");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (!component.includes("红移与仪器带通不能交换顺序")
    || !component.includes("No collecting area, exposure, electrons, counts")
    || component.includes("Math.random")
    || component.includes("<canvas")
    || !wrapper.includes("KERR_PHOTON_METROLOGY_DETAILS_V534[detail]")
    || wrapper.includes("fetch(")
    || (catalog.match(/lazy\(/g) ?? []).length !== 1
    || !catalog.includes("...KERR_PHOTON_METROLOGY_DETAILS_V533")
    || !route.includes('delivery !== "local-shadow"')
    || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV534"')) {
    throw new Error("v534-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.intake,
    paths.dense,
    paths.formal,
    "app/lib/kerrBandpassRedshiftCommutatorV534.ts",
    "app/lib/kerrBandpassRedshiftCommutatorV534.test.ts",
    "app/lib/kerrBandpassRedshiftCommutatorServerV534.ts",
    "app/lib/kerrBandpassRedshiftCommutatorServerV534.test.ts",
    "app/lib/kerrBandpassRedshiftCommutatorClientV534.ts",
    "app/lib/kerrBandpassRedshiftCommutatorClientV534.test.ts",
    "app/api/atlas/relativity-evidence/v534/bandpass-redshift/route.ts",
    "app/api/atlas/relativity-evidence/v534/bandpass-redshift/route.test.ts",
    "app/components/KerrBandpassRedshiftCommutatorV534.tsx",
    "app/components/KerrBandpassRedshiftCommutatorV534.test.tsx",
    "app/components/kerrPhotonMetrologyDetailCatalogV534.ts",
    "app/components/kerrPhotonMetrologyDetailCatalogV534.test.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV534.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV534.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV534.test.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV533.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-bandpass-redshift-commutator-oracle-v534.py",
    "scripts/test-kerr-bandpass-redshift-commutator-v534.py",
    "scripts/build-kerr-bandpass-redshift-commutator-v534.ts",
    "scripts/build-kerr-bandpass-redshift-commutator-v534.mjs",
    "scripts/build-kerr-bandpass-redshift-runtime-v534.ts",
  ];
  const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((a, b) => compare(a.path, b.path));
  const unsigned = {
    version: "v534-kerr-bandpass-redshift-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "bandpass-redshift-runtime-qualified-v8r3-science-cinematic-payload-stable",
    source: {
      bandpassRedshiftArtifactSha256: artifact.artifactSha256,
      v533EvidenceSha256: previousEvidence.evidenceSha256,
      v533PointerSha256: previousPointer.pointerSha256,
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
      detailCount: 36,
      inheritedDetailCount: 35,
      newLazyImportCount: 1,
      concurrentDetailSurfaceBudget: 1,
      automaticDetailRequestCount: 0,
      workbenchCurrentBinding: "v534",
    },
    visualProfile: {
      profileId: scienceProfile.id,
      scientificPayloadStable: encodingAudit.scientificPayloadStable,
      scientificGeometryStable: encodingAudit.scientificGeometryStable,
      scientificGeometryInputCount: 4,
      numericScientificStyleInputCount: 0,
      scientificFieldMutation: false,
    },
    counts: artifact.counts,
    maxima: artifact.maxima,
    minima: artifact.minima,
    operator: artifact.operator,
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
    bandpassRedshiftSha256: artifact.artifactSha256,
    commutatorRows: 4,
    detailCatalogSize: 36,
    automaticRequests: 0,
    explicitRequests: 1,
    finalResourceStatus: audit.runtime.finalResourceStatus,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
