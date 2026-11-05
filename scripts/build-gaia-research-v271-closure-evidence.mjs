import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const EVIDENCE_PATH = "dist/science/gaia-research-v271-closure-evidence.json";
const POINTER_PATH = "dist/release/orbit-atlas-current-local-v271-closure-v275r2.json";
const MANIFEST_PATH = "dist/gaia-research-v271/gaia-research-v271.manifest.json";
const VALIDATION_PATH = "dist/science/gaia-research-v271-closure-validation.json";
const TEST_REPORT_PATH = "dist/science/gaia-research-v271-test-report.json";
const ATTEMPT_ONE_PATH = "dist/science/gaia-research-v271-attempt-1-negative-evidence.json";
const RESOURCE_PATH = "dist/science/resource-preflight-v275r2-evidence.json";
const PRODUCT_POINTER_PATH = "dist/release/orbit-atlas-current-product-evidence-v263.json";
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

const [manifest, validation, tests, attemptOne, resource, productPointer, v263, progress] = await Promise.all([
  readJson(MANIFEST_PATH),
  readJson(VALIDATION_PATH),
  readJson(TEST_REPORT_PATH),
  readJson(ATTEMPT_ONE_PATH),
  readJson(RESOURCE_PATH),
  readJson(PRODUCT_POINTER_PATH),
  readJson("dist/release/orbit-atlas-v263-local-validation-evidence.json"),
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
]);
if (manifest.version !== "v271-gaia-research-aggregate-v2" || manifest.manifestSha256 !== validation.manifest.canonicalSha256) throw new Error("v271 manifest validation mismatch");
if (validation.status !== "passed-v271-generated-integrity" || validation.aggregate.integrity !== "ok") throw new Error("v271 generated integrity is not passing");
if (tests.success !== true || tests.numTotalTests !== 16 || tests.numPassedTests !== 16 || tests.numFailedTests !== 0) throw new Error("v271 focused API tests are not passing");
if (attemptOne.status !== "blocked-v271-aggregate-attempt-1-not-retried") throw new Error("v271 attempt-1 negative evidence is missing");
if (resource.status !== "resource-preflight-passed-heavy-work-authorized-v271-only") throw new Error("v275.2 authorization evidence drifted");
if (productPointer.version !== "v263-current-product-evidence-pointer") throw new Error("Formal product pointer moved away from v263");
if (progress.codeSha256 !== CODE_SHA || progress.finiteObserverScreenManifestSha256 !== SCREEN_SHA) throw new Error("Protected science SHA changed");
if (v263.contracts?.legacyRootAttributes !== 603 || v263.contracts?.evidenceLedgerClaims !== 84) throw new Error("Frozen contracts changed");

