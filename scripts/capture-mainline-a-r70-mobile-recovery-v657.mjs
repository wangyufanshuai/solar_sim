import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import {
  browserReceipt, captureResourceCycle, openPanel,
  verifyLongRunLaunchV650, verifyLongRunRawV650,
  waitForObservation,
} from "./capture-mainline-a-web-r65-longrun-v650.mjs";
import longRunModule from "../app/lib/mainlineAR65LongRunV643.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_PATH = "docs/release/v607/mainline-a-r70-build-20261012v657web02.json";
const DESKTOP_PATH = "docs/release/v607/mainline-a-r70-v657-browser-desktop-raw-20261012-v657long02.json";
const MOBILE_PATH = "docs/release/v607/mainline-a-r70-v657-browser-mobile-raw-20261012-v657long03.json";
const FINAL_PATH = "docs/release/v607/mainline-a-r70-v657-browser-final-raw-20261012-v657long03.json";
const ATTEMPT_PATH = "docs/release/v607/mainline-a-r70-v657-browser-attempt-20261012-v657long03.json";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const {
  createMainlineAR65LongRunReceiptV643,
  finalizeMainlineAR65LongRunReceiptV643,
  verifyMainlineAR65LongRunObservationV643,
  verifyMainlineAR65LongRunReceiptV643,
  replayMainlineAR65LongRunReceiptV643,
} = longRunModule.default ?? longRunModule;

