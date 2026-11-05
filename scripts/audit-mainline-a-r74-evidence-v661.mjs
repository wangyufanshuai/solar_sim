import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { verifyRunR74V661 } from "./verify-mainline-a-r74-alternatives-v661.mjs";
import { inspectR74HttpV661 } from "./verify-mainline-a-r74-http-v661.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_RUN = "20261013v661r74page02";
const WEB_RUN = "20261013v661r74web03";
const BUILD_RUN = "20261013v661r74web02";
const FILES = Object.freeze({
  build: `docs/release/v607/mainline-a-r74-build-${BUILD_RUN}.json`,
  sourceLedger: `docs/release/v607/mainline-a-r74-v661-page-ledger-${SOURCE_RUN}.json`,
  sourceAudit: `docs/release/v607/mainline-a-r74-v661-page-audit-${SOURCE_RUN}.json`,
  sourceOverlay: "app/data/mainlineANebulaR74AlternativesV661.generated.json",
  http: `docs/release/v607/mainline-a-r74-v661-http-${WEB_RUN}.json`,
  browser: `docs/release/v607/mainline-a-r74-v661-browser-${WEB_RUN}.json`,
  visual: `docs/release/v607/mainline-a-r74-v661-visual-${WEB_RUN}.json`,
  performance: `docs/release/v607/mainline-a-r74-v661-performance-${WEB_RUN}.json`,
  v616Snapshot: "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json",
  v616Projection: "app/data/mainlineABetaStellarProjectionV607.generated.ts",
});
const EXPECTED_V616 = Object.freeze({
  v616Snapshot: "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b",
  v616Projection: "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce",
});
const OUTPUT = `docs/release/v607/mainline-a-r74-v661-evidence-audit-${WEB_RUN}.json`;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safePath(relative) {
  if (typeof relative !== "string" || !relative
    || relative.startsWith("/") || relative.includes("\\")
    || relative.split("/").some((part) => !part || part === "..")) {
    throw new Error("r74-evidence-v661:unsafe-path");
  }
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error("r74-evidence-v661:path-escaped-root");
  }
  return absolute;
}

async function pin(relative) {
  const bytes = await readFile(safePath(relative));
  return { path: relative, bytes: bytes.length, sha256: sha256(bytes),
    parsed: relative.endsWith(".json")
      ? JSON.parse(bytes.toString("utf8")) : null };
}

export function inspectEvidenceR74V661(data) {
  const issues = [];
  const { build, sourceAudit, sourceOverlay, http, browser, visual,
    performance } = data;
  const digest = build?.inputAfterSha256;
  if (build?.status !== "passed" || build?.sourceStable !== true
    || !/^[a-f0-9]{64}$/.test(digest ?? "")
    || !build?.buildId || build?.inputBefore?.sha256 !== digest) {
    issues.push("production-build-identity-invalid");
  }
  if (sourceAudit?.status !== "verified-page-candidates-all-five-images-held"
    || sourceAudit?.counts?.officialPagesCaptured !== 6
    || sourceAudit?.counts?.conflictingPages !== 1
    || sourceAudit?.counts?.imageRequestsExecuted !== 0
    || sourceAudit?.counts?.rightsSigned !== 0
    || sourceOverlay?.counts?.heldTargets !== 5
    || sourceOverlay?.counts?.runtimeAdmitted !== 0
    || sourceOverlay?.boundary?.scientificPayloadWriteback !== false) {
    issues.push("external-source-boundary-invalid");
  }
  const checkedHttp = inspectR74HttpV661(http);
  if (!checkedHttp.ok || http?.build?.buildId !== build?.buildId
    || http?.build?.appSourceSha256 !== digest) {
    issues.push("http-evidence-invalid");
  }
  if (browser?.status !== "passed-local-desktop-and-simulated-mobile-viewport"
    || browser?.buildId !== build?.buildId
    || browser?.appSourceSha256 !== digest
    || browser?.totals?.heldTargetSelections !== 10
    || browser?.totals?.pageAlternativesInspected !== 12
    || browser?.totals?.knownIdentityConflicts !== 2
    || browser?.totals?.remoteImageRequests !== 0
    || browser?.totals?.pageErrors !== 0
    || browser?.totals?.consoleErrors !== 0
    || browser?.physicalMobile !== "not-run"
    || browser?.scientificPayloadWriteback !== false
    || browser?.desktop?.rows?.length !== 5
    || browser?.mobileViewport?.rows?.length !== 5
    || browser.desktop.measurements?.panelScrollWidth
      > browser.desktop.measurements?.panelWidth
    || browser.mobileViewport.measurements?.panelScrollWidth
      > browser.mobileViewport.measurements?.panelWidth) {
    issues.push("browser-evidence-invalid");
  }
  if (visual?.status !== "local-browser-screenshots-no-human-signoff"
    || visual?.buildId !== build?.buildId
    || visual?.appSourceSha256 !== digest
    || visual?.screenshots?.length !== 4
    || visual?.humanVisualSignoff !== false
    || visual?.copyrightApproval !== false) {
    issues.push("visual-evidence-invalid");
  }
  if (performance?.status !== "short-local-headless-chrome-diagnostic"
    || performance?.buildId !== build?.buildId
    || performance?.appSourceSha256 !== digest
    || performance?.desktop?.frames?.sampleCount !== 120
    || performance?.mobileViewport?.frames?.sampleCount !== 120
    || performance?.productionPerformanceClaimed !== false
    || performance?.longRunCurrentSource !== "not-run-in-r74") {
    issues.push("performance-class-invalid");
  }
  return { ok: issues.length === 0, issues };
}

