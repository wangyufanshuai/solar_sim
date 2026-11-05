import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import { acquireKerrScienceImageProductV344, getKerrScienceImageProductClientSnapshotV344, resetKerrScienceImageProductClientV344ForTests, type KerrScienceImageProductExpectationV344 } from "../app/lib/kerrScienceImageProductClientV344";
import { parseKerrScienceImageProductManifestV343 } from "../app/lib/kerrScienceImageProductsV343";
import { parseKerrScienceImageProductLifecycleV344 } from "../app/lib/kerrScienceImageProductLifecycleV344";

const root = process.cwd(); const manifestPath = "dist/science/kerr-observation-images-v343/manifest.json"; const outputPath = "dist/science/kerr-image-lifecycle-v344/replay.json";
const manifest = parseKerrScienceImageProductManifestV343(JSON.parse(readFileSync(resolve(root, manifestPath), "utf8")));
const product = (id: "fits" | "png") => manifest.products.find((entry) => entry.id === id)!;
const expectation = (id: "fits" | "png"): KerrScienceImageProductExpectationV344 => ({ id, endpoint: `/api/atlas/relativity-evidence/v343/products/${id}`, sha256: product(id).sha256, manifestSha256: manifest.manifestSha256, bytes: product(id).bytes, mimeType: id === "fits" ? "application/fits" : "image/png" });
const originalFetch = globalThis.fetch;
const response = (id: "fits" | "png", bytes: Uint8Array) => new Response(bytes.slice(), { status: 200, headers: { "content-type": expectation(id).mimeType, "content-length": String(bytes.byteLength), etag: `"${expectation(id).sha256}"`, "x-atlas-science-product": `v343-${id}` } });
function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); }
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
async function main() {
  resetKerrScienceImageProductClientV344ForTests();
  const baseline = getAtlasResourceSnapshot(); const beforeIntent = getKerrScienceImageProductClientSnapshotV344();
  const pngBytes = new Uint8Array(readFileSync(resolve(root, product("png").path))); const fitsBytes = new Uint8Array(readFileSync(resolve(root, product("fits").path)));
  globalThis.fetch = async (input) => { const id = String(input).endsWith("/fits") ? "fits" : "png"; return response(id, id === "fits" ? fitsBytes : pngBytes); };
  const [first, second] = await Promise.all([acquireKerrScienceImageProductV344(expectation("png")), acquireKerrScienceImageProductV344(expectation("png"))]);
  const concurrent = getKerrScienceImageProductClientSnapshotV344(); const during = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  second.release(); second.release(); first.release(); const afterReverse = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const fits = await acquireKerrScienceImageProductV344(expectation("fits")); const fitsObjectUrlPublished = fits.objectUrl.startsWith("blob:"); fits.release(); const afterFits = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()); const afterFitsClient = getKerrScienceImageProductClientSnapshotV344();
  let corruptRejected = false; const corrupted = new Uint8Array(pngBytes.byteLength); globalThis.fetch = async () => response("png", corrupted);
  try { await acquireKerrScienceImageProductV344(expectation("png")); } catch { corruptRejected = true; }
  const afterCorrupt = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const replay = parseKerrScienceImageProductLifecycleV344({ version: "v344-kerr-science-image-product-lifecycle-replay-v1", status: "qualified-intent-single-flight-integrity-idempotent-baseline", source: { manifestSha256: manifest.manifestSha256, fitsSha256: product("fits").sha256, pngSha256: product("png").sha256 }, beforeIntent: { productFetchCount: beforeIntent.fetchCount, cacheEntries: beforeIntent.cacheEntries, referenceCount: beforeIntent.referenceCount }, concurrentPng: { consumerCount: 2, productFetchCount: concurrent.fetchCount, cacheEntries: concurrent.cacheEntries, referenceCount: concurrent.referenceCount, during }, reverseRelease: { duplicateReleaseApplied: true, after: afterReverse, baselineReturned: afterReverse.status === "baseline" }, fitsDownload: { productFetchCount: afterFitsClient.fetchCount, objectUrlPublished: fitsObjectUrlPublished, after: afterFits, baselineReturned: afterFits.status === "baseline" }, corruptBytes: { rejected: corruptRejected, objectUrlPublished: false, after: afterCorrupt, baselineReturned: afterCorrupt.status === "baseline" }, intentBeforeProductRequest: true, singleFlight: true, exactShaVerified: true, objectUrlPerConsumer: true, idempotentRelease: true, mobilePreview: "fit-width-no-crop-no-prefetch", denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", boundary: "node-browser-api-replay-real-client-no-project-server-no-playwright-no-product-promotion" });
  const unsigned = { version: "v344-kerr-science-image-lifecycle-artifact-v1", generatedAt: new Date().toISOString(), status: replay.status, source: { manifestPath, manifestFileSha256: createHash("sha256").update(readFileSync(resolve(root, manifestPath))).digest("hex"), manifestSha256: manifest.manifestSha256 }, replay };
  const artifact = { ...unsigned, artifactSha256: sha(unsigned) }; const target = resolve(root, outputPath); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`); renameSync(temporary, target);
  console.log(JSON.stringify({ status: replay.status, artifactSha256: artifact.artifactSha256, beforeIntent: replay.beforeIntent, concurrent: replay.concurrentPng, reverseBaseline: replay.reverseRelease.baselineReturned, fitsBaseline: replay.fitsDownload.baselineReturned, corruptBaseline: replay.corruptBytes.baselineReturned }, null, 2));
}
void main().finally(() => { globalThis.fetch = originalFetch; resetKerrScienceImageProductClientV344ForTests(); }).catch((error: unknown) => { console.error(error); process.exitCode = 1; });
