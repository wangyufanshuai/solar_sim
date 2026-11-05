import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { pinFileV662, safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { verifyR75MatrixShapeV662 } from
  "./verify-mainline-a-r75-matrix-v662.mjs";
import { verifyHttpMatrixV662 } from
  "./verify-mainline-a-r75-http-v662.mjs";
import { verifyDisabledHttpV662 } from
  "./verify-mainline-a-r75-http-disabled-v662.mjs";
import { verifyCanonicalBrowserV662, verifySkyBrowserV662,
  verifyNebulaBrowserV662, verifyMatrixBrowserV662,
  verifyLongRunAuditV662 } from
  "./audit-mainline-a-r75-evidence-v662.mjs";

const SHA = /^[a-f0-9]{64}$/;
function issue(issues, code, detail) {
  issues.push(detail ? `${code}:${detail}` : code);
}
export function verifyR75CandidateShapeV662(candidate) {
  const issues = [];
  if (candidate?.schema !== "mainline-a-r75-web-candidate-v662"
    || candidate.status !== "verified-local-web-candidate-hold-public-release-blocked"
    || !SHA.test(candidate.appSourceSha256 ?? "")
    || !/^[A-Za-z0-9_-]{10,40}$/.test(candidate.buildId ?? "")) {
    issue(issues, "candidate-identity-invalid");
  }
  const coverage = candidate?.coverage ?? {};
  if (JSON.stringify(coverage.aLine) !== JSON.stringify([12, 12, 12])
    || coverage.betaStars !== 24
    || coverage.betaConstellations !== 12
    || coverage.betaNebulae !== 24
    || coverage.reviewableNebulaImageChains !== 19
    || coverage.imageHolds !== 5
    || coverage.componentIdentitiesConfirmed !== 0
    || coverage.rightsSigned !== 0
    || coverage.runtimeAdmitted !== 0) {
    issue(issues, "candidate-coverage-or-promotion-invalid");
  }
  if (candidate?.boundary?.candidateOnly !== true
    || candidate.boundary.hold !== true
    || candidate.boundary.notAdmitted !== true
    || candidate.boundary.scientificPayloadWriteback !== false
    || candidate.boundary.publicWebReleaseApproved !== false
    || candidate?.claims?.copyrightApproval !== false
    || candidate.claims.scientificValidity !== false
    || candidate.claims.productionPerformance !== false
    || candidate.claims.realUserValidation !== false
    || candidate.claims.physicalMobile !== false
    || candidate.claims.publicWebReleaseApproved !== false) {
    issue(issues, "candidate-boundary-or-claim-invalid");
  }
  const classes = candidate?.evidenceClasses ?? {};
  for (const [name, minimum] of Object.entries({ static: 3, http: 2,
    visual: 89, browser: 5, performance: 3, externalSource: 2 })) {
    if (!Array.isArray(classes[name]) || classes[name].length < minimum) {
      issue(issues, "evidence-class-missing", name);
    }
  }
  const pins = Array.isArray(candidate?.pinnedFiles)
    ? candidate.pinnedFiles : [];
  const byPath = new Map();
  if (pins.length < 140) issue(issues, "pin-count-too-small");
  for (const pin of pins) {
    try { safeWorkspacePathV662(pin?.path); }
    catch { issue(issues, "unsafe-pin-path", pin?.path); }
    if (byPath.has(pin?.path) || !Number.isSafeInteger(pin?.bytes)
      || pin.bytes <= 0 || !SHA.test(pin?.sha256 ?? "")) {
      issue(issues, "pin-invalid", pin?.path);
    }
    byPath.set(pin?.path, pin);
  }
  if (!byPath.has(candidate?.rollbackReference)) {
    issue(issues, "rollback-reference-unpinned");
  }
  const toolPaths = candidate?.toolSourcePaths;
  if (!Array.isArray(toolPaths) || toolPaths.length < 17
    || new Set(toolPaths).size !== toolPaths.length
    || toolPaths.some((relative) => !byPath.has(relative)
      || !classes.static?.includes(relative))) {
    issue(issues, "tool-source-not-pinned");
  }
  for (const [name, paths] of Object.entries(classes)) {
    if (!Array.isArray(paths)) continue;
    for (const relative of paths) {
      if (!byPath.has(relative)) issue(issues, "evidence-unpinned", `${name}:${relative}`);
    }
  }
  return { ok: issues.length === 0, issues,
    pinCount: pins.length, classCounts: Object.fromEntries(
      Object.entries(classes).map(([key, value]) => [key,
        Array.isArray(value) ? value.length : 0])) };
}
export async function replayR75CandidateV662(candidate) {
  const shape = verifyR75CandidateShapeV662(candidate);
  const issues = [...shape.issues];
  const before = await captureBuildInputs();
  if (before.sha256 !== candidate?.appSourceSha256)
    issue(issues, "source-no-longer-current");
  let pinsChecked = 0;
  for (const expected of candidate?.pinnedFiles ?? []) {
    try {
      const actual = await pinFileV662(expected.path);
      pinsChecked += 1;
      if (actual.bytes !== expected.bytes
        || actual.sha256 !== expected.sha256) {
        issue(issues, "pinned-byte-drift", expected.path);
      }
    } catch { issue(issues, "pin-unreadable", expected?.path); }
  }
  try {
    const classes = candidate.evidenceClasses;
    const readEvidence = async (relative) => JSON.parse(await readFile(
      safeWorkspacePathV662(relative), "utf8"));
    const [build, matrix, visual, longrun, desktopRaw, finalRaw,
      http, httpDisabled, matrixBrowser, canonicalDesktop,
      canonicalMobile, sky, nebula, source] = await Promise.all([
      classes.static[0], classes.static[1], classes.visual[0],
      ...classes.performance.slice(0, 3), ...classes.http.slice(0, 2),
      ...classes.browser.slice(0, 5), classes.externalSource[1],
    ].map(readEvidence));
    if (build.status !== "passed" || build.sourceStable !== true
      || build.buildId !== candidate.buildId
      || build.inputAfterSha256 !== candidate.appSourceSha256
      || matrix.appSourceSha256 !== candidate.appSourceSha256
      || !verifyR75MatrixShapeV662(matrix).ok
      || visual.appSourceSha256 !== candidate.appSourceSha256
      || visual.coverage?.screenshotCount !== 88
      || visual.claims?.humanPerItemSignoff !== false
      || longrun.status !== "verified-two-independent-current-source-local-browser-runs"
      || longrun.sourceSha256 !== candidate.appSourceSha256
      || longrun.qualification?.ok !== true
      || source.counts?.rightsSigned !== 0
      || source.counts?.imageResponsesCaptured !== 0) {
      issue(issues, "cross-class-identity-or-promotion-invalid");
    }
    if (!verifyHttpMatrixV662(matrix, http.observations, http.origin).ok
      || !verifyDisabledHttpV662(matrix, httpDisabled.observations,
        httpDisabled.origin).ok) {
      issue(issues, "http-replay-failed");
    }
    if (!verifyMatrixBrowserV662(matrixBrowser, matrix, build).ok
      || !verifyCanonicalBrowserV662(canonicalDesktop, matrix,
        build, "desktop").ok
      || !verifyCanonicalBrowserV662(canonicalMobile, matrix,
        build, "mobile").ok
      || !verifySkyBrowserV662(sky, matrix, build).ok
      || !verifyNebulaBrowserV662(nebula, matrix, build).ok) {
      issue(issues, "browser-replay-failed");
    }
    if (!verifyLongRunAuditV662(longrun, desktopRaw,
      finalRaw, build).ok) {
      issue(issues, "performance-replay-failed");
    }
  } catch { issue(issues, "evidence-link-unreadable"); }
  const after = await captureBuildInputs();
  if (before.sha256 !== after.sha256)
    issue(issues, "source-changed-during-candidate-replay");
  return { schema: "mainline-a-r75-candidate-replay-v662",
    status: issues.length ? "rejected-candidate" : "verified-candidate-hold",
    observedAt: new Date().toISOString(),
    appSourceSha256: after.sha256,
    buildId: candidate?.buildId ?? null,
    pinsExpected: candidate?.pinnedFiles?.length ?? 0,
    pinsChecked, classCounts: shape.classCounts,
    issues,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, publicWebReleaseApproved: false },
    claims: { copyrightApproval: false, scientificValidity: false,
      productionPerformance: false, realUserValidation: false,
      physicalMobile: false, publicWebReleaseApproved: false } };
}
export function parseCandidateOptionsV662(argv) {
  if (argv.length !== 2 || argv[0] !== "--run-id"
    || !/^20261013v662r75web0[1-9]$/.test(argv[1])) {
    throw new Error("r75-candidate:usage:--run-id 20261013v662r75webNN");
  }
  return argv[1];
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const runId = parseCandidateOptionsV662(process.argv.slice(2));
  const input = `docs/release/v607/mainline-a-r75-v662-web-candidate-${runId}.json`;
  const candidate = JSON.parse(await readFile(safeWorkspacePathV662(input),
    "utf8"));
  const replay = await replayR75CandidateV662(candidate);
  const output = `docs/release/v607/mainline-a-r75-v662-web-candidate-replay-${runId}.json`;
  await writeFile(safeWorkspacePathV662(output),
    `${JSON.stringify(replay, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: replay.status,
    pinsChecked: replay.pinsChecked, issues: replay.issues,
    output }));
  if (replay.issues.length) process.exitCode = 1;
}
