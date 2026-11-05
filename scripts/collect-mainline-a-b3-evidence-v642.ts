import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import evidencePlan from "../app/data/mainlineABetaStellarRosterEvidenceV642.generated.json";
import {
  assertMainlineABetaStellarRosterEvidenceV642,
  bindBuildToEvidencePlanV642,
  canonicalEvidenceValueV642,
  evidenceRecordFingerprintInputV642,
  mergeEvidenceObservationV642,
  withEvidenceFingerprintV642,
  type MainlineABetaStellarEvidencePackV642,
  type MainlineABetaStellarEvidenceRecordV642,
} from "../app/lib/mainlineABetaStellarRosterEvidenceV642";
import { replayMainlineABetaStellarRosterEvidenceV642 } from "../app/lib/mainlineABetaStellarRosterEvidenceReplayV642";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLAN = evidencePlan as unknown as MainlineABetaStellarEvidencePackV642;
const BUILD_RECEIPT = "docs/release/v607/mainline-a-r66-build-b3v642-20260929-003.json";
const BROWSER_RECEIPT = "docs/release/v607/mainline-a-b3-browser-v642-20260929-final.json";
const HTTP_RECEIPT = "docs/release/v607/mainline-a-b3-http-v642-20260929-final-002.json";
const SESSION_RECEIPT = "docs/release/v607/mainline-a-b3-evidence-session-v642-20260929-final-002.json";
const BASE_URL = "http://127.0.0.1:3079";
const MAX_BYTES = 8 * 1024 * 1024;

type HttpObservation = Readonly<{
  path: string;
  startedAt: string;
  endedAt: string;
  status: number | null;
  contentType: string | null;
  finalUrl: string | null;
  redirectChain: readonly string[];
  bytes: number | null;
  sha256: string | null;
  error: string | null;
  bodyText: string | null;
}>;

type BuildReceipt = Readonly<{
  status: string;
  sourceStable: boolean;
  buildId: string;
  runtimeBuildId: string;
  distDir: string;
  branch: string;
  head: string;
  inputBefore: { sha256: string; inputs: readonly { path: string; sha256: string }[] };
}>;

type BrowserReceipt = Readonly<{
  schema: string;
  buildId: string;
  runtimeBuildId: string;
  url: string;
  desktop: {
    dialogOpen: boolean;
    viewport: { width: number; height: number };
    scrollWidth: number;
    clientWidth: number;
    roster: { count: string; rows: number; candidateRows: readonly string[] };
    evidence: { classes: number; reportable: string; state: string };
  };
  mobileViewport: {
    dialogOpen: boolean;
    viewport: { width: number; height: number };
    scrollWidth: number;
    clientWidth: number;
    rosterRows: number;
    evidenceClasses: number;
    evidenceState: string;
  };
  classSwitch: { selected: string; recordRows: number; states: readonly string[] };
  console: { errors: readonly unknown[]; warnings: readonly unknown[] };
  screenshots: readonly { path: string; bytes: number; sha256: string; viewport: readonly number[] }[];
}>;

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileSha256(relativePath: string): string {
  return sha256(fs.readFileSync(path.join(ROOT, relativePath)));
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalEvidenceValueV642(value));
}

function finalizeSession(pack: MainlineABetaStellarEvidencePackV642): MainlineABetaStellarEvidencePackV642 {
  const unsigned = Object.fromEntries(Object.entries(pack).filter(([key]) => key !== "fingerprint"));
  const fingerprint = sha256(canonicalJson(unsigned));
  const final = withEvidenceFingerprintV642(pack, fingerprint);
  assertMainlineABetaStellarRosterEvidenceV642(final);
  return final;
}

function observation(
  template: MainlineABetaStellarEvidenceRecordV642,
  update: Partial<MainlineABetaStellarEvidenceRecordV642>,
): MainlineABetaStellarEvidenceRecordV642 {
  const record = { ...template, ...update, observationFingerprint: null } as MainlineABetaStellarEvidenceRecordV642;
  const fingerprint = sha256(canonicalJson(evidenceRecordFingerprintInputV642(record)));
  return { ...record, observationFingerprint: fingerprint };
}

function updateRecord(
  pack: MainlineABetaStellarEvidencePackV642,
  id: string,
  update: Partial<MainlineABetaStellarEvidenceRecordV642>,
): MainlineABetaStellarEvidencePackV642 {
  const template = pack.records.find((record) => record.id === id);
  if (!template) throw new Error(`${id}: V642 evidence plan record missing`);
  return mergeEvidenceObservationV642(pack, observation(template, update));
}

