import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from
  "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "docs/release/v607/";
const RUN = /^20261013-v665long0[1-9]$/;
const BOUNDARY = Object.freeze({ candidateOnly: true,
  hold: true, notAdmitted: true,
  scientificPayloadWriteback: false,
  publicWebReleaseApproved: false });
const V616_SNAPSHOT =
  "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b";
const V616_PROJECTION =
  "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce";

function sha(value) {
  return createHash("sha256").update(value).digest("hex");
}
function assert(value, code, detail) {
  if (!value) throw new Error("r78-package:" + code
    + (detail === undefined ? "" : ":" + JSON.stringify(detail)));
}
function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function unique(values) {
  return [...new Set(values)].sort();
}
function safe(relative) {
  assert(/^docs\/release\/v607\/[a-z0-9-]+\.json$/i
    .test(relative), "path-invalid", relative);
  const resolved = path.resolve(ROOT, relative);
  assert(resolved.toLowerCase().startsWith(
    (ROOT + path.sep).toLowerCase()),
  "path-outside-workspace", relative);
  return resolved;
}
async function pinned(relative) {
  const absolute = safe(relative);
  const stat = await lstat(absolute);
  assert(stat.isFile() && !stat.isSymbolicLink()
    && stat.size > 0 && stat.size < 4 * 1024 * 1024,
  "input-not-small-regular-file", relative);
  const bytes = await readFile(absolute);
  assert(bytes.length === stat.size,
    "input-changed-during-read", relative);
  return { value: JSON.parse(bytes.toString("utf8")),
    pin: { path: relative, bytes: bytes.length,
      sha256: sha(bytes) } };
}
function paths(runId) {
  assert(RUN.test(runId), "run-id-invalid", runId);
  return {
    build: BASE
      + "mainline-a-r77-build-20261013v664r77web01.json",
    compileBuild: BASE
      + "mainline-a-r78-build-20261013v665r78web01.json",
    freeze: BASE
      + "mainline-a-r77-v664-freeze-20261013v664r77freeze01.json",
    static: BASE
      + "mainline-a-r77-v664-static-20261013.json",
    r77Audit: BASE
      + "mainline-a-r77-v664-evidence-audit-20261013v664r77web01.json",
    httpEnabled: BASE
      + "mainline-a-r77-v664-http-enabled-20261013v664r77web01.json",
    httpDefaultOff: BASE
      + "mainline-a-r77-v664-http-default-off-20261013v664r77web01.json",
    browser: BASE
      + "mainline-a-r77-v664-matrix-browser-20261013v664r77web01.json",
    visual: BASE
      + "mainline-a-r77-v664-visual-20261013v664r77web01.json",
    external: BASE
      + "mainline-a-r77-v664-external-source-20261013v664r77web01.json",
    r78External: BASE
      + "mainline-a-r78-v665-external-source-20261013v665r78web01.json",
    r78Http: BASE
      + "mainline-a-r78-v665-http-20261013v665r78web01.json",
    r78Browser: BASE
      + "mainline-a-r78-v665-browser-20261013v665r78web01.json",
    r78Visual: BASE
      + "mainline-a-r78-v665-visual-20261013v665r78web01.json",
    longRun: BASE
      + `mainline-a-r78-v665-longrun-verification-${runId}.json`,
    longRunReplay: BASE
      + `mainline-a-r78-v665-longrun-replay-${runId}.json`,
    performance: BASE
      + `mainline-a-r78-v665-performance-${runId}.json`,
    package: BASE
      + `mainline-a-r78-v665-web-candidate-${runId}.json`,
    replay: BASE
      + `mainline-a-r78-v665-web-candidate-replay-${runId}.json`,
  };
}
export function requiredGates() {
  return [
    { id: "source-build", state: "verified-local",
      scope: "one preserved production build and app-source digest" },
    { id: "a-runtime-coverage", state: "verified-local",
      scope: "12 stars, 12 constellations, 12 nebulae" },
    { id: "beta-review-coverage", state: "candidate-hold",
      scope: "24 stars, 12 constellations, 24 nebula entry rows" },
    { id: "local-browser-longrun", state: "verified-local",
      scope: "two independent 30-minute browser observations" },
    { id: "stellar-components", state: "pending",
      scope: "four physical component identities, zero confirmed" },
    { id: "nebula-image-chains", state: "policy-held",
      scope: "five images without admissible acquisition" },
    { id: "nebula-rights", state: "pending",
      scope: "zero of twelve A and zero of twenty-four Beta signed" },
    { id: "human-visual", state: "pending",
      scope: "per-item human acceptance" },
    { id: "physical-mobile", state: "not-run-web-only-scope",
      scope: "browser mobile viewport is simulated" },
    { id: "root-app-parity", state: "deferred-web-only-scope",
      scope: "independent root application remains outside this web package" },
    { id: "public-web-release", state: "blocked",
      scope: "rights and source gates are not cleared" },
  ];
}
function summarizeMatrix(rows) {
  return Object.fromEntries([
    "a-star", "a-constellation", "a-nebula",
    "beta-star", "beta-constellation", "beta-nebula",
  ].map((group) => {
    const selected = rows.filter((row) => row.group === group);
    return [group, { total: selected.length,
      states: Object.fromEntries(unique(selected.map(
        (row) => row.state)).map((state) => [state,
        selected.filter((row) => row.state === state).length])),
      admission: ["candidate-only"],
      rightsStates: unique(selected.map((row) => row.rights)),
      rightsSigned: selected.filter((row) =>
        row.rightsSigned === true
        || row.rights === "signed").length }];
  }));
}
export function verifyR78PackageInputsV665(items, sourceSha256) {
  const issues = [];
  const build = items.build.value;
  const freeze = items.freeze.value;
  const audit = items.r77Audit.value;
  const longRun = items.longRun.value;
  const replay = items.longRunReplay.value;
  const performance = items.performance.value;
  const httpEnabled = items.httpEnabled.value;
  const httpDefaultOff = items.httpDefaultOff.value;
  const browser = items.browser.value;
  const visual = items.visual.value;
  const external = items.external.value;
  const r78External = items.r78External.value;
  const staticReceipt = items.static.value;
  const compileBuild = items.compileBuild.value;
  const r78Http = items.r78Http.value;
  const r78Browser = items.r78Browser.value;
  const r78Visual = items.r78Visual.value;
  if (build.status !== "passed"
    || build.inputAfterSha256 !== sourceSha256
    || build.sourceStable !== true
    || freeze.appSourceSha256 !== sourceSha256
    || audit.appSourceSha256 !== sourceSha256
    || longRun.sourceSha256 !== sourceSha256
    || performance.sourceSha256 !== sourceSha256
    || compileBuild.inputAfterSha256 !== sourceSha256
    || compileBuild.inputBefore?.sha256 !== sourceSha256
    || compileBuild.status !== "passed"
    || compileBuild.exitCode !== 0
    || compileBuild.sourceStable !== true
    || compileBuild.runtimeBuildId
      !== `mainline-a-${sourceSha256.slice(0, 16)}`
    || r78Http.appSourceSha256 !== sourceSha256
    || r78Browser.appSourceSha256 !== sourceSha256
    || r78Visual.appSourceSha256 !== sourceSha256
    || r78External.appSourceSha256 !== sourceSha256
    || staticReceipt.appSourceSha256 !== sourceSha256) {
    issues.push("source-build-or-freeze-drift");
  }
  if (audit.buildId !== build.buildId
    || longRun.buildId !== build.buildId
    || performance.buildId !== build.buildId
    || browser.buildId !== build.buildId
    || visual.buildId !== build.buildId
    || r78Http.buildId !== build.buildId
    || r78Browser.buildId !== build.buildId
    || r78Visual.buildId !== build.buildId
    || audit.freezeFingerprint !== freeze.fingerprint
    || longRun.freezeFingerprint !== freeze.fingerprint) {
    issues.push("cross-evidence-identity-drift");
  }
  if (freeze.matrixRows?.length !== 96
    || freeze.scenes?.length !== 36
    || audit.screenshotCount !== 77
    || audit.verification?.matrixBrowser?.matrixSelections !== 192
    || audit.verification?.canonicalDesktop?.scenes !== 36
    || audit.verification?.canonicalMobile?.scenes !== 36
    || visual.screenshots?.length !== 77) {
    issues.push("coverage-or-visual-missing");
  }
  if (httpEnabled.status
      !== "passed-local-production-build-candidate-hold"
    || httpDefaultOff.status
      !== "passed-local-production-build-candidate-hold"
    || httpEnabled.mode !== "enabled"
    || httpDefaultOff.mode !== "default-off"
    || browser.totals?.matrixSelections !== 192) {
    issues.push("http-or-browser-missing");
  }
  if (r78Http.status
      !== "passed-same-build-local-two-preview-modes"
    || r78Http.enabled?.ok !== true
    || r78Http.defaultOff?.ok !== true
    || r78Browser.status
      !== "passed-local-desktop-and-simulated-mobile"
    || r78Browser.desktop?.matrixSelections !== 96
    || r78Browser.mobileViewport?.matrixSelections !== 96
    || r78Browser.desktop?.errors !== 0
    || r78Browser.mobileViewport?.errors !== 0
    || r78Browser.physicalMobile !== "not-run"
    || r78Browser.boundary?.scientificPayloadWriteback
      !== false
    || r78Visual.status
      !== "77-current-build-screenshots-rehashed"
    || r78Visual.screenshots?.length !== 77
    || r78Visual.boundary?.scientificPayloadWriteback
      !== false
    || r78Visual.humanPerItemSignoff !== false) {
    issues.push("r78-http-browser-or-visual-missing");
  }
  if (longRun.status
      !== "verified-current-source-local-longrun"
    || longRun.counts?.totalIndependentLongRuns !== 2
    || longRun.windows?.length !== 2
    || replay.ok !== true
    || replay.fingerprint !== longRun.fingerprint
    || performance.status
      !== "two-current-source-local-longruns-verified"
    || performance.observations?.length !== 2) {
    issues.push("longrun-or-replay-unqualified");
  }
  if (external.newHttpsRequests !== 0
    || external.stellarPhysicalComponentsConfirmed !== 0
    || external.aNebulaRightsSigned !== 0
    || external.betaNebulaRightsSigned !== 0
    || freeze.boundary?.scientificPayloadWriteback !== false
    || audit.claims?.publicWebReleaseApproved !== false
    || longRun.claims?.publicWebReleaseApproved !== false) {
    issues.push("external-source-or-boundary-promoted");
  }
  if (r78External.status
      !== "prior-real-raw-pins-verified-no-new-acquisition"
    || r78External.verification?.ok !== true
    || r78External.verification?.verifiedFilePins !== 57
    || r78External.verification?.stellarComponentHolds !== 4
    || r78External.verification?.betaNebulaImageHolds !== 5
    || r78External.newHttpsRequests !== 0
    || r78External.copyrightApproval !== false
    || r78External.boundary?.scientificPayloadWriteback
      !== false) {
    issues.push("r78-external-source-replay-invalid");
  }
  const matrix = summarizeMatrix(freeze.matrixRows ?? []);
  if (matrix["a-star"].total !== 12
    || matrix["a-constellation"].total !== 12
    || matrix["a-nebula"].total !== 12
    || matrix["beta-star"].total !== 24
    || matrix["beta-constellation"].total !== 12
    || matrix["beta-nebula"].total !== 24
    || Object.values(matrix).some((group) =>
      group.rightsSigned !== 0
      || !same(group.rightsStates, ["pending"]))
    || freeze.matrixRows.filter((row) =>
      row.group === "beta-star"
      && row.state === "identity-hold").length !== 4
    || freeze.matrixRows.filter((row) =>
      row.group === "beta-nebula"
      && row.state === "source-hold").length !== 5) {
    issues.push("matrix-count-or-rights-promotion");
  }
  return { ok: issues.length === 0, issues,
    matrix, buildId: build.buildId,
    compileBuildId: compileBuild.buildId,
    runtimeBuildId: build.runtimeBuildId,
    freezeFingerprint: freeze.fingerprint,
    longRunFingerprint: longRun.fingerprint };
}
export function inspectR78WebCandidateV665(candidate) {
  const issues = [];
  if (candidate?.schema
      !== "mainline-a-r78-web-candidate-v665"
    || candidate.status !== "candidate-only-public-release-blocked"
    || !RUN.test(candidate.runId ?? "")
    || candidate.gates?.length !== 11
    || candidate.evidencePins?.length !== 17
    || candidate.release?.publicWebReleaseAllowed !== false
    || candidate.release?.scientificPayloadWriteback !== false
    || candidate.claims?.productionPerformance !== false
    || candidate.claims?.copyrightApproval !== false
    || candidate.claims?.realUserValidation !== false
    || !same(candidate.boundary, BOUNDARY)) {
    issues.push("candidate-envelope-or-boundary-invalid");
  }
  if (!/^[a-f0-9]{64}$/.test(candidate?.sourceSha256 ?? "")
    || candidate.runtimeBuildId
      !== `mainline-a-${candidate.sourceSha256?.slice(0, 16)}`
    || !/^[a-f0-9]{64}$/.test(
      candidate.freezeFingerprint ?? "")
    || !/^[a-f0-9]{64}$/.test(
      candidate.longRunFingerprint ?? "")
    || candidate.repository?.branch
      !== "codex/solar-sim-mainline-a"
    || candidate.repository?.parentGitTouched !== false) {
    issues.push("candidate-source-or-repository-invalid");
  }
  const pins = candidate?.evidencePins ?? [];
  if (pins.length !== 17
    || unique(pins.map((pin) => pin.path)).length !== 17
    || pins.some((pin) =>
      !/^docs\/release\/v607\/[a-z0-9-]+\.json$/i
        .test(pin.path ?? "")
      || !Number.isSafeInteger(pin.bytes) || pin.bytes <= 0
      || !/^[a-f0-9]{64}$/.test(pin.sha256 ?? ""))) {
    issues.push("candidate-evidence-pins-invalid");
  }
  const counts = candidate?.matrix ?? {};
  for (const [group, expected] of [
    ["a-star", 12], ["a-constellation", 12],
    ["a-nebula", 12], ["beta-star", 24],
    ["beta-constellation", 12], ["beta-nebula", 24],
  ]) {
    if (counts[group]?.total !== expected
      || counts[group]?.rightsSigned !== 0
      || !same(counts[group]?.rightsStates,
        ["pending"])) {
      issues.push("candidate-matrix-count-or-rights:" + group);
    }
  }
  if (!/^\.next-mainline-a-r77-[a-z0-9-]+\/\.next$/
    .test(candidate?.rollback?.slot ?? "")
    || candidate.buildRecheck?.sourceSha256
      !== candidate.sourceSha256
    || candidate.buildRecheck?.receipt
      !== "docs/release/v607/mainline-a-r78-build-20261013v665r78web01.json"
    || candidate.release?.candidateImagePreviewDefaultOff
      !== true
    || candidate.release?.physicalMobile !== "not-run"
    || candidate.release?.rootAppParity
      !== "deferred-web-only-scope") {
    issues.push("candidate-rollback-or-web-scope-invalid");
  }
  if (!same(candidate?.gates, requiredGates())) {
    issues.push("release-gate-promoted-or-missing");
  }
  if (candidate?.v616Pins?.length !== 2
    || candidate.v616Pins[0]?.sha256 !== V616_SNAPSHOT
    || candidate.v616Pins[1]?.sha256 !== V616_PROJECTION) {
    issues.push("v616-scientific-source-pin-drift");
  }
  const clone = { ...candidate };
  delete clone.fingerprint;
  delete clone.generatedAt;
  if (candidate?.fingerprint !== sha(JSON.stringify(clone))) {
    issues.push("candidate-fingerprint-drift");
  }
  return { ok: issues.length === 0,
    issues, fingerprint: candidate?.fingerprint ?? null };
}
export async function buildR78WebCandidateV665(runId) {
  const files = paths(runId);
  const inputNames = ["build", "compileBuild", "freeze", "static", "r77Audit",
    "httpEnabled", "httpDefaultOff", "browser", "visual",
    "external", "r78External", "r78Http", "r78Browser", "r78Visual",
    "longRun", "longRunReplay", "performance"];
  const sourceBefore = await captureBuildInputs();
  const loaded = await Promise.all(inputNames.map(
    (name) => pinned(files[name])));
  const items = Object.fromEntries(inputNames.map(
    (name, index) => [name, loaded[index]]));
  const verification = verifyR78PackageInputsV665(items,
    sourceBefore.sha256);
  assert(verification.ok, "evidence-input-invalid",
    verification.issues);
  const sourceAfter = await captureBuildInputs();
  assert(sourceAfter.sha256 === sourceBefore.sha256,
    "source-drift-during-package");
  const candidate = {
    schema: "mainline-a-r78-web-candidate-v665",
    status: "candidate-only-public-release-blocked",
    runId, sourceSha256: sourceBefore.sha256,
    buildId: verification.buildId,
    runtimeBuildId: verification.runtimeBuildId,
    freezeFingerprint: verification.freezeFingerprint,
    longRunFingerprint: verification.longRunFingerprint,
    buildRecheck: { receipt: files.compileBuild,
      buildId: verification.compileBuildId,
      sourceSha256: sourceBefore.sha256,
      role: "same-source-independent-compile-proof",
      browserPerformanceClaim: false },
    repository: { root: ROOT.replaceAll("\\", "/"),
      branch: items.build.value.branch,
      head: items.build.value.head,
      parentGitTouched: false },
    matrix: verification.matrix,
    v616Pins: items.freeze.value.v616Pins,
    gates: requiredGates(),
    evidencePins: loaded.map((entry) => entry.pin),
    rollback: { type: "local-preserved-build-only",
      slot: items.build.value.distDir,
      buildReceipt: files.build,
      sourceSha256: sourceBefore.sha256,
      publicDeploymentRollback: "not-applicable-no-deployment" },
    release: { publicWebReleaseAllowed: false,
      scientificPayloadWriteback: false,
      candidateImagePreviewDefaultOff: true,
      physicalMobile: "not-run",
      rootAppParity: "deferred-web-only-scope" },
    boundary: BOUNDARY,
    claims: { copyrightApproval: false,
      scientificValidity: false,
      productionPerformance: false,
      realUserValidation: false,
      publicWebReleaseApproved: false },
  };
  candidate.fingerprint = sha(JSON.stringify(candidate));
  candidate.generatedAt = new Date().toISOString();
  assert(inspectR78WebCandidateV665(candidate).ok,
    "candidate-self-check-invalid");
  return candidate;
}
export async function replayR78WebCandidateV665(saved, runId) {
  const fresh = await buildR78WebCandidateV665(runId);
  const envelope = inspectR78WebCandidateV665(saved);
  const sameContent = saved.fingerprint === fresh.fingerprint
    && same(saved.evidencePins, fresh.evidencePins)
    && same(saved.matrix, fresh.matrix);
  return { schema: "mainline-a-r78-web-candidate-replay-v665",
    status: envelope.ok && sameContent
      ? "replayed-candidate-hold"
      : "replay-rejected",
    ok: envelope.ok && sameContent,
    issues: [...envelope.issues,
      ...(sameContent ? [] : ["source-or-evidence-pin-drift"])],
    fingerprint: fresh.fingerprint,
    sourceSha256: fresh.sourceSha256,
    releaseAllowed: false };
}
export function parseR78CandidateOptionsV665(argv) {
  assert(argv.length === 4
    && argv[0] === "--mode"
    && ["build", "replay"].includes(argv[1])
    && argv[2] === "--run-id"
    && RUN.test(argv[3]), "usage");
  return { mode: argv[1], runId: argv[3] };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const { mode, runId } = parseR78CandidateOptionsV665(
    process.argv.slice(2));
  const file = paths(runId);
  if (mode === "build") {
    const candidate = await buildR78WebCandidateV665(runId);
    await writeFile(safe(file.package),
      JSON.stringify(candidate, null, 2) + "\n",
    { flag: "wx" });
    console.log(JSON.stringify({ status: candidate.status,
      fingerprint: candidate.fingerprint,
      output: file.package }));
  } else {
    const saved = await pinned(file.package);
    const report = await replayR78WebCandidateV665(
      saved.value, runId);
    await writeFile(safe(file.replay),
      JSON.stringify(report, null, 2) + "\n",
    { flag: "wx" });
    console.log(JSON.stringify(report));
    if (!report.ok) process.exitCode = 1;
  }
}
