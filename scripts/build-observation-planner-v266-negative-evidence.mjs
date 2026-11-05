import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const ROOT = resolve(".");
const REPORTER = "dist/science/observation-planner-v266-browser-result.json";
const ARTIFACT_ROOT = "dist/science/observation-planner-v266-failed-attempt";
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;

const [reporter, progress, productPointer, v264r3, v265] = await Promise.all([
  readJson(REPORTER),
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
  readJson("dist/release/orbit-atlas-current-product-evidence-v263.json"),
  readJson("dist/science/catalog-stream-v264r3-preflight-negative-evidence.json"),
  readJson("dist/science/gaia-presentation-v265-negative-evidence.json"),
]);
if (progress.codeSha256 !== EXPECTED_CODE_SHA || progress.finiteObserverScreenManifestSha256 !== EXPECTED_SCREEN_SHA) {
  throw new Error("Science SHA changed before v266 evidence closure");
}
if (reporter.stats?.unexpected !== 2 || reporter.stats?.expected !== 0 || reporter.config?.projects?.length !== 2) {
  throw new Error("v266 reporter does not describe the single two-project failed gate");
}

await mkdir(resolve(ROOT, ARTIFACT_ROOT), { recursive: true });
const attempts = [];
for (const spec of reporter.suites.flatMap((suite) => suite.specs ?? [])) {
  for (const test of spec.tests ?? []) {
    const result = test.results?.[0];
    if (!result || result.status !== "failed" || result.retry !== 0) {
      throw new Error(`Unexpected v266 result for ${test.projectName}`);
    }
    const runtimeAuditAttachment = result.attachments.find((entry) => entry.name === "atlas-runtime-audit-v263");
    const runtimeAudit = runtimeAuditAttachment?.body
      ? JSON.parse(Buffer.from(runtimeAuditAttachment.body, "base64").toString("utf8"))
      : null;
    const copiedArtifacts = [];
    for (const attachment of result.attachments.filter((entry) => entry.path)) {
      const source = resolve(attachment.path);
      const targetRelative = `${ARTIFACT_ROOT}/${test.projectName}-${basename(source)}`;
      await copyFile(source, resolve(ROOT, targetRelative));
      copiedArtifacts.push({
        name: attachment.name,
        path: targetRelative,
        bytes: (await stat(resolve(ROOT, targetRelative))).size,
        sha256: await fileSha256(targetRelative),
      });
    }
    attempts.push({
      project: test.projectName,
      status: result.status,
      durationMs: result.duration,
      retry: result.retry,
      failureClass: "playwright-strict-selector-ambiguity",
      failureLocation: result.errorLocation,
      error: result.error?.message ?? "",
      runtimeAudit,
      milestonesBeforeFailure: [
        "single-canvas",
        "visible-research-mode-route",
        "exclusive-observing-planner-sheet",
        "observation-worker-result",
        "lazy-recharts-visible",
      ],
      artifacts: copiedArtifacts,
    });
  }
}
if (attempts.some((attempt) => !attempt.error.includes("strict mode violation") || !attempt.error.includes("搜索"))) {
  throw new Error("v266 failure is not the diagnosed search selector ambiguity");
}
if (attempts.some((attempt) => !attempt.runtimeAudit || attempt.runtimeAudit.consoleErrors.length || attempt.runtimeAudit.pageErrors.length || attempt.runtimeAudit.missingResources.length || attempt.runtimeAudit.rendererFaults !== 0)) {
  throw new Error("v266 runtime audit contains a browser or resource failure");
}