function buildReceipt(): BuildReceipt {
  const build = readJson<BuildReceipt>(BUILD_RECEIPT);
  if (build.status !== "passed" || !build.sourceStable) throw new Error("V642 requires a passed, source-stable production build");
  if (build.branch !== "codex/solar-sim-mainline-a") throw new Error("V642 build branch mismatch");
  if (build.head !== PLAN.build.head) throw new Error("V642 build head mismatch");
  const stage = path.join(ROOT, build.distDir, "..");
  const stagedPlanPath = path.join(stage, "app/data/mainlineABetaStellarRosterEvidenceV642.generated.json");
  if (sha256(fs.readFileSync(stagedPlanPath)) !== fileSha256("app/data/mainlineABetaStellarRosterEvidenceV642.generated.json")) {
    throw new Error("V642 current evidence plan differs from the staged build source");
  }
  const rosterInput = build.inputBefore.inputs.find((input) => input.path === "app/data/mainlineABetaStellarRosterV641.generated.json");
  if (rosterInput?.sha256 !== PLAN.roster.sha256) throw new Error("V641 roster changed since the build");
  return build;
}

export function validateBrowserReceiptV642(browser: BrowserReceipt, build: BuildReceipt): readonly string[] {
  const errors: string[] = [];
  if (browser.schema !== "mainline-a-b3-browser-v642") errors.push("schema");
  if (browser.buildId !== build.buildId || browser.runtimeBuildId !== build.runtimeBuildId) errors.push("build-identity");
  if (browser.url !== `${BASE_URL}/`) errors.push("url");
  if (!browser.desktop.dialogOpen || browser.desktop.roster.count !== "24" || browser.desktop.roster.rows !== 24) errors.push("desktop-roster");
  if (browser.desktop.viewport.width !== 1280 || browser.desktop.viewport.height !== 720) errors.push("desktop-viewport");
  if (browser.desktop.scrollWidth > browser.desktop.clientWidth) errors.push("desktop-overflow");
  if (browser.desktop.evidence.classes !== 6 || browser.desktop.evidence.reportable !== "false" || browser.desktop.evidence.state !== "plan-only") errors.push("desktop-boundary");
  if (JSON.stringify([...browser.desktop.roster.candidateRows].sort()) !== JSON.stringify(["acrux", "polaris", "regulus", "spica"])) errors.push("candidate-rows");
  if (!browser.mobileViewport.dialogOpen || browser.mobileViewport.rosterRows !== 24 || browser.mobileViewport.evidenceClasses !== 6) errors.push("mobile-roster");
  if (browser.mobileViewport.viewport.width !== 390 || browser.mobileViewport.viewport.height !== 844) errors.push("mobile-viewport");
  if (browser.mobileViewport.scrollWidth > browser.mobileViewport.clientWidth) errors.push("mobile-overflow");
  if (browser.mobileViewport.evidenceState !== "plan-only") errors.push("mobile-boundary");
  if (browser.classSwitch.selected !== "http" || browser.classSwitch.recordRows !== 3 || browser.classSwitch.states.some((state) => state !== "planned")) errors.push("class-switch");
  if (browser.console.errors.length > 0 || browser.console.warnings.length > 0) errors.push("console");
  for (const shot of browser.screenshots) {
    if (!shot.path.startsWith("docs/release/v607/screenshots/mainline-a-b3-v642-")) errors.push("screenshot-path");
    const absolute = path.join(ROOT, shot.path);
    if (!fs.existsSync(absolute)) errors.push("screenshot-missing");
    else if (fs.statSync(absolute).size !== shot.bytes || fileSha256(shot.path) !== shot.sha256) errors.push("screenshot-integrity");
  }
  if (browser.screenshots.length !== 2) errors.push("screenshot-count");
  return [...new Set(errors)];
}

async function httpGet(relativePath: string): Promise<HttpObservation> {
  const startedAt = new Date().toISOString();
  const redirectChain: string[] = [];
  let url = new URL(relativePath, BASE_URL);
  try {
    for (let redirects = 0; redirects <= 5; redirects += 1) {
      const response = await fetch(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(20_000) });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("redirect-location-missing");
        const next = new URL(location, url);
        if (next.origin !== new URL(BASE_URL).origin) throw new Error("redirect-cross-origin");
        redirectChain.push(next.href);
        url = next;
        continue;
      }
      const body = new Uint8Array(await response.arrayBuffer());
      if (body.byteLength > MAX_BYTES) throw new Error("response-too-large");
      const contentType = response.headers.get("content-type");
      const readable = contentType?.includes("text/") || contentType?.includes("application/json") || contentType?.includes("javascript");
      return {
        path: relativePath,
        startedAt,
        endedAt: new Date().toISOString(),
        status: response.status,
        contentType,
        finalUrl: url.href,
        redirectChain,
        bytes: body.byteLength,
        sha256: sha256(body),
        error: null,
        bodyText: readable ? new TextDecoder().decode(body) : null,
      };
    }
    throw new Error("redirect-limit");
  } catch (error) {
    return {
      path: relativePath,
      startedAt,
      endedAt: new Date().toISOString(),
      status: null,
      contentType: null,
      finalUrl: url.href,
      redirectChain,
      bytes: null,
      sha256: null,
      error: error instanceof Error ? error.message : String(error),
      bodyText: null,
    };
  }
}