export async function auditEvidenceR74V661(options = {}) {
  const pinned = {};
  for (const [role, relative] of Object.entries(FILES)) {
    pinned[role] = await pin(relative);
  }
  const source = await verifyRunR74V661(SOURCE_RUN, { check: true });
  if (!source.ok) throw new Error(`r74-evidence-v661:source-replay:${source.issues}`);
  const current = await captureBuildInputs();
  const build = pinned.build.parsed;
  if (current.sha256 !== build.inputAfterSha256) {
    throw new Error("r74-evidence-v661:app-source-drift-after-build");
  }
  for (const role of ["v616Snapshot", "v616Projection"]) {
    if (pinned[role].sha256 !== EXPECTED_V616[role]) {
      throw new Error(`r74-evidence-v661:${role}-digest-drift`);
    }
  }
  const visual = pinned.visual.parsed;
  const screenshotPins = [];
  for (const screenshot of visual.screenshots) {
    const actual = await pin(screenshot.path);
    if (actual.bytes !== screenshot.bytes || actual.sha256 !== screenshot.sha256) {
      throw new Error(`r74-evidence-v661:screenshot-drift:${screenshot.path}`);
    }
    screenshotPins.push({ path: actual.path,
      bytes: actual.bytes, sha256: actual.sha256 });
  }
  const checked = inspectEvidenceR74V661({
    build, sourceAudit: pinned.sourceAudit.parsed,
    sourceOverlay: pinned.sourceOverlay.parsed,
    http: pinned.http.parsed, browser: pinned.browser.parsed,
    visual, performance: pinned.performance.parsed,
  });
  if (!checked.ok) throw new Error(`r74-evidence-v661:${checked.issues.join(",")}`);
  const report = { schema: "mainline-a-r74-layered-evidence-audit-v661",
    status: "verified-current-source-local-candidate-hold",
    observedAt: new Date().toISOString(),
    buildId: build.buildId, appSourceSha256: current.sha256,
    evidence: {
      static: { status: "local-tests-and-build-passed",
        build: { path: pinned.build.path, bytes: pinned.build.bytes,
          sha256: pinned.build.sha256 },
        v616Snapshot: EXPECTED_V616.v616Snapshot,
        v616Projection: EXPECTED_V616.v616Projection },
      http: { status: "local-production-server-passed",
        receipt: { path: pinned.http.path, bytes: pinned.http.bytes,
          sha256: pinned.http.sha256 },
        allowedSample: 200, heldImages: [404, 404, 404, 404, 404] },
      visual: { status: "four-screenshots-pinned-no-human-signoff",
        receipt: { path: pinned.visual.path, bytes: pinned.visual.bytes,
          sha256: pinned.visual.sha256 }, screenshots: screenshotPins },
      browser: { status: "desktop-and-simulated-mobile-viewport-passed",
        receipt: { path: pinned.browser.path, bytes: pinned.browser.bytes,
          sha256: pinned.browser.sha256 }, physicalMobile: "not-run" },
      performance: { status: "short-local-diagnostic-only",
        receipt: { path: pinned.performance.path,
          bytes: pinned.performance.bytes,
          sha256: pinned.performance.sha256 },
        currentSourceLongRun: "not-run-in-r74",
        productionPerformanceClaimed: false },
      externalSource: { status: "six-real-https-pages-replayed",
        ledger: { path: pinned.sourceLedger.path,
          bytes: pinned.sourceLedger.bytes,
          sha256: pinned.sourceLedger.sha256 },
        audit: { path: pinned.sourceAudit.path,
          bytes: pinned.sourceAudit.bytes,
          sha256: pinned.sourceAudit.sha256 },
        officialPagesCaptured: 6, identityConflicts: 1,
        imageRequestsExecuted: 0, rightsSigned: 0 },
    },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      runtimeAdmitted: 0, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { independentNasaAuthentication: false,
      scientificValidity: false, copyrightApproval: false,
      productionPerformance: false, realUserValidation: false,
      physicalMobile: false } };
  if (options.write) await writeFile(safePath(OUTPUT),
    `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  return { ok: true, output: options.write ? OUTPUT : null,
    buildId: report.buildId, appSourceSha256: report.appSourceSha256,
    screenshotCount: screenshotPins.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  auditEvidenceR74V661({ write: process.argv.includes("--write") })
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(String(error?.message ?? error));
      process.exitCode = 1;
    });
}