const generatedAt = new Date().toISOString();
const evidence = {
  version: "v271-gaia-research-closure-evidence-v1",
  generatedAt,
  status: "implemented-awaiting-browser-qualification",
  capabilityState: "implemented-awaiting-browser-qualification",
  attempts: {
    attempt1: {
      source: ATTEMPT_ONE_PATH,
      sourceSha256: await fileSha(ATTEMPT_ONE_PATH),
      status: attemptOne.status,
      retainedAsNegativeEvidence: true,
    },
    attempt2: {
      command: "npm run atlas -- catalog research-v271",
      startedAt: "2026-07-20T07:42:42.1790761Z",
      endedAt: "2026-07-20T07:42:43.7671045Z",
      durationMs: 1583,
      exitCode: 0,
      explicitUserAuthorization: "授权 v271 attempt 2",
      automaticRetryApplied: false,
      checkpointResumeApplied: true,
    },
  },
  aggregate: {
    manifest: { path: MANIFEST_PATH, fileSha256: await fileSha(MANIFEST_PATH), canonicalSha256: manifest.manifestSha256 },
    sqlite: manifest.aggregate,
    inputs: {
      science: manifest.scienceSource,
      mother: manifest.motherCatalog,
      astropyHealpix: manifest.dependencies.astropyHealpix,
    },
    counts: manifest.counts,
    contentAddressed: validation.aggregate.contentAddressed,
    integrity: validation.aggregate.integrity,
    checkpoint: validation.checkpoint,
  },
  validation: {
    generatedIntegrity: { path: VALIDATION_PATH, sha256: await fileSha(VALIDATION_PATH), status: validation.status },
    focusedTests: {
      path: TEST_REPORT_PATH,
      sha256: await fileSha(TEST_REPORT_PATH),
      files: 4,
      total: tests.numTotalTests,
      passed: tests.numPassedTests,
      failed: tests.numFailedTests,
    },
    api: {
      overview: "passed",
      healpixDensity: "passed",
      hrDensity: "passed",
      selectionGaiaIdDenominator: "passed",
      selectionPresentationDenominator: "passed",
      unsupportedFieldAndSqlAdqlInjection: "rejected",
      responseMaximumBytes: 2 * 1024 * 1024,
      lite: "explicit-unavailable-no-local-path",
    },
    export: {
      json: "passed-provenance-units-boundary",
      csv: "passed-provenance-units-boundary",
      gaiaSurveyCompleteness: "unavailable",
    },
    browserQualification: "not-run",
  },
  implementation: {
    builderSha256: await fileSha("scripts/build-gaia-research-v271.py"),
    queryContractSha256: await fileSha("app/lib/gaiaResearchWorkbenchV271.ts"),
    queryServiceSha256: await fileSha("app/lib/gaiaResearchQueryServiceV271.ts"),
    queryWorkerSha256: await fileSha("app/workers/gaiaResearchQuery.worker.mjs"),
    routeSha256: await fileSha("app/api/atlas/science-workbench/route.ts"),
    workbenchSha256: await fileSha("app/components/GaiaScienceAnalysisPanel.tsx"),
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
  release: {
    formalProductPointer: PRODUCT_POINTER_PATH,
    formalProductPointerSha256: await fileSha(PRODUCT_POINTER_PATH),
    formalProductPointerAdvanced: false,
    formalProductVersion: "v263",
    defaultVisualProfile: "legacy-v9",
    localShadowPromotionApplied: false,
    v272ShardSeriesStarted: false,
    publicDeploymentBlocked: true,
  },
  boundary: "frozen-200k-derived-research-implemented-not-browser-qualified-not-survey-completeness-or-physics",
};
evidence.evidenceSha256 = canonicalSha(evidence);
await writeFile(resolve(ROOT, EVIDENCE_PATH), `${JSON.stringify(evidence, null, 2)}\n`);

const pointer = {
  version: "orbit-atlas-current-local-v271-closure-v275r2",
  generatedAt,
  status: evidence.status,
  source: { path: EVIDENCE_PATH, sha256: await fileSha(EVIDENCE_PATH) },
  priorNegativeEvidence: { path: ATTEMPT_ONE_PATH, sha256: evidence.attempts.attempt1.sourceSha256 },
  formalProductPointer: PRODUCT_POINTER_PATH,
  formalProductPointerSha256: evidence.release.formalProductPointerSha256,
  formalProductPointerAdvanced: false,
  capabilities: {
    v271: { state: "implemented-awaiting-browser-qualification", reason: "aggregate, API, Lite and provenance gates passed" },
    v272: { state: "ready-for-resource-gated-shard-series", reason: "v271 dependency closed; no shard started by this evidence step" },
    v273: { state: "not-started", reason: "v272 catalog dependency remains incomplete" },
    v274: { state: "not-started", reason: "v272 catalog dependency remains incomplete" },
    v275: { state: "not-started", reason: "v272 catalog dependency remains incomplete" },
  },
  automaticRetryApplied: false,
  localShadowPromotionApplied: false,
  publicDeploymentBlocked: true,
};
pointer.pointerSha256 = canonicalSha(pointer);
await writeFile(resolve(ROOT, POINTER_PATH), `${JSON.stringify(pointer, null, 2)}\n`);
console.log(JSON.stringify({ evidence: EVIDENCE_PATH, evidenceSha256: evidence.evidenceSha256, pointer: POINTER_PATH, pointerSha256: pointer.pointerSha256, status: evidence.status }, null, 2));