const file = (relative) => path.join(ROOT, relative);
const load = async (relative) => JSON.parse(await readFile(file(relative), "utf8"));
function check(value, code, detail = null) {
  if (!value) throw new Error(`r70-independent-mobile-v657:${code}${detail
    ? `:${JSON.stringify(detail)}` : ""}`);
}
async function absent(relative) {
  try { await access(file(relative)); } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  check(false, "output-exists", relative);
}
async function save(relative, value) {
  await writeFile(file(relative), `${JSON.stringify(value, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" });
}
function log(stage, value) {
  console.log(JSON.stringify({ at: new Date().toISOString(), stage, ...value }));
}

export function composeR70IndependentLongRunsV657(desktopRaw,
  mobileRaw, build) {
  const desktopShallow = verifyLongRunRawV650(desktopRaw,
    1, "desktop", build);
  const mobileShallow = verifyLongRunRawV650(mobileRaw,
    1, "mobile", build);
  check(desktopShallow.ok && mobileShallow.ok,
    "source-raw-invalid", { desktop: desktopShallow.issues,
      mobile: mobileShallow.issues });
  const desktop = desktopRaw.observations[0];
  const mobile = mobileRaw.observations[0];
  const desktopDeep = verifyMainlineAR65LongRunObservationV643(desktop);
  const mobileDeep = verifyMainlineAR65LongRunObservationV643(mobile);
  check(desktopDeep.ok && mobileDeep.ok,
    "observation-deep-invalid", { desktop: desktopDeep.issues,
      mobile: mobileDeep.issues });
  check(desktopRaw.build.buildId === mobileRaw.build.buildId
    && desktopRaw.build.runtimeBuildId === mobileRaw.build.runtimeBuildId
    && desktopRaw.build.branch === mobileRaw.build.branch
    && desktopRaw.build.head === mobileRaw.build.head
    && desktopRaw.build.route === mobileRaw.build.route
    && desktopRaw.build.buildId === build.runtimeBuildId,
  "independent-build-identity-drift");
  check(desktop.sessionId !== mobile.sessionId
    && desktop.independenceKey !== mobile.independenceKey
    && Date.parse(desktop.endedAt) < Date.parse(mobile.startedAt),
  "independent-session-or-time-invalid");
  const combined = createMainlineAR65LongRunReceiptV643({
    build: desktopRaw.build,
    observations: [desktop, mobile],
  });
  const final = finalizeMainlineAR65LongRunReceiptV643(combined);
  const verification = verifyMainlineAR65LongRunReceiptV643(final);
  const shallow = verifyLongRunRawV650(final, 2, "mobile", build);
  const replay = replayMainlineAR65LongRunReceiptV643(final);
  check(verification.ok && shallow.ok
    && replay.status === "verified" && replay.failures.length === 0,
  "composed-final-invalid", { receipt: verification.issues,
    attempt: verification.attemptIssues, shallow: shallow.issues,
    replay: replay.failures });
  return Object.freeze({ final, verification, replay });
}

export async function captureR70IndependentMobileV657(mode) {
  check(mode === "probe" || mode === "run", "mode-invalid");
  const startedAt = new Date().toISOString();
  let stage = "preflight";
  let lastState = null;
  let rawSaved = false;
  const build = await load(BUILD_PATH);
  const desktopRaw = await load(DESKTOP_PATH);
  const source = await captureBuildInputs();
  const launch = verifyLongRunLaunchV650(build, source.sha256, null);
  check(launch.ok, "build-source-invalid", launch.issues);
  check(verifyLongRunRawV650(desktopRaw, 1,
    "desktop", build).ok, "desktop-raw-invalid");
  const desktopDeep = verifyMainlineAR65LongRunObservationV643(
    desktopRaw.observations[0]);
  check(desktopDeep.ok, "desktop-deep-invalid",
    desktopDeep.issues);
  if (mode === "run") {
    await Promise.all([MOBILE_PATH, FINAL_PATH, ATTEMPT_PATH].map(absent));
  }
  const browser = await chromium.launch({ headless: false,
    executablePath: CHROME });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
    });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(10_000);
      stage = "open-mobile-panel";
      const opened = await openPanel(page);
      lastState = opened;
      const runtime = verifyLongRunLaunchV650(build, source.sha256,
        opened);
      check(runtime.ok && opened.viewport[0] === 390
        && opened.viewport[1] === 844
        && opened.observationCount === 0,
      "mobile-launch-invalid", runtime.issues);
      log("mobile-panel-probe", { mode, buildId: build.buildId,
        resourceTotal: opened.resourceTotal });
      if (mode === "probe") return { status: "probe-passed",
        buildId: build.buildId, sourceSha256: source.sha256 };

      stage = "mobile-resource-cycle";
      await captureResourceCycle(page, "mobile");
      stage = "mobile-observation";
      lastState = await waitForObservation(page, "mobile", 1);
      const mobileRaw = await browserReceipt(page);
      check(mobileRaw?.observations?.length === 1,
        "mobile-raw-missing");
      await save(MOBILE_PATH, mobileRaw);
      rawSaved = true;
      log("mobile-raw-preserved", { path: MOBILE_PATH,
        durationMs: mobileRaw.observations[0].observedDurationMs,
        receiptStatus: mobileRaw.status });
      stage = "independent-compose";
      check((await captureBuildInputs()).sha256 === source.sha256,
        "source-changed-before-composition");
      const composed = composeR70IndependentLongRunsV657(
        desktopRaw, mobileRaw, build);
      await save(FINAL_PATH, composed.final);
      log("independent-final-saved", {
        path: FINAL_PATH, status: composed.final.status,
        durations: composed.final.observations.map(
          (row) => row.observedDurationMs),
      });
      return { status: "qualified", finalPath: FINAL_PATH,
        mobilePath: MOBILE_PATH };
    } finally {
      await context.close();
    }
  } catch (error) {
    if (mode === "run") await save(ATTEMPT_PATH, {
      schema: "mainline-a-r70-independent-mobile-attempt-v657",
      startedAt, endedAt: new Date().toISOString(),
      stage, buildPath: BUILD_PATH, buildId: build.buildId,
      sourceSha256: source.sha256, lastState,
      mobileRawPath: rawSaved ? MOBILE_PATH : null,
      errorClass: error?.name ?? "Error",
      errorMessage: error?.message ?? String(error),
      browserObservationQualified: false,
      productionPerformance: false,
      scientificPayloadWriteback: false,
    });
    throw error;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) ===
    fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  captureR70IndependentMobileV657(mode).then((result) =>
    console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
