import { createHash } from "node:crypto";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
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
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.subarray(12, 16).toString("ascii") === "IHDR", "v591-ice-giant-browser-png");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const expectedPhases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
const sealedReceipts = [];
for (const body of ["uranus", "neptune"]) {
  const path = resolve(root, `docs/release/v591/browser-qualification-${body}-v591.json`);
  const receipt = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  assert(unsigned.version === "v591-ice-giant-browser-qualification-v1", `v591-${body}-browser-version`);
  assert(unsigned.status === `${body}-slice-passed-global-visual-matrix-pending`, `v591-${body}-browser-status`);
  assert(unsigned.route === "/local-shadow-v591", `v591-${body}-browser-route`);
  assert(unsigned.runtime?.canvasCount === 1 && unsigned.runtime?.hero === body && unsigned.runtime?.heroAdmission === "admitted", `v591-${body}-browser-admission`);
  assert(unsigned.runtime?.proceduralPrimary === true && unsigned.runtime?.proceduralFallback === false, `v591-${body}-browser-primary-policy`);
  assert(unsigned.runtime?.observationTextureClaim === false && unsigned.runtime?.measuredPhotometryClaim === false, `v591-${body}-browser-observation-policy`);
  assert(unsigned.runtime?.scientificPayloadStableAcrossModesAndDeviceTiers === true && unsigned.runtime?.scientificWriteback === false, `v591-${body}-browser-science-boundary`);
  assert(unsigned.orderedReplay?.length === expectedPhases.length, `v591-${body}-browser-replay-count`);
  const payloads = new Set();
  for (const [index, sample] of unsigned.orderedReplay.entries()) {
    const mobile = sample.deviceTier === "mobile";
    assert(sample.sequence === index && sample.phase === expectedPhases[index], `v591-${body}-browser-replay-order:${index}`);
    assert(sample.viewport === (mobile ? "390x844" : "1440x900"), `v591-${body}-browser-viewport:${index}`);
    assert(sample.heroAdmission === "admitted" && sample.ktx2First === false, `v591-${body}-browser-source-policy:${index}`);
    assert(sample.loaderLane === "v591" && sample.prewarm === "not-applicable-procedural-primary", `v591-${body}-browser-loader:${index}`);
    assert(sample.lod === (mobile ? "analytical-primary-96x48" : "analytical-primary-192x96"), `v591-${body}-browser-lod:${index}`);
    assert(sample.textureSources.includes("ice-giant-flow-primary:procedural-primary"), `v591-${body}-browser-source:${index}`);
    assert(sample.textureReceipt.includes("ice-giant-flow-primary:ready:procedural-primary:") && sample.textureReceipt.includes("quality=passed"), `v591-${body}-browser-receipt:${index}`);
    assert(sample.cameraSettled === true && sample.subjectVisible === true && sample.frameFits === true && sample.screenDiameterPx >= 72, `v591-${body}-browser-subject:${index}`);
    assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120 && sample.drawCalls <= 60, `v591-${body}-browser-performance:${index}`);
    assert(sample.gpuBytes <= (mobile ? 201326592 : 536870912), `v591-${body}-browser-gpu:${index}`);
    payloads.add(sample.payloadSha256);
  }
  assert(payloads.size === 1 && payloads.has(unsigned.runtime.scientificPayloadSha256), `v591-${body}-browser-payload-replay`);
  assert(unsigned.errorAudit?.pageConsoleWarnings === 0 && unsigned.errorAudit?.pageConsoleErrors === 0, `v591-${body}-browser-console`);
  assert(unsigned.releaseAudit?.candidateResources === 0 && unsigned.releaseAudit?.candidateBytes === 0 && unsigned.releaseAudit?.rendererTextureDelta === 0, `v591-${body}-browser-release-owner`);
  assert(unsigned.releaseAudit?.candidateSceneNodes === 0 && unsigned.releaseAudit?.candidateProgramDelta === 0, `v591-${body}-browser-release-scene`);
  assert(unsigned.releaseAudit?.registryStatus === "baseline" && unsigned.releaseAudit?.status === "released-zero", `v591-${body}-browser-release-status`);
  for (const screenshot of unsigned.screenshots) {
    const bytes = readFileSync(resolve(root, screenshot.path));
    const dimensions = pngDimensions(bytes);
    assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256, `v591-${body}-browser-screenshot-sha:${screenshot.path}`);
    assert(dimensions.width === screenshot.width && dimensions.height === screenshot.height, `v591-${body}-browser-screenshot-dimensions:${screenshot.path}`);
  }
  sealedReceipts.push({ path, sealed: { ...unsigned, receiptSha256: canonicalSha(unsigned) } });
}

for (const { path, sealed } of sealedReceipts) {
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`);
  rmSync(path, { force: true });
  renameSync(partial, path);
}

console.log(JSON.stringify({
  status: "ice-giant-browser-slices-passed-global-visual-matrix-pending",
  receipts: sealedReceipts.map(({ sealed }) => ({ body: sealed.runtime.hero, receiptSha256: sealed.receiptSha256 })),
}, null, 2));
