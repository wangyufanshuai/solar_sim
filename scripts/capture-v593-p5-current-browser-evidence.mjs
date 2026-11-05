import { createHash } from "node:crypto";
import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const telemetryPath = resolve(root, "docs/release/v593/screenshots/p5-saturn-corrective/browser-telemetry-current-dev-v593.json");
const runnerPath = resolve(root, "tmp/v593-p5-current-browser-code.js");
const buildReceiptPath = resolve(root, "dist/release/atlas-v593-standalone-build-resource.json");
const bridgePath = resolve(root, "app/components/SignatureArtDirectionBridgeV593.tsx");
const playwrightCliPath = resolve(
  process.env.LOCALAPPDATA ?? "C:/Users/86137/AppData/Local",
  "npm-cache/_npx/31e32ef8478fbf80/node_modules/@playwright/cli/playwright-cli.js",
);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

const result = spawnSync(
  process.execPath,
  [playwrightCliPath, "-s=v593p5", "--raw", "run-code", "--filename", runnerPath],
  {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 240_000,
    windowsHide: true,
  },
);
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`v593-p5-playwright-cli:${result.status}:${result.stderr || result.stdout}`);

const returnedString = JSON.parse(result.stdout.trim());
const telemetry = JSON.parse(returnedString);
const buildReceipt = JSON.parse(await readFile(buildReceiptPath, "utf8"));
telemetry.server.buildId = buildReceipt.buildId;
telemetry.server.sourceManifestSha256 = buildReceipt.candidateSourceManifestSha256;
telemetry.server.bridgeSha256 = sha256(await readFile(bridgePath));

for (const frame of telemetry.frames) {
  for (const lane of ["baseline", "signature"]) {
    frame[lane].bytes = (await stat(resolve(root, frame[lane].path))).size;
  }
}
for (const frame of telemetry.mobile.frames) {
  frame.bytes = (await stat(resolve(root, frame.path))).size;
}

const unsigned = { ...telemetry };
delete unsigned.telemetrySha256;
telemetry.telemetrySha256 = canonicalSha(unsigned);
await writeFile(`${telemetryPath}.part`, `${JSON.stringify(telemetry, null, 2)}\n`, "utf8");
await rename(`${telemetryPath}.part`, telemetryPath);

console.log(JSON.stringify({
  status: "captured-current-source-p5",
  buildId: telemetry.server.buildId,
  sourceManifestSha256: telemetry.server.sourceManifestSha256,
  frameCount: telemetry.frames.length,
  resourceCycleCount: telemetry.resourceCycles.cycles.length,
  mobileFrameCount: telemetry.mobile.frames.length,
  rotationSampleCount: telemetry.rotation.samples.length,
  consoleCount: telemetry.console.count,
  telemetrySha256: telemetry.telemetrySha256,
}, null, 2));
