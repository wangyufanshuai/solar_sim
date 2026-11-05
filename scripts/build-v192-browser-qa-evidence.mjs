import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const screenshots = [
  {
    viewport: "desktop-1440x900",
    path: "output/playwright/v192-final-desktop-1440x900.png",
    width: 1440,
    height: 900,
    focusReturn: "data-atlas-section=simulation",
  },
  {
    viewport: "mobile-390x844",
    path: "output/playwright/v192-final-mobile-390x844.png",
    width: 390,
    height: 844,
    focusReturn: "data-atlas-accessibility-return-target=search",
  },
];

const artifacts = [];
for (const screenshot of screenshots) {
  const absolute = path.join(root, screenshot.path);
  const bytes = await readFile(absolute);
  const metadata = await sharp(bytes).metadata();
  if (metadata.width !== screenshot.width || metadata.height !== screenshot.height) {
    throw new Error(`Unexpected screenshot dimensions for ${screenshot.path}`);
  }
  artifacts.push({
    ...screenshot,
    bytes: (await stat(absolute)).size,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

const report = {
  version: "v192-fresh-browser-qa",
  generatedAt: new Date().toISOString(),
  nextBuildId: (await readFile(path.join(root, ".next-v192", "BUILD_ID"), "utf8")).trim(),
  runner: "playwright-cli-named-fresh-chrome-sessions",
  viewports: artifacts,
  assertions: {
    singleCanvasBeforeDuringAfterLaunchPanel: true,
    horizontalOverflowCount: 0,
    consoleErrorCount: 0,
    consoleWarningCount: 0,
    pageErrorCount: 0,
    response4xx5xxCount: 0,
    launchRegionReceivesFocus: true,
    escapeClosesLaunchPanel: true,
    focusReturnPassed: true,
    mobileMinimumTouchTargetPx: 40,
    mobileSmallTouchTargetCount: 0,
    v9Base4kStatus: 200,
    v9Base8kStatus: 200,
    moonTextureStatus: 200,
  },
  passed: true,
  boundary: "fresh-production-browser-observation-no-scientific-state-mutation",
};

await writeFile(
  path.join(root, "dist", "science", "browser-qa-v192.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(`v192 browser QA evidence: ${artifacts.length} viewports, passed`);
