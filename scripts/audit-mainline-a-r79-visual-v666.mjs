import { createHash } from "node:crypto";
import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import acceptanceModule from
  "../app/lib/mainlineAWebAcceptanceV662.ts";
import visualModule from
  "../app/lib/mainlineAR79VisualReviewV666.ts";

const { assembleMainlineAWebAcceptanceV662 } =
  acceptanceModule.default ?? acceptanceModule;
const { assembleVisualReviewIndexV666,
  visualDeliveryByIdV666 } = visualModule.default ?? visualModule;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INPUTS = Object.freeze({
  canonical: "app/data/mainlineACanonicalCoverageV622.generated.json",
  sky: "app/data/mainlineAWebSkyAtlasV656.generated.json",
  nebula: "app/data/mainlineANebulaR73CatalogV660.generated.json",
  alternatives: "app/data/mainlineANebulaR74AlternativesV661.generated.json",
});
const V616 = Object.freeze([
  { path: "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json",
    sha256: "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b" },
  { path: "app/data/mainlineABetaStellarProjectionV607.generated.ts",
    sha256: "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce" },
]);
const ALLOWED_IMAGE_ROOTS = Object.freeze([
  "public/textures/mainline-a/",
  "docs/release/v607/nebula-review-derivatives/v655/",
  "docs/release/v607/nebula-r71-v658/raw/",
  "docs/release/v607/nebula-r72-v659/raw/",
]);
const MIME = Object.freeze({ jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp" });
const sha256 = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");

function check(value, code, detail) {
  if (!value) throw new Error("r79-visual:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}

export function parseR79VisualOptionsV666(argv) {
  check(argv.length === 4 && argv[0] === "--mode"
    && argv[2] === "--run-id"
    && ["audit", "replay"].includes(argv[1]), "usage");
  check(/^20261013v666r79visual0[1-9]$/.test(argv[3]), "run-id");
  return { mode: argv[1], runId: argv[3] };
}

function paths(runId) {
  const base = "docs/release/v607/mainline-a-r79-v666-visual-";
  return { audit: base + "static-" + runId + ".json",
    replay: base + "replay-" + runId + ".json" };
}

async function pinnedBytes(relative) {
  const file = safeWorkspacePathV662(relative);
  const entry = await lstat(file);
  check(entry.isFile() && !entry.isSymbolicLink(),
    "not-regular-file", relative);
  const resolved = await realpath(file);
  check(resolved.toLowerCase().startsWith(
    `${ROOT.toLowerCase()}${path.sep}`), "resolved-outside-workspace",
  relative);
  return readFile(file);
}

async function inputJson(relative) {
  const bytes = await pinnedBytes(relative);
  return { path: relative, bytes: bytes.length,
    sha256: sha256(bytes), value: JSON.parse(bytes.toString("utf8")) };
}

export function candidateLocalPathV666(plan, delivery) {
  check(plan.requestAllowed && plan.route && plan.expectedSha256,
    "not-a-requestable-image", plan.key);
  let candidate;
  if (plan.kind === "a-local-image") {
    candidate = "public" + plan.route;
  } else {
    check(delivery && delivery.route === plan.route
      && delivery.sha256 === plan.expectedSha256,
    "delivery-route-or-digest", plan.key);
    candidate = delivery.path;
  }
  check(typeof candidate === "string"
    && ALLOWED_IMAGE_ROOTS.some((prefix) => candidate.startsWith(prefix)),
  "image-path-outside-allowlist", candidate);
  safeWorkspacePathV662(candidate);
  return candidate;
}

export async function pinVisualImageV666(plan, delivery) {
  const candidate = candidateLocalPathV666(plan, delivery);
  const bytes = await pinnedBytes(candidate);
  const digest = sha256(bytes);
  check(digest === plan.expectedSha256,
    "candidate-image-sha", { key: plan.key, path: candidate });
  check(bytes.length > 0 && bytes.length <= 32 * 1024 * 1024,
    "candidate-image-size", plan.key);
  if (plan.expectedBytes !== null) {
    check(plan.expectedBytes === bytes.length,
      "candidate-image-byte-length", plan.key);
  }
  const metadata = await sharp(bytes, { limitInputPixels: 256e6 })
    .metadata();
  const mimeType = MIME[metadata.format];
  check(Boolean(mimeType) && metadata.width > 0
    && metadata.height > 0 && metadata.width <= 32768
    && metadata.height <= 32768,
  "candidate-image-decode", plan.key);
  if (plan.expectedMimeType) {
    check(plan.expectedMimeType === mimeType,
      "candidate-image-mime", plan.key);
  }
  if (plan.expectedWidth !== null || plan.expectedHeight !== null) {
    check(plan.expectedWidth === metadata.width
      && plan.expectedHeight === metadata.height,
    "candidate-image-dimensions", plan.key);
  }
  return { key: plan.key, id: plan.id, kind: plan.kind,
    route: plan.route, localPath: candidate,
    sha256: digest, bytes: bytes.length, mimeType,
    width: metadata.width, height: metadata.height,
    candidateOnly: true, rights: "pending",
    scientificPayloadWriteback: false };
}

function stableFingerprintV666(value) {
  return sha256(Buffer.from(JSON.stringify(value)));
}

export function inspectR79VisualAuditV666(receipt) {
  const issues = [];
  if (receipt?.schema !== "mainline-a-r79-visual-static-v666"
    || receipt?.status !== "local-file-pins-verified-candidate-hold"
    || !/^[a-f0-9]{64}$/.test(receipt?.appSourceSha256 ?? "")) {
    issues.push("receipt-shape-or-source");
  }
  const summary = receipt?.summary;
  if (summary?.matrixRows !== 96 || summary?.localImages !== 31
    || summary?.aImages !== 12 || summary?.betaImages !== 19
    || summary?.derivedPreviews !== 12 || summary?.officialRaw !== 7
    || summary?.sourceHolds !== 5 || summary?.identityHolds !== 4
    || summary?.rightsSigned !== 0 || summary?.runtimeAdmitted !== 0) {
    issues.push("coverage-or-promotion");
  }
  const images = receipt?.images;
  const routes = new Set();
  if (!Array.isArray(images) || images.length !== 31) {
    issues.push("image-pin-count");
  } else {
    for (const item of images) {
      if (!item.key || !item.route || routes.has(item.route)
        || !ALLOWED_IMAGE_ROOTS.some((root) =>
          item.localPath?.startsWith(root))
        || !/^[a-f0-9]{64}$/.test(item.sha256)
        || item.bytes <= 0 || item.width <= 0 || item.height <= 0
        || item.candidateOnly !== true || item.rights !== "pending"
        || item.scientificPayloadWriteback !== false) {
        issues.push(`image-pin-invalid:${item.key}`);
      }
      routes.add(item.route);
    }
  }
  if (receipt?.boundary?.candidateOnly !== true
    || receipt.boundary.hold !== true
    || receipt.boundary.notAdmitted !== true
    || receipt.boundary.scientificPayloadWriteback !== false
    || receipt.boundary.publicWebReleaseApproved !== false
    || receipt.newHttpsRequests !== 0) {
    issues.push("boundary-or-network");
  }
  const fingerprint = stableFingerprintV666({
    appSourceSha256: receipt?.appSourceSha256,
    inputPins: receipt?.inputPins,
    v616Pins: receipt?.v616Pins,
    images: receipt?.images,
    summary: receipt?.summary,
    boundary: receipt?.boundary,
  });
  if (receipt?.fingerprint !== fingerprint) {
    issues.push("fingerprint");
  }
  return { ok: issues.length === 0, issues, fingerprint };
}

export async function buildR79VisualAuditV666(runId) {
  check(/^20261013v666r79visual0[1-9]$/.test(runId), "run-id");
  const sourceBefore = await captureBuildInputs();
  const inputValues = await Promise.all(Object.values(INPUTS).map(inputJson));
  const [canonical, sky, nebula, alternatives] = inputValues;
  const matrix = assembleMainlineAWebAcceptanceV662(
    canonical.value, sky.value, nebula.value, alternatives.value);
  const index = assembleVisualReviewIndexV666(matrix, nebula.value);
  check(index.status === "valid-candidate-hold",
    "visual-index-invalid", index.issues);
  const byId = visualDeliveryByIdV666(nebula.value);
  const images = [];
  for (const plan of index.plans.filter((item) => item.requestAllowed)) {
    images.push(await pinVisualImageV666(plan,
      byId.get(plan.id) ?? null));
  }
  const v616Pins = [];
  for (const pin of V616) {
    const bytes = await pinnedBytes(pin.path);
    const actual = sha256(bytes);
    check(actual === pin.sha256, "v616-pin-drift", pin.path);
    v616Pins.push({ path: pin.path, bytes: bytes.length,
      sha256: actual });
  }
  const sourceAfter = await captureBuildInputs();
  check(sourceBefore.sha256 === sourceAfter.sha256,
    "source-changed-during-audit");
  const summary = { matrixRows: index.counts.total,
    localImages: images.length,
    aImages: index.counts.aImages,
    betaImages: index.counts.betaImages,
    derivedPreviews: index.counts.derivedPreviews,
    officialRaw: index.counts.officialRaw,
    sourceHolds: index.counts.sourceHolds,
    identityHolds: index.counts.identityHolds,
    noLocalImage: index.counts.noLocalImage,
    rightsSigned: 0, runtimeAdmitted: 0 };
  const boundary = { candidateOnly: true, hold: true,
    notAdmitted: true, scientificPayloadWriteback: false,
    publicWebReleaseApproved: false };
  const inputPins = inputValues.map(({ path: file, bytes, sha256: hash }) =>
    ({ path: file, bytes, sha256: hash }));
  const fingerprint = stableFingerprintV666({
    appSourceSha256: sourceBefore.sha256, inputPins,
    v616Pins, images, summary, boundary });
  const receipt = {
    schema: "mainline-a-r79-visual-static-v666",
    status: "local-file-pins-verified-candidate-hold",
    runId, generatedAt: new Date().toISOString(),
    appSourceSha256: sourceBefore.sha256,
    inputPins, v616Pins, images, summary, boundary,
    newHttpsRequests: 0,
    evidenceClass: "offline-local-file-and-decoding-audit",
    claims: { scientificValidity: false, copyrightApproval: false,
      humanVisualSignoff: false, productionPerformance: false,
      publicWebReleaseApproved: false },
    fingerprint,
  };
  check(inspectR79VisualAuditV666(receipt).ok,
    "self-inspection-failed");
  return receipt;
}

export async function replayR79VisualAuditV666(saved, runId) {
  const inspection = inspectR79VisualAuditV666(saved);
  const fresh = await buildR79VisualAuditV666(runId);
  const issues = [...inspection.issues];
  if (saved?.fingerprint !== fresh.fingerprint
    || saved?.appSourceSha256 !== fresh.appSourceSha256) {
    issues.push("current-source-or-file-drift");
  }
  return { schema: "mainline-a-r79-visual-replay-v666",
    status: issues.length ? "replay-rejected" : "replayed-candidate-hold",
    ok: issues.length === 0, issues,
    appSourceSha256: fresh.appSourceSha256,
    fingerprint: fresh.fingerprint, releaseAllowed: false };
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const { mode, runId } = parseR79VisualOptionsV666(
    process.argv.slice(2));
  const output = paths(runId);
  if (mode === "audit") {
    const receipt = await buildR79VisualAuditV666(runId);
    await writeFile(safeWorkspacePathV662(output.audit),
      JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
    console.log(JSON.stringify({ status: receipt.status,
      images: receipt.images.length, output: output.audit }));
  } else {
    const saved = JSON.parse(await pinnedBytes(output.audit));
    const report = await replayR79VisualAuditV666(saved, runId);
    await writeFile(safeWorkspacePathV662(output.replay),
      JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
    console.log(JSON.stringify(report));
    if (!report.ok) process.exitCode = 1;
  }
}
