import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { request } from "node:https";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-15T00:00:00Z";
const receiptPath = resolve(root, "docs/release/v592/acquisition-receipt-small-body-rotation-metadata-v592.json");
const sources = Object.freeze([
  {
    id: "bennu-jpl-sbdb-physical-parameters",
    bodyId: "bennu",
    url: "https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=101955&phys-par=1&full-prec=1",
    host: "ssd-api.jpl.nasa.gov",
    outputPath: "source-cache/v592/rotation/bennu-jpl-sbdb.json",
  },
  {
    id: "kleopatra-jpl-sbdb-physical-parameters",
    bodyId: "kleopatra",
    url: "https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=216&phys-par=1&full-prec=1",
    host: "ssd-api.jpl.nasa.gov",
    outputPath: "source-cache/v592/rotation/kleopatra-jpl-sbdb.json",
  },
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, bytes);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function writeReceipt(unsigned) {
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
  return receipt;
}
function verifyExisting() {
  if (!existsSync(receiptPath)) return null;
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  if (canonicalSha(unsigned) !== receipt.receiptSha256) throw new Error("v592-small-body-rotation-existing-receipt-seal");
  for (const asset of receipt.assets ?? []) {
    const path = resolve(root, asset.outputPath);
    if (!existsSync(path)) throw new Error(`v592-small-body-rotation-existing-source-missing:${asset.bodyId}`);
    const bytes = readFileSync(path);
    if (bytes.byteLength !== asset.bytes || sha256(bytes) !== asset.sha256) throw new Error(`v592-small-body-rotation-existing-source-drift:${asset.bodyId}`);
  }
  return receipt;
}

function fetchOnce(source) {
  return new Promise((resolvePromise, rejectPromise) => {
    const url = new URL(source.url);
    if (url.protocol !== "https:" || url.hostname !== source.host) {
      rejectPromise(new Error(`v592-small-body-rotation-allowlist:${source.id}`));
      return;
    }
    const req = request(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Orbit-Atlas-v592-metadata-probe/1.0",
      },
    }, (response) => {
      const chunks = [];
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        response.resume();
        rejectPromise(new Error(`v592-small-body-rotation-redirect-rejected:${source.id}:${status}:${response.headers.location ?? "missing-location"}`));
        return;
      }
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const bytes = Buffer.concat(chunks);
        if (status !== 200) {
          rejectPromise(new Error(`v592-small-body-rotation-http:${source.id}:${status}`));
          return;
        }
        try {
          JSON.parse(bytes.toString("utf8"));
        } catch {
          rejectPromise(new Error(`v592-small-body-rotation-json:${source.id}`));
          return;
        }
        resolvePromise({
          status,
          contentType: response.headers["content-type"] ?? null,
          lastModified: response.headers["last-modified"] ?? null,
          etag: response.headers.etag ?? null,
          bytes,
        });
      });
    });
    req.on("error", rejectPromise);
    req.end();
  });
}

const existing = verifyExisting();
if (existing) {
  console.log(JSON.stringify({ status: "verified-existing-no-request", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

const assets = [];
const failures = [];
for (const source of sources) {
  const output = resolve(root, source.outputPath);
  const temporary = `${output}.part`;
  if (existsSync(output) || existsSync(temporary)) {
    failures.push({ bodyId: source.bodyId, error: "unreceipted-existing-output" });
    continue;
  }
  try {
    const response = await fetchOnce(source);
    atomicWrite(output, response.bytes);
    const document = JSON.parse(response.bytes.toString("utf8"));
    assets.push({
      ...source,
      finalUrl: source.url,
      httpStatus: response.status,
      contentType: response.contentType,
      lastModified: response.lastModified,
      etag: response.etag,
      bytes: response.bytes.byteLength,
      sha256: sha256(response.bytes),
      objectIdentity: {
        fullname: document.object?.fullname ?? null,
        shortname: document.object?.shortname ?? null,
        spkid: document.object?.spkid ?? null,
        neo: document.object?.neo ?? null,
      },
      physicalParameterNames: Array.isArray(document.phys_par) ? document.phys_par.map((entry) => entry.name) : [],
      license: "NASA-JPL-public-domain",
    });
  } catch (error) {
    failures.push({ bodyId: source.bodyId, error: error instanceof Error ? error.message : String(error) });
  }
}

const receipt = writeReceipt({
  version: "v592-small-body-rotation-metadata-acquisition-v1",
  generatedAt,
  status: failures.length === 0 && assets.length === sources.length ? "committed-two-urls-single-request-each-no-retry" : "blocked-no-automatic-retry",
  requestCount: sources.length,
  requestCountPerUrl: 1,
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  redirectFollowed: false,
  assets,
  failures,
  authority: {
    purpose: "catalog-rotation-pole-and-period-metadata-only",
    scientificPayload: false,
    measuredAuthorityGranted: false,
    scientificPayloadWriteback: false,
  },
});
console.log(JSON.stringify({ status: receipt.status, assets: assets.map((asset) => asset.bodyId), failures, receiptSha256: receipt.receiptSha256 }, null, 2));
if (failures.length > 0) process.exitCode = 1;
