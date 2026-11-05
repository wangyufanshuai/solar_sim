import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { pinFileV662, safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";

const SAMPLES = Object.freeze([
  { path: "docs/release/v607/mainline-a-r75-v662-matrix-desktop-overview-20261013v662r75web03.png",
    observation: "Desktop matrix overview and candidate-only boundary legible; no visible horizontal clipping." },
  { path: "docs/release/v607/mainline-a-r75-v662-matrix-mobile-viewport-identity-conflict-20261013v662r75web03.png",
    observation: "Dumbbell conflict and alternative page remain distinct in the narrow review view." },
  { path: "output/playwright/mainline-a-r75-web-canonical-scene-desktop-nebula-carina-20261013-v662scene01.png",
    observation: "Carina candidate image, source credit and rights-pending label are simultaneously visible." },
  { path: "docs/release/v607/mainline-a-r75-v662-mobile-viewport-image-detail-20261013v662r75web02.png",
    observation: "Candidate image detail is reachable on a narrow viewport; evidence text is long and dense." },
  { path: "docs/release/v607/mainline-a-r75-v662-sky-mobile-viewport-star-detail-20261013v662r75web02.png",
    observation: "Sirius A parametric portrait is visible with source and component review status." },
  { path: "docs/release/v607/mainline-a-r75-v662-sky-desktop-constellations-20261013v662r75web02.png",
    observation: "Constellation cards and selected Orion chart are visible together." },
  { path: "output/playwright/mainline-a-r75-web-canonical-scene-mobile-constellation-Ori-20261013-v662scene02.png",
    observation: "Orion chart remains reachable in the narrow scene passport; dense explanatory text still merits human readability review." },
]);
function check(condition, code, detail) {
  if (!condition) throw new Error(`r75-visual:${code}${detail ? `:${detail}` : ""}`);
}
export function parseVisualOptionsV662(argv) {
  check(argv.length === 4 && argv[0] === "--run-id"
    && argv[2] === "--matrix-browser-run-id", "usage");
  check(/^20261013v662r75web0[1-9]$/.test(argv[1])
    && /^20261013v662r75web0[1-9]$/.test(argv[3]),
  "run-identities");
  return { runId: argv[1], matrixBrowserRunId: argv[3] };
}
function collectScreenshots(value, result = new Map()) {
  if (!value || typeof value !== "object") return result;
  if (typeof value.path === "string" && value.path.endsWith(".png")
    && Number.isInteger(value.bytes)
    && typeof value.sha256 === "string") {
    const old = result.get(value.path);
    check(!old || old.sha256 === value.sha256,
      "duplicate-image-drift", value.path);
    result.set(value.path, value);
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") collectScreenshots(child, result);
  }
  return result;
}
export function expectedVisualCoverageV662(records) {
  const { canonicalDesktop, canonicalMobile, sky, nebula, matrix } = records;
  const issues = [];
  if (canonicalDesktop?.items?.length !== 36
    || canonicalMobile?.items?.length !== 36) {
    issues.push("canonical-screenshot-matrix-incomplete");
  }
  if (sky?.desktop?.starSelections?.length !== 24
    || sky?.mobileViewport?.constellationSelections?.length !== 12
    || nebula?.desktop?.rows?.length !== 24
    || nebula?.mobileViewport?.rows?.length !== 24
    || matrix?.desktop?.selections?.length !== 96
    || matrix?.mobileViewport?.selections?.length !== 96) {
    issues.push("companion-browser-matrix-incomplete");
  }
  const screenshots = collectScreenshots(records);
  if (screenshots.size !== 88) issues.push("screenshot-count-not-88");
  for (const sample of SAMPLES) {
    if (!screenshots.has(sample.path)) issues.push(`sample-missing:${sample.path}`);
  }
  return { ok: issues.length === 0, issues,
    screenshotCount: screenshots.size,
    canonical: 72, sky: 6, nebula: 6, matrix: 4 };
}
export async function buildVisualReceiptV662(config) {
  const base = "docs/release/v607/";
  const files = {
    canonicalDesktop: `${base}mainline-a-r75-web-canonical-scene-desktop-raw-20261013-v662scene01.json`,
    canonicalMobile: `${base}mainline-a-r75-web-canonical-scene-mobile-raw-20261013-v662scene02.json`,
    sky: `${base}mainline-a-r75-v662-sky-browser-${config.runId}.json`,
    nebula: `${base}mainline-a-r75-v662-nebula-browser-${config.runId}.json`,
    matrix: `${base}mainline-a-r75-v662-matrix-browser-${config.matrixBrowserRunId}.json`,
  };
  const source = await captureBuildInputs();
  const records = Object.fromEntries(await Promise.all(
    Object.entries(files).map(async ([role, relative]) =>
      [role, JSON.parse(await readFile(safeWorkspacePathV662(relative), "utf8"))])));
  const coverage = expectedVisualCoverageV662(records);
  check(coverage.ok, "browser-visual-coverage", coverage.issues);
  for (const record of Object.values(records)) {
    const digest = record.appSourceSha256 ?? record.sourceSha256
      ?? record.build?.sourceSha256;
    check(digest === source.sha256, "source-drift", digest);
  }
  const expected = [...collectScreenshots(records).values()];
  const pins = await Promise.all(expected.map(async (item) => {
    const actual = await pinFileV662(item.path);
    check(actual.bytes === item.bytes && actual.sha256 === item.sha256,
      "screenshot-hash-drift", item.path);
    return actual;
  }));
  const after = await captureBuildInputs();
  check(after.sha256 === source.sha256, "source-changed-during-visual-pin");
  const output = `${base}mainline-a-r75-v662-visual-${config.runId}.json`;
  const receipt = { schema: "mainline-a-r75-visual-v662",
    status: "88-local-screenshots-pinned-seven-sample-inspected",
    observedAt: new Date().toISOString(),
    appSourceSha256: source.sha256,
    browserReceipts: files,
    coverage, screenshots: pins,
    samples: SAMPLES,
    observation: "No sampled horizontal clipping; narrow review views remain text-dense and require human readability signoff.",
    visualSignoff: "pending",
    physicalMobile: "not-run",
    evidenceClass: "local-browser-screenshot-pins-and-agent-sample-inspection",
    claims: { humanPerItemSignoff: false, realUserValidation: false,
      scientificValidity: false, copyrightApproval: false,
      productionPerformance: false, publicWebReleaseApproved: false } };
  await writeFile(safeWorkspacePathV662(output),
    `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  return { status: receipt.status, output,
    screenshots: pins.length, samplesInspected: SAMPLES.length };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await buildVisualReceiptV662(
    parseVisualOptionsV662(process.argv.slice(2)))));
}
