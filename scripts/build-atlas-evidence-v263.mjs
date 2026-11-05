import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const RELEASE = resolve(ROOT, "dist/release");
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));

const previousPath = "dist/release/orbit-atlas-v262-local-candidate-evidence.json";
const resultPath = "dist/science/browser-fresh-v263-result.json";
const [previous, result] = await Promise.all([readJson(previousPath), readJson(resultPath)]);
const unsignedResult = { ...result };
delete unsignedResult.resultSha256;
if (sha256(canonicalJson(unsignedResult)) !== result.resultSha256) throw new Error("v263 browser result canonical SHA mismatch");
if (result.status !== "passed-corrected-fresh-matrix") throw new Error(`v263 fresh result is not passing: ${result.status}`);
if (result.playwrightExitCode !== 0 || result.wrapperExitCode !== 0 || result.timedOut !== false) throw new Error("v263 fresh process result is not passing");
if (result.summary?.expected !== 21 || result.summary?.skipped !== 1 || result.summary?.unexpected !== 0) throw new Error("v263 fresh summary differs from 21 passed / 1 expected skip");
if (result.harness?.files !== 11 || result.harness?.tests !== 22 || result.harness?.workers !== 1 || result.harness?.retries !== 0) throw new Error("v263 fresh harness contract changed");
if (Object.values(result.runtimeTotals ?? {}).some((value) => value !== 0)) throw new Error("v263 runtime error totals are non-zero");
if (result.cleanup?.port3015Clear !== true) throw new Error("v263 port 3015 cleanup did not pass");
if (previous.science?.defaultKernel !== "legacy-eih-1pn") throw new Error("default science kernel changed");
if (previous.science?.v8?.codeSha256 !== "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8") throw new Error("science code SHA changed");
if (previous.science?.v8?.screenSha256 !== "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037") throw new Error("science screen SHA changed");
if (previous.contracts?.workerPhysicsMutation !== "not-applied" || previous.contracts?.eihOnePnMutation !== "not-applied") throw new Error("protected physics mutation changed");

const generatedAt = new Date().toISOString();
const manifest = structuredClone(previous);
delete manifest.manifestSha256;
manifest.version = "v263-local-validation-evidence-v1";
manifest.generatedAt = generatedAt;
manifest.validation.browserQa = {
  status: "passed-corrected-fresh-matrix",
  dedicatedGates: previous.validation.browserQa.dedicatedGates,
  historicalNegativeEvidence: {
    source: previous.validation.browserQa.evidencePath,
    firstAttempt: previous.validation.browserQa.fullFresh.firstAttempt,
    secondAttempt: previous.validation.browserQa.fullFresh.finalAttempt,
    correctedFailedAttempt: previous.validation.browserQa.fullFresh.correctedHarness.correctedAttempt,
  },
  correctedFreshMatrix: {
    source: resultPath,
    sourceSha256: await fileSha256(resultPath),
    resultSha256: result.resultSha256,
    buildId: result.build.buildId,
    startedAt: result.startedAt,
    endedAt: result.endedAt,
    elapsedMs: result.elapsedMs,
    playwrightExitCode: result.playwrightExitCode,
    wrapperExitCode: result.wrapperExitCode,
    summary: result.summary,
    runtimeTotals: result.runtimeTotals,
    expectedSkip: result.expectedSkip,
    cleanup: result.cleanup,
    automaticRetryApplied: result.automaticRetryApplied,
    assertionOrThresholdRelaxationApplied: result.assertionOrThresholdRelaxationApplied,
  },
  formalThirtyCycleSoak: previous.validation.browserQa.formalThirtyCycleSoak,
  evidencePath: resultPath,
};
manifest.release.localCandidateValidationStatus = "local-validation-passed-public-deployment-blocked";
manifest.release.blockers = [
  "Cosmicflows-4 redistribution license unconfirmed",
  "GaiaUnlimited completeness dependency blocked",
];
manifest.boundary = "v263-product-browser-closure-no-kerr-stm-weak-field-or-runtime-physics-mutation";
manifest.manifestSha256 = sha256(canonicalJson(manifest));

const outputPath = resolve(RELEASE, "orbit-atlas-v263-local-validation-evidence.json");
const pointerPath = resolve(RELEASE, "orbit-atlas-current-product-evidence-v263.json");
const generatedTsPath = resolve(ROOT, "app/lib/atlasDynamicEvidenceV263.generated.ts");
const dossierPath = resolve(RELEASE, "orbit-atlas-v263-local-validation-dossier.md");
await mkdir(RELEASE, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
const outputSha256 = await fileSha256("dist/release/orbit-atlas-v263-local-validation-evidence.json");
await writeFile(pointerPath, `${JSON.stringify({
  version: "v263-current-product-evidence-pointer",
  generatedAt,
  source: "dist/release/orbit-atlas-v263-local-validation-evidence.json",
  sourceSha256: outputSha256,
  scienceSource: manifest.science.sourceEvidence.currentPath,
  scienceSourceSha256: manifest.science.sourceEvidence.currentSha256,
  localCandidateValidationStatus: manifest.release.localCandidateValidationStatus,
  publicDeploymentBlocked: true,
  vercelApplied: false,
}, null, 2)}\n`);
await writeFile(generatedTsPath, `/* Generated by scripts/build-atlas-evidence-v263.mjs. */\nexport const ATLAS_DYNAMIC_EVIDENCE_V263 = ${JSON.stringify(manifest, null, 2)} as const;\n`);
await writeFile(dossierPath, `# Orbit Atlas v263 Local Validation Dossier\n\nGenerated: ${generatedAt}\n\n- Browser fresh matrix: **21 passed / 1 expected desktop skip / 0 failed**.\n- Runtime errors: console 0; page 0; missing resources 0; Renderer Fault 0.\n- Standalone build: **${result.build.buildId}**.\n- Automatic retry: **not applied**. Assertion or threshold relaxation: **not applied**.\n- Science: **science-failed-shadow-retained**; default kernel **legacy-eih-1pn**; code/screen SHA unchanged.\n- Local validation: **local-validation-passed-public-deployment-blocked**.\n- Public blockers: Cosmicflows-4 redistribution license and GaiaUnlimited completeness dependency.\n- Vercel/production/DNS/signing/Desktop Beta: **not applied**.\n`);
console.log(JSON.stringify({
  generated: true,
  validationStatus: manifest.release.localCandidateValidationStatus,
  output: outputPath,
  outputSha256,
  manifestSha256: manifest.manifestSha256,
  browserResultSha256: result.resultSha256,
  scienceCodeSha256: manifest.science.v8.codeSha256,
  scienceScreenSha256: manifest.science.v8.screenSha256,
}, null, 2));
