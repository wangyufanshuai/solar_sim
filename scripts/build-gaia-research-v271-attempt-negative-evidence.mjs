import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const EVIDENCE_PATH = "dist/science/gaia-research-v271-attempt-1-negative-evidence.json";
const POINTER_PATH = "dist/release/orbit-atlas-current-local-v271-closure-v275r2.json";
const AUDIT_PATH = "dist/science/gaia-research-v271-attempt-1-part-audit.json";
const RESOURCE_PATH = "dist/science/resource-preflight-v275r2-evidence.json";
const RECOVERY_DIAGNOSTIC_PATH = "dist/science/gaia-research-v271-recovery-diagnostic.json";
const PRODUCT_POINTER_PATH = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const PART_PATH = "dist/gaia-research-v271/gaia-research-v271.sqlite.part";
const ATTEMPTED_BUILDER_SHA = "e2035d195e27704bcb51ed56dd0a600531e340c7663372ee1a34df4e65aa5522";
const CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalSha = (value) => sha256(JSON.stringify(canonicalize(value)));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha = async (path) => sha256(await readFile(resolve(ROOT, path)));

const [audit, recoveryDiagnostic, resource, shadow, productPointer, v263, progress] = await Promise.all([
  readJson(AUDIT_PATH),
  readJson(RECOVERY_DIAGNOSTIC_PATH),
  readJson(RESOURCE_PATH),
  readJson("dist/science/gaia-research-v271-shadow-evidence.json"),
  readJson(PRODUCT_POINTER_PATH),
  readJson("dist/release/orbit-atlas-v263-local-validation-evidence.json"),
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
]);
if (resource.status !== "resource-preflight-passed-heavy-work-authorized-v271-only") throw new Error("v275.2 did not authorize the v271 attempt");
if (resource.userAuthorizedThresholdOverride?.requestedExecutionMemoryGiB !== 6.48) throw new Error("v275.2 user memory override drifted");
if (shadow.implementation?.sourceHashes?.["scripts/build-gaia-research-v271.py"] !== ATTEMPTED_BUILDER_SHA) throw new Error("Attempted v271 builder SHA is not preserved by prior evidence");
if (audit.part?.integrity !== "ok" || audit.part?.sha256 !== await fileSha(PART_PATH)) throw new Error("Retained v271 part audit is invalid");
if (recoveryDiagnostic.status !== "passed-recovery-diagnostic-only" || recoveryDiagnostic.formalAttemptConsumed !== false || recoveryDiagnostic.sourcePart?.sha256 !== audit.part.sha256) throw new Error("v271 recovery diagnostic is invalid");
if (productPointer.version !== "v263-current-product-evidence-pointer") throw new Error("Formal product pointer moved away from v263");
if (progress.codeSha256 !== CODE_SHA || progress.finiteObserverScreenManifestSha256 !== SCREEN_SHA) throw new Error("Protected science SHA changed");
if (v263.contracts?.legacyRootAttributes !== 603 || v263.contracts?.evidenceLedgerClaims !== 84) throw new Error("Frozen public contracts changed");