function findRosterChunk(build: BuildReceipt): string {
  const staticRoot = path.join(ROOT, build.distDir, "static/chunks");
  const matches: string[] = [];
  for (const name of fs.readdirSync(staticRoot)) {
    if (!name.endsWith(".js")) continue;
    const full = path.join(staticRoot, name);
    if (fs.statSync(full).size > MAX_BYTES) continue;
    const body = fs.readFileSync(full, "utf8");
    if (body.includes("mainline-a-beta-stellar-evidence") && body.includes("mainline-a-beta-stellar-roster")) matches.push(name);
  }
  if (matches.length !== 1) throw new Error(`V642 roster chunk discovery expected one match, got ${matches.length}`);
  return `/_next/static/chunks/${matches[0]}`;
}

function httpRecord(
  pack: MainlineABetaStellarEvidencePackV642,
  id: string,
  result: HttpObservation,
  details: readonly string[],
): MainlineABetaStellarEvidencePackV642 {
  return updateRecord(pack, id, {
    state: result.status === 200 && result.error === null ? "passed" : "blocked",
    startedAt: result.startedAt,
    endedAt: result.endedAt,
    source: result.finalUrl,
    httpStatus: result.status,
    contentType: result.contentType,
    finalUrl: result.finalUrl,
    redirectChain: result.redirectChain,
    bytes: result.bytes,
    sha256: result.sha256,
    details: result.error ? [...details, result.error] : [...details],
  });
}