const sourceFiles = [
  "app/lib/observationPlannerV1.ts",
  "app/lib/observationPlannerV2.ts",
  "app/lib/useObservationPlannerWorkerV266.ts",
  "app/workers/observationPlanner.worker.ts",
  "app/components/ObservingPlannerPanel.tsx",
  "app/components/ObservationPlannerChartsV266.tsx",
  "app/components/ObservationFovOverlayV266.tsx",
  "app/lib/useResearchOverlayBoundaryV266.ts",
  "tests/atlas-browser/atlas-observation-planner-v266.spec.ts",
  "playwright.atlas.observation-v266.config.ts",
];
const evidence = {
  version: "v266-observation-planner-negative-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "blocked-browser-selector-ambiguity-shadow-retained",
  phasePromotionApplied: false,
  implementation: {
    planner: "ObservationPlannerViewModelV2",
    worker: "observation-planner-v266-presentation-only",
    durationHours: [24, 48, 72],
    observerProfileLimit: 10,
    fovProfileLimit: 10,
    chartLoading: "research-intent-lazy-recharts",
    exports: ["json", "csv", "ics"],
    weatherBoundary: "optional-transient-weather-not-science-evidence",
    fovBoundary: "camera-relative-presentation-no-scene-revision",
    focusedGate: { status: "passed", files: 13, tests: 41 },
    typeScript: "passed",
    eslint: "passed-with-one-pre-existing-unused-local-warning",
    standaloneBuild: { status: "passed", buildId: (await readFile(resolve(ROOT, ".next-atlas-standalone-current/BUILD_ID"), "utf8")).trim() },
    sourceHashes: Object.fromEntries(await Promise.all(sourceFiles.map(async (path) => [path, await fileSha256(path)]))),
  },
  browserGate: {
    command: "npx playwright test --config=playwright.atlas.observation-v266.config.ts",
    projects: ["desktop-v266", "mobile-v266"],
    workers: 1,
    retries: 0,
    attempts: 1,
    durationMs: reporter.stats.duration,
    passed: 0,
    failed: 2,
    reporter: { path: REPORTER, bytes: (await stat(resolve(ROOT, REPORTER))).size, sha256: await fileSha256(REPORTER) },
    results: attempts,
    correctedSelectorPrepared: true,
    correctedSelector: "planner.getByRole(button, { name: search, exact: true })",
    correctedFormalRerunApplied: false,
    automaticRetryApplied: false,
    thresholdRelaxationApplied: false,
  },
  release: {
    currentProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
    currentProductPointerSha256: await fileSha256("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    currentProductStatus: productPointer.localCandidateValidationStatus,
    pointerAdvancedToV266: false,
    publicDeploymentBlocked: true,
    vercelApplied: false,
  },
  priorNegativeEvidence: {
    v264r3: { status: v264r3.status, evidenceSha256: v264r3.evidenceSha256 },
    v265: { status: v265.status, evidenceSha256: v265.evidenceSha256 },
  },
  science: {
    status: "science-failed-shadow-retained",
    defaultKernel: "legacy-eih-1pn",
    codeSha256: progress.codeSha256,
    screenSha256: progress.finiteObserverScreenManifestSha256,
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrMutation: "not-applied",
  },
  boundary: "v266-product-browser-gate-failed-on-test-selector-after-worker-and-chart-milestones-no-retry-no-product-promotion-no-science-mutation",
};
evidence.evidenceSha256 = sha256(JSON.stringify(canonicalize(evidence)));
const evidencePath = "dist/science/observation-planner-v266-negative-evidence.json";
await writeFile(resolve(ROOT, evidencePath), `${JSON.stringify(evidence, null, 2)}\n`);

const shadowPointer = {
  version: "orbit-atlas-current-local-shadow-candidate-v266",
  generatedAt: evidence.generatedAt,
  status: "blocked-v266-browser-matrix-product-pointer-v263-retained",
  productPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  productPointerSha256: await fileSha256("dist/release/orbit-atlas-current-product-evidence-v263.json"),
  source: evidencePath,
  sourceSha256: await fileSha256(evidencePath),
  implementedCapabilities: ["observation-worker", "profiles", "location-search", "weather", "charts", "horizon", "fov-overlay", "exports", "exclusive-research-sheet"],
  promotionApplied: false,
  formalRerunRequiresExplicitUserAuthorization: true,
  publicDeploymentBlocked: true,
};
await writeFile(resolve(ROOT, "dist/release/orbit-atlas-current-local-shadow-candidate-v266.json"), `${JSON.stringify(shadowPointer, null, 2)}\n`);
console.log(JSON.stringify({
  evidence: evidencePath,
  status: evidence.status,
  evidenceSha256: evidence.evidenceSha256,
  browserFailed: 2,
  automaticRetryApplied: false,
  productPointer: "v263",
}, null, 2));
