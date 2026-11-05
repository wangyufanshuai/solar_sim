import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const DESKTOP_PATH = "dist/science/visual-matrix-v275-desktop-1440x900.json";
const MOBILE_PATH = "dist/science/visual-matrix-v275-mobile-390x844.json";
const PLAYWRIGHT_PATH = "output/playwright/v275-shadow-visual-four-way-result.json";
const CONFIG_PATH = "playwright.atlas.visual-v275-four-way.config.ts";
const SPEC_PATH = "tests/atlas-browser/atlas-visual-v275-four-way.spec.ts";
const OUTPUT = "dist/science/visual-matrix-v275-current-memory-negative-evidence.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));

const [desktop, mobile, playwright] = await Promise.all([
  readJson(DESKTOP_PATH),
  readJson(MOBILE_PATH),
  readJson(PLAYWRIGHT_PATH),
]);
const errorText = JSON.stringify(playwright.suites ?? []);
const frameMetricsValid = [...desktop.frames, ...mobile.frames].every((frame) => frame.bytes > 20_000
  && frame.width > 0
  && frame.height > 0
  && frame.meanLuma > 2
  && frame.meanLuma < 250
  && frame.p95Luma - frame.p05Luma > 8
  && /^[a-f0-9]{64}$/.test(frame.sha256));
const expectedFailure = desktop.frameCount === 24
  && mobile.frameCount === 4
  && desktop.expectedFrameCount === 24
  && mobile.expectedFrameCount === 24
  && frameMetricsValid
  && playwright.stats?.expected === 1
  && playwright.stats?.unexpected === 1
  && /data-atlas-section/.test(errorText)
  && /launch/.test(errorText)
  && /not visible/.test(errorText);
if (!expectedFailure) throw new Error("v275 visual diagnostic failure is not the expected mobile hidden launch route boundary");

const evidence = {
  version: "v275-shadow-visual-diagnostic-negative-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "failed-mobile-hidden-desktop-launch-route-no-retry",
  formalQualificationApplied: false,
  automaticRetryApplied: false,
  frameCount: desktop.frameCount + mobile.frameCount,
  expectedFrameCount: desktop.expectedFrameCount + mobile.expectedFrameCount,
  viewports: {
    desktop: { path: DESKTOP_PATH, sha256: await fileSha256(DESKTOP_PATH), frames: desktop.frameCount, status: "passed" },
    mobile: { path: MOBILE_PATH, sha256: await fileSha256(MOBILE_PATH), frames: mobile.frameCount, status: "failed-test-viewport-route" },
  },
  playwright: {
    path: PLAYWRIGHT_PATH,
    sha256: await fileSha256(PLAYWRIGHT_PATH),
    expected: playwright.stats.expected,
    unexpected: playwright.stats.unexpected,
    durationMs: Math.round(playwright.stats.duration),
  },
  config: { path: CONFIG_PATH, sha256: await fileSha256(CONFIG_PATH) },
  correctedSpec: { path: SPEC_PATH, sha256: await fileSha256(SPEC_PATH) },
  failure: {
    project: "mobile-v275-visual-four-way-chrome-390x844",
    boundary: "desktop-launch-tab-hidden-on-mobile",
    productRenderingFailure: false,
    exposureBudgetFailure: false,
  },
  correctedRoutePrepared: "mobile-more-menu-visible-launch-entry",
  correctedRunApplied: false,
  artifacts: "output/playwright/v275-visual-four-way-current-memory-negative",
  boundary: "local-shadow-visual-negative-retained-formal-v263-and-legacy-v9-default",
};
evidence.evidenceSha256 = sha256(canonicalJson(evidence));
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(resolve(ROOT, OUTPUT), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT, status: evidence.status, evidenceSha256: evidence.evidenceSha256 }, null, 2));
