import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const REPORT_PATH = "dist/science/visual-matrix-v275-mobile-390x844-corrected.json";
const PLAYWRIGHT_PATH = "output/playwright/v275-shadow-visual-mobile-corrected-result.json";
const CONFIG_PATH = "playwright.atlas.visual-v275-mobile-corrected.config.ts";
const SPEC_PATH = "tests/atlas-browser/atlas-visual-v275-four-way.spec.ts";
const OUTPUT = "dist/science/visual-matrix-v275-mobile-corrected-negative-evidence.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));

const [report, playwright] = await Promise.all([readJson(REPORT_PATH), readJson(PLAYWRIGHT_PATH)]);
const errorText = JSON.stringify(playwright.suites ?? []);
const expectedFailure = report.frameCount === 4
  && report.expectedFrameCount === 24
  && report.frames.every((frame) => frame.bytes > 20_000 && /^[a-f0-9]{64}$/.test(frame.sha256))
  && playwright.stats?.expected === 0
  && playwright.stats?.unexpected === 1
  && /getByRole/.test(errorText)
  && /button/.test(errorText)
  && /鏇村/.test(errorText);
if (!expectedFailure) throw new Error("v275 corrected mobile visual failure is not the expected More accessible-name boundary");

const evidence = {
  version: "v275-shadow-visual-mobile-corrected-negative-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "failed-mobile-more-accessible-name-route-no-retry",
  formalQualificationApplied: false,
  automaticRetryApplied: false,
  explicitCorrectedAttemptApplied: true,
  frameCount: report.frameCount,
  expectedFrameCount: report.expectedFrameCount,
  report: { path: REPORT_PATH, sha256: await fileSha256(REPORT_PATH) },
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
    project: "mobile-v275-visual-four-way-corrected-chrome-390x844",
    boundary: "visible-more-button-accessible-name-not-resolved-after-exoplanet-return",
    screenshotShowsVisibleMoreControl: true,
    productRenderingFailure: false,
    exposureBudgetFailure: false,
  },
  nextCorrectionPrepared: "visible-camera-tools-last-button-then-visible-launch-entry",
  nextCorrectedRunApplied: false,
  priorNegativeEvidence: "dist/science/visual-matrix-v275-current-memory-negative-evidence.json",
  artifacts: "output/playwright/v275-visual-four-way-mobile-corrected-negative",
  boundary: "second-mobile-test-route-negative-retained-formal-v263-and-legacy-v9-default",
};
evidence.evidenceSha256 = sha256(canonicalJson(evidence));
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(resolve(ROOT, OUTPUT), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT, status: evidence.status, evidenceSha256: evidence.evidenceSha256 }, null, 2));
