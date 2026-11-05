import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const captureRelativePath = "docs/release/v592/stellar-browser-capture-v592.json";
const receiptRelativePath = "docs/release/v592/stellar-browser-matrix-receipt-v592.json";
const expectedPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const maximumDesktopGpuBytes = 512 * 1024 * 1024;
const maximumCloseupDrawCalls = 65;
const minimumCloseupFps = 45;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}
function verifySealed(path, field) {
  const document = readJson(path);
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v592-stellar-browser-baseline-seal:${path}`);
  return document;
}
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function fail(reason) {
  throw new Error(`v592-stellar-browser-matrix:${reason}`);
}

const capturePath = resolve(root, captureRelativePath);
if (!existsSync(capturePath)) fail("capture-missing");
const captureBytes = readFileSync(capturePath);
const capture = JSON.parse(captureBytes.toString("utf8"));
const stellarPacket = verifySealed("public/data/living-universe-v592/stellar-heroes.json", "packetSha256");
const expectedIds = stellarPacket.heroes.map((hero) => hero.id);
const expectedTemperature = new Map(stellarPacket.heroes.map((hero) => [hero.id, hero.temperatureK]));

if (
  capture.version !== "v592-stellar-browser-capture-v1"
  || new URL(capture.route).hostname !== "127.0.0.1"
  || new URL(capture.route).pathname !== "/local-shadow-v592"
  || capture.viewport?.width !== 1440
  || capture.viewport?.height !== 900
  || capture.frozenJulianDate !== 2_451_545
) fail("capture-contract");
if (
  capture.diagnostics?.errorCount !== 0
  || capture.diagnostics?.warningCount !== 0
  || capture.diagnostics?.shaderOrWebglErrorCount !== 0
) fail("runtime-diagnostics");

const rows = [];
const screenshotShas = new Set();
for (const mode of ["science", "cinematic"]) {
  const entries = capture.modes?.[mode];
  if (!Array.isArray(entries) || entries.length !== expectedIds.length) fail(`${mode}-count`);
  if (new Set(entries.map((entry) => entry.id)).size !== expectedIds.length) fail(`${mode}-duplicate-id`);
  for (let index = 0; index < expectedIds.length; index += 1) {
    const entry = entries[index];
    const expectedId = expectedIds[index];
    const telemetry = entry.telemetry;
    if (
      entry.id !== expectedId
      || entry.observedId !== expectedId
      || telemetry?.id !== expectedId
      || telemetry?.mode !== mode
      || telemetry?.temperatureK !== expectedTemperature.get(expectedId)
      || telemetry?.runtimeAdmission !== "admitted"
      || telemetry?.scientificWriteback !== "false"
      || telemetry?.payloadSha256 !== expectedPayloadSha256
      || telemetry?.canvasCount !== 1
      || !Number.isFinite(telemetry?.fpsMedian)
      || telemetry.fpsMedian < minimumCloseupFps
      || !Number.isFinite(telemetry?.gpuBytes)
      || telemetry.gpuBytes > maximumDesktopGpuBytes
      || !Number.isFinite(telemetry?.drawCalls)
      || telemetry.drawCalls > maximumCloseupDrawCalls
    ) fail(`${mode}-telemetry:${expectedId}`);
    if (
      typeof entry.screenshotPath !== "string"
      || !entry.screenshotPath.startsWith("docs/release/v592/screenshots/stellar-matrix/")
      || !entry.screenshotPath.endsWith(".jpg")
      || entry.screenshotPath.includes("..")
    ) fail(`${mode}-screenshot-path:${expectedId}`);
    const screenshotPath = resolve(root, entry.screenshotPath);
    if (!existsSync(screenshotPath)) fail(`${mode}-screenshot-missing:${expectedId}`);
    const screenshotBytes = readFileSync(screenshotPath);
    const screenshotSha256 = sha256(screenshotBytes);
    if (
      screenshotBytes.byteLength !== entry.screenshotBytes
      || screenshotSha256 !== entry.screenshotSha256
      || screenshotBytes[0] !== 0xff
      || screenshotBytes[1] !== 0xd8
      || screenshotBytes[2] !== 0xff
    ) fail(`${mode}-screenshot-integrity:${expectedId}`);
    screenshotShas.add(screenshotSha256);
    rows.push({
      id: expectedId,
      mode,
      screenshotPath: entry.screenshotPath,
      screenshotBytes: entry.screenshotBytes,
      screenshotSha256,
      fpsMedian: telemetry.fpsMedian,
      gpuBytes: telemetry.gpuBytes,
      drawCalls: telemetry.drawCalls,
      payloadSha256: telemetry.payloadSha256,
      canvasCount: telemetry.canvasCount,
    });
  }
}
if (screenshotShas.size !== expectedIds.length * 2) fail("reused-screenshot");

const unsigned = {
  version: "v592-stellar-browser-matrix-receipt-v1",
  capturedAt: capture.capturedAt,
  status: "passed-24-of-24-two-mode-browser-matrix",
  route: "/local-shadow-v592",
  viewport: capture.viewport,
  frozenJulianDate: capture.frozenJulianDate,
  source: {
    capturePath: captureRelativePath,
    captureBytes: captureBytes.byteLength,
    captureSha256: sha256(captureBytes),
    stellarPacketSha256: stellarPacket.packetSha256,
  },
  admission: {
    stellarHeroCount: expectedIds.length,
    scienceFrameCount: rows.filter((row) => row.mode === "science").length,
    cinematicFrameCount: rows.filter((row) => row.mode === "cinematic").length,
    uniqueScreenshotCount: screenshotShas.size,
    minimumFpsMedian: Math.min(...rows.map((row) => row.fpsMedian)),
    peakGpuBytes: Math.max(...rows.map((row) => row.gpuBytes)),
    peakDrawCalls: Math.max(...rows.map((row) => row.drawCalls)),
    singleCanvas: rows.every((row) => row.canvasCount === 1),
    scienceCinematicPayloadStable: new Set(rows.map((row) => row.payloadSha256)).size === 1,
    scientificPayloadSha256: expectedPayloadSha256,
    scientificPayloadWriteback: false,
    consolePageWebglErrorCount: 0,
    humanVisualSignoff: "pending-full-v592-goal",
  },
  thresholds: {
    minimumCloseupFps,
    maximumDesktopGpuBytes,
    maximumCloseupDrawCalls,
  },
  frames: rows,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(resolve(root, receiptRelativePath), `${JSON.stringify(receipt, null, 2)}\n`);

console.log(JSON.stringify({
  status: receipt.status,
  receiptSha256: receipt.receiptSha256,
  stellarHeroCount: receipt.admission.stellarHeroCount,
  frameCount: receipt.frames.length,
  minimumFpsMedian: receipt.admission.minimumFpsMedian,
  peakGpuBytes: receipt.admission.peakGpuBytes,
  peakDrawCalls: receipt.admission.peakDrawCalls,
  scientificPayloadSha256: receipt.admission.scientificPayloadSha256,
}, null, 2));
