import { createHash } from "node:crypto";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const receiptPath = resolve(root, "docs/release/v591/browser-qualification-vesta-v591.json");
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
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.subarray(12, 16).toString("ascii") === "IHDR", "v591-vesta-browser-png");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
const unsigned = { ...receipt };
delete unsigned.receiptSha256;
assert(unsigned.version === "v591-vesta-browser-qualification-v1", "v591-vesta-browser-version");
assert(unsigned.status === "vesta-slice-passed-global-visual-matrix-pending", "v591-vesta-browser-status");
assert(unsigned.route === "/local-shadow-v591", "v591-vesta-browser-route");
assert(unsigned.runtime?.canvasCount === 1, "v591-vesta-browser-canvas");
assert(unsigned.runtime?.hero === "vesta" && unsigned.runtime?.heroAdmission === "admitted", "v591-vesta-browser-admission");
assert(unsigned.runtime?.requiredChannels === "4/4" && unsigned.runtime?.proceduralFallback === false, "v591-vesta-browser-channels");
assert(unsigned.runtime?.ownedModel?.includes("v591-vesta-nasa-shape-owned"), "v591-vesta-browser-model-identity");
assert(unsigned.runtime?.microtexturePolicy === "poly-haven-cc0-exact-byte-reuse-presentation-only-not-vesta-observation", "v591-vesta-browser-microtexture-policy");
assert(unsigned.runtime?.microtextureExactByteReuse === true && unsigned.runtime?.measuredPhotometryClaim === false, "v591-vesta-browser-authority-policy");
assert(unsigned.runtime?.desktopMobileDesktopReplay === "passed", "v591-vesta-browser-replay-status");
assert(unsigned.runtime?.scientificPayloadStableAcrossModesAndDeviceTiers === true && unsigned.runtime?.scientificWriteback === false, "v591-vesta-browser-science-boundary");
const expectedPhases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
const requiredAssets = ["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"];
const modelShas = [
  "1a723394ca60a238b3778f682cd1845fc0eca114583bcf6f3a8e1a040cf365c3",
  "d9f063c7640b7ec686f2faa685b56d2ae12e884851c83157b80b2673e6dfefdc",
];
assert(Array.isArray(unsigned.orderedReplay) && unsigned.orderedReplay.length === expectedPhases.length, "v591-vesta-browser-replay-count");
const payloads = new Set();
for (const [index, sample] of unsigned.orderedReplay.entries()) {
  assert(sample.sequence === index && sample.phase === expectedPhases[index], `v591-vesta-browser-replay-order:${index}`);
  const mobile = sample.deviceTier === "mobile";
  assert(sample.viewport === (mobile ? "390x844" : "1440x900"), `v591-vesta-browser-viewport:${index}`);
  assert(sample.heroAdmission === "admitted" && sample.ktx2First === true, `v591-vesta-browser-ktx2:${index}`);
  assert(sample.loaderLane === "v591" && sample.prewarm === "ready", `v591-vesta-browser-loader:${index}`);
  assert(sample.cameraSettled === true && sample.subjectVisible === true && sample.frameFits === true && sample.screenDiameterPx >= 72, `v591-vesta-browser-subject:${index}`);
  assert(sample.lod === (mobile ? "model-lod1;micro=2048x2048" : "model-lod0;micro=4096x4096"), `v591-vesta-browser-lod:${index}`);
  for (const id of requiredAssets) {
    assert(sample.textureSources.includes(`${id}:ktx2`), `v591-vesta-browser-source:${index}:${id}`);
    assert(sample.textureReceipt.includes(`${id}:ready:ktx2:`) && sample.textureReceipt.includes("quality=passed"), `v591-vesta-browser-texture-receipt:${index}:${id}`);
  }
  assert(sample.textureReceipt.startsWith("exact-byte-reuse:"), `v591-vesta-browser-texture-reuse:${index}`);
  assert(sample.textureReceipt.includes(`model:ready:lod=${mobile ? 1 : 0}:sha256=${modelShas[mobile ? 1 : 0]}`), `v591-vesta-browser-model-lod:${index}`);
  assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120, `v591-vesta-browser-fps:${index}`);
  assert(sample.drawCalls <= 60, `v591-vesta-browser-draw:${index}`);
  assert(sample.gpuBytes <= (mobile ? 201326592 : 536870912), `v591-vesta-browser-gpu:${index}`);
  payloads.add(sample.payloadSha256);
}
assert(payloads.size === 1 && payloads.has(unsigned.runtime.scientificPayloadSha256), "v591-vesta-browser-payload-replay");
assert(unsigned.errorAudit?.pageConsoleWarnings === 0 && unsigned.errorAudit?.pageConsoleErrors === 0, "v591-vesta-browser-console");
assert(unsigned.releaseAudit?.candidateResources === 0 && unsigned.releaseAudit?.candidateBytes === 0 && unsigned.releaseAudit?.rendererTextureDelta === 0, "v591-vesta-browser-release-owner");
assert(unsigned.releaseAudit?.candidateSceneNodes === 0 && unsigned.releaseAudit?.candidateProgramDelta === 0, "v591-vesta-browser-release-scene");
assert(unsigned.releaseAudit?.registryStatus === "baseline" && unsigned.releaseAudit?.status === "released-zero", "v591-vesta-browser-release-status");
for (const screenshot of unsigned.screenshots) {
  const bytes = readFileSync(resolve(root, screenshot.path));
  const dimensions = pngDimensions(bytes);
  assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256, `v591-vesta-browser-screenshot-sha:${screenshot.path}`);
  assert(dimensions.width === screenshot.width && dimensions.height === screenshot.height, `v591-vesta-browser-screenshot-dimensions:${screenshot.path}`);
  const desktop = screenshot.path.includes("desktop");
  assert(dimensions.width === (desktop ? 1440 : 390) && dimensions.height === (desktop ? 900 : 844), `v591-vesta-browser-screenshot-viewport:${screenshot.path}`);
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
