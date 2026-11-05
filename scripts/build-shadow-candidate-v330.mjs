import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v329Evidence: "dist/science/orbit-atlas-shadow-v329-evidence.json",
  v329Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v329.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v330-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v330.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const read = (relative) => JSON.parse(text(relative));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => {
  const target = resolve(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const v329Evidence = read(paths.v329Evidence);
const v329Pointer = read(paths.v329Pointer);
const state = read(paths.state);
const formal = read(paths.formal);
const evidenceSources = [325, 326, 327, 328, 329].map((version) => read(`dist/science/orbit-atlas-shadow-v${version}-evidence.json`));
const workbenchSource = text("app/lib/relativityWorkbenchEvidenceV330.ts");
const serverSource = text("app/lib/relativityEvidenceServerV330.ts");
const routeSource = text("app/api/atlas/relativity-evidence/v330/route.ts");
const historicalLocks = {
  "app/lib/relativityWorkbenchEvidenceV285.ts": "93efae6feead47e33513d0391e72dd87d51ce491f7143201cb418e96f3cd6a80",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts": "aeb02858f2adfc1261cef8352d8ea4003d77f55174d286931e77a3c68f74ca41",
  "app/lib/relativityEvidenceServerV285R1.ts": "96ee9b7f252d4033a75b78086a62a22da549f40945ebca0dd2df7854aa4e0197",
  "app/lib/relativityEvidenceServerV285R1.test.ts": "ae18f82c14c1d7847ab4b029b41a05cae2f59b7944fa67afdfcfb23919f71bb4",
};
if (v329Evidence.status !== "science-observatory-single-flight-wired-browser-pending-dense-incomplete-0-of-49"
  || v329Pointer.capabilities?.v329SingleFlight !== "three-consumers-one-v321-acquisition-one-derivation"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || Object.entries(historicalLocks).some(([path, expected]) => fileSha(path) !== expected)
  || !workbenchSource.includes("id: \"v325\"") || !workbenchSource.includes("id: \"v329\"") || !workbenchSource.includes("no RSS")
  || !serverSource.includes("Promise.all") || !serverSource.includes("CACHE_LIMIT = 4") || !serverSource.includes("v330-evidence-dependency-mismatch")
  || !routeSource.includes("128 * 1024") || !routeSource.includes("Cache-Control\": \"no-store") || !routeSource.includes("lite-boundary")) throw new Error("v330 dependency, frozen-source or bounded-adapter mismatch");

const expectedStatuses = [
  "componentwise-uncertainty-wired-browser-pending-dense-incomplete-0-of-49",
  "uncertainty-provenance-wired-browser-pending-dense-incomplete-0-of-49",
  "science-cinematic-ab-wired-browser-pending-dense-incomplete-0-of-49",
  "photon-observables-wired-browser-pending-dense-incomplete-0-of-49",
  "science-observatory-single-flight-wired-browser-pending-dense-incomplete-0-of-49",
];
if (evidenceSources.some((evidence, index) => evidence.status !== expectedStatuses[index] || evidence.correctedCampaign?.namespace !== "v314" || evidence.correctedCampaign?.completedShardCount !== 0)) throw new Error("v330 source evidence truth mismatch");

const sourcePaths = [
  "scripts/build-shadow-candidate-v330.mjs",
  "scripts/verify-shadow-v330-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/relativityWorkbenchEvidenceV330.ts",
  "app/lib/relativityWorkbenchEvidenceV330.test.ts",
  "app/lib/relativityEvidenceServerV330.ts",
  "app/api/atlas/relativity-evidence/v330/route.ts",
  "app/api/atlas/relativity-evidence/v330/route.test.ts",
  "app/lib/atlasShadowCapabilityPointerV330.ts",
  "app/lib/atlasShadowCapabilityPointerV330.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v330-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "science-workbench-v325-v329-evidence-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v329EvidenceSha256: v329Evidence.evidenceSha256,
    v329PointerSha256: v329Pointer.pointerSha256,
    capabilityEvidenceSha256: Object.fromEntries([325, 326, 327, 328, 329].map((version, index) => [`v${version}`, evidenceSources[index].evidenceSha256])),
    fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null,
  },
  workbench: {
    rowIds: ["v325", "v326", "v327", "v328", "v329"],
    rowCount: 5,
    separateCapabilityStatuses: true,
    v325Uncertainty: { diskRayCount: 4, bandMeasurementCount: 12, maximumLinearRelativeEnvelope: evidenceSources[0].science?.maxima?.conservativeLinearRelativeEnvelope ?? null, combinationPolicy: "linear-sum-without-independence-claim-no-rss" },
    v326Provenance: { json: true, csv: true, sanitized: true, rawRayBufferExcluded: true },
    v327ScienceCinematicAB: { swatchCount: 4, scienceValuesUnchanged: true, buffersDisjoint: true, cinematicOutputsDistinct: true },
    v328PhotonObservables: { diskRayCount: 4, bandMeasurementCount: 12, unit: "photons s^-1 m^-2 sr^-1", detectorIndependent: true },
    v329SingleFlight: { consumers: 3, acquisitions: 1, derivations: 1, directConsumerFetches: 0, idempotentRelease: true, resourceBaselineReturnTested: true },
  },
  api: {
    route: "/api/atlas/relativity-evidence/v330",
    parallelIndependentReads: true,
    boundedRootBundleCache: 4,
    combinedMtimeSizeFingerprint: true,
    canonicalShaValidated: true,
    dependencyChainValidated: true,
    responseMaxBytes: 128 * 1024,
    cacheControl: "no-store",
    lite: "unavailable-lite-boundary",
    browserQualification: "not-run",
  },
  historicalSourceLocks: historicalLocks,
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "five-row-sanitized-versioned-workbench-evidence-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v330",
  generatedAt: new Date().toISOString(),
  status: "science-workbench-v325-v329-evidence-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v325Uncertainty: "four-rays-twelve-bands-componentwise-linear-envelope",
    v326Provenance: "sanitized-json-csv-no-ray-buffer-host-path-pid",
    v327ScienceCinematicAB: "science-unchanged-v5-v6-cinematic-distinct",
    v328PhotonObservables: "four-rays-twelve-fixed-band-photon-radiances",
    v329SingleFlight: "three-consumers-one-v321-acquisition-one-derivation",
    v330WorkbenchAdapter: "five-versioned-capability-rows",
    v330EvidenceApi: "parallel-bounded-single-flight-no-store-lite-unavailable-128kib",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    v5V6Profiles: "manual-local-shadow-only-not-default",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: evidence.workbench.rowIds, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
