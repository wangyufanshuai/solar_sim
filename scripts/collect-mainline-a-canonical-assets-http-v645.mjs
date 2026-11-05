import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { captureCurrentInputs, safeFile, sha256, writeExclusiveJson } from "./mainline-a-release-evidence.mjs";

export const CANONICAL_COVERAGE_SHA256_V645 = "1b710eda006fbdd1908b8c0cb070b546bdfd12d3fe96f9f315d3640f0a627377";
export const CANONICAL_ASSET_HTTP_SCHEMA_V645 = "mainline-a-canonical-assets-http-v645b";
const SHA = /^[a-f0-9]{64}$/u;
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function args(argv) {
  const options = {};
  const allowed = new Set(["build", "coverage", "base-url", "output", "check", "json"]);
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index]?.replace(/^--/u, "");
    if (!argv[index]?.startsWith("--") || !allowed.has(key) || Object.hasOwn(options, key)) throw new Error(`invalid-option:${argv[index]}`);
    if (["check", "json"].includes(key)) options[key] = true;
    else options[key] = argv[++index];
  }
  for (const key of ["build", "coverage", "base-url"]) if (typeof options[key] !== "string" || !options[key]) throw new Error(`missing-${key}`);
  if (!options.check && !options.output) throw new Error("missing-output");
  return options;
}

export function jpegFrameHeaderV645(bytes) {
  if (bytes.length < 16 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("jpeg-signature-invalid");
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("jpeg-marker-invalid");
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
    if (offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) throw new Error("jpeg-segment-invalid");
    if (SOF.has(marker)) {
      if (length < 8) throw new Error("jpeg-frame-invalid");
      const bitDepth = bytes[offset + 2];
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      const channels = bytes[offset + 7];
      if (bitDepth !== 8 || width < 1 || height < 1 || ![1, 3, 4].includes(channels)) throw new Error("jpeg-frame-invalid");
      return { width, height, channels, estimatedRasterBytes: width * height * channels };
    }
    offset += length;
  }
  throw new Error("jpeg-frame-missing");
}

export function canonicalNebulaRoutesV645(coverage) {
  if (coverage?.schema !== "mainline-a-canonical-coverage-v622" || coverage?.counts?.total !== 36
    || coverage?.counts?.nebulae !== 12 || !Array.isArray(coverage.records) || coverage.records.length !== 36) {
    throw new Error("canonical-coverage-invalid");
  }
  const rows = coverage.records.filter((row) => row.kind === "nebula");
  if (rows.length !== 12 || new Set(rows.map((row) => row.id)).size !== 12
    || rows.some((row) => row.route?.assetId !== row.id
      || row.route?.route !== "mainline-a3-nebula-visual"
      || typeof row.route?.assetPath !== "string"
      || !/^public\/textures\/mainline-a\/[A-Za-z0-9_-]+\.jpg$/u.test(row.route.assetPath)
      || !SHA.test(row.route?.assetHash ?? "")
      || row.scientificPayloadWriteback !== false)) {
    throw new Error("canonical-nebula-route-invalid");
  }
  return rows.map((row) => ({ id: row.id, path: row.route.assetPath, sha256: row.route.assetHash }));
}

async function pinnedJson(workspace, requested, maxBytes) {
  const file = await safeFile(workspace, requested);
  if (file.stat.size <= 0 || file.stat.size > maxBytes) throw new Error(`input-size-invalid:${file.relative}`);
  const bytes = await readFile(file.absolute);
  return { file, bytes, value: JSON.parse(bytes.toString("utf8")), sha256: sha256(bytes) };
}