function writeJson(relativePath: string, value: unknown): void {
  const absolute = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

export async function collectB3EvidenceV642() {
  const build = buildReceipt();
  const browser = readJson<BrowserReceipt>(BROWSER_RECEIPT);
  const browserIssues = validateBrowserReceiptV642(browser, build);
  if (browserIssues.length > 0) throw new Error(`V642 browser receipt blocked: ${browserIssues.join(",")}`);
  const rosterChunk = findRosterChunk(build);
  const [home, health, chunk] = await Promise.all([httpGet("/"), httpGet("/api/health"), httpGet(rosterChunk)]);
  const httpIssues: string[] = [];
  if (home.status !== 200 || !home.contentType?.includes("text/html")) httpIssues.push("home-status");
  if (!home.bodyText?.includes("/_next/static/chunks/")) httpIssues.push("home-build-scripts");
  if (health.status !== 200 || !health.contentType?.includes("application/json")) httpIssues.push("health-status");
  let healthJson: Record<string, unknown> = {};
  try { healthJson = JSON.parse(health.bodyText ?? "{}"); } catch { httpIssues.push("health-json"); }
  if (healthJson.status !== "ok" || healthJson.defaultScientificKernel !== "legacy-eih-1pn") httpIssues.push("health-kernel-boundary");
  if (chunk.status !== 200 || !chunk.contentType?.includes("javascript")) httpIssues.push("roster-chunk-status");
  if (!chunk.bodyText?.includes("mainline-a-beta-stellar-evidence") || !chunk.bodyText?.includes("mainline-a-beta-stellar-roster")) httpIssues.push("roster-chunk-marker");
  const httpReceipt = {
    schema: "mainline-a-b3-http-v642",
    recordedAt: new Date().toISOString(),
    status: httpIssues.length === 0 ? "passed" : "blocked",
    baseUrl: BASE_URL,
    build: { buildId: build.buildId, runtimeBuildId: build.runtimeBuildId, distDir: build.distDir, sourceStable: build.sourceStable },
    checks: [home, health, chunk].map((result) => ({
      path: result.path,
      startedAt: result.startedAt,
      endedAt: result.endedAt,
      status: result.status,
      contentType: result.contentType,
      finalUrl: result.finalUrl,
      redirectChain: result.redirectChain,
      bytes: result.bytes,
      sha256: result.sha256,
      error: result.error,
    })),
    health: { status: healthJson.status ?? null, defaultScientificKernel: healthJson.defaultScientificKernel ?? null },
    issues: httpIssues,
    claims: { browserAcceptance: false, productionPerformance: false, scientificValidity: false, copyrightApproval: false },
  };
  writeJson(HTTP_RECEIPT, httpReceipt);
  if (httpIssues.length > 0) throw new Error(`V642 HTTP blocked: ${httpIssues.join(",")}`);
  let session = bindBuildToEvidencePlanV642(PLAN, {
    buildId: build.buildId,
    branch: build.branch,
    head: build.head,
    distDir: build.distDir,
    sourceStableAtBuild: true,
  });
  const observedAt = new Date().toISOString();
  session = updateRecord(session, "static-v641-roster", { state: "passed", startedAt: build.inputBefore.sha256 ? observedAt : null, endedAt: observedAt, source: PLAN.roster.path, sha256: PLAN.roster.sha256, details: ["24 rows: 20 existing references, 4 candidate hold, component confirmed 0", "staged roster SHA matches current source and build input"] });
  session = updateRecord(session, "static-v641-negative", { state: "passed", startedAt: observedAt, endedAt: observedAt, source: "docs/release/v607/mainline-a-b3-stellar-roster-audit-v641.json", sha256: fileSha256("docs/release/v607/mainline-a-b3-stellar-roster-audit-v641.json"), details: ["V641 audit negative cases include duplicate, admission, synthetic source, fingerprint and component promotion", "V642 audit rejects build mismatch, visual claim, external promotion and missing rows"] });
  session = httpRecord(session, "http-home", home, ["local production home HTML and script entry observed"]);
  session = httpRecord(session, "http-health", health, ["local production health JSON; default kernel legacy-eih-1pn"]);
  session = httpRecord(session, "http-roster-panel", chunk, ["served JavaScript chunk contains V641 roster and V642 evidence panel markers"]);
  const desktopShot = browser.screenshots.find((shot) => shot.viewport[0] === 1280);
  const mobileShot = browser.screenshots.find((shot) => shot.viewport[0] === 390);
  if (!desktopShot || !mobileShot) throw new Error("V642 browser screenshots are incomplete");
  session = updateRecord(session, "visual-desktop", { state: "observed", startedAt: observedAt, endedAt: observedAt, source: desktopShot.path, bytes: desktopShot.bytes, sha256: desktopShot.sha256, details: ["local desktop screenshot of V642 panel", "human visual signoff remains pending"] });
  session = updateRecord(session, "browser-desktop", { state: "observed", startedAt: observedAt, endedAt: observedAt, source: BROWSER_RECEIPT, sha256: fileSha256(BROWSER_RECEIPT), details: ["1280x720 dialog, 24 roster rows, four candidate holds, six evidence classes", "HTTP class switch showed three planned records; console had no errors or warnings"] });
  session = updateRecord(session, "browser-mobile", { state: "observed", startedAt: observedAt, endedAt: observedAt, source: mobileShot.path, bytes: mobileShot.bytes, sha256: mobileShot.sha256, details: ["390x844 in-app viewport, 24 roster rows, no document horizontal overflow", "viewport check is not a physical-device test"] });
  session = updateRecord(session, "performance-long-run", { state: "not-run", startedAt: null, endedAt: null, details: ["B3 used build, HTTP and short browser interaction only", "two independent >=30-minute observations and physical GPU memory were not collected"] });
  session = finalizeSession(session);
  const replay = replayMainlineABetaStellarRosterEvidenceV642(session);
  const receipt = {
    schema: "mainline-a-b3-evidence-session-receipt-v642",
    recordedAt: new Date().toISOString(),
    status: "local-evidence-observed-external-gates-held",
    plan: { path: "app/data/mainlineABetaStellarRosterEvidenceV642.generated.json", sha256: fileSha256("app/data/mainlineABetaStellarRosterEvidenceV642.generated.json") },
    build: { path: BUILD_RECEIPT, sha256: fileSha256(BUILD_RECEIPT), buildId: build.buildId, runtimeBuildId: build.runtimeBuildId, sourceStable: build.sourceStable },
    http: { path: HTTP_RECEIPT, sha256: fileSha256(HTTP_RECEIPT), status: httpReceipt.status },
    browser: { path: BROWSER_RECEIPT, sha256: fileSha256(BROWSER_RECEIPT), desktop: true, mobileViewport: true, physicalMobile: false },
    replay: { total: replay.total, required: replay.required, observed: replay.observed, openGateIds: replay.openGateIds, reportable: replay.reportable },
    session,
    evidenceClasses: { static: "passed-local", http: "passed-local", visual: "observed-local", browser: "observed-local", performance: "not-run-long-run", externalSource: "held" },
    limits: ["Local browser screenshots do not prove human visual acceptance or real-user validation.", "Local HTTP timings are not production performance.", "The four stellar component identities and rights remain pending; no scientific payload was written back."],
  };
  writeJson(SESSION_RECEIPT, receipt);
  return { receipt, httpReceipt };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  collectB3EvidenceV642().then(({ receipt }) => {
    console.log(JSON.stringify({ schema: receipt.schema, status: receipt.status, observed: receipt.replay.observed, required: receipt.replay.required, openGateIds: receipt.replay.openGateIds }, null, 2));
  }).catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
