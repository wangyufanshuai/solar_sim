import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const root = process.cwd();
const registryPath = resolve(root, "scripts/v589-visual-sources.json");
const receiptPath = resolve(root, "docs/release/v589/acquisition-receipt-v589.json");
const generatedAt = process.env.V589_GENERATED_AT ?? "2026-08-09T08:00:00Z";
const registryBytes = readFileSync(registryPath);
const registry = JSON.parse(registryBytes.toString("utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  renameSync(partial, path);
}

function allowed(url) {
  const parsed = new URL(url);
  return parsed.protocol === "https:" && registry.policy.allowedHosts.includes(parsed.hostname);
}

async function fetchOnce(source) {
  if (!allowed(source.url)) throw new Error(`v589-source-host-rejected:${source.id}`);
  const destination = resolve(root, source.destination);
  if (!destination.startsWith(resolve(root, "public/vendor/celestial-art-v589/sources") + "\\")) {
    throw new Error(`v589-source-path-traversal:${source.id}`);
  }
  if (existsSync(destination)) {
    const bytes = readFileSync(destination);
    return {
      id: source.id,
      status: "existing-verified-no-network",
      finalUrl: source.url,
      destination: source.destination,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      httpStatus: null,
      requestCount: 0,
      license: source.license,
      licenseUrl: source.licenseUrl,
    };
  }
  const partial = `${destination}.${process.pid}.part`;
  mkdirSync(dirname(destination), { recursive: true });
  rmSync(partial, { force: true });
  let response;
  try {
    response = await fetch(source.url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v589-visual-acquisition/1.0" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("redirect-without-location");
      const finalUrl = new URL(location, source.url).href;
      if (!allowed(finalUrl)) throw new Error(`redirect-host-rejected:${new URL(finalUrl).hostname}`);
      throw new Error(`redirect-requires-explicit-registry-entry:${finalUrl}`);
    }
    if (!response.ok || !response.body) throw new Error(`http-${response.status}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial, { flags: "wx" }));
    renameSync(partial, destination);
    const bytes = readFileSync(destination);
    return {
      id: source.id,
      status: "acquired",
      finalUrl: response.url || source.url,
      destination: source.destination,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      httpStatus: response.status,
      contentType: response.headers.get("content-type") ?? "unknown",
      requestCount: 1,
      license: source.license,
      licenseUrl: source.licenseUrl,
    };
  } catch (error) {
    rmSync(partial, { force: true });
    return {
      id: source.id,
      status: "blocked-single-attempt-consumed",
      finalUrl: source.url,
      destination: source.destination,
      bytes: 0,
      sha256: null,
      httpStatus: response?.status ?? null,
      requestCount: 1,
      license: source.license,
      licenseUrl: source.licenseUrl,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

if (
  registry.version !== "v589-public-domain-visual-source-registry-v1"
  || registry.policy.singleRequestPerUrl !== true
  || registry.policy.automaticRetry !== false
  || registry.policy.automaticSubstitution !== false
  || !Array.isArray(registry.sources)
) throw new Error("v589-source-registry-contract");

const duplicateUrls = registry.sources.filter((source, index, all) => all.findIndex((other) => other.url === source.url) !== index);
if (duplicateUrls.length > 0) throw new Error("v589-duplicate-source-url");

const results = [];
for (const source of registry.sources) results.push(await fetchOnce(source));
const unsigned = {
  version: "v589-visual-acquisition-receipt-v1",
  generatedAt,
  status: results.every((entry) => entry.status === "acquired" || entry.status === "existing-verified-no-network")
    ? "complete"
    : "blocked-partial-no-retry",
  registry: {
    path: "scripts/v589-visual-sources.json",
    bytes: registryBytes.byteLength,
    sha256: sha256(registryBytes),
  },
  policy: registry.policy,
  results,
  networkRequestCount: results.reduce((sum, entry) => sum + entry.requestCount, 0),
  automaticRetryApplied: false,
  automaticSubstitutionApplied: false,
};
const receipt = {
  ...unsigned,
  receiptSha256: sha256(Buffer.from(JSON.stringify(canonical(unsigned)), "utf8")),
};
atomicWrite(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({
  status: receipt.status,
  receipt: "docs/release/v589/acquisition-receipt-v589.json",
  receiptSha256: receipt.receiptSha256,
  acquired: results.filter((entry) => entry.status === "acquired" || entry.status === "existing-verified-no-network").length,
  blocked: results.filter((entry) => entry.status === "blocked-single-attempt-consumed").length,
  automaticRetryApplied: false,
}, null, 2));
