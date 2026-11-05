import { createHash } from "node:crypto";
import { access, lstat, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from "./build-mainline-a-r75-matrix-v662.mjs";
import { inspectR79VisualAuditV666 } from "./audit-mainline-a-r79-visual-v666.mjs";
import { verifyR80HttpV667 } from "./verify-mainline-a-r80-http-v667.mjs";
import { validateM1Build } from "./capture-mainline-a-m1-browser.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = "docs/release/v607/mainline-a-r79-v666-visual-static-20261013v666r79visual04.json";
const HELD = ["ring-nebula", "dumbbell-nebula", "bubble-nebula", "cats-eye-nebula", "omega-nebula"];
const MIME = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (ok, message) => { if (!ok) throw new Error(`m1-http:${message}`); };
const relative = (file) => path.relative(ROOT, file).replaceAll("\\", "/");

export function parseM1HttpOptions(args) {
  const values = {};
  const allowed = new Set(["origin", "build-receipt", "mode", "run-id"]);
  check(args.length === 8, "four-option-pairs-required");
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    check(args[i].startsWith("--") && allowed.has(key) && !(key in values)
      && args[i + 1] && !args[i + 1].startsWith("--"), "invalid-option");
    values[key] = args[i + 1];
  }
  check(["enabled", "default-off"].includes(values.mode), "mode");
  check(/^[a-zA-Z0-9-]{8,48}$/.test(values["run-id"] ?? ""), "run-id");
  const origin = new URL(values.origin ?? "http://invalid");
  check(origin.protocol === "http:" && origin.hostname === "127.0.0.1" && origin.port
    && origin.pathname === "/" && !origin.search && !origin.hash
    && !origin.username && !origin.password, "explicit-local-origin-required");
  const buildReceipt = relative(path.resolve(ROOT, values["build-receipt"]));
  safeWorkspacePathV662(buildReceipt);
  return { mode: values.mode, origin: origin.origin, buildReceipt, runId: values["run-id"] };
}

async function localBytes(file) {
  const absolute = safeWorkspacePathV662(file);
  const stat = await lstat(absolute);
  const resolved = await realpath(absolute);
  check(stat.isFile() && !stat.isSymbolicLink()
    && resolved.toLowerCase().startsWith(ROOT.toLowerCase() + path.sep), `local-file:${file}`);
  return readFile(absolute);
}

export async function revalidateM1AssetPins(audit) {
  const inspection = inspectR79VisualAuditV666(audit);
  check(inspection.ok, `asset-index-invalid:${inspection.issues.join(",")}`);
  check(audit.inputPins?.length === 4 && audit.v616Pins?.length === 2, "metadata-pin-count");
  const metadataPins = [];
  for (const pin of [...audit.inputPins, ...audit.v616Pins]) {
    const bytes = await localBytes(pin.path);
    check(bytes.length === pin.bytes && sha(bytes) === pin.sha256, `metadata-pin-drift:${pin.path}`);
    metadataPins.push({ ...pin, verified: true });
  }
  const images = [];
  for (const pin of audit.images) {
    const bytes = await localBytes(pin.localPath);
    check(bytes.length === pin.bytes && sha(bytes) === pin.sha256, `image-pin-drift:${pin.key}`);
    const meta = await sharp(bytes, { limitInputPixels: 256e6 }).metadata();
    check(meta.width === pin.width && meta.height === pin.height
      && MIME[meta.format] === pin.mimeType, `image-metadata-drift:${pin.key}`);
    images.push({ ...pin, verified: true });
  }
  return { verifiedAt: new Date().toISOString(), metadataPins, images,
    imageCount: images.length, metadataCount: metadataPins.length,
    use: "historical-asset-index-revalidated-against-current-disk-not-current-source-acceptance" };
}

