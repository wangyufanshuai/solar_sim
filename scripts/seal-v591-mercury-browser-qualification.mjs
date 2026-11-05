import { createHash } from "node:crypto";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const receiptPath = resolve(root, "docs/release/v591/browser-qualification-mercury-v591.json");
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
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.subarray(12, 16).toString("ascii") === "IHDR", "v591-mercury-browser-png");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
const unsigned = { ...receipt };
delete unsigned.receiptSha256;
assert(unsigned.version === "v591-mercury-browser-qualification-v1", "v591-mercury-browser-version");
assert(unsigned.status === "mercury-slice-passed-global-visual-matrix-pending", "v591-mercury-browser-status");
assert(unsigned.route === "/local-shadow-v591", "v591-mercury-browser-route");
assert(unsigned.runtime?.canvasCount === 1, "v591-mercury-browser-canvas");
assert(unsigned.runtime?.hero === "mercury" && unsigned.runtime?.heroAdmission === "admitted", "v591-mercury-browser-admission");
assert(unsigned.runtime?.requiredChannels === "4/4" && unsigned.runtime?.proceduralFallback === false, "v591-mercury-browser-channels");
assert(unsigned.runtime?.material === "nasa-pia15063-messenger-dem-oren-nayar-bounded-opposition-finite-relief-no-specular", "v591-mercury-browser-material");
assert(unsigned.runtime?.albedoDetailCeiling === "6132x3066-nasa-pia15063", "v591-mercury-browser-albedo-ceiling");
assert(unsigned.runtime?.terrainSource === "messenger-usgs-dem-23040x11520-signed-int16-meters", "v591-mercury-browser-terrain");
assert(unsigned.runtime?.desktopMobileDesktopReplay === "passed", "v591-mercury-browser-replay-status");
assert(unsigned.runtime?.scientificPayloadStableAcrossModesAndDeviceTiers === true && unsigned.runtime?.scientificWriteback === false, "v591-mercury-browser-science-boundary");
const expectedPhases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
const requiredAssets = ["mercury-albedo", "mercury-normal", "mercury-roughness", "mercury-height"];
assert(Array.isArray(unsigned.orderedReplay) && unsigned.orderedReplay.length === expectedPhases.length, "v591-mercury-browser-replay-count");
const payloads = new Set();
for (const [index, sample] of unsigned.orderedReplay.entries()) {
  assert(sample.sequence === index && sample.phase === expectedPhases[index], `v591-mercury-browser-replay-order:${index}`);
  const mobile = sample.deviceTier === "mobile";
  assert(sample.viewport === (mobile ? "390x844" : "1440x900"), `v591-mercury-browser-viewport:${index}`);
  assert(sample.heroAdmission === "admitted" && sample.ktx2First === true, `v591-mercury-browser-ktx2:${index}`);
  assert(sample.loaderLane === "v591" && sample.prewarm === "ready", `v591-mercury-browser-loader:${index}`);
  assert(sample.cameraSettled === true && sample.subjectVisible === true && sample.screenDiameterPx >= 72, `v591-mercury-browser-subject:${index}`);
  assert(sample.lod === (mobile ? "2048x1024" : "4096x2048"), `v591-mercury-browser-lod:${index}`);
  for (const id of requiredAssets) {
    assert(sample.textureSources.includes(`${id}:ktx2`), `v591-mercury-browser-source:${index}:${id}`);
    assert(sample.textureReceipt.includes(`${id}:ready:ktx2:`) && sample.textureReceipt.includes("quality=passed"), `v591-mercury-browser-texture-receipt:${index}:${id}`);
  }
  assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120, `v591-mercury-browser-fps:${index}`);
  assert(sample.drawCalls <= 60, `v591-mercury-browser-draw:${index}`);
  assert(sample.gpuBytes <= (mobile ? 201326592 : 536870912), `v591-mercury-browser-gpu:${index}`);
  payloads.add(sample.payloadSha256);
}
assert(payloads.size === 1 && payloads.has(unsigned.runtime.scientificPayloadSha256), "v591-mercury-browser-payload-replay");
assert(unsigned.errorAudit?.pageConsoleWarnings === 0 && unsigned.errorAudit?.pageConsoleErrors === 0, "v591-mercury-browser-console");
assert(unsigned.releaseAudit?.candidateResources === 0 && unsigned.releaseAudit?.candidateBytes === 0 && unsigned.releaseAudit?.rendererTextureDelta === 0, "v591-mercury-browser-release-owner");
assert(unsigned.releaseAudit?.candidateSceneNodes === 0 && unsigned.releaseAudit?.candidateProgramDelta === 0, "v591-mercury-browser-release-scene");
assert(unsigned.releaseAudit?.registryStatus === "baseline" && unsigned.releaseAudit?.status === "released-zero", "v591-mercury-browser-release-status");
assert(unsigned.screenshots?.length === 4, "v591-mercury-browser-screenshot-count");
for (const screenshot of unsigned.screenshots) {
  const bytes = readFileSync(resolve(root, screenshot.path));
  const dimensions = pngDimensions(bytes);
  assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256, `v591-mercury-browser-screenshot-sha:${screenshot.path}`);
  assert(dimensions.width === screenshot.width && dimensions.height === screenshot.height, `v591-mercury-browser-screenshot-dimensions:${screenshot.path}`);
  const desktop = screenshot.path.includes("desktop");
  assert(dimensions.width === (desktop ? 1440 : 390) && dimensions.height === (desktop ? 900 : 844), `v591-mercury-browser-screenshot-viewport:${screenshot.path}`);
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
