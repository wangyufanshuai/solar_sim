import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v328Evidence: "dist/science/orbit-atlas-shadow-v328-evidence.json",
  v328Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v328.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v329-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v329.json",
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

const v328Evidence = read(paths.v328Evidence);
const v328Pointer = read(paths.v328Pointer);
const state = read(paths.state);
const formal = read(paths.formal);
const storeSource = text("app/lib/kerrScienceObservatoryStoreV329.ts");
const storeTestSource = text("app/lib/kerrScienceObservatoryStoreV329.test.ts");
const consumerSources = [
  "app/components/KerrScienceBandUncertaintyV325.tsx",
  "app/components/KerrScienceCinematicABV327.tsx",
  "app/components/KerrSciencePhotonBandsV328.tsx",
].map(text);
if (v328Evidence.status !== "photon-observables-wired-browser-pending-dense-incomplete-0-of-49"
  || v328Pointer.capabilities?.v328PhotonObservables !== "four-rays-twelve-fixed-band-photon-radiances"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || !storeSource.includes("acquireKerrThinDiskBandViewV321(controller.signal)")
  || !storeSource.includes("consumerCount === 0") || !storeSource.includes("releaseAcquiredView?.()")
  || !storeSource.includes("createKerrScienceBandUncertaintyViewV325") || !storeSource.includes("createKerrScienceCinematicABViewV327") || !storeSource.includes("createKerrSciencePhotonBandViewV328")
  || !storeTestSource.includes("toHaveBeenCalledTimes(1)") || !storeTestSource.includes("consumerCount: 3, acquisitionCount: 1, derivationCount: 1")
  || consumerSources.some((source) => !source.includes("useSyncExternalStore") || !source.includes("retainKerrScienceObservatoryV329") || source.includes("acquireKerrThinDiskBandViewV321"))) throw new Error("v329 dependency, store or consumer boundary mismatch");

const sourcePaths = [
  "scripts/build-shadow-candidate-v329.mjs",
  "scripts/verify-shadow-v329-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceObservatoryStoreV329.ts",
  "app/lib/kerrScienceObservatoryStoreV329.test.ts",
  "app/components/KerrScienceBandUncertaintyV325.tsx",
  "app/components/KerrScienceBandUncertaintyV325.test.ts",
  "app/components/KerrScienceCinematicABV327.tsx",
  "app/components/KerrScienceCinematicABV327.test.ts",
  "app/components/KerrSciencePhotonBandsV328.tsx",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/lib/atlasShadowCapabilityPointerV329.ts",
  "app/lib/atlasShadowCapabilityPointerV329.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v329-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "science-observatory-single-flight-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: { v328EvidenceSha256: v328Evidence.evidenceSha256, v328PointerSha256: v328Pointer.pointerSha256, fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null },
  runtime: {
    consumerCountFixture: 3,
    v321AcquisitionCountFixture: 1,
    derivationCountFixture: 1,
    derivedModels: ["v325-uncertainty", "v326-provenance", "v327-cinematic-ab", "v328-photon-bands"],
    externalStore: "use-sync-external-store-bounded-models",
    directConsumerFetches: 0,
    lastConsumerRelease: "aborts-pending-or-releases-view-and-clears-derived-models",
    idempotentRelease: true,
    resourceBaselineReturnTested: true,
    browserQualification: "not-run",
  },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "single-flight-science-observatory-store-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v329",
  generatedAt: new Date().toISOString(),
  status: "science-observatory-single-flight-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v328PhotonObservables: "four-rays-twelve-fixed-band-photon-radiances",
    v329SingleFlight: "three-consumers-one-v321-acquisition-one-derivation",
    v329ExternalStore: "bounded-models-use-sync-external-store",
    v329BaselineReturn: "last-consumer-releases-cache-and-derived-models",
    v329BrowserGate: "authored-not-run",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, consumers: evidence.runtime.consumerCountFixture, acquisitions: evidence.runtime.v321AcquisitionCountFixture, derivations: evidence.runtime.derivationCountFixture, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
