import { createHash } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const defaultOutputPath = resolve(root, "docs/release/v593/soak-v593.json");
const sourcePath = resolve(root, "docs/release/v593/source-manifest-v593.json");
const manifestPath = resolve(root, "public/data/final-art-direction-v593/manifest.json");
const standalonePath = resolve(root, "dist/release/atlas-v593-standalone-build-resource.json");
const litePath = resolve(root, "dist/release/atlas-v593-lite-build-resource.json");
const scientificPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const minimumSampleCount = 181;
const minimumSampleSpanMilliseconds = 1_800_000;
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
const cdpHeapGateNames = Object.freeze([
  "exactSampleCount",
  "minimumSampleSpan",
  "heapTelemetryComplete",
  "finalHeapWithinAllowance",
  "lastTenOlsWithinLimit",
  "rendererResourceExactStable",
  "identityStable",
  "sourceManifestStable",
  "fpsGate",
  "gpuGate",
  "drawCallGate",
  "pageAuditZero",
  "cliConsoleZero",
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
function nearlyEqual(left, right, tolerance = 1e-6) {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= tolerance;
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
    cdpHeapBatch: process.env.V593_CDP_HEAP_BATCH ?? null,
    sameRealmBatch: process.env.V593_SAME_REALM_BATCH ?? null,
    output: process.env.V593_SOAK_OUTPUT ?? defaultOutputPath,
  };
  const options = new Map([
    ["--cdp-heap-batch", "cdpHeapBatch"],
    ["--same-realm-batch", "sameRealmBatch"],
    ["--output", "output"],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    assert(options.has(option), `v593-soak-unknown-option:${option}`);
    const value = argv[index + 1];
    assert(value && !value.startsWith("--"), `v593-soak-option-value:${option}`);
    values[options.get(option)] = value;
    index += 1;
  }
  assert(values.cdpHeapBatch, "v593-cdp-heap-batch-required:--cdp-heap-batch-or-V593_CDP_HEAP_BATCH");
  assert(values.sameRealmBatch, "v593-same-realm-batch-required:--same-realm-batch-or-V593_SAME_REALM_BATCH");
  return {
    cdpHeapBatch: resolveWorkspacePath(values.cdpHeapBatch, "v593-cdp-heap-batch"),
    sameRealmBatch: resolveWorkspacePath(values.sameRealmBatch, "v593-same-realm-batch"),
    output: resolveWorkspacePath(values.output, "v593-soak-output"),
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
  assert(source.version === "v593-source-manifest-v1" && source.status === "complete", "v593-soak-source-contract");
  assert(manifest.route === "/local-shadow-v593" && manifest.formalProductPointer === "v263", "v593-soak-manifest-boundary");
  assert(standalone.status === "passed" && standalone.deliveryTier === "standalone-full", "v593-soak-standalone-contract");
  assert(lite.status === "passed" && lite.deliveryTier === "vercel-lite", "v593-soak-lite-contract");
  assert(standalone.buildId === lite.buildId, "v593-soak-shared-build-id");
  const deploymentId = `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
  assert(standalone.deploymentId === deploymentId && lite.deploymentId === deploymentId, "v593-soak-deployment-identity");
  assert(
    standalone.candidateSourceManifestSha256 === source.receiptSha256
      && lite.candidateSourceManifestSha256 === source.receiptSha256,
    "v593-soak-current-source-builds",
  );
  return {
    buildId: standalone.buildId,
    deploymentId,
    sourceManifestSha256: source.receiptSha256,
    candidateManifestSha256: manifest.manifestSha256,
    scientificPayloadSha256,
  };
}
function numericZero(value) {
  return Number.isFinite(value) && value === 0;
}
function zeroSnapshotState(snapshot, keys) {
  return Object.fromEntries(keys.map((key) => [key, Number.isFinite(snapshot?.[key]) ? snapshot[key] : null]));
}
function classifyRunnerEnvelope(status, passedStatus, failedStatus) {
  if (status === passedStatus) return "passed";
  if (status === failedStatus) return "failed";
  if (
    typeof status === "string"
    && (status.includes("runner-blocked") || status.includes("unavailable"))
  ) {
    return "unavailable";
  }
  return "unknown";
}
function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}
function observedBoolean(value) {
  return typeof value === "boolean" ? value : "unknown";
}
function observedGate(gates, name) {
  return observedBoolean(gates?.[name]);
}
function observedDifference(left, right) {
  return Number.isFinite(left) && Number.isFinite(right) ? left - right : null;
}
function observedArrayLength(value) {
  return Array.isArray(value) ? value.length : null;
}
function observedSampleSpan(samples) {
  if (!Array.isArray(samples) || samples.length < 2) return null;
  const first = samples[0]?.capturedAtMs;
  const last = samples.at(-1)?.capturedAtMs;
  return Number.isFinite(first) && Number.isFinite(last) && last >= first ? last - first : null;
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
function safeReceiptSha(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
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
async function sameRealmSceneExit(batchPath, document, expected, readError = null) {
  const batch = isRecord(document) ? document : {};
  const errors = [];
  if (readError) errors.push(`v593-soak-same-realm-stage-read:${readError}`);
  const rawStatus = typeof batch.status === "string" ? batch.status : "unknown";
  const runnerDisposition = classifyRunnerEnvelope(
    rawStatus,
    "staging-same-realm-scene-exit-passed-not-promoted",
    "staging-same-realm-scene-exit-failed-not-promoted",
  );
  const addError = (condition, reason) => {
    if (!condition && !errors.includes(reason)) errors.push(reason);
  };
  addError(batch.version === "v593-same-realm-scene-exit-stage-v1", "v593-soak-same-realm-version");
  addError(runnerDisposition !== "unknown", "v593-soak-same-realm-status-unknown");
  addError(batch.qualificationScope === "v593-current-shared-build-same-realm-scene-exit-staging", "v593-soak-same-realm-scope");
  addError(batch.protocolPreRegisteredBeforeBrowserRun === true, "v593-soak-same-realm-protocol-registration");
  addError(batch.syntheticZeroClaim === false, "v593-soak-same-realm-synthetic-zero-boundary");
  if (runnerDisposition === "passed") {
    addError(batch.promotion === "staging-only", "v593-soak-same-realm-promotion-boundary");
  } else if (batch.promotion !== undefined) {
    addError(
      batch.promotion === "none-diagnostic-only" || batch.promotion === "none" || batch.promotion === "staging-only",
      "v593-soak-same-realm-blocked-promotion-boundary",
    );
  }

  let sealAlgorithm = "unknown";
  let sealVerified = false;
  if (typeof batch.receiptSha256 === "string" && batch.receiptSha256.length > 0) {
    try {
      sealAlgorithm = verifyRunnerReceipt(batch, "v593-soak-same-realm");
      sealVerified = true;
    } catch (error) {
      errors.push(`v593-soak-same-realm-receipt-seal:${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    errors.push("v593-soak-same-realm-receipt-seal-missing");
  }
  const runnerReceiptVerified = await verifyOptionalReceipt(batch.runnerReceipt, "v593-soak-same-realm-runner", errors);
  let codeReceiptNames = [];
  let codeReceiptsVerified = false;
  if (isRecord(batch.codeReceipts)) {
    codeReceiptNames = Object.keys(batch.codeReceipts);
    addError(codeReceiptNames.length > 0, "v593-soak-same-realm-code-receipts-empty");
    if (runnerDisposition === "passed") {
      addError(
        sameJson(codeReceiptNames.slice().sort(), ["baseline", "bootstrap", "detached", "discovery", "exited", "mounted"]),
        "v593-soak-same-realm-code-receipt-schema",
      );
    }
    const codeResults = await Promise.all(
      Object.entries(batch.codeReceipts).map(([name, receipt]) =>
        verifyOptionalReceipt(receipt, `v593-soak-same-realm-code-${name}`, errors)),
    );
    codeReceiptsVerified = codeResults.length > 0 && codeResults.every(Boolean);
  } else {
    errors.push("v593-soak-same-realm-code-receipts-missing");
  }
  for (const [name, snapshot] of [["before", batch.sourceIdentityBefore], ["after", batch.sourceIdentityAfter]]) {
    if (!isRecord(snapshot)) {
      errors.push(`v593-soak-same-realm-${name}-identity-missing`);
      continue;
    }
    errors.push(...identityMismatches(snapshot.expected, expected, `v593-soak-same-realm-${name}`));
    addError(snapshot.sharedBuildIdentity === true, `v593-soak-same-realm-${name}-shared-build`);
    addError(snapshot.formalProductPointer === "v263", `v593-soak-same-realm-${name}-formal-product-pointer`);
    addError(
      snapshot.sourceManifestDriftCount === 0 && sameJson(snapshot.sourceManifestDrifts, []),
      `v593-soak-same-realm-${name}-source-drift`,
    );
  }
  if (isRecord(batch.sourceIdentityBefore) && isRecord(batch.sourceIdentityAfter)) {
    addError(
      sameJson(batch.sourceIdentityBefore.expected, batch.sourceIdentityAfter.expected),
      "v593-soak-same-realm-identity-drift",
    );
  }
  if (batch.sourceIdentityStable !== undefined) {
    addError(batch.sourceIdentityStable === true, "v593-soak-same-realm-source-identity-stability");
  }
    const evidence = await safeEvidenceReceipt(batchPath);
  const phases = batch.phases;
  const phasesAvailable = Boolean(
    isRecord(phases) && ["baseline", "mounted", "detached", "exited"].every((name) => isRecord(phases[name])),
  );
  const baselineHarness = phases?.baseline?.source?.harness;
  const mountedHarness = phases?.mounted?.source?.harness;
  const detachedHarness = phases?.detached?.source?.harness;
  const exitedHarness = phases?.exited?.source?.harness;
  const rendererAfterDetach = phases?.detached?.source?.sourceLedger?.snapshots?.detached?.renderer;
  const registryAfterDetach = phases?.detached?.source?.sourceLedger?.snapshots?.detached?.registry;
  const rendererUnknown = ["textures", "geometries", "programs", "renderTargets"]
    .some((key) => !Number.isFinite(rendererAfterDetach?.[key]));
  const registryUnknown = ["total", "workers", "renderTargets", "textures", "subscriptions", "typedArrays", "estimatedBytes"]
    .some((key) => !Number.isFinite(registryAfterDetach?.[key]));
  const gates = batch.analysis?.gates;
  const gateSchemaAvailable = sameJson(Object.keys(gates ?? {}).sort(), [...sameRealmGateNames].sort());
  const analysisPassed = batch.analysis?.status === "passed"
    && sameJson(batch.analysis?.failedGates ?? [], [])
    && gateSchemaAvailable
    && Object.values(gates).every((value) => value === true);
  const receiptSchemaAvailable = runnerReceiptVerified
    && codeReceiptsVerified
    && sameJson(codeReceiptNames.sort(), ["baseline", "bootstrap", "detached", "discovery", "exited", "mounted"]);
  const identitySnapshotsAvailable = isRecord(batch.sourceIdentityBefore) && isRecord(batch.sourceIdentityAfter);
  const listenerEvidenceAvailable = [baselineHarness, mountedHarness, detachedHarness, exitedHarness]
    .every((harness) => Number.isFinite(harness?.listenerCount));
  const workerEvidenceAvailable = ["baseline", "mounted", "detached", "exited"]
    .every((name) => Array.isArray(batch.analysis?.workerTargets?.[name]));
  const exitEvidence = phases?.exited?.source?.sourceLedger?.exit;
  const cleanupEvidenceAvailable = typeof exitEvidence?.renderListsDisposed === "boolean"
    && typeof exitEvidence.contextLost === "boolean"
    && typeof exitEvidence.canvasDetached === "boolean"
    && Number.isFinite(exitedHarness?.webgl?.liveContextCount);
  const passEvidenceAvailable = runnerDisposition === "passed"
    && errors.length === 0
    && analysisPassed
    && phasesAvailable
    && !rendererUnknown
    && !registryUnknown
    && receiptSchemaAvailable
    && listenerEvidenceAvailable
    && workerEvidenceAvailable
    && Array.isArray(batch.analysis?.sceneTargetIds)
    && cleanupEvidenceAvailable
    && identitySnapshotsAvailable
    && sealVerified
    && errors.length === 0;

  if (!passEvidenceAvailable) {
    const listenerValues = [baselineHarness, mountedHarness, detachedHarness, exitedHarness]
      .map((harness) => finiteOrNull(harness?.listenerCount));
    const exit = phases?.exited?.source?.sourceLedger?.exit;
    const workerTargets = batch.analysis?.workerTargets ?? null;
    const normalizedGates = Object.fromEntries(
      sameRealmGateNames.map((name) => [name, typeof gates?.[name] === "boolean" ? gates[name] : "unknown"]),
    );
    const explicitGateFailure = batch.analysis?.status === "failed"
      || (Array.isArray(batch.analysis?.failedGates) && batch.analysis.failedGates.length > 0)
      || Object.values(normalizedGates).some((value) => value === false);
    const status = runnerDisposition === "failed"
      ? "blocked-same-realm-scene-exit-failed"
      : "blocked-same-realm-scene-exit-unavailable";
    return {
      status,
      evidence,
      receiptSha256: safeReceiptSha(batch.receiptSha256),
      receiptSealAlgorithm: sealAlgorithm,
      receiptVerified: sealVerified && runnerReceiptVerified && codeReceiptsVerified && receiptSchemaAvailable,
      gates: normalizedGates,
      allGatesPassed: explicitGateFailure ? false : "unknown",
      workerOwnership: {
        sceneCreatedTargetIds: Array.isArray(batch.analysis?.sceneTargetIds)
          ? batch.analysis.sceneTargetIds
          : null,
        targetCounts: {
          baseline: observedArrayLength(workerTargets?.baseline),
          mounted: observedArrayLength(workerTargets?.mounted),
          detached: observedArrayLength(workerTargets?.detached),
          exited: observedArrayLength(workerTargets?.exited),
        },
        targets: workerTargets,
        sceneTargetsReleased: observedGate(gates, "sceneWorkerTargetsReleased"),
        ledgerReturnedToBaseline: observedGate(gates, "workerLedgerReturnedToBaseline"),
        unknown: true,
      },
      listenerBaselineDelta: {
        baseline: listenerValues[0],
        mounted: listenerValues[1],
        detached: listenerValues[2],
        exited: listenerValues[3],
        detachedDelta: observedDifference(listenerValues[2], listenerValues[0]),
        exitedDelta: observedDifference(listenerValues[3], listenerValues[0]),
        returnedToBaseline: observedGate(gates, "listenerLedgerReturnedToBaseline"),
        rawRegistered: {
          baseline: finiteOrNull(baselineHarness?.rawRegisteredListenerCount),
          mounted: finiteOrNull(mountedHarness?.rawRegisteredListenerCount),
          detached: finiteOrNull(detachedHarness?.rawRegisteredListenerCount),
          exited: finiteOrNull(exitedHarness?.rawRegisteredListenerCount),
        },
        inactiveTargets: {
          baseline: finiteOrNull(baselineHarness?.inactiveTargetListenerCount),
          mounted: finiteOrNull(mountedHarness?.inactiveTargetListenerCount),
          detached: finiteOrNull(detachedHarness?.inactiveTargetListenerCount),
          exited: finiteOrNull(exitedHarness?.inactiveTargetListenerCount),
        },
      },
      r3fCleanup: {
        renderListsDisposed: observedBoolean(exit?.renderListsDisposed),
        contextLost: observedBoolean(exit?.contextLost),
        canvasDetached: observedBoolean(exit?.canvasDetached),
        liveContextCountAfterExit: finiteOrNull(exitedHarness?.webgl?.liveContextCount),
        cleanupObserved: observedGate(gates, "finalRendererCleanupObserved"),
      },
      realm: {
        harnessRealmToken: baselineHarness?.realmToken ?? null,
        sourceRealmToken: phases?.baseline?.source?.sourceLedger?.realmToken ?? null,
        timeOrigin: finiteOrNull(baselineHarness?.timeOrigin),
        sourceTimeOrigin: finiteOrNull(phases?.baseline?.source?.sourceLedger?.timeOrigin),
        routeAfter: phases?.exited?.source?.pathname ?? null,
        stable: ["harnessRealmStable", "harnessTimeOriginStable", "sourceRealmStable", "sourceTimeOriginStable"]
          .every((name) => gates?.[name] === true)
          ? true
          : ["harnessRealmStable", "harnessTimeOriginStable", "sourceRealmStable", "sourceTimeOriginStable"]
              .some((name) => gates?.[name] === false)
            ? false
            : "unknown",
      },
      rendererAfterDetach: zeroSnapshotState(rendererAfterDetach, ["textures", "geometries", "programs", "renderTargets"]),
      registryAfterDetach: zeroSnapshotState(registryAfterDetach, ["total", "workers", "renderTargets", "textures", "subscriptions", "typedArrays", "estimatedBytes"]),
      syntheticZeroClaim: false,
      blockedReason: {
        kind: "same-realm-scene-exit-unavailable",
        runnerStatus: batch.status,
        runnerDisposition,
        analysisStatus: batch.analysis?.status ?? "unknown",
        failedGates: Array.isArray(batch.analysis?.failedGates) ? batch.analysis.failedGates : null,
        phases: phasesAvailable ? "available" : "unavailable",
        rendererTelemetry: rendererUnknown ? "unknown" : "available",
        registryTelemetry: registryUnknown ? "unknown" : "available",
        runnerReceipt: runnerReceiptVerified ? "verified" : "unavailable",
        codeReceiptSchema: receiptSchemaAvailable ? "verified-complete" : "unavailable-or-incomplete",
        validationErrors: errors,
      },
    };
  }

  assert(batch.analysis?.status === "passed" && sameJson(batch.analysis.failedGates, []), "v593-soak-same-realm-analysis");
  assert(gateSchemaAvailable, "v593-soak-same-realm-gate-schema");
  assert(Object.values(batch.analysis.gates).every((value) => value === true), "v593-soak-same-realm-gates");
  for (const snapshot of [batch.sourceIdentityBefore, batch.sourceIdentityAfter]) {
    assert(snapshot?.sharedBuildIdentity === true, "v593-soak-same-realm-shared-build");
    assert(snapshot?.formalProductPointer === "v263", "v593-soak-same-realm-formal-product-pointer");
    assert(snapshot?.sourceManifestDriftCount === 0 && sameJson(snapshot?.sourceManifestDrifts, []), "v593-soak-same-realm-source-drift");
  }
  const baselineTargets = workerTargetIds(batch.analysis.workerTargets?.baseline, "v593-soak-same-realm-baseline");
  const mountedTargets = workerTargetIds(batch.analysis.workerTargets?.mounted, "v593-soak-same-realm-mounted");
  const detachedTargets = workerTargetIds(batch.analysis.workerTargets?.detached, "v593-soak-same-realm-detached");
  const exitedTargets = workerTargetIds(batch.analysis.workerTargets?.exited, "v593-soak-same-realm-exited");
  const sceneTargetIds = batch.analysis.sceneTargetIds;
  assert(Array.isArray(sceneTargetIds) && sceneTargetIds.length > 0 && new Set(sceneTargetIds).size === sceneTargetIds.length, "v593-soak-same-realm-scene-target-schema");
  for (const id of sceneTargetIds) {
    assert(mountedTargets.has(id) && !baselineTargets.has(id), `v593-soak-same-realm-scene-target-ownership:${id}`);
    assert(!detachedTargets.has(id) && !exitedTargets.has(id), `v593-soak-same-realm-scene-target-release:${id}`);
  }
  assertRendererAndRegistryZero(phases.detached.source?.sourceLedger?.snapshots?.detached);
  const listenerValues = [baselineHarness, mountedHarness, detachedHarness, exitedHarness]
    .map((harness) => harness?.listenerCount);
  const rawListenerValues = [baselineHarness, mountedHarness, detachedHarness, exitedHarness]
    .map((harness) => harness?.rawRegisteredListenerCount);
  const inactiveTargetListenerValues = [baselineHarness, mountedHarness, detachedHarness, exitedHarness]
    .map((harness) => harness?.inactiveTargetListenerCount);
  assert(listenerValues.every(Number.isFinite), "v593-soak-same-realm-listener-values");
  assert(rawListenerValues.every(Number.isFinite) && inactiveTargetListenerValues.every(Number.isFinite), "v593-soak-same-realm-listener-accounting-values");
  assert(rawListenerValues.every((value, index) => value === listenerValues[index] + inactiveTargetListenerValues[index]), "v593-soak-same-realm-listener-accounting-balance");
  assert(listenerValues[2] <= listenerValues[0] && listenerValues[3] <= listenerValues[0], "v593-soak-same-realm-listener-baseline");
  const exit = phases.exited.source?.sourceLedger?.exit;
  assert(
    exit?.renderListsDisposed === true
      && exit?.contextLost === true
      && exit?.canvasDetached === true
      && exit?.routeAfter === "/downloads"
      && exitedHarness?.webgl?.liveContextCount === 0,
    "v593-soak-same-realm-r3f-cleanup",
  );
  assert(phases.exited.source?.pathname === "/downloads", "v593-soak-same-realm-exit-route");
  return {
    status: "passed-same-realm-resource-zero",
    evidence,
    receiptSha256: safeReceiptSha(batch.receiptSha256),
    receiptSealAlgorithm: sealAlgorithm,
    receiptVerified: true,
    gates: batch.analysis.gates,
    allGatesPassed: true,
    workerOwnership: {
      sceneCreatedTargetIds: sceneTargetIds,
      targetCounts: {
        baseline: baselineTargets.size,
        mounted: mountedTargets.size,
        detached: detachedTargets.size,
        exited: exitedTargets.size,
      },
      targets: batch.analysis.workerTargets,
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
      sourceRealmToken: phases.baseline.source?.sourceLedger?.realmToken,
      timeOrigin: baselineHarness.timeOrigin,
      sourceTimeOrigin: phases.baseline.source?.sourceLedger?.timeOrigin,
      routeAfter: "/downloads",
      stable: true,
    },
    rendererAfterDetach: phases.detached.source.sourceLedger.snapshots.detached.renderer,
    registryAfterDetach: phases.detached.source.sourceLedger.snapshots.detached.registry,
    syntheticZeroClaim: false,
  };
}
function olsSlope(values) {
  if (values.length < 2) return null;
  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    const dx = index - xMean;
    numerator += dx * (values[index] - yMean);
    denominator += dx * dx;
  }
  return denominator === 0 ? null : numerator / denominator;
}
function range(values) {
  return [Math.min(...values), Math.max(...values)];
}
async function cdpHeapSoak(batchPath, document, expected, readError = null) {
  // A runner-blocked or malformed stage is still evidence, but it is negative
  // evidence.  Validate it without throwing so unknown telemetry can never be
  // converted into a numeric zero or an accidental pass.
  const batch = isRecord(document) ? document : {};
  const errors = [];
  const addError = (condition, reason) => {
    if (!condition && !errors.includes(reason)) errors.push(reason);
  };
  if (readError) errors.push(`v593-cdp-heap-stage-read:${readError}`);
  const rawStatus = typeof batch.status === "string" ? batch.status : "unknown";
  const runnerDisposition = classifyRunnerEnvelope(
    rawStatus,
    "staging-cdp-heap-soak-passed-not-promoted",
    "staging-cdp-heap-soak-failed-not-promoted",
  );
  addError(batch.version === "v593-cdp-heap-soak-stage-v1", "v593-cdp-heap-version");
  addError(batch.qualificationScope === "v593-current-shared-build-cdp-heap-soak", "v593-cdp-heap-scope");
  addError(batch.protocolPreRegisteredBeforeSampling === true, "v593-cdp-heap-protocol-registration");
  addError(runnerDisposition !== "unknown", "v593-cdp-heap-status-unknown");
  addError(batch.effectiveRun?.preflight === false, "v593-cdp-heap-not-preflight");
  addError(batch.promotion === "staging-only", "v593-cdp-heap-promotion-boundary");

  let sealAlgorithm = "unknown";
  let sealVerified = false;
  if (typeof batch.receiptSha256 === "string" && batch.receiptSha256.length > 0) {
    try {
      sealAlgorithm = verifyRunnerReceipt(batch, "v593-cdp-heap");
      sealVerified = true;
    } catch (error) {
      errors.push(`v593-cdp-heap-receipt-seal:${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    errors.push("v593-cdp-heap-receipt-seal-missing");
  }

  const runnerReceiptVerified = await verifyOptionalReceipt(batch.runnerReceipt, "v593-cdp-heap-runner", errors);
  let codeReceiptNames = [];
  let codeReceiptsVerified = false;
  if (isRecord(batch.cliCodeReceipts)) {
    codeReceiptNames = Object.keys(batch.cliCodeReceipts);
    addError(codeReceiptNames.length > 0, "v593-cdp-heap-code-receipts-empty");
    const codeResults = await Promise.all(
      Object.entries(batch.cliCodeReceipts).map(([name, receipt]) =>
        verifyOptionalReceipt(receipt, `v593-cdp-heap-code-${name}`, errors)),
    );
    codeReceiptsVerified = codeResults.length > 0 && codeResults.every(Boolean);
  } else {
    errors.push("v593-cdp-heap-code-receipts-missing");
  }
  addError(
    sameJson(codeReceiptNames.slice().sort(), ["auditBootstrap", "navigation", "sample", "stateBootstrap"]),
    "v593-cdp-heap-code-receipt-schema",
  );

  const expectedIdentity = isRecord(batch.expectedIdentity) ? batch.expectedIdentity : null;
  if (!expectedIdentity) {
    errors.push("v593-cdp-heap-expected-identity-missing");
  } else {
    errors.push(...identityMismatches(expectedIdentity, expected, "v593-cdp-heap-expected"));
    addError(
      typeof expectedIdentity.deploymentId === "string" && expectedIdentity.deploymentId.length > 0,
      "v593-cdp-heap-deployment-id",
    );
  }
  for (const [name, snapshot] of [["before", batch.sourceIdentityBefore], ["after", batch.sourceIdentityAfter]]) {
    if (!isRecord(snapshot)) {
      errors.push(`v593-cdp-heap-${name}-identity-missing`);
      continue;
    }
    errors.push(...identityMismatches(snapshot.expected, expected, `v593-cdp-heap-${name}`));
    addError(snapshot.sharedBuildIdentity === true, `v593-cdp-heap-${name}-shared-build`);
    addError(snapshot.formalProductPointer === "v263", `v593-cdp-heap-${name}-formal-product-pointer`);
    addError(
      snapshot.sourceManifest?.driftCount === 0 && sameJson(snapshot.sourceManifest?.drifts, []),
      `v593-cdp-heap-${name}-source-drift`,
    );
    for (const [receiptName, receipt] of Object.entries({
      source: snapshot.sourceManifest?.file,
      candidate: snapshot.candidate?.file,
      standalone: snapshot.standalone?.file,
      lite: snapshot.lite?.file,
    })) {
      if (receipt !== undefined && receipt !== null) {
        await verifyOptionalReceipt(receipt, `v593-cdp-heap-${name}-${receiptName}`, errors);
      } else {
        addError(false, `v593-cdp-heap-${name}-${receiptName}-file-missing`);
      }
    }
  }
  const identitySnapshotsAvailable = isRecord(batch.sourceIdentityBefore) && isRecord(batch.sourceIdentityAfter);
  if (identitySnapshotsAvailable) {
    addError(
      sameJson(batch.sourceIdentityBefore.expected, batch.sourceIdentityAfter.expected),
      "v593-cdp-heap-identity-drift",
    );
  }

  const rawSamples = Array.isArray(batch.samples) ? batch.samples : [];
  const sampleSpanMilliseconds = observedSampleSpan(rawSamples);
  const telemetryUnavailable = rawSamples.length === 0
    || rawSamples.some((sample) => (
      !Number.isFinite(sample?.heap?.usedSize)
      || !Number.isFinite(sample?.metrics?.JSHeapUsedSize)
      || !Number.isFinite(sample?.metrics?.JSEventListeners)
    ));
  const gates = isRecord(batch.analysis?.gates) ? batch.analysis.gates : null;
  const gateSchemaAvailable = sameJson(Object.keys(gates ?? {}).sort(), [...cdpHeapGateNames].sort());
  const analysisPassed = batch.analysis?.status === "passed"
    && gateSchemaAvailable
    && Object.values(gates ?? {}).every((value) => value === true);
  if (runnerDisposition === "passed") {
    addError(analysisPassed, "v593-cdp-heap-analysis");
    addError(!telemetryUnavailable, "v593-cdp-heap-telemetry-complete");
    addError(rawSamples.length === minimumSampleCount, "v593-cdp-heap-sample-count");
    addError(sampleSpanMilliseconds !== null && sampleSpanMilliseconds >= minimumSampleSpanMilliseconds, "v593-cdp-heap-sample-span");
    addError(batch.effectiveRun?.sampleCount === minimumSampleCount, "v593-cdp-heap-effective-sample-count");
    addError(batch.protocol?.expectedSampleCount === minimumSampleCount, "v593-cdp-heap-protocol-sample-count");
    addError(batch.protocol?.minimumSampleSpanMilliseconds >= minimumSampleSpanMilliseconds, "v593-cdp-heap-protocol-span");
    addError(batch.protocol?.heapCollection === "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage", "v593-cdp-heap-collection-authority");
    addError(batch.protocol?.rendererResourceExactStabilityRequired === true && batch.protocol?.sourceManifestExactStabilityRequired === true, "v593-cdp-heap-stability-policy");
    addError(batch.protocol?.promotion === "staging-only", "v593-cdp-heap-protocol-promotion");
    addError(Boolean(batch.analysis?.heap && batch.analysis?.runtime && batch.analysis?.console), "v593-cdp-heap-analysis-shape");
  }
  const receiptSchemaAvailable = runnerReceiptVerified
    && sameJson(codeReceiptNames.sort(), ["auditBootstrap", "navigation", "sample", "stateBootstrap"]);
  addError(receiptSchemaAvailable, "v593-cdp-heap-receipt-schema");
  addError(identitySnapshotsAvailable, "v593-cdp-heap-identity-snapshots");
  if (runnerDisposition === "passed") {
    addError(sealVerified, "v593-cdp-heap-receipt-seal");
  }
  const protocolAuthorityAvailable = batch.protocol?.heapCollection
    === "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage";
  const passEvidenceAvailable = runnerDisposition === "passed"
    && analysisPassed
    && !telemetryUnavailable
    && rawSamples.length === minimumSampleCount
    && sampleSpanMilliseconds !== null
    && sampleSpanMilliseconds >= minimumSampleSpanMilliseconds
    && protocolAuthorityAvailable
    && receiptSchemaAvailable
    && identitySnapshotsAvailable
    && batch.effectiveRun?.preflight === false
    && batch.effectiveRun?.sampleCount === minimumSampleCount
    && batch.protocol?.expectedSampleCount === minimumSampleCount
    && batch.protocol?.minimumSampleSpanMilliseconds >= minimumSampleSpanMilliseconds
    && batch.protocol?.rendererResourceExactStabilityRequired === true
    && batch.protocol?.sourceManifestExactStabilityRequired === true
    && batch.protocol?.promotion === "staging-only"
    && Boolean(batch.analysis?.heap && batch.analysis?.runtime && batch.analysis?.console);

  if (!passEvidenceAvailable) {
    const evidence = await safeEvidenceReceipt(batchPath);
    const rawRuntime = batch.analysis?.runtime;
    const rawHeap = batch.analysis?.heap;
    const pageAudit = batch.analysis?.console?.pageAudit;
    const consoleCountValues = [
      pageAudit?.consoleWarningCount,
      pageAudit?.consoleErrorCount,
    ];
    const consoleCount = consoleCountValues.every(Number.isFinite)
      ? consoleCountValues.reduce((sum, value) => sum + value, 0)
      : null;
    const samplesObserved = rawSamples.length > 0;
    const runtime = {
      sampleSpanMilliseconds,
      minimumMedianFps: samplesObserved ? finiteOrNull(rawRuntime?.minimumMedianFps) : null,
      maximumGpuBytes: samplesObserved ? finiteOrNull(rawRuntime?.maximumGpuBytes) : null,
      maximumResourceBytes: samplesObserved ? finiteOrNull(rawRuntime?.maximumResourceBytes) : null,
      maximumDrawCalls: samplesObserved ? finiteOrNull(rawRuntime?.maximumDrawCalls) : null,
      rendererFingerprintCount: samplesObserved ? finiteOrNull(rawRuntime?.rendererFingerprintCount) : null,
      jsEventListenerMinimum: samplesObserved ? finiteOrNull(rawRuntime?.jsEventListenerMinimum) : null,
      jsEventListenerMaximum: samplesObserved ? finiteOrNull(rawRuntime?.jsEventListenerMaximum) : null,
      domNodeMinimum: samplesObserved ? finiteOrNull(rawRuntime?.domNodeMinimum) : null,
      domNodeMaximum: samplesObserved ? finiteOrNull(rawRuntime?.domNodeMaximum) : null,
      workerTargetMinimum: samplesObserved ? finiteOrNull(rawRuntime?.workerTargetMinimum) : null,
      workerTargetMaximum: samplesObserved ? finiteOrNull(rawRuntime?.workerTargetMaximum) : null,
      listenerWorkerMetricsGateScope: samplesObserved
        ? rawRuntime?.listenerWorkerMetricsGateScope ?? "unknown"
        : "unknown",
      resourceRanges: samplesObserved ? rawRuntime?.resourceRanges ?? null : null,
    };
    const status = runnerDisposition === "failed"
      ? "blocked-current-identity-cdp-heap-soak-failed"
      : "blocked-current-identity-cdp-heap-soak-unavailable";
    const memory = {
      status,
      measurementAuthority: !telemetryUnavailable && protocolAuthorityAvailable
        ? batch.protocol.heapCollection
        : "unknown",
      jsHeapTelemetry: telemetryUnavailable
        ? "unavailable"
        : "available-chromium-cdp-runtime-getHeapUsage",
      sampleCount: Array.isArray(batch.samples) ? rawSamples.length : null,
      sampleSpanMilliseconds: runtime.sampleSpanMilliseconds,
      baselineUsedSizeBytes: samplesObserved ? finiteOrNull(rawHeap?.baselineUsedSizeBytes) : null,
      finalUsedSizeBytes: samplesObserved ? finiteOrNull(rawHeap?.finalUsedSizeBytes) : null,
      finalDeltaBytes: samplesObserved ? finiteOrNull(rawHeap?.finalDeltaBytes) : null,
      allowanceBytes: samplesObserved ? finiteOrNull(rawHeap?.allowanceBytes) : null,
      minimumUsedSizeBytes: samplesObserved ? finiteOrNull(rawHeap?.minimumUsedSizeBytes) : null,
      maximumUsedSizeBytes: samplesObserved ? finiteOrNull(rawHeap?.maximumUsedSizeBytes) : null,
      overallOlsBytesPerSample: samplesObserved ? finiteOrNull(rawHeap?.overallOlsBytesPerSample) : null,
      lastTenOlsBytesPerSample: samplesObserved ? finiteOrNull(rawHeap?.lastTenOlsBytesPerSample) : null,
      lastTenOlsMaximumBytesPerSample: finiteOrNull(batch.protocol?.lastTenOlsMaximumBytesPerSample),
      finalHeapWithinAllowance: samplesObserved
        ? observedGate(gates, "finalHeapWithinAllowance")
        : "unknown",
      lastTenOlsWithinLimit: samplesObserved
        ? observedGate(gates, "lastTenOlsWithinLimit")
        : "unknown",
      sustainedJsHeapGrowth: "unknown",
      requiredForClosure: true,
      noSyntheticSubstitution: true,
    };
    return {
      status,
      evidence,
      receiptSha256: safeReceiptSha(batch.receiptSha256),
      receiptSealAlgorithm: sealAlgorithm,
      receiptVerified: sealVerified && runnerReceiptVerified && codeReceiptsVerified && receiptSchemaAvailable,
      gates: Object.fromEntries(
        cdpHeapGateNames.map((name) => [name, observedGate(gates, name)]),
      ),
      allGatesPassed: Object.values(gates ?? {}).some((value) => value === false) ? false : "unknown",
      durationSeconds: runtime.sampleSpanMilliseconds === null
        ? null
        : runtime.sampleSpanMilliseconds / 1000,
      sampleCount: Array.isArray(batch.samples) ? batch.samples.length : null,
      aggregate: {
        minimumMedianFps: runtime.minimumMedianFps,
        maximumGpuBytes: runtime.maximumGpuBytes,
        maximumResourceBytes: runtime.maximumResourceBytes,
        maximumDrawCalls: runtime.maximumDrawCalls,
        rendererResourceGrowth: "unknown",
        rendererResourceBaselineStable: "unknown",
        canvasCountStable: "unknown",
        payloadUniqueCount: null,
        scientificWritebackCount: null,
        resourceRanges: runtime.resourceRanges,
      },
      memory,
      runtime,
      console: {
        count: consoleCount,
        cliRaw: typeof batch.analysis?.console?.cliRaw === "string"
          ? batch.analysis.console.cliRaw
          : null,
        stderr: typeof batch.analysis?.console?.stderr === "string"
          ? batch.analysis.console.stderr
          : null,
        pageAudit: pageAudit ?? null,
      },
      renderer: {
        resourceGrowth: "unknown",
        resourceBaselineStable: "unknown",
        fingerprintCount: runtime.rendererFingerprintCount,
        fingerprint: rawSamples[0]?.state?.rendererFingerprint ?? null,
        resourceRanges: runtime.resourceRanges,
      },
      samples: rawSamples.map((sample) => ({
        sequence: finiteOrNull(sample.sequence),
        capturedAt: sample.capturedAt ?? null,
        capturedAtMs: finiteOrNull(sample.capturedAtMs),
        elapsedMs: finiteOrNull(sample.elapsedMs),
        focusTarget: sample.state?.focusId ?? null,
        mode: sample.state?.lane === "v593-signature" ? "cinematic" : null,
        deviceTier: null,
        fpsMedian: finiteOrNull(sample.state?.fpsMedian),
        fpsMinimum: finiteOrNull(sample.state?.fpsMinimum),
        fpsSampleCount: finiteOrNull(sample.state?.fpsSampleCount),
        gpuBytes: finiteOrNull(sample.state?.gpuBytes),
        resourceBytes: finiteOrNull(sample.state?.resourceBytes),
        textures: finiteOrNull(sample.state?.textures),
        geometries: finiteOrNull(sample.state?.geometries),
        programs: finiteOrNull(sample.state?.programs),
        drawCalls: finiteOrNull(sample.state?.drawCalls),
        candidateNodes: finiteOrNull(sample.state?.candidateNodes),
        candidateResources: finiteOrNull(sample.state?.candidateResources),
        canvasCount: finiteOrNull(sample.state?.canvasCount),
        payloadSha: sample.state?.scientificPayloadSha256 ?? null,
        payloadStable: sample.state?.payloadStable === "true"
          ? true
          : sample.state?.payloadStable === "false" ? false : "unknown",
        scientificWriteback: sample.state?.scientificWriteback === "false"
          ? false
          : sample.state?.scientificWriteback === "true" ? true : "unknown",
        jsHeapUsedBytes: finiteOrNull(sample?.heap?.usedSize),
        jsHeapTelemetry: Number.isFinite(sample?.heap?.usedSize)
          ? "available-chromium-cdp-runtime-getHeapUsage"
          : "unavailable",
      })),
      syntheticHeapPassClaim: false,
      blockedReason: {
        kind: runnerDisposition === "failed" ? "runner-reported-failed" : "runner-or-evidence-unavailable",
        runnerStatus: batch.status,
        runnerDisposition,
        analysisStatus: batch.analysis?.status ?? "unknown",
        failedGates: gateSchemaAvailable
          ? Object.entries(gates ?? {}).filter(([, value]) => value !== true).map(([name]) => name)
          : null,
        sampleEnvelope: Array.isArray(batch.samples)
          ? rawSamples.length === 0 ? "empty-unavailable" : "available"
          : "unavailable",
        heapTelemetry: telemetryUnavailable ? "unavailable" : "available",
        protocolAuthority: protocolAuthorityAvailable ? "declared" : "unavailable",
        identitySnapshots: identitySnapshotsAvailable ? "available" : "unavailable",
        runnerReceipt: runnerReceiptVerified ? "verified" : "unavailable",
        codeReceiptSchema: receiptSchemaAvailable ? "verified-complete" : "unavailable-or-incomplete",
        validationErrors: errors,
      },
    };
  }
  assert(gateSchemaAvailable, "v593-cdp-heap-gate-schema");
  assert(Object.values(batch.analysis.gates).every((value) => value === true), "v593-cdp-heap-gates");
  assert(Array.isArray(batch.samples) && batch.samples.length === minimumSampleCount, "v593-cdp-heap-sample-count");
  assert(batch.effectiveRun.sampleCount === batch.samples.length, "v593-cdp-heap-effective-sample-count");
  assert(batch.protocol?.expectedSampleCount === minimumSampleCount, "v593-cdp-heap-protocol-sample-count");
  assert(batch.protocol?.minimumSampleSpanMilliseconds >= minimumSampleSpanMilliseconds, "v593-cdp-heap-protocol-span");
  assert(batch.protocol?.heapCollection === "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage", "v593-cdp-heap-collection-authority");
  assert(batch.protocol?.rendererResourceExactStabilityRequired === true && batch.protocol?.sourceManifestExactStabilityRequired === true, "v593-cdp-heap-stability-policy");
  assert(batch.protocol?.promotion === "staging-only", "v593-cdp-heap-protocol-promotion");
  for (const snapshot of [batch.sourceIdentityBefore, batch.sourceIdentityAfter]) {
    assert(snapshot?.expected?.deploymentId === expected.deploymentId, "v593-cdp-heap-snapshot-deployment-id");
    assert(snapshot?.sourceManifest?.receiptSha256 === expected.sourceManifestSha256, "v593-cdp-heap-source-receipt");
    assert(snapshot?.sourceManifest?.driftCount === 0 && sameJson(snapshot?.sourceManifest?.drifts, []), "v593-cdp-heap-source-drift");
    assert(snapshot?.candidate?.manifestSha256 === expected.candidateManifestSha256, "v593-cdp-heap-candidate-receipt");
    assert(snapshot?.candidate?.formalProductPointer === "v263", "v593-cdp-heap-formal-product-pointer");
    assert(snapshot?.standalone?.status === "passed" && snapshot?.standalone?.deliveryTier === "standalone-full", "v593-cdp-heap-standalone-snapshot");
    assert(snapshot?.lite?.status === "passed" && snapshot?.lite?.deliveryTier === "vercel-lite", "v593-cdp-heap-lite-snapshot");
    assert(snapshot?.standalone?.buildId === expected.buildId && snapshot?.lite?.buildId === expected.buildId, "v593-cdp-heap-snapshot-build-id");
    assert(snapshot?.standalone?.deploymentId === expected.deploymentId && snapshot?.lite?.deploymentId === expected.deploymentId, "v593-cdp-heap-snapshot-deployment-id");
    assert(snapshot?.standalone?.sourceManifestSha256 === expected.sourceManifestSha256 && snapshot?.lite?.sourceManifestSha256 === expected.sourceManifestSha256, "v593-cdp-heap-snapshot-source");
  }
  assert(
    sameJson(batch.sourceIdentityBefore.sourceManifest, batch.sourceIdentityAfter.sourceManifest)
      && sameJson(batch.sourceIdentityBefore.candidate, batch.sourceIdentityAfter.candidate)
      && sameJson(batch.sourceIdentityBefore.standalone, batch.sourceIdentityAfter.standalone)
      && sameJson(batch.sourceIdentityBefore.lite, batch.sourceIdentityAfter.lite),
    "v593-cdp-heap-identity-drift",
  );

  const samples = batch.samples.map((sample, index) => {
    assert(sample.sequence === index && Number.isFinite(sample.capturedAtMs) && Number.isFinite(sample.elapsedMs), `v593-cdp-heap-sample-sequence:${index}`);
    if (index > 0) {
      assert(sample.capturedAtMs > batch.samples[index - 1].capturedAtMs, `v593-cdp-heap-sample-time:${index}`);
      assert(sample.elapsedMs > batch.samples[index - 1].elapsedMs, `v593-cdp-heap-sample-elapsed:${index}`);
    }
    assert(Number.isFinite(sample?.heap?.usedSize) && sample.heap.usedSize >= 0, `v593-cdp-heap-used:${index}`);
    assert(Number.isFinite(sample?.metrics?.JSHeapUsedSize) && Number.isFinite(sample?.metrics?.JSEventListeners), `v593-cdp-heap-metrics:${index}`);
    const state = sample.state;
    assert(
      state?.url === batch.protocol.route
        && state?.candidateManifestSha256 === expected.candidateManifestSha256
        && state?.scientificPayloadSha256 === scientificPayloadSha256
        && state?.payloadStable === "true"
        && state?.scientificWriteback === "false"
        && state?.productionPromotion === "false"
        && state?.formalProductPointer === "v263"
        && state?.lane === "v593-signature"
        && state?.focusId === "jupiter"
        && state?.bridge === "mounted-r3f-webgl"
        && state?.canvasReady === "true"
        && state?.singleCanvas === "true"
        && state?.canvasCount === 1
        && sameJson(state?.deploymentIds, [batch.expectedIdentity.deploymentId]),
      `v593-cdp-heap-state-boundary:${index}`,
    );
    assert(
      Number.isFinite(state.fpsMedian)
        && state.fpsMedian >= batch.protocol.minimumMedianFps
        && state.fpsSampleCount >= 120
        && Number.isFinite(state.gpuBytes)
        && state.gpuBytes > 0
        && state.gpuBytes <= batch.protocol.maximumGpuBytes
        && Number.isFinite(state.resourceBytes)
        && state.resourceBytes > 0
        && Number.isFinite(state.drawCalls)
        && state.drawCalls <= batch.protocol.maximumDrawCalls,
      `v593-cdp-heap-state-performance:${index}`,
    );
    assert(sample.targets?.supported === true && Array.isArray(sample.targets?.workers), `v593-cdp-heap-targets:${index}`);
    assert(
      sample.pageAudit?.consoleWarningCount === 0
        && sample.pageAudit?.consoleErrorCount === 0
        && sample.pageAudit?.pageErrorCount === 0
        && sample.pageAudit?.unhandledRejectionCount === 0
        && sample.pageAudit?.webglEventCount === 0,
      `v593-cdp-heap-page-audit:${index}`,
    );
    assert(sample.cliAttempt >= 1 && sameJson(sample.cliAttemptErrors, []), `v593-cdp-heap-cli-attempt:${index}`);
    return {
      sequence: index,
      capturedAt: sample.capturedAt,
      capturedAtMs: sample.capturedAtMs,
      elapsedMs: sample.elapsedMs,
      heap: {
        usedSizeBytes: sample.heap.usedSize,
        totalSizeBytes: sample.heap.totalSize,
        embedderHeapUsedSizeBytes: sample.heap.embedderHeapUsedSize,
        backingStorageSizeBytes: sample.heap.backingStorageSize,
        jsHeapUsedSizeMetricBytes: sample.metrics.JSHeapUsedSize,
        jsHeapTotalSizeMetricBytes: sample.metrics.JSHeapTotalSize,
      },
      renderer: {
        fingerprint: state.rendererFingerprint,
        gpuBytes: state.gpuBytes,
        resourceBytes: state.resourceBytes,
        textures: state.textures,
        geometries: state.geometries,
        programs: state.programs,
        drawCalls: state.drawCalls,
        candidateNodes: state.candidateNodes,
        canvasCount: state.canvasCount,
      },
      runtime: {
        fpsMedian: state.fpsMedian,
        fpsMinimum: state.fpsMinimum,
        fpsSampleCount: state.fpsSampleCount,
        jsEventListeners: sample.metrics.JSEventListeners,
        domNodes: sample.metrics.Nodes,
        workerTargetCount: sample.targets.workers.length,
        workerTargets: sample.targets.workers,
      },
      scientificPayloadSha256: state.scientificPayloadSha256,
      scientificWriteback: false,
    };
  });
  const used = samples.map((sample) => sample.heap.usedSizeBytes);
  const rendererFingerprints = samples.map((sample) => sample.renderer.fingerprint);
  const spanMilliseconds = samples.at(-1).capturedAtMs - samples[0].capturedAtMs;
  const heap = batch.analysis.heap;
  const runtime = batch.analysis.runtime;
  assert(spanMilliseconds >= minimumSampleSpanMilliseconds && runtime.sampleSpanMilliseconds === spanMilliseconds, "v593-cdp-heap-measured-span");
  assert(heap.baselineUsedSizeBytes === used[0] && heap.finalUsedSizeBytes === used.at(-1), "v593-cdp-heap-endpoints");
  assert(heap.finalDeltaBytes === used.at(-1) - used[0], "v593-cdp-heap-final-delta");
  assert(heap.minimumUsedSizeBytes === Math.min(...used) && heap.maximumUsedSizeBytes === Math.max(...used), "v593-cdp-heap-range");
  assert(nearlyEqual(heap.overallOlsBytesPerSample, olsSlope(used)), "v593-cdp-heap-overall-ols");
  assert(nearlyEqual(heap.lastTenOlsBytesPerSample, olsSlope(used.slice(-10))), "v593-cdp-heap-last-ten-ols");
  assert(used.at(-1) <= used[0] + heap.allowanceBytes, "v593-cdp-heap-final-allowance");
  assert(heap.lastTenOlsBytesPerSample <= batch.protocol.lastTenOlsMaximumBytesPerSample, "v593-cdp-heap-last-ten-limit");
  assert(new Set(rendererFingerprints).size === 1 && runtime.rendererFingerprintCount === 1, "v593-cdp-heap-renderer-fingerprint");
  assert(runtime.minimumMedianFps === Math.min(...samples.map((sample) => sample.runtime.fpsMedian)), "v593-cdp-heap-fps-analysis");
  assert(runtime.maximumGpuBytes === Math.max(...samples.map((sample) => sample.renderer.gpuBytes)), "v593-cdp-heap-gpu-analysis");
  assert(runtime.maximumResourceBytes === Math.max(...samples.map((sample) => sample.renderer.resourceBytes)), "v593-cdp-heap-resource-analysis");
  assert(runtime.maximumDrawCalls === Math.max(...samples.map((sample) => sample.renderer.drawCalls)), "v593-cdp-heap-draw-analysis");
  assert(batch.analysis.console?.pageAudit?.consoleWarningCount === 0 && batch.analysis.console?.pageAudit?.consoleErrorCount === 0, "v593-cdp-heap-analysis-console");
  assert(/Total messages:\s*0\s*\(Errors:\s*0,\s*Warnings:\s*0\)/i.test(batch.analysis.console?.cliRaw ?? ""), "v593-cdp-heap-cli-console");
  assert((batch.analysis.console?.stderr ?? "") === "", "v593-cdp-heap-stderr");
  const memory = {
    status: "passed-authoritative-cdp-heap-soak",
    measurementAuthority: batch.protocol.heapCollection,
    jsHeapTelemetry: "available-chromium-cdp-runtime-getHeapUsage",
    sampleCount: samples.length,
    sampleSpanMilliseconds: spanMilliseconds,
    baselineUsedSizeBytes: heap.baselineUsedSizeBytes,
    finalUsedSizeBytes: heap.finalUsedSizeBytes,
    finalDeltaBytes: heap.finalDeltaBytes,
    allowanceBytes: heap.allowanceBytes,
    minimumUsedSizeBytes: heap.minimumUsedSizeBytes,
    maximumUsedSizeBytes: heap.maximumUsedSizeBytes,
    overallOlsBytesPerSample: heap.overallOlsBytesPerSample,
    lastTenOlsBytesPerSample: heap.lastTenOlsBytesPerSample,
    lastTenOlsMaximumBytesPerSample: batch.protocol.lastTenOlsMaximumBytesPerSample,
    finalHeapWithinAllowance: true,
    lastTenOlsWithinLimit: true,
    sustainedJsHeapGrowth: false,
    requiredForClosure: true,
    noSyntheticSubstitution: true,
  };
  return {
    status: "passed-current-identity-authoritative-cdp-heap-soak",
    evidence: await fileReceipt(batchPath),
    receiptSha256: batch.receiptSha256,
    receiptSealAlgorithm: sealAlgorithm,
    receiptVerified: true,
    gates: batch.analysis.gates,
    allGatesPassed: true,
    durationSeconds: spanMilliseconds / 1000,
    sampleCount: samples.length,
    samplingIntervalSeconds: batch.protocol.sampleIntervalMilliseconds / 1000,
    heap: batch.analysis.heap,
    memory,
    runtime,
    renderer: {
      resourceGrowth: false,
      resourceBaselineStable: true,
      fingerprintCount: runtime.rendererFingerprintCount,
      fingerprint: rendererFingerprints[0],
      resourceRanges: Object.fromEntries(
        ["gpuBytes", "resourceBytes", "textures", "geometries", "programs", "drawCalls", "candidateNodes"]
          .map((key) => [key, range(samples.map((sample) => sample.renderer[key]))]),
      ),
    },
    console: {
      count: 0,
      cliRaw: batch.analysis.console.cliRaw,
      stderr: "",
      pageAudit: batch.analysis.console.pageAudit,
    },
    samples,
    syntheticHeapPassClaim: false,
  };
}
async function atomicWriteJson(path, value) {
  const partial = `${path}.${process.pid}.part`;
  await rm(partial, { force: true });
  await writeFile(partial, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await rename(partial, path);
}

const args = parseArgs(process.argv.slice(2));
const source = await readCanonicalReceipt(sourcePath, "receiptSha256", "v593-soak-source");
const manifest = await readCanonicalReceipt(manifestPath, "manifestSha256", "v593-soak-manifest");
await verifySourceManifestFiles(source, "v593-soak-source");
const { value: standalone } = await readJsonWithBytes(standalonePath, "v593-soak-standalone");
const { value: lite } = await readJsonWithBytes(litePath, "v593-soak-lite");
const expected = currentIdentity(source, manifest, standalone, lite);
const cdpHeapStage = await readStageJson(args.cdpHeapBatch, "v593-cdp-heap-stage");
const sameRealmStage = await readStageJson(args.sameRealmBatch, "v593-soak-same-realm-stage");
const cdpHeapBatch = cdpHeapStage.value;
const sameRealmBatch = sameRealmStage.value;
const cdpHeapReceipt = await cdpHeapSoak(args.cdpHeapBatch, cdpHeapBatch, expected, cdpHeapStage.error);
const sameRealmReceipt = await sameRealmSceneExit(args.sameRealmBatch, sameRealmBatch, expected, sameRealmStage.error);
const completionTimes = [cdpHeapBatch.completedAt, sameRealmBatch.completedAt]
  .filter((value) => typeof value === "string" && Number.isFinite(Date.parse(value)))
  .sort();
const generatedAt = completionTimes.at(-1) ?? null;
const cdpHeapPassed = cdpHeapReceipt.status === "passed-current-identity-authoritative-cdp-heap-soak";
const sameRealmPassed = sameRealmReceipt.status === "passed-same-realm-resource-zero";
const allSoakEvidencePassed = cdpHeapPassed && sameRealmPassed;
const aggregate = cdpHeapPassed
  ? {
      minimumMedianFps: cdpHeapReceipt.runtime.minimumMedianFps,
      maximumGpuBytes: cdpHeapReceipt.runtime.maximumGpuBytes,
      maximumResourceBytes: cdpHeapReceipt.runtime.maximumResourceBytes,
      maximumDrawCalls: cdpHeapReceipt.runtime.maximumDrawCalls,
      rendererResourceGrowth: false,
      rendererResourceBaselineStable: true,
      canvasCountStable: true,
      payloadUniqueCount: 1,
      scientificWritebackCount: 0,
      resourceRanges: cdpHeapReceipt.renderer.resourceRanges,
    }
  : {
      minimumMedianFps: finiteOrNull(cdpHeapReceipt.runtime?.minimumMedianFps),
      maximumGpuBytes: finiteOrNull(cdpHeapReceipt.runtime?.maximumGpuBytes),
      maximumResourceBytes: finiteOrNull(cdpHeapReceipt.runtime?.maximumResourceBytes),
      maximumDrawCalls: finiteOrNull(cdpHeapReceipt.runtime?.maximumDrawCalls),
      rendererResourceGrowth: "unknown",
      rendererResourceBaselineStable: "unknown",
      canvasCountStable: "unknown",
      payloadUniqueCount: null,
      scientificWritebackCount: null,
      resourceRanges: cdpHeapReceipt.renderer?.resourceRanges ?? null,
    };
const unsigned = {
  version: "v593-soak-v2",
  generatedAt,
  status: allSoakEvidencePassed
    ? "passed-current-identity-cdp-heap-soak-and-same-realm-scene-exit"
    : "blocked-current-identity-cdp-heap-soak-or-same-realm-scene-exit",
  candidate: {
    route: manifest.route,
    buildId: expected.buildId,
    deploymentId: expected.deploymentId,
    sourceManifestSha256: expected.sourceManifestSha256,
    manifestSha256: expected.candidateManifestSha256,
    scientificPayloadSha256,
  },
  cdpHeapSoak: cdpHeapReceipt,
  sameRealmSceneExit: sameRealmReceipt,
  durationSeconds: cdpHeapReceipt.durationSeconds,
  sampleCount: cdpHeapReceipt.sampleCount,
  aggregate,
  memory: cdpHeapReceipt.memory,
  console: cdpHeapReceipt.console,
  authority: {
    scientificPayloadSha256,
    scientificPayloadWriteback: cdpHeapPassed ? false : "unknown",
    scientificAuthorityChanged: cdpHeapPassed ? false : "unknown",
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
  durationSeconds: receipt.durationSeconds,
  sampleCount: receipt.sampleCount,
  minimumMedianFps: receipt.aggregate.minimumMedianFps,
  maximumGpuBytes: receipt.aggregate.maximumGpuBytes,
  rendererResourceGrowth: receipt.aggregate.rendererResourceGrowth,
  jsHeapTelemetry: receipt.memory?.jsHeapTelemetry ?? "unknown",
  sameRealmSceneExitStatus: receipt.sameRealmSceneExit.status,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