const generatedAt = new Date().toISOString();
const partStat = statSync(resolve(ROOT, PART_PATH));
const expected = {
  scienceRows: 200000,
  gold: 30028,
  silver: 169972,
  limited: 0,
  skyOrder3Rows: 200000,
  skyOrder5Rows: 200000,
  motherPresentationRows: 1066208,
  motherGaiaIdRows: 1047028,
  motherWithoutGaiaIdRows: 19180,
  selectedRows: 199957,
  rawHrRows: 159330,
  astrophysicalOverlapRows: 51145,
};
const evidence = {
  version: "v271-gaia-research-attempt-1-negative-evidence-v1",
  generatedAt,
  status: "blocked-v271-aggregate-attempt-1-not-retried",
  capabilityState: "blocked",
  attempt: {
    ordinal: 1,
    command: "npm run atlas -- catalog research-v271",
    exitCode: 1,
    durationMs: 21800,
    durationMeasurementResolutionMs: 100,
    automaticRetryApplied: false,
    thresholdRelaxationApplied: false,
    error: {
      exception: "TypeError",
      message: "'NoneType' object is not subscriptable",
      source: "scripts/build-gaia-research-v271.py",
      line: 416,
      function: "scalar",
      expression: "db.execute(query, params).fetchone()[0]",
      trigger: "quality_summary has no materialized row for the valid zero-count limited tier",
    },
    attemptedBuilderSha256: ATTEMPTED_BUILDER_SHA,
    lastArtifactWriteAt: partStat.mtime.toISOString(),
  },
  authorization: {
    source: RESOURCE_PATH,
    sourceSha256: await fileSha(RESOURCE_PATH),
    sourceEvidenceSha256: resource.evidenceSha256,
    requestedExecutionMemoryGiB: 6.48,
    status: resource.status,
    scope: "v271-aggregate-only",
  },
  retainedPart: {
    path: PART_PATH,
    bytes: audit.part.bytes,
    sha256: audit.part.sha256,
    integrity: audit.part.integrity,
    audit: { path: AUDIT_PATH, sha256: await fileSha(AUDIT_PATH), readOnly: true },
    checkpoint: audit.checkpoint,
    conservation: audit.conservation,
    expected,
    checkpointReusable: true,
  },
  recoveryAuditFinding: {
    status: "correction-prepared-not-formally-reexecuted",
    missingZeroTierBehavior: "scalar now maps an absent aggregate row to zero",
    overlapSummary: {
      retainedCount: 51133,
      frozenExpectedCount: 51145,
      excludedByPresentationPlotBounds: 12,
      cause: "provenance overlap counting was incorrectly coupled to G/BP-RP presentation-bin eligibility",
      correction: "reconcile overlap provenance from frozen source IDs independently of HR/CMD bounds",
    },
    currentBuilderSha256: await fileSha("scripts/build-gaia-research-v271.py"),
    recoveryFixture: "scripts/test-gaia-research-v271.py",
    recoveryFixtureSha256: await fileSha("scripts/test-gaia-research-v271.py"),
    temporaryCopyDiagnostic: {
      path: RECOVERY_DIAGNOSTIC_PATH,
      sha256: await fileSha(RECOVERY_DIAGNOSTIC_PATH),
      status: recoveryDiagnostic.status,
      formalAttemptConsumed: recoveryDiagnostic.formalAttemptConsumed,
      publishCalled: recoveryDiagnostic.publishCalled,
      integrity: recoveryDiagnostic.integrity,
      counts: recoveryDiagnostic.counts,
    },
  },
  publication: {
    manifestPath: "dist/gaia-research-v271/gaia-research-v271.manifest.json",
    manifestPublished: existsSync(resolve(ROOT, "dist/gaia-research-v271/gaia-research-v271.manifest.json")),
    publishPartPresent: existsSync(resolve(ROOT, "dist/gaia-research-v271/gaia-research-v271.publish.sqlite.part")),
    aggregateQualified: false,
    formalProductPointerAdvanced: false,
    localShadowPromotionApplied: false,
  },
  downstream: {
    v272ShardSeriesStarted: false,
    gaia10mBuildStarted: false,
    v273ToV275HeavyClosureStarted: false,
    playwrightStarted: false,
    soakStarted: false,
    rtxStarted: false,
    stopReason: "v271 attempt 1 failed; a new explicit user-authorized attempt is required",
  },
  science: {
    status: "science-failed-shadow-retained",
    defaultKernel: "legacy-eih-1pn",
    codeSha256: CODE_SHA,
    screenSha256: SCREEN_SHA,
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrMutation: "not-applied",
    campaignRerunApplied: false,
  },
  contracts: {
    legacyRootAttributes: 603,
    legacyRootKeySha256: v263.contracts.legacyRootKeySha256,
    evidenceLedgerClaims: 84,
    evidenceLedgerCanonicalSha256: v263.contracts.evidenceLedgerCanonicalSha256,
    singleCanvas: true,
    sceneRevisionSemanticsChanged: false,
  },
  formalProduct: {
    pointer: PRODUCT_POINTER_PATH,
    pointerSha256: await fileSha(PRODUCT_POINTER_PATH),
    version: "v263",
    advanced: false,
    defaultVisualProfile: "legacy-v9",
  },
  boundary: "failed-derived-data-build-only-no-physics-science-campaign-or-public-release",
};
evidence.evidenceSha256 = canonicalSha(evidence);

await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
await writeFile(resolve(ROOT, EVIDENCE_PATH), `${JSON.stringify(evidence, null, 2)}\n`);
const pointer = {
  version: "orbit-atlas-current-local-v271-closure-v275r2",
  generatedAt,
  status: evidence.status,
  source: { path: EVIDENCE_PATH, sha256: await fileSha(EVIDENCE_PATH) },
  formalProductPointer: PRODUCT_POINTER_PATH,
  formalProductPointerSha256: evidence.formalProduct.pointerSha256,
  formalProductPointerAdvanced: false,
  capabilities: {
    v271: { state: "blocked", reason: "attempt-1-final-validation-zero-tier-boundary; correction prepared; explicit new attempt required" },
    v272: { state: "not-started", reason: "v271 dependency stopped execution chain" },
    v273: { state: "not-started", reason: "v271 dependency stopped execution chain" },
    v274: { state: "not-started", reason: "v271 dependency stopped execution chain" },
    v275: { state: "not-started", reason: "v271 dependency stopped execution chain" },
  },
  automaticRetryApplied: false,
  localShadowPromotionApplied: false,
  publicDeploymentBlocked: true,
};
pointer.pointerSha256 = canonicalSha(pointer);
await writeFile(resolve(ROOT, POINTER_PATH), `${JSON.stringify(pointer, null, 2)}\n`);
console.log(JSON.stringify({ evidence: EVIDENCE_PATH, evidenceSha256: evidence.evidenceSha256, pointer: POINTER_PATH, pointerSha256: pointer.pointerSha256, status: evidence.status }, null, 2));
