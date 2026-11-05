import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { BOUNDARY, readPinnedFile, safeFile, sha256 } from "./mainline-a-release-evidence.mjs";
import { verifyPackage } from "./verify-mainline-a-release-package.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "docs/release/v607/mainline-a-r66-v646-evidence-supplement-20261007.json";
const BASE = "docs/release/v607/mainline-a-r66-package-20261007-v645-final-candidate/manifest.json";
const REFERENCES = Object.freeze([
  ["canonicalBrowserClosure", "docs/release/v607/mainline-a-r66-canonical-36-browser-closure-20261007.json", "browser"],
  ["baseCandidateSupplement", "docs/release/v607/mainline-a-r66-final-candidate-supplement-20261007.json", "static"],
  ["wdsComponentReview", "docs/release/v607/mainline-a-r66-stellar-component-review-packet-20261007.json", "external-source"],
  ["tapRawLedger", "docs/release/v607/stellar-component-tap-v646/ledger-r66-tap-20261007-001.json", "external-source"],
  ["tapOfflineReplay", "docs/release/v607/stellar-component-tap-v646/replay-r66-tap-20261007-001.json", "external-source"],
  ["tapCrossIdAnalysis", "docs/release/v607/stellar-component-tap-v646/analysis-r66-tap-20261007-001.json", "external-source"],
  ["tapReviewAddendum", "docs/release/v607/mainline-a-r66-stellar-tap-cross-id-addendum-20261007.md", "static"],
  ["rootManifestProbe", "docs/release/v607/mainline-a-r66-root-manifest-probe-20261007-v645.json", "static"],
]);
const GATES = Object.freeze({
  rootManifestParity: "pending",
  stellarComponentIdentity: "pending-0-of-4",
  nebulaRightsSignoff: "pending-0-of-12",
  physicalMobile: "not-run",
  finalRelease: "blocked",
});
const CLAIMS = Object.freeze({
  releaseApproved: false,
  runtimeAdmission: false,
  scientificValidity: false,
  realUserValidation: false,
  productionPerformance: false,
  copyrightApproval: false,
});
const assert = (value, code) => { if (!value) throw new Error(`r66-v646:${code}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function descriptor(role, relative, evidenceClass) {
  const file = await safeFile(ROOT, relative);
  const bytes = await readFile(file.absolute);
  return { role, path: relative, bytes: bytes.length, sha256: sha256(bytes), evidenceClass };
}

export function validateSupplementPolicy(manifest) {
  assert(manifest?.schema === "mainline-a-r66-evidence-supplement-v646", "schema");
  assert(manifest.status === "blocked" && manifest.runtimePayloadIncluded === false, "release-state");
  assert(Number.isFinite(Date.parse(manifest.createdAt)), "timestamp");
  for (const [key, value] of Object.entries(BOUNDARY)) assert(manifest.boundary?.[key] === value, `boundary:${key}`);
  assert(same(manifest.gates, GATES), "gates");
  assert(same(manifest.claims, CLAIMS), "claims");
  assert(manifest.sourceSha256 === "93b297e97cc3a2cee8d72e8c91a43ff64b55d3c75b975b6476e027dfa6844f98", "source-binding");
  assert(manifest.basePackage?.role === "basePackage" && manifest.basePackage.path === BASE &&
    manifest.basePackage.evidenceClass === "static", "base-package");
  assert(Array.isArray(manifest.references) && manifest.references.length === REFERENCES.length, "reference-count");
  assert(REFERENCES.every(([role, relative, evidenceClass], index) => {
    const item = manifest.references[index];
    return item?.role === role && item.path === relative && item.evidenceClass === evidenceClass;
  }), "reference-set");
  return true;
}

function executeJson(script, args) {
  return JSON.parse(execFileSync(process.execPath, [script, ...args], {
    cwd: ROOT, encoding: "utf8", timeout: 60_000, maxBuffer: 2 * 1024 * 1024,
  }));
}

async function createSupplement() {
  const basePackage = await descriptor("basePackage", BASE, "static");
  const base = JSON.parse((await readPinnedFile(ROOT, basePackage, "basePackage")).raw);
  assert(base.status === "blocked" && base.runtimePayloadIncluded === false, "base-state");
  const current = await captureBuildInputs();
  assert(current.sha256 === base.build.sourceSha256, "current-source-drift");
  const references = await Promise.all(REFERENCES.map(([role, relative, evidenceClass]) =>
    descriptor(role, relative, evidenceClass)));
  return {
    schema: "mainline-a-r66-evidence-supplement-v646",
    createdAt: new Date().toISOString(),
    status: "blocked",
    evidenceClass: "pinned-supplemental-index",
    sourceSha256: current.sha256,
    basePackage,
    references,
    gates: GATES,
    claims: CLAIMS,
    boundary: BOUNDARY,
    runtimePayloadIncluded: false,
    note: "Append-only evidence reference; does not mutate or promote the V645 candidate package.",
  };
}

export async function verifySupplement(manifest) {
  validateSupplementPolicy(manifest);
  const [base, ...references] = await Promise.all([
    readPinnedFile(ROOT, manifest.basePackage, "basePackage"),
    ...manifest.references.map((item) => readPinnedFile(ROOT, item, item.role)),
  ]);
  const baseReport = await verifyPackage(ROOT, BASE, { current: true });
  assert(baseReport.status === "blocked" && baseReport.currentSourceVerified && !baseReport.releaseApproved,
    "base-package-replay");
  assert(sha256(base.raw) === baseReport.manifest.sha256, "base-package-digest");
  const current = await captureBuildInputs();
  assert(current.sha256 === manifest.sourceSha256, "current-source-drift");
  const byRole = Object.fromEntries(references.map((item) => [item.record.role, item.raw]));
  const closure = JSON.parse(byRole.canonicalBrowserClosure);
  const previous = JSON.parse(byRole.baseCandidateSupplement);
  const probe = JSON.parse(byRole.rootManifestProbe);
  assert(closure.coverage.total === 36 && closure.coverage.individuallyReplayed === 36 &&
    closure.coverage.localBrowserOnly === true && closure.gates.finalRelease === "blocked", "browser-coverage");
  assert(Array.isArray(closure.observations) && closure.observations.length === 36 &&
    new Set(closure.observations.map((item) => item.key)).size === 36, "browser-observation-set");
  const observationFiles = await Promise.all(closure.observations.map(async (item) => {
    assert(item.status === "measured-local", `browser-observation-state:${item.key}`);
    const pinned = await readPinnedFile(ROOT, { ...item.raw, evidenceClass: "browser" }, item.key);
    const raw = JSON.parse(pinned.raw);
    assert(raw.runId === item.runId &&
      `${raw.objectCycle?.target?.kind}:${raw.objectCycle?.target?.id}` === item.key &&
      raw.objectCycle?.manifestDigest === "1b710eda006fbdd1908b8c0cb070b546bdfd12d3fe96f9f315d3640f0a627377" &&
      raw.build?.buildId === `mainline-a-${manifest.sourceSha256.slice(0, 16)}` &&
      raw.boundary?.scientificPayloadWriteback === false, `browser-observation-binding:${item.key}`);
    return pinned;
  }));
  const batchRoles = ["browserExport", "offlineIntake", "independentIndex", "independentReplay", "rejectedFirstAttempt"];
  assert(batchRoles.every((role) => closure.batch?.[role]), "browser-batch-set");
  await Promise.all(batchRoles.map((role) => readPinnedFile(ROOT,
    { ...closure.batch[role], evidenceClass: role === "browserExport" || role === "rejectedFirstAttempt" ? "browser" : "static" },
    `browser-batch:${role}`)));
  assert(previous.status === "blocked" && previous.basePackage.sha256 === manifest.basePackage.sha256,
    "base-supplement-binding");
  assert(probe.status === "blocked" && probe.parity.rootManifestPresent === false &&
    probe.writes.root === false && probe.writes.parentGit === false, "root-readonly-gate");
  const tapScript = "docs/release/v607/stellar-component-tap-v646/collect-and-replay.mjs";
  const analysisScript = "docs/release/v607/stellar-component-tap-v646/analyze-cross-ids.mjs";
  const rawLedger = manifest.references.find((item) => item.role === "tapRawLedger");
  const replay = executeJson(tapScript, ["--check", rawLedger.path, "--expected-sha256", rawLedger.sha256]);
  const analysis = executeJson(analysisScript, ["--check"]);
  assert(replay.status === "verified-candidate-only" && replay.counts.responseCaptured === 4 &&
    replay.counts.failed === 0 && replay.componentIdentityConfirmed === false, "tap-raw-replay");
  assert(analysis.status === "verified-candidate-only" && analysis.summary.heroToWdsPrimaryCrossIdsMatched === 4 &&
    analysis.summary.physicalComponentIdentitiesConfirmed === 0, "tap-analysis-replay");
  return {
    status: "verified-candidate-only-release-blocked",
    sourceSha256: current.sha256,
    basePackage: baseReport.manifest,
    supplementalReferencesVerified: references.length,
    canonicalBrowserObjects: closure.coverage.individuallyReplayed,
    individualBrowserRawFilesVerified: observationFiles.length,
    browserBatchReferencesVerified: batchRoles.length,
    tapResponsesCaptured: replay.counts.responseCaptured,
    stellarPhysicalComponentsConfirmed: analysis.summary.physicalComponentIdentitiesConfirmed,
    gates: manifest.gates,
    releaseApproved: false,
  };
}

async function main(argv) {
  assert(process.cwd().toLowerCase() === ROOT.toLowerCase(), "wrong-workspace");
  if (argv.length === 1 && argv[0] === "--build") {
    const body = await createSupplement();
    const destination = path.join(ROOT, OUTPUT);
    await writeFile(destination, `${JSON.stringify(body, null, 2)}\n`, { flag: "wx" });
    return { path: OUTPUT, sha256: sha256(await readFile(destination)), status: body.status };
  }
  if (argv.length === 1 && argv[0] === "--check") {
    const file = await safeFile(ROOT, OUTPUT);
    const bytes = await readFile(file.absolute);
    return { path: OUTPUT, sha256: sha256(bytes), ...(await verifySupplement(JSON.parse(bytes))) };
  }
  throw new Error("Usage: node scripts/verify-mainline-a-r66-v646-supplement.mjs --build | --check");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(await main(process.argv.slice(2)), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