async function request(origin, route) {
  check(route.startsWith("/") && !route.startsWith("//") && !/[?#]/.test(route)
    && !route.includes(".."), "unsafe-route");
  const response = await fetch(origin + route, { redirect: "manual", cache: "no-store",
    signal: AbortSignal.timeout(25_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { route, finalUrl: response.url, status: response.status,
    contentType: response.headers.get("content-type"), bytes: bytes.length, sha256: sha(bytes),
    artifactSha256: response.headers.get("x-artifact-sha256"),
    reviewOnly: response.headers.get("x-mainline-a-review-only"),
    rights: response.headers.get("x-mainline-a-rights"),
    writeback: response.headers.get("x-scientific-payload-writeback") };
}

export async function runM1Http(config) {
  const prefix = `docs/release/v607/mainline-a-m1-http-${config.mode}-${config.runId}`;
  for (const file of [`${prefix}.json`, `${prefix}-failed.json`]) {
    try { await access(safeWorkspacePathV662(file)); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    throw new Error(`m1-http:output-already-exists:${file}`);
  }
  const receipt = { schema: "mainline-a-m1-http-v1", startedAt: new Date().toISOString(),
    status: "running", ...config, stage: "asset-index", observation: { images: [], heldImages: [] },
    evidenceClass: "local-production-http", physicalMobile: "not-run", publicDeployment: "not-run",
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, publicWebReleaseApproved: false },
    claims: { humanVisualSignoff: false, scientificValidity: false,
      copyrightApproval: false, productionPerformance: false } };
  try {
    const auditBytes = await localBytes(AUDIT);
    const audit = JSON.parse(auditBytes.toString("utf8"));
    receipt.assetIndex = { path: AUDIT, sha256: sha(auditBytes),
      historicalAppSourceSha256: audit.appSourceSha256 };
    receipt.localPins = await revalidateM1AssetPins(audit);
    receipt.stage = "current-build-binding";
    const buildBytes = await localBytes(config.buildReceipt);
    const build = JSON.parse(buildBytes.toString("utf8"));
    const source = await captureBuildInputs();
    const diskBuildId = (await localBytes(`${build.distDir}/BUILD_ID`)).toString("utf8").trim();
    receipt.build = validateM1Build(build, source, diskBuildId);
    receipt.buildReceiptSha256 = sha(buildBytes);
    receipt.stage = "home";
    receipt.observation.home = await request(config.origin, "/");
    receipt.stage = "health";
    receipt.observation.health = await request(config.origin, "/api/health");
    receipt.stage = "running-build-manifest";
    const manifestRoute = `/_next/static/${build.buildId}/_buildManifest.js`;
    const manifestBytes = await localBytes(`${build.distDir}/static/${build.buildId}/_buildManifest.js`);
    receipt.runningBuildManifest = await request(config.origin, manifestRoute);
    check(receipt.runningBuildManifest.status === 200
      && receipt.runningBuildManifest.sha256 === sha(manifestBytes)
      && receipt.runningBuildManifest.bytes === manifestBytes.length, "running-build-manifest-mismatch");
    for (const pin of audit.images) {
      receipt.stage = `image:${pin.key}`;
      receipt.observation.images.push(await request(config.origin, pin.route));
    }
    for (const id of HELD) {
      receipt.stage = `held:${id}`;
      receipt.observation.heldImages.push({ id, ...await request(config.origin,
        `/api/atlas/mainline-a-nebula-review/${id}/detail`) });
    }
    receipt.stage = "invalid-route";
    receipt.observation.invalidRoute = await request(config.origin,
      "/api/atlas/mainline-a-nebula-review/not-an-object/detail");
    receipt.verification = verifyR80HttpV667(audit, receipt.observation, config.origin, config.mode);
    check(receipt.verification.ok, `http-verification:${receipt.verification.issues.join(",")}`);
    receipt.stage = "final-source-and-assets";
    receipt.sourceAfterSha256 = (await captureBuildInputs()).sha256;
    check(receipt.sourceAfterSha256 === source.sha256, "source-drift-during-http");
    const afterPins = await revalidateM1AssetPins(audit);
    receipt.localPinsRecheckedAt = afterPins.verifiedAt;
    receipt.status = "passed-current-build-local-http-candidate-only";
    receipt.stage = "complete";
    receipt.endedAt = new Date().toISOString();
    await writeFile(safeWorkspacePathV662(`${prefix}.json`), JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
    return { status: receipt.status, output: `${prefix}.json`, requests: 40,
      images: 31, held: 5, localMetadataPins: 6, mode: config.mode };
  } catch (error) {
    receipt.status = "failed-preserved";
    receipt.endedAt = new Date().toISOString();
    receipt.error = { name: error.name, message: error.message };
    await writeFile(safeWorkspacePathV662(`${prefix}-failed.json`), JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runM1Http(parseM1HttpOptions(process.argv.slice(2)))));
}