export async function collectCanonicalAssetHttpV645(workspace, options) {
  const base = new URL(options.baseUrl);
  if (base.protocol !== "http:" || base.hostname !== "127.0.0.1" || base.pathname !== "/") throw new Error("base-url-must-be-local-loopback");
  const build = await pinnedJson(workspace, options.build, 4 * 1024 * 1024);
  const coverage = await pinnedJson(workspace, options.coverage, 2 * 1024 * 1024);
  if (coverage.sha256 !== CANONICAL_COVERAGE_SHA256_V645) throw new Error("canonical-coverage-sha-mismatch");
  const routes = canonicalNebulaRoutesV645(coverage.value);
  const current = await captureCurrentInputs(workspace);
  if (build.value.status !== "passed" || build.value.exitCode !== 0 || build.value.sourceStable !== true
    || build.value.inputBefore?.sha256 !== current.sha256 || build.value.inputAfterSha256 !== current.sha256) {
    throw new Error("build-current-source-mismatch");
  }
  const rows = [];
  for (const route of routes) {
    const localFile = await safeFile(workspace, route.path);
    const localBytes = await readFile(localFile.absolute);
    if (localBytes.length > 32 * 1024 * 1024) throw new Error(`asset-too-large:${route.id}`);
    const assetUrl = new URL(route.path.slice("public".length), base);
    const startedAt = new Date().toISOString();
    let row;
    try {
      const response = await fetch(assetUrl, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
      const body = Buffer.from(await response.arrayBuffer());
      const endedAt = new Date().toISOString();
      const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? null;
      const observedSha = sha256(body);
      const localSha = sha256(localBytes);
      const frameHeader = jpegFrameHeaderV645(body);
      const passed = response.status === 200 && response.url === assetUrl.href && contentType === "image/jpeg"
        && body.length === localBytes.length && observedSha === route.sha256 && localSha === route.sha256;
      row = { id: route.id, path: route.path, url: assetUrl.href, startedAt, endedAt,
        httpStatus: response.status, contentType, bytes: body.length, expectedSha256: route.sha256,
        localSha256: localSha, sha256: observedSha, matchesManifest: observedSha === route.sha256,
        matchesCurrentLocalBytes: observedSha === localSha && body.length === localBytes.length,
        jpegFrameHeader: frameHeader, headerError: null, status: passed ? "passed" : "blocked" };
    } catch (error) {
      row = { id: route.id, path: route.path, url: assetUrl.href, startedAt, endedAt: new Date().toISOString(),
        httpStatus: null, contentType: null, bytes: 0, expectedSha256: route.sha256,
        localSha256: sha256(localBytes), sha256: null, matchesManifest: false,
        matchesCurrentLocalBytes: false, jpegFrameHeader: null,
        headerError: error instanceof Error ? error.name : String(error), status: "blocked" };
    }
    rows.push(row);
  }
  return { schema: CANONICAL_ASSET_HTTP_SCHEMA_V645, recordedAt: new Date().toISOString(),
    buildId: build.value.buildId, runtimeBuildId: build.value.runtimeBuildId,
    branch: build.value.branch, head: build.value.head,
    buildReceipt: { path: build.file.relative, sha256: build.sha256, bytes: build.bytes.length },
    coverage: { path: coverage.file.relative, sha256: coverage.sha256, bytes: coverage.bytes.length },
    evidenceClass: "http", status: rows.every((row) => row.status === "passed") ? "passed" : "blocked",
    rows, counts: { total: rows.length, passed: rows.filter((row) => row.status === "passed").length },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
    claims: { legalClearance: false, scientificValidity: false, productionPerformance: false, realUserValidation: false,
      fullImageDecode: false } };
}

async function main() {
  const options = args(process.argv.slice(2));
  const receipt = await collectCanonicalAssetHttpV645(process.cwd(), {
    build: options.build, coverage: options.coverage, baseUrl: options["base-url"],
  });
  if (!options.check) await writeExclusiveJson(process.cwd(), options.output, receipt);
  console.log(options.json ? JSON.stringify(receipt, null, 2) : `R66 canonical assets: ${receipt.status} ${receipt.counts.passed}/${receipt.counts.total}`);
  if (receipt.status !== "passed") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
