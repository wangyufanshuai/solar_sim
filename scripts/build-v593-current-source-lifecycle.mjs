import { createHash } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const defaultOutputPath = resolve(root, "docs/release/v593/resource-lifecycle-v593.json");
const sourcePath = resolve(root, "docs/release/v593/source-manifest-v593.json");
const manifestPath = resolve(root, "public/data/final-art-direction-v593/manifest.json");
const standalonePath = resolve(root, "dist/release/atlas-v593-standalone-build-resource.json");
const litePath = resolve(root, "dist/release/atlas-v593-lite-build-resource.json");
const scientificPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const maximumDesktopGpuBytes = 512 * 1024 * 1024;
const minimumHeroMedianFps = 45;
const maximumHeroDrawCalls = 60;
const expectedHeroBodies = Object.freeze([
  "sun",
  "earth",
  "mercury",
  "venus",
  "moon",
  "mars",
  "jupiter",
  "saturn",
  "vesta",
  "bennu",
  "eros",
  "kleopatra",
  "tempel-1",
  "ceres",
  "uranus",
  "neptune",
]);
const sameRealmGateNames = Object.freeze([
  "sourceIdentityStable",
  "sharedBuildIdentity",
  "formalProductPointerFrozen",
  "sourceContractVersion",
  "sourceIdentityMatches",
  "pageIdentityMatches",
  "harnessRealmStable",
  "harnessTimeOriginStable",
  "sourceRealmStable",
  "sourceTimeOriginStable",
  "rendererZeroAfterDetach",
  "registryZeroAfterDetach",
  "nativeWebglReturnedToBaseline",
  "sceneWorkerTargetsReleased",
  "workerLedgerReturnedToBaseline",
  "listenerLedgerReturnedToBaseline",
  "exitedThroughSameRealmClientRoute",
  "finalRendererCleanupObserved",
  "noUnexpectedErrors",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function toPosix(path) {
  return path.replaceAll("\\", "/");
}
function assertInsideRoot(path, label) {
  const relation = relative(root, path);
  assert(relation !== "" || path === root, `${label}-root-path-not-allowed`);
  assert(!relation.startsWith("..") && !isAbsolute(relation), `${label}-outside-workspace`);
  return path;
}
function resolveWorkspacePath(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label}-path-required`);
  return assertInsideRoot(resolve(root, value), label);
}
function parseArgs(argv) {
  const values = {
    lifecycleBatch: process.env.V593_LIFECYCLE_BATCH ?? null,
    sameRealmBatch: process.env.V593_SAME_REALM_BATCH ?? null,
    output: process.env.V593_LIFECYCLE_OUTPUT ?? defaultOutputPath,
  };
  const options = new Map([
    ["--lifecycle-batch", "lifecycleBatch"],
    ["--same-realm-batch", "sameRealmBatch"],
    ["--output", "output"],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    assert(options.has(option), `v593-lifecycle-unknown-option:${option}`);
    const value = argv[index + 1];
    assert(value && !value.startsWith("--"), `v593-lifecycle-option-value:${option}`);
    values[options.get(option)] = value;
    index += 1;
  }
  assert(values.lifecycleBatch, "v593-lifecycle-batch-required:--lifecycle-batch-or-V593_LIFECYCLE_BATCH");
  assert(values.sameRealmBatch, "v593-same-realm-batch-required:--same-realm-batch-or-V593_SAME_REALM_BATCH");
  return {
    lifecycleBatch: resolveWorkspacePath(values.lifecycleBatch, "v593-lifecycle-batch"),
    sameRealmBatch: resolveWorkspacePath(values.sameRealmBatch, "v593-same-realm-batch"),
    output: resolveWorkspacePath(values.output, "v593-lifecycle-output"),
  };
}
async function readJsonWithBytes(path, label) {
  const bytes = await readFile(path);
  try {
    return { bytes, value: JSON.parse(bytes.toString("utf8")) };
  } catch (error) {
    throw new Error(`${label}-invalid-json:${String(error)}`);
  }
}
async function fileReceipt(path) {
  const bytes = await readFile(path);
  return {
    path: toPosix(relative(root, path)),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}
async function safeEvidenceReceipt(path) {
  try {
    return await fileReceipt(path);
  } catch {
    return null;
  }
}
async function readStageJson(path, label) {
  try {
    return { ...(await readJsonWithBytes(path, label)), error: null };
  } catch (error) {
    return {
      bytes: null,
      value: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
async function readCanonicalReceipt(path, sealKey, label) {
  const { value } = await readJsonWithBytes(path, label);
  const unsigned = { ...value };
  delete unsigned[sealKey];
  assert(typeof value[sealKey] === "string" && value[sealKey] === canonicalSha(unsigned), `${label}-canonical-seal`);
  return value;
}
async function verifySourceManifestFiles(source, label) {
  assert(Array.isArray(source.files) && source.files.length > 0, `${label}-files`);
  for (const entry of source.files) {
    await verifyReferencedFileReceipt(entry, `${label}-file`);
  }
}
function verifyRunnerReceipt(document, label) {
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  const nativeSeal = sha256(Buffer.from(JSON.stringify(unsigned), "utf8"));
  const canonicalSeal = canonicalSha(unsigned);
  assert(
    document.receiptSha256 === nativeSeal || document.receiptSha256 === canonicalSeal,
    `${label}-runner-receipt-seal`,
  );
  return document.receiptSha256 === canonicalSeal
    ? "sha256-canonical-json"
    : "sha256-json-insertion-order";
}
async function verifyReferencedFileReceipt(receipt, label) {
  assert(receipt && typeof receipt.path === "string", `${label}-receipt-path`);
  const path = resolveWorkspacePath(receipt.path, label);
  const observed = await fileReceipt(path);
  assert(receipt.bytes === observed.bytes && receipt.sha256 === observed.sha256, `${label}-receipt-drift`);
}
function currentIdentity(source, manifest, standalone, lite) {
  assert(source.version === "v593-source-manifest-v1" && source.status === "complete", "v593-lifecycle-source-contract");
  assert(manifest.route === "/local-shadow-v593" && manifest.formalProductPointer === "v263", "v593-lifecycle-manifest-boundary");
  assert(standalone.status === "passed" && standalone.deliveryTier === "standalone-full", "v593-lifecycle-standalone-contract");
  assert(lite.status === "passed" && lite.deliveryTier === "vercel-lite", "v593-lifecycle-lite-contract");
  assert(standalone.buildId === lite.buildId, "v593-lifecycle-shared-build-id");
  const deploymentId = `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
  assert(standalone.deploymentId === deploymentId && lite.deploymentId === deploymentId, "v593-lifecycle-deployment-identity");
  assert(
    standalone.candidateSourceManifestSha256 === source.receiptSha256
      && lite.candidateSourceManifestSha256 === source.receiptSha256,
    "v593-lifecycle-current-source-builds",
  );
  return {
    buildId: standalone.buildId,
    deploymentId,
    sourceManifestSha256: source.receiptSha256,
    candidateManifestSha256: manifest.manifestSha256,
    scientificPayloadSha256,
  };
}
function assertIdentity(actual, expected, label) {
  for (const key of Object.keys(expected)) {
    assert(actual?.[key] === expected[key], `${label}-identity:${key}`);
  }
}
function numericZero(value) {
  return Number.isFinite(value) && value === 0;
}
function assertRendererAndRegistryZero(detached) {
  const renderer = detached?.renderer;
  const registry = detached?.registry;
  for (const key of ["textures", "geometries", "programs", "renderTargets"]) {
    assert(numericZero(renderer?.[key]), `v593-same-realm-renderer-zero:${key}`);
  }
  for (const key of ["total", "workers", "renderTargets", "textures", "subscriptions", "typedArrays", "estimatedBytes"]) {
    assert(numericZero(registry?.[key]), `v593-same-realm-registry-zero:${key}`);
  }
}
function workerTargetIds(entries, label) {
  assert(Array.isArray(entries), `${label}-worker-targets-array`);
  const ids = entries.map((entry) => entry?.targetId);
  assert(ids.every((id) => typeof id === "string" && id.length > 0), `${label}-worker-target-id`);
  assert(new Set(ids).size === ids.length, `${label}-worker-target-id-unique`);
  return new Set(ids);
}
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function identityMismatches(actual, expected, label) {
  return Object.keys(expected)
    .filter((key) => actual?.[key] !== expected[key])
    .map((key) => `${label}-identity:${key}`);
}
function observedBoolean(value) {
  return typeof value === "boolean" ? value : "unknown";
}
function observedNumber(value) {
  return Number.isFinite(value) ? value : null;
}
function observedNumericSnapshot(snapshot, keys) {
  return Object.fromEntries(keys.map((key) => [key, observedNumber(snapshot?.[key])]));
}
function normalizedGateSnapshot(gates) {
  return Object.fromEntries(
    sameRealmGateNames.map((name) => [name, typeof gates?.[name] === "boolean" ? gates[name] : "unknown"]),
  );
}
function safeReceiptSha(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
async function verifyOptionalReceipt(receipt, label, errors) {
  if (receipt === undefined || receipt === null) {
    errors.push(`${label}-missing`);
    return false;
  }
  try {
    await verifyReferencedFileReceipt(receipt, label);
    return true;
  } catch (error) {
    errors.push(`${label}-invalid:${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
async function sameRealmSceneExit(batchPath, batch, expected, readError = null) {
  const errors = [];
  if (readError) errors.push(`v593-same-realm-stage-read:${readError}`);
  const rawBatch = isRecord(batch) ? batch : {};
  const rawStatus = typeof rawBatch.status === "string" ? rawBatch.status : "unknown";
  const envelopeClass = rawStatus === "staging-same-realm-scene-exit-passed-not-promoted"
    ? "passed"
    : rawStatus === "staging-same-realm-scene-exit-failed-not-promoted"
      ? "failed"
      : rawStatus.startsWith("runner-blocked") || rawStatus.includes("unavailable")
        ? "blocked"
        : "unknown";
  const addError = (condition, reason) => {
    if (!condition && !errors.includes(reason)) errors.push(reason);
  };

  // Validate the envelope and all available receipts before deciding whether it can qualify.
  addError(rawBatch.version === "v593-same-realm-scene-exit-stage-v1", "v593-same-realm-version");
  addError(envelopeClass !== "unknown", "v593-same-realm-status-unknown");
  addError(rawBatch.qualificationScope === "v593-current-shared-build-same-realm-scene-exit-staging", "v593-same-realm-scope");
  addError(rawBatch.protocolPreRegisteredBeforeBrowserRun === true, "v593-same-realm-protocol-registration");
  addError(rawBatch.syntheticZeroClaim === false, "v593-same-realm-synthetic-zero-claim");
  addError(rawBatch.promotion === "staging-only", "v593-same-realm-promotion-boundary");

  let sealAlgorithm = "unknown";
  let sealVerified = false;
  if (typeof rawBatch.receiptSha256 === "string" && rawBatch.receiptSha256.length > 0) {
    try {
      sealAlgorithm = verifyRunnerReceipt(rawBatch, "v593-same-realm");
      sealVerified = true;
    } catch (error) {
      errors.push(`v593-same-realm-receipt-seal:${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    errors.push("v593-same-realm-receipt-seal-missing");
  }
  const runnerReceiptVerified = await verifyOptionalReceipt(rawBatch.runnerReceipt, "v593-same-realm-runner", errors);
  let codeReceiptsVerified = false;
  if (isRecord(rawBatch.codeReceipts)) {
    const codeNames = Object.keys(rawBatch.codeReceipts).sort();
    addError(codeNames.length > 0, "v593-same-realm-code-receipts-empty");
    if (envelopeClass === "passed") {
      addError(sameJson(codeNames, ["baseline", "bootstrap", "detached", "discovery", "exited", "mounted"]), "v593-same-realm-code-receipt-schema");
    }
    const codeResults = await Promise.all(
      Object.entries(rawBatch.codeReceipts).map(([name, receipt]) =>
        verifyOptionalReceipt(receipt, `v593-same-realm-code-${name}`, errors)),
    );
    codeReceiptsVerified = codeResults.length > 0 && codeResults.every(Boolean);
  } else {
    errors.push("v593-same-realm-code-receipts-missing");
  }

  for (const [name, snapshot] of [["before", rawBatch.sourceIdentityBefore], ["after", rawBatch.sourceIdentityAfter]]) {
    if (!isRecord(snapshot)) {
      errors.push(`v593-same-realm-${name}-identity-missing`);
      continue;
    }
    errors.push(...identityMismatches(snapshot.expected, expected, `v593-same-realm-${name}`));
    addError(snapshot.sharedBuildIdentity === true, `v593-same-realm-${name}-shared-build`);
    addError(snapshot.formalProductPointer === "v263", `v593-same-realm-${name}-formal-product-pointer`);
    addError(
      snapshot.sourceManifestDriftCount === 0 && sameJson(snapshot.sourceManifestDrifts, []),
      `v593-same-realm-${name}-source-drift`,
    );
  }
  if (isRecord(rawBatch.sourceIdentityBefore) && isRecord(rawBatch.sourceIdentityAfter)) {
    addError(
      sameJson(rawBatch.sourceIdentityBefore.expected, rawBatch.sourceIdentityAfter.expected),
      "v593-same-realm-identity-drift",
    );
  }
  if (rawBatch.sourceIdentityStable !== undefined) {
    addError(rawBatch.sourceIdentityStable === true, "v593-same-realm-source-identity-stability");
  }

  const analysis = isRecord(rawBatch.analysis) ? rawBatch.analysis : null;
  const rawGates = isRecord(analysis?.gates) ? analysis.gates : null;
  const gates = normalizedGateSnapshot(rawGates);
  const gateKeysValid = rawGates !== null
    && sameJson(Object.keys(rawGates).sort(), [...sameRealmGateNames].sort());
  const explicitGateFailure = analysis?.status === "failed"
    || (Array.isArray(analysis?.failedGates) && analysis.failedGates.length > 0)
    || Object.values(gates).some((value) => value === false);
  if (envelopeClass === "passed") {
    addError(analysis?.status === "passed", "v593-same-realm-analysis-status");
    addError(Array.isArray(analysis?.failedGates) && sameJson(analysis.failedGates, []), "v593-same-realm-analysis-failed-gates");
    addError(gateKeysValid, "v593-same-realm-gate-schema");
    addError(rawGates !== null && Object.values(rawGates).every((value) => value === true), "v593-same-realm-gates");
  }

  const phases = isRecord(rawBatch.phases) ? rawBatch.phases : {};
  const baselinePhase = isRecord(phases.baseline) ? phases.baseline : {};
  const mountedPhase = isRecord(phases.mounted) ? phases.mounted : {};
  const detachedPhase = isRecord(phases.detached) ? phases.detached : {};
  const exitedPhase = isRecord(phases.exited) ? phases.exited : {};
  const baselineSource = isRecord(baselinePhase.source) ? baselinePhase.source : {};
  const detachedSource = isRecord(detachedPhase.source) ? detachedPhase.source : {};
  const exitedSource = isRecord(exitedPhase.source) ? exitedPhase.source : {};
  const baselineHarness = isRecord(baselineSource.harness) ? baselineSource.harness : null;
  const mountedHarness = isRecord(mountedPhase.source?.harness) ? mountedPhase.source.harness : null;
  const detachedHarness = isRecord(detachedSource.harness) ? detachedSource.harness : null;
  const exitedHarness = isRecord(exitedSource.harness) ? exitedSource.harness : null;
  const rendererAfterDetach = detachedSource.sourceLedger?.snapshots?.detached?.renderer;
  const registryAfterDetach = detachedSource.sourceLedger?.snapshots?.detached?.registry;
  const sceneTargetIds = Array.isArray(analysis?.sceneTargetIds) ? analysis.sceneTargetIds : null;
  const workerTargets = isRecord(analysis?.workerTargets) ? analysis.workerTargets : null;

  if (envelopeClass === "passed" && errors.length === 0) {
    const strictErrors = [];
    const strictAdd = (condition, reason) => {
      if (!condition) strictErrors.push(reason);
    };
    strictAdd(["baseline", "mounted", "detached", "exited"].every((name) => isRecord(phases[name])), "v593-same-realm-phases");
    let baselineTargets = null;
    let mountedTargets = null;
    let detachedTargets = null;
    let exitedTargets = null;
    try {
      baselineTargets = workerTargetIds(analysis?.workerTargets?.baseline, "v593-same-realm-baseline");
      mountedTargets = workerTargetIds(analysis?.workerTargets?.mounted, "v593-same-realm-mounted");
      detachedTargets = workerTargetIds(analysis?.workerTargets?.detached, "v593-same-realm-detached");
      exitedTargets = workerTargetIds(analysis?.workerTargets?.exited, "v593-same-realm-exited");
    } catch (error) {
      strictErrors.push(error instanceof Error ? error.message : String(error));
    }
    strictAdd(
      Array.isArray(sceneTargetIds)
        && sceneTargetIds.length > 0
        && sceneTargetIds.every((id) => typeof id === "string" && id.length > 0)
        && new Set(sceneTargetIds).size === sceneTargetIds.length,
      "v593-same-realm-scene-target-schema",
    );
    if (baselineTargets && mountedTargets && detachedTargets && exitedTargets && Array.isArray(sceneTargetIds)) {
      for (const id of sceneTargetIds) {
        strictAdd(mountedTargets.has(id) && !baselineTargets.has(id), `v593-same-realm-scene-target-ownership:${id}`);
        strictAdd(!detachedTargets.has(id) && !exitedTargets.has(id), `v593-same-realm-scene-target-release:${id}`);
      }
    }
    try {
      assertRendererAndRegistryZero(detachedSource.sourceLedger?.snapshots?.detached);
    } catch (error) {
      strictErrors.push(error instanceof Error ? error.message : String(error));
    }
    const listenerValues = [baselineHarness, mountedHarness, detachedHarness, exitedHarness]
      .map((harness) => harness?.listenerCount);
    const rawListenerValues = [baselineHarness, mountedHarness, detachedHarness, exitedHarness]
      .map((harness) => harness?.rawRegisteredListenerCount);
    const inactiveTargetListenerValues = [baselineHarness, mountedHarness, detachedHarness, exitedHarness]
      .map((harness) => harness?.inactiveTargetListenerCount);
    strictAdd(listenerValues.every(Number.isFinite), "v593-same-realm-listener-values");
    strictAdd(rawListenerValues.every(Number.isFinite) && inactiveTargetListenerValues.every(Number.isFinite), "v593-same-realm-listener-accounting-values");
    strictAdd(rawListenerValues.every((value, index) => value === listenerValues[index] + inactiveTargetListenerValues[index]), "v593-same-realm-listener-accounting-balance");
    strictAdd(listenerValues[2] <= listenerValues[0] && listenerValues[3] <= listenerValues[0], "v593-same-realm-listener-baseline");
    const exit = exitedSource.sourceLedger?.exit;
    strictAdd(
      exit?.renderListsDisposed === true
        && exit?.contextLost === true
        && exit?.canvasDetached === true
        && exit?.routeAfter === "/downloads"
        && exitedHarness?.webgl?.liveContextCount === 0,
      "v593-same-realm-r3f-cleanup",
    );
    strictAdd(exitedSource.pathname === "/downloads", "v593-same-realm-exit-route");
    if (strictErrors.length === 0) {
      const evidence = await fileReceipt(batchPath);
      return {
        status: "passed-same-realm-resource-zero",
        evidence,
        receiptSha256: rawBatch.receiptSha256,
        receiptSealAlgorithm: sealAlgorithm,
        receiptVerified: true,
        gates: rawGates,
        allGatesPassed: true,
        workerOwnership: {
          sceneCreatedTargetIds: sceneTargetIds,
          targetCounts: {
            baseline: baselineTargets.size,
            mounted: mountedTargets.size,
            detached: detachedTargets.size,
            exited: exitedTargets.size,
          },
          targets: analysis.workerTargets,
          sceneTargetsReleased: true,
          ledgerReturnedToBaseline: true,
        },
        listenerBaselineDelta: {
          baseline: listenerValues[0],
          mounted: listenerValues[1],
          detached: listenerValues[2],
          exited: listenerValues[3],
          detachedDelta: listenerValues[2] - listenerValues[0],
          exitedDelta: listenerValues[3] - listenerValues[0],
          returnedToBaseline: true,
          rawRegistered: {
            baseline: baselineHarness.rawRegisteredListenerCount,
            mounted: mountedHarness.rawRegisteredListenerCount,
            detached: detachedHarness.rawRegisteredListenerCount,
            exited: exitedHarness.rawRegisteredListenerCount,
          },
          inactiveTargets: {
            baseline: baselineHarness.inactiveTargetListenerCount,
            mounted: mountedHarness.inactiveTargetListenerCount,
            detached: detachedHarness.inactiveTargetListenerCount,
            exited: exitedHarness.inactiveTargetListenerCount,
          },
        },
        r3fCleanup: {
          renderListsDisposed: true,
          contextLost: true,
          canvasDetached: true,
          liveContextCountAfterExit: 0,
          cleanupObserved: true,
        },
        realm: {
          harnessRealmToken: baselineHarness.realmToken,
          sourceRealmToken: baselineSource.sourceLedger?.realmToken,
          timeOrigin: baselineHarness.timeOrigin,
          sourceTimeOrigin: baselineSource.sourceLedger?.timeOrigin,
          routeAfter: "/downloads",
          stable: true,
        },
        rendererAfterDetach: detachedSource.sourceLedger.snapshots.detached.renderer,
        registryAfterDetach: detachedSource.sourceLedger.snapshots.detached.registry,
        syntheticZeroClaim: false,
      };
    }
    errors.push(...strictErrors);
  }

  const listenerValues = [baselineHarness, mountedHarness, detachedHarness, exitedHarness]
    .map((harness) => observedNumber(harness?.listenerCount));
  const detachedDelta = Number.isFinite(listenerValues[0]) && Number.isFinite(listenerValues[2])
    ? listenerValues[2] - listenerValues[0]
    : null;
  const exitedDelta = Number.isFinite(listenerValues[0]) && Number.isFinite(listenerValues[3])
    ? listenerValues[3] - listenerValues[0]
    : null;
  const listenerReturned = typeof gates.listenerLedgerReturnedToBaseline === "boolean"
    ? gates.listenerLedgerReturnedToBaseline
    : listenerValues.every(Number.isFinite)
      ? listenerValues[2] <= listenerValues[0] && listenerValues[3] <= listenerValues[0]
      : "unknown";
  const phaseTargets = {
    baseline: Array.isArray(workerTargets?.baseline) ? workerTargets.baseline : null,
    mounted: Array.isArray(workerTargets?.mounted) ? workerTargets.mounted : null,
    detached: Array.isArray(workerTargets?.detached) ? workerTargets.detached : null,
    exited: Array.isArray(workerTargets?.exited) ? workerTargets.exited : null,
  };
  const targetSetsAvailable = Object.values(phaseTargets).every(Array.isArray)
    && Array.isArray(sceneTargetIds);
  const sceneReleased = typeof gates.sceneWorkerTargetsReleased === "boolean"
    ? gates.sceneWorkerTargetsReleased
    : targetSetsAvailable
      ? sceneTargetIds.every((id) => phaseTargets.mounted.some((entry) => entry?.targetId === id)
        && !phaseTargets.baseline.some((entry) => entry?.targetId === id)
        && !phaseTargets.detached.some((entry) => entry?.targetId === id)
        && !phaseTargets.exited.some((entry) => entry?.targetId === id))
      : "unknown";
  const ledgerReturned = typeof gates.workerLedgerReturnedToBaseline === "boolean"
    ? gates.workerLedgerReturnedToBaseline
    : targetSetsAvailable
      ? phaseTargets.detached.length === phaseTargets.baseline.length
        && phaseTargets.exited.length === phaseTargets.baseline.length
      : "unknown";
  const exit = exitedSource.sourceLedger?.exit;
  const cleanupFields = ["renderListsDisposed", "contextLost", "canvasDetached"]
    .map((key) => observedBoolean(exit?.[key]));
  const liveContextCount = observedNumber(exitedHarness?.webgl?.liveContextCount);
  const cleanupObserved = cleanupFields.every((value) => typeof value === "boolean") && Number.isFinite(liveContextCount)
    ? cleanupFields.every((value) => value === true) && liveContextCount === 0
    : "unknown";
  const realmValues = {
    harnessRealmToken: typeof baselineHarness?.realmToken === "string" ? baselineHarness.realmToken : null,
    sourceRealmToken: typeof baselineSource.sourceLedger?.realmToken === "string" ? baselineSource.sourceLedger.realmToken : null,
    timeOrigin: observedNumber(baselineHarness?.timeOrigin),
    sourceTimeOrigin: observedNumber(baselineSource.sourceLedger?.timeOrigin),
    routeAfter: typeof exitedSource.pathname === "string" ? exitedSource.pathname : null,
  };
  const realmStable = typeof gates.harnessRealmStable === "boolean"
    && typeof gates.sourceRealmStable === "boolean"
    && typeof gates.harnessTimeOriginStable === "boolean"
    && typeof gates.sourceTimeOriginStable === "boolean"
    ? gates.harnessRealmStable && gates.sourceRealmStable && gates.harnessTimeOriginStable && gates.sourceTimeOriginStable
    : "unknown";
  const rendererKeys = ["textures", "geometries", "programs", "renderTargets"];
  const registryKeys = ["total", "workers", "renderTargets", "textures", "subscriptions", "typedArrays", "estimatedBytes"];
  const rendererValues = observedNumericSnapshot(rendererAfterDetach, rendererKeys);
  const registryValues = observedNumericSnapshot(registryAfterDetach, registryKeys);
  const rendererUnknown = Object.values(rendererValues).some((value) => value === null);
  const registryUnknown = Object.values(registryValues).some((value) => value === null);
  const evidence = await safeEvidenceReceipt(batchPath);
  return {
    status: envelopeClass === "failed"
      ? "blocked-same-realm-scene-exit-failed"
      : "blocked-same-realm-scene-exit-unavailable",
    evidence,
    receiptSha256: safeReceiptSha(rawBatch.receiptSha256),
    receiptSealAlgorithm: sealAlgorithm,
    receiptVerified: sealVerified && runnerReceiptVerified && codeReceiptsVerified,
    gates,
    allGatesPassed: explicitGateFailure ? false : "unknown",
    workerOwnership: {
      sceneCreatedTargetIds: sceneTargetIds,
      targetCounts: {
        baseline: Array.isArray(phaseTargets.baseline) ? phaseTargets.baseline.length : null,
        mounted: Array.isArray(phaseTargets.mounted) ? phaseTargets.mounted.length : null,
        detached: Array.isArray(phaseTargets.detached) ? phaseTargets.detached.length : null,
        exited: Array.isArray(phaseTargets.exited) ? phaseTargets.exited.length : null,
      },
      targets: workerTargets,
      sceneTargetsReleased: sceneReleased,
      ledgerReturnedToBaseline: ledgerReturned,
      unknown: true,
    },
    listenerBaselineDelta: {
      baseline: listenerValues[0],
      mounted: listenerValues[1],
      detached: listenerValues[2],
      exited: listenerValues[3],
      detachedDelta,
      exitedDelta,
      returnedToBaseline: listenerReturned,
      rawRegistered: {
        baseline: observedNumber(baselineHarness?.rawRegisteredListenerCount),
        mounted: observedNumber(mountedHarness?.rawRegisteredListenerCount),
        detached: observedNumber(detachedHarness?.rawRegisteredListenerCount),
        exited: observedNumber(exitedHarness?.rawRegisteredListenerCount),
      },
      inactiveTargets: {
        baseline: observedNumber(baselineHarness?.inactiveTargetListenerCount),
        mounted: observedNumber(mountedHarness?.inactiveTargetListenerCount),
        detached: observedNumber(detachedHarness?.inactiveTargetListenerCount),
        exited: observedNumber(exitedHarness?.inactiveTargetListenerCount),
      },
    },
    r3fCleanup: {
      renderListsDisposed: cleanupFields[0],
      contextLost: cleanupFields[1],
      canvasDetached: cleanupFields[2],
      liveContextCountAfterExit: liveContextCount,
      cleanupObserved,
    },
    realm: {
      ...realmValues,
      stable: realmStable,
    },
    rendererAfterDetach: rendererValues,
    registryAfterDetach: registryValues,
    syntheticZeroClaim: false,
    blockedReason: {
      kind: "same-realm-scene-exit-unavailable",
      analysisStatus: typeof analysis?.status === "string" ? analysis.status : "unknown",
      rendererTelemetry: rendererUnknown ? "unknown" : "available",
      registryTelemetry: registryUnknown ? "unknown" : "available",
      validationErrors: errors,
    },
  };
}
async function mountCycles(batchPath, batch, expected) {
  assert(batch.version === "v593-lifecycle-browser-stage-v1", "v593-lifecycle-stage-version");
  assert(batch.status === "staging-lifecycle-audit-passed-exit-and-heap-runner-blocked-unknown-not-promoted", "v593-lifecycle-stage-status");
  assert(batch.lifecycleAudit?.version === "v593-lifecycle-stage-audit-v1", "v593-lifecycle-audit-version");
  assert(batch.lifecycleAudit?.status?.startsWith("passed-mount-cycle-stability-"), "v593-lifecycle-audit-status");
  assert(batch.capturePolicy?.currentSharedBuildOnly === true && batch.capturePolicy?.noHistoricalSubstitution === true, "v593-lifecycle-current-build-policy");
  assert(batch.capturePolicy?.matchingMountCyclesPerBody === 2 && batch.capturePolicy?.bodyCount === 16, "v593-lifecycle-capture-count-policy");
  assert(batch.capturePolicy?.rendererExitSyntheticZeroClaim === false && batch.capturePolicy?.jsHeapSyntheticPassClaim === false, "v593-lifecycle-synthetic-policy");
  assert(batch.capturePolicy?.promotion === "staging-only", "v593-lifecycle-stage-promotion");
  assert(batch.sceneExitAudit?.syntheticZeroClaim === false && batch.jsHeapAudit?.syntheticPassClaim === false, "v593-lifecycle-legacy-audit-boundary");
  assertIdentity(batch.identity, expected, "v593-lifecycle-stage");
  assert(batch.identity?.deploymentId && typeof batch.identity.deploymentId === "string", "v593-lifecycle-deployment-id");
  assert(batch.expectedBodyCount === 16 && Array.isArray(batch.bodies) && batch.bodies.length === 16, "v593-lifecycle-body-count");
  assert(Array.isArray(batch.failures) && batch.failures.length === 0, "v593-lifecycle-failures");
  assert(batch.console?.status === "passed-zero-warning-error" && batch.console?.count === 0 && sameJson(batch.console?.entries, []), "v593-lifecycle-console");
  const audit = batch.lifecycleAudit;
  assert(
    audit.bodyCount === 16
      && audit.admittedMountCycleCount === 32
      && audit.checkpointCount === 16
      && audit.scientificPayloadUniqueCount === 1
      && audit.buildIdUniqueCount === 1
      && audit.sourceManifestUniqueCount === 1
      && audit.candidateManifestUniqueCount === 1
      && audit.deploymentIdUniqueCount === 1
      && audit.syntheticExitZeroClaim === false
      && audit.syntheticHeapPassClaim === false
      && audit.consoleCount === 0,
    "v593-lifecycle-audit-summary",
  );
  for (const [tier, expectedTier] of [["standalone", "standalone-full"], ["lite", "vercel-lite"]]) {
    const buildReceipt = batch.buildEvidence?.[tier];
    assert(buildReceipt?.deliveryTier === expectedTier, `v593-lifecycle-build-tier:${tier}`);
    assert(
      buildReceipt?.buildId === expected.buildId
        && buildReceipt?.deploymentId === expected.deploymentId
        && buildReceipt?.sourceManifestSha256 === expected.sourceManifestSha256,
      `v593-lifecycle-build-identity:${tier}`,
    );
    await verifyReferencedFileReceipt(buildReceipt, `v593-lifecycle-build-${tier}`);
  }
  const bodies = new Set();
  const rows = batch.bodies.map((bodyEntry, bodyIndex) => {
    assert(bodyEntry.index === bodyIndex && typeof bodyEntry.body === "string", `v593-lifecycle-body-index:${bodyIndex}`);
    assert(!bodies.has(bodyEntry.body), `v593-lifecycle-body-duplicate:${bodyEntry.body}`);
    bodies.add(bodyEntry.body);
    assert(bodyEntry.body === expectedHeroBodies[bodyIndex], `v593-lifecycle-body-order:${bodyEntry.body}`);
    assert(bodyEntry.status === "passed-two-matching-current-build-mount-cycles", `v593-lifecycle-body-status:${bodyEntry.body}`);
    for (const key of ["receiptStable", "gpuStable", "resourceStable", "programsStable", "texturesStable", "geometriesStable", "payloadStable", "writebackFalse"]) {
      assert(bodyEntry[key] === true, `v593-lifecycle-body-stability:${bodyEntry.body}:${key}`);
    }
    assert(Array.isArray(bodyEntry.admittedCycles) && bodyEntry.admittedCycles.length === 2, `v593-lifecycle-body-cycles:${bodyEntry.body}`);
    const cycles = bodyEntry.admittedCycles.map((cycle, cycleIndex) => {
      assert(cycle.body === bodyEntry.body && cycle.cycle === cycleIndex, `v593-lifecycle-cycle-index:${bodyEntry.body}:${cycleIndex}`);
      assertIdentity(cycle, expected, `v593-lifecycle-cycle:${bodyEntry.body}:${cycleIndex}`);
      assert(cycle.deploymentId === batch.identity.deploymentId, `v593-lifecycle-cycle-deployment:${bodyEntry.body}:${cycleIndex}`);
      const state = cycle.state;
      assert(
        state?.focusId === bodyEntry.body
          && state?.heroBody === bodyEntry.body
          && state?.heroAdmission === "admitted"
          && state?.heroProceduralFallback === "false"
          && state?.payload === scientificPayloadSha256
          && state?.payloadStable === "true"
          && state?.writeback === "false"
          && state?.productionPromotion === "false"
          && state?.formalProductPointer === "v263"
          && state?.manifest === expected.candidateManifestSha256
          && state?.singleCanvas === "true"
          && state?.canvasActualCount === 1
          && state?.canvasReady === "true"
          && state?.prewarm === "ready"
          && state?.assetManifestState === "verified-v590-readonly"
          && typeof state?.heroTextureReceipt === "string"
          && state.heroTextureReceipt.length > 0,
        `v593-lifecycle-cycle-boundary:${bodyEntry.body}:${cycleIndex}`,
      );
      assert(
        Number.isFinite(state.reportedFpsMedian)
          && state.reportedFpsMedian >= minimumHeroMedianFps
          && state.reportedFpsSamples >= 120
          && Number.isFinite(state.gpuBytes)
          && state.gpuBytes > 0
          && state.gpuBytes <= maximumDesktopGpuBytes
          && Number.isFinite(state.resourceBytes)
          && state.resourceBytes > 0
          && Number.isFinite(state.drawCalls)
          && state.drawCalls <= maximumHeroDrawCalls,
        `v593-lifecycle-cycle-performance:${bodyEntry.body}:${cycleIndex}`,
      );
      return {
        cycle: cycleIndex,
        capturedAt: cycle.capturedAt,
        fingerprint: cycle.fingerprint,
        buildId: cycle.buildId,
        deploymentId: cycle.deploymentId,
        sourceManifestSha256: cycle.sourceManifestSha256,
        candidateManifestSha256: cycle.candidateManifestSha256,
        scientificPayloadSha256: cycle.scientificPayloadSha256,
        fpsMedian: state.reportedFpsMedian,
        fpsMinimum: state.reportedFpsMinimum,
        fpsSampleCount: state.reportedFpsSamples,
        gpuBytes: state.gpuBytes,
        resourceBytes: state.resourceBytes,
        programs: state.programs,
        textures: state.textures,
        geometries: state.geometries,
        drawCalls: state.drawCalls,
        textureReceipt: state.heroTextureReceipt,
        scientificWriteback: false,
      };
    });
    assert(cycles[0].fingerprint === cycles[1].fingerprint, `v593-lifecycle-cycle-fingerprint:${bodyEntry.body}`);
    assert(bodyEntry.matchingFingerprint === cycles[0].fingerprint, `v593-lifecycle-matching-fingerprint:${bodyEntry.body}`);
    return {
      body: bodyEntry.body,
      status: bodyEntry.status,
      admittedCycles: cycles,
      discardedNonmatchingMountCount: bodyEntry.discardedNonmatchingMounts?.length ?? 0,
      receiptStable: true,
      gpuStable: true,
      resourceStable: true,
      programsStable: true,
      texturesStable: true,
      geometriesStable: true,
      payloadStable: true,
      writebackFalse: true,
    };
  });
  const evidence = await fileReceipt(batchPath);
  return {
    status: "passed-current-identity-16-hero-32-mount-cycles",
    evidence,
    heroCount: 16,
    admittedCount: 16,
    blockedCount: 0,
    admittedMountCycleCount: 32,
    admittedBodies: [...bodies],
    blockedBodies: [],
    sustainedGrowth: false,
    minimumMedianFps: audit.minimumMedianFps,
    maximumGpuBytes: audit.maximumGpuBytes,
    maximumResourceBytes: audit.maximumResourceBytes,
    maximumPrograms: audit.maximumPrograms,
    maximumTextures: audit.maximumTextures,
    maximumGeometries: audit.maximumGeometries,
    rows,
    separationPolicy: "mount-cycle-stability-only-scene-exit-authority-is-sameRealmSceneExit",
  };
}
async function mountCyclesOrBlocked(batchPath, document, expected, readError = null) {
  const batch = isRecord(document) ? document : {};
  try {
    if (readError) throw new Error(readError);
    return await mountCycles(batchPath, batch, expected);
  } catch (error) {
    const bodies = Array.isArray(batch.bodies) ? batch.bodies : null;
    const admittedBodies = bodies
      ? bodies
          .filter((entry) => entry?.status === "passed-two-matching-current-build-mount-cycles")
          .map((entry) => entry?.body)
          .filter((body) => typeof body === "string")
      : null;
    return {
      status: batch.status?.includes("failed")
        ? "blocked-current-identity-hero-mount-cycles-failed"
        : "blocked-current-identity-hero-mount-cycles-unavailable",
      evidence: await safeEvidenceReceipt(batchPath),
      heroCount: bodies ? bodies.length : null,
      admittedCount: admittedBodies ? admittedBodies.length : null,
      blockedCount: bodies && admittedBodies ? bodies.length - admittedBodies.length : null,
      admittedMountCycleCount: observedNumber(batch.lifecycleAudit?.admittedMountCycleCount),
      admittedBodies,
      blockedBodies: bodies
        ? bodies
            .filter((entry) => entry?.status !== "passed-two-matching-current-build-mount-cycles")
            .map((entry) => entry?.body)
            .filter((body) => typeof body === "string")
        : null,
      sustainedGrowth: "unknown",
      minimumMedianFps: observedNumber(batch.lifecycleAudit?.minimumMedianFps),
      maximumGpuBytes: observedNumber(batch.lifecycleAudit?.maximumGpuBytes),
      maximumResourceBytes: observedNumber(batch.lifecycleAudit?.maximumResourceBytes),
      maximumPrograms: observedNumber(batch.lifecycleAudit?.maximumPrograms),
      maximumTextures: observedNumber(batch.lifecycleAudit?.maximumTextures),
      maximumGeometries: observedNumber(batch.lifecycleAudit?.maximumGeometries),
      rows: null,
      separationPolicy: "mount-cycle-stability-only-scene-exit-authority-is-sameRealmSceneExit",
      blockedReason: {
        kind: "mount-cycle-evidence-unavailable-or-invalid",
        runnerStatus: typeof batch.status === "string" ? batch.status : "unknown",
        validationError: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
async function atomicWriteJson(path, value) {
  const partial = `${path}.${process.pid}.part`;
  await rm(partial, { force: true });
  await writeFile(partial, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await rename(partial, path);
}

const args = parseArgs(process.argv.slice(2));
const source = await readCanonicalReceipt(sourcePath, "receiptSha256", "v593-lifecycle-source");
const manifest = await readCanonicalReceipt(manifestPath, "manifestSha256", "v593-lifecycle-manifest");
await verifySourceManifestFiles(source, "v593-lifecycle-source");
const { value: standalone } = await readJsonWithBytes(standalonePath, "v593-lifecycle-standalone");
const { value: lite } = await readJsonWithBytes(litePath, "v593-lifecycle-lite");
const expected = currentIdentity(source, manifest, standalone, lite);
const lifecycleStage = await readStageJson(args.lifecycleBatch, "v593-lifecycle-stage");
const sameRealmStage = await readStageJson(args.sameRealmBatch, "v593-same-realm-stage");
const lifecycleBatch = lifecycleStage.value;
const sameRealmBatch = sameRealmStage.value;
const mountCyclesReceipt = await mountCyclesOrBlocked(args.lifecycleBatch, lifecycleBatch, expected, lifecycleStage.error);
const sameRealmReceipt = await sameRealmSceneExit(args.sameRealmBatch, sameRealmBatch, expected, sameRealmStage.error);
const completionTimes = [sameRealmBatch?.completedAt, lifecycleBatch?.completedAt]
  .filter((value) => typeof value === "string" && Number.isFinite(Date.parse(value)))
  .sort();
const mountCyclesPassed = mountCyclesReceipt.status === "passed-current-identity-16-hero-32-mount-cycles";
const sameRealmPassed = sameRealmReceipt.status === "passed-same-realm-resource-zero";
const lifecyclePassed = mountCyclesPassed && sameRealmPassed;
const unsigned = {
  version: "v593-resource-lifecycle-v2",
  generatedAt: completionTimes.at(-1) ?? null,
  status: lifecyclePassed
    ? "passed-current-identity-16-hero-mount-cycles-and-same-realm-scene-exit"
    : "blocked-current-identity-16-hero-mount-cycles-and-same-realm-scene-exit",
  candidate: {
    route: manifest.route,
    buildId: expected.buildId,
    deploymentId: expected.deploymentId,
    sourceManifestSha256: expected.sourceManifestSha256,
    manifestSha256: expected.candidateManifestSha256,
    scientificPayloadSha256,
  },
  mountCycles: mountCyclesReceipt,
  sameRealmSceneExit: sameRealmReceipt,
  console: mountCyclesPassed
    ? { count: 0, entries: [] }
    : {
        count: observedNumber(lifecycleBatch.console?.count),
        entries: Array.isArray(lifecycleBatch.console?.entries) ? lifecycleBatch.console.entries : null,
      },
  authority: {
    scientificPayloadSha256,
    scientificPayloadWriteback: mountCyclesPassed ? false : "unknown",
    scientificAuthorityChanged: mountCyclesPassed ? false : "unknown",
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    radiativeTransferGranted: false,
    productionReleaseAuthorized: false,
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
await atomicWriteJson(args.output, receipt);
console.log(JSON.stringify({
  status: receipt.status,
  buildId: receipt.candidate.buildId,
  sourceManifestSha256: receipt.candidate.sourceManifestSha256,
  manifestSha256: receipt.candidate.manifestSha256,
  heroCount: receipt.mountCycles.heroCount,
  admittedMountCycleCount: receipt.mountCycles.admittedMountCycleCount,
  sameRealmSceneExitStatus: receipt.sameRealmSceneExit.status,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
