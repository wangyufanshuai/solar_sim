import { createHash } from "node:crypto";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const receiptPath = resolve(root, "docs/release/v591/browser-qualification-moon-v591.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function pngDimensions(bytes) {
  const signature = bytes.subarray(0, 8).toString("hex");
  assert(signature === "89504e470d0a1a0a" && bytes.subarray(12, 16).toString("ascii") === "IHDR", "v591-moon-browser-png");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
const unsigned = { ...receipt };
delete unsigned.receiptSha256;
assert(unsigned.version === "v591-moon-browser-qualification-v2", "v591-moon-browser-version");
assert(unsigned.status === "moon-slice-passed-global-visual-matrix-pending", "v591-moon-browser-status");
assert(unsigned.route === "/local-shadow-v591", "v591-moon-browser-route");
assert(unsigned.runtime?.canvasCount === 1, "v591-moon-browser-canvas");
assert(unsigned.runtime?.hero === "moon" && unsigned.runtime?.heroAdmission === "admitted", "v591-moon-browser-admission");
assert(unsigned.runtime?.desktopMobileDesktopReplay === "passed", "v591-moon-browser-replay-status");
assert(unsigned.runtime?.scientificPayloadStableAcrossModesAndDeviceTiers === true && unsigned.runtime?.scientificWriteback === false, "v591-moon-browser-science-boundary");
const expectedPhases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
assert(Array.isArray(unsigned.orderedReplay) && unsigned.orderedReplay.length === expectedPhases.length, "v591-moon-browser-replay-count");
const payloads = new Set();
for (const [index, sample] of unsigned.orderedReplay.entries()) {
  assert(sample.sequence === index && sample.phase === expectedPhases[index], `v591-moon-browser-replay-order:${index}`);
  const mobile = sample.deviceTier === "mobile";
  assert(sample.viewport === (mobile ? "390x844" : "1440x900"), `v591-moon-browser-viewport:${index}`);
  assert(sample.heroAdmission === "admitted" && sample.ktx2First === true, `v591-moon-browser-ktx2:${index}`);
  assert(sample.loaderLane === "v591" && sample.prewarm === "ready", `v591-moon-browser-loader:${index}`);
  assert(sample.cameraSettled === true && sample.subjectVisible === true && sample.screenDiameterPx >= 72, `v591-moon-browser-subject:${index}`);
  assert(sample.lod === (mobile ? "2048x1024" : "8192x4096"), `v591-moon-browser-lod:${index}`);
  for (const id of ["moon-albedo", "moon-normal", "moon-roughness", "moon-height"]) {
    assert(sample.textureSources.includes(`${id}:ktx2`), `v591-moon-browser-source:${index}:${id}`);
    assert(sample.textureReceipt.includes(`${id}:ready:ktx2:`) && sample.textureReceipt.includes("quality=passed"), `v591-moon-browser-texture-receipt:${index}:${id}`);
  }
  assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120, `v591-moon-browser-fps:${index}`);
  assert(sample.drawCalls <= 60, `v591-moon-browser-draw:${index}`);
  assert(sample.gpuBytes <= (mobile ? 201326592 : 536870912), `v591-moon-browser-gpu:${index}`);
  payloads.add(sample.payloadSha256);
}
assert(payloads.size === 1 && payloads.has(unsigned.runtime.scientificPayloadSha256), "v591-moon-browser-payload-replay");
assert(unsigned.errorAudit?.pageConsoleWarnings === 0 && unsigned.errorAudit?.pageConsoleErrors === 0, "v591-moon-browser-console");
assert(unsigned.releaseAudit?.candidateResources === 0 && unsigned.releaseAudit?.candidateBytes === 0 && unsigned.releaseAudit?.rendererTextureDelta === 0, "v591-moon-browser-release-owner");
assert(unsigned.releaseAudit?.candidateSceneNodes === 0 && unsigned.releaseAudit?.candidateProgramDelta === 0, "v591-moon-browser-release-scene");
assert(unsigned.releaseAudit?.registryStatus === "baseline" && unsigned.releaseAudit?.status === "released-zero", "v591-moon-browser-release-status");
for (const screenshot of unsigned.screenshots) {
  const bytes = readFileSync(resolve(root, screenshot.path));
  const dimensions = pngDimensions(bytes);
  assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256, `v591-moon-browser-screenshot-sha:${screenshot.path}`);
  assert(dimensions.width === screenshot.width && dimensions.height === screenshot.height, `v591-moon-browser-screenshot-dimensions:${screenshot.path}`);
  const desktop = screenshot.path.includes("desktop");
  assert(dimensions.width === (desktop ? 1440 : 390) && dimensions.height === (desktop ? 900 : 844), `v591-moon-browser-screenshot-viewport:${screenshot.path}`);
}
const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
const partial = `${receiptPath}.part`;
writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`);
rmSync(receiptPath, { force: true });
renameSync(partial, receiptPath);
console.log(JSON.stringify({
  status: sealed.status,
  orderedReplay: sealed.orderedReplay.length,
  screenshots: sealed.screenshots.length,
  scientificPayloadSha256: sealed.runtime.scientificPayloadSha256,
  receiptSha256: sealed.receiptSha256,
}, null, 2));
