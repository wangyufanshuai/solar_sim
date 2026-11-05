import { createHash } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = process.cwd();
const definitionPath = resolve(root, "scripts/v591-nasa-small-body-visual-sources.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-nasa-small-bodies.json");
const blockedReceiptPath = resolve(root, "docs/release/v591/acquisition-blocked-nasa-small-bodies.json");
const urlLedgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-nasa-small-bodies.json");
const assetReceiptDirectory = resolve(root, "docs/release/v591/acquisition-assets-nasa-small-bodies");
const definitions = JSON.parse(readFileSync(definitionPath, "utf8"));

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
function readSealed(path) {
  const receipt = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  assert(receipt.receiptSha256 === canonicalSha(unsigned), `v591-nasa-small-body-acquisition-seal:${path}`);
  return receipt;
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
  return sealed;
}
async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

assert(definitions.version === "v591-nasa-small-body-visual-sources-v1", "v591-nasa-small-body-definition-version");
assert(Array.isArray(definitions.assets) && definitions.assets.length === 3, "v591-nasa-small-body-definition-assets");
const allowedHosts = new Set(definitions.policy.allowedHosts.map((host) => host.toLowerCase()));
const urlLedger = existsSync(urlLedgerPath)
  ? readSealed(urlLedgerPath)
  : { version: "v591-nasa-small-body-acquisition-url-ledger-v1", entries: [], receiptSha256: null };
const blockedHistory = existsSync(blockedReceiptPath) ? readSealed(blockedReceiptPath) : null;
assert(urlLedger.version === "v591-nasa-small-body-acquisition-url-ledger-v1" && Array.isArray(urlLedger.entries), "v591-nasa-small-body-ledger-contract");
const requestedUrls = new Set([
  ...urlLedger.entries.map((entry) => entry.url),
  ...(blockedHistory?.attempts ?? []).flatMap((attempt) => attempt.requestedUrls ?? []),
]);
function appendUrlLedger(entry) {
  const next = writeSealed(urlLedgerPath, {
    version: "v591-nasa-small-body-acquisition-url-ledger-v1",
    entries: [...urlLedger.entries, entry],
  });
  urlLedger.entries = next.entries;
  urlLedger.receiptSha256 = next.receiptSha256;
}
function assertAllowedUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (
    url.protocol !== "https:"
    || !allowedHosts.has(url.hostname.toLowerCase())
    || !url.pathname.startsWith(definitions.policy.requiredRepositoryPrefix)
    || url.username
    || url.password
    || url.port
  ) {
    throw new Error(`v591-nasa-small-body-acquisition-url:${url.hostname}${url.pathname}`);
  }
  return url;
}
async function fetchOnceFollowingAllowedRedirects(asset) {
  let current = assertAllowedUrl(asset.sourceUrl);
  const redirectChain = [];
  for (let hop = 0; hop <= definitions.policy.maximumRedirectHops; hop += 1) {
    if (requestedUrls.has(current.href)) throw new Error(`v591-nasa-small-body-acquisition-repeat-url:${current.href}`);
    requestedUrls.add(current.href);
    let response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { "user-agent": "Orbit-Atlas-v591-NASA-3D-acquisition/1.0" },
        signal: AbortSignal.timeout(10 * 60 * 1000),
      });
    } catch (error) {
      appendUrlLedger({
        assetId: asset.id,
        url: current.href,
        requestedAt: new Date().toISOString(),
        outcome: "network-error-no-retry",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`v591-nasa-small-body-acquisition-redirect-location:${response.status}`);
      const redirectUrl = new URL(location, current).href;
      let next;
      try {
        next = assertAllowedUrl(redirectUrl);
      } catch (error) {
        appendUrlLedger({
          assetId: asset.id,
          url: current.href,
          requestedAt: new Date().toISOString(),
          httpStatus: response.status,
          outcome: "blocked-redirect-host-no-follow",
          redirectTo: redirectUrl,
        });
        throw error;
      }
      redirectChain.push({ status: response.status, from: current.href, to: next.href });
      appendUrlLedger({ assetId: asset.id, url: current.href, requestedAt: new Date().toISOString(), httpStatus: response.status, outcome: "allowed-redirect", redirectTo: next.href });
      current = next;
      continue;
    }
    appendUrlLedger({
      assetId: asset.id,
      url: current.href,
      requestedAt: new Date().toISOString(),
      httpStatus: response.status,
      outcome: response.ok ? "response-received" : "http-error-no-retry",
      mediaType,
      contentLength: response.headers.get("content-length"),
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    });
    return { response, finalUrl: current.href, redirectChain, mediaType };
  }
  throw new Error("v591-nasa-small-body-acquisition-redirect-depth");
}
async function acquire(asset) {
  const finalPath = resolve(root, asset.outputPath);
  const allowedRoot = resolve(root, `source-cache/celestial-convergence-v591/small-bodies/${asset.body}`);
  assert(finalPath.startsWith(`${allowedRoot}\\`) || finalPath === allowedRoot, `v591-nasa-small-body-output-scope:${asset.id}`);
  const partialPath = `${finalPath}.part`;
  const assetReceiptPath = resolve(assetReceiptDirectory, `${asset.id}.json`);
  if (existsSync(finalPath) || existsSync(assetReceiptPath)) {
    assert(existsSync(finalPath) && existsSync(assetReceiptPath) && !existsSync(partialPath), `v591-nasa-small-body-existing-state:${asset.id}`);
    const committed = readSealed(assetReceiptPath);
    const stats = statSync(finalPath);
    assert(committed.asset?.sourceUrl === asset.sourceUrl && committed.asset?.bytes === stats.size, `v591-nasa-small-body-existing-identity:${asset.id}`);
    assert(committed.asset.sha256 === await sha256File(finalPath), `v591-nasa-small-body-existing-sha:${asset.id}`);
    return committed.asset;
  }
  assert(!existsSync(partialPath), `v591-nasa-small-body-part-exists:${asset.id}`);
  mkdirSync(dirname(finalPath), { recursive: true });
  try {
    const responseMeta = await fetchOnceFollowingAllowedRedirects(asset);
    const { response } = responseMeta;
    if (!response.ok || !response.body) throw new Error(`v591-nasa-small-body-http:${asset.id}:${response.status}`);
    const announcedBytes = Number(response.headers.get("content-length"));
    if (Number.isFinite(announcedBytes) && announcedBytes !== asset.expectedBytes) throw new Error(`v591-nasa-small-body-content-length:${asset.id}:${announcedBytes}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partialPath, { flags: "wx" }));
    const stats = statSync(partialPath);
    assert(stats.size === asset.expectedBytes, `v591-nasa-small-body-bytes:${asset.id}:${stats.size}`);
    const record = {
      id: asset.id,
      body: asset.body,
      role: asset.role,
      sourceUrl: asset.sourceUrl,
      finalUrl: responseMeta.finalUrl,
      repositoryPath: asset.repositoryPath,
      gitBlobSha1: asset.gitBlobSha1,
      redirectChain: responseMeta.redirectChain,
      httpStatus: response.status,
      mediaType: responseMeta.mediaType,
      outputPath: asset.outputPath,
      bytes: stats.size,
      sha256: await sha256File(partialPath),
      license: asset.license,
      observationIdentity: asset.observationIdentity,
      observationLimit: asset.observationLimit,
      presentationOnly: true,
    };
    renameSync(partialPath, finalPath);
    writeSealed(assetReceiptPath, {
      version: "v591-nasa-small-body-asset-acquisition-receipt-v1",
      status: "committed-single-request-no-retry",
      asset: record,
    });
    return record;
  } catch (error) {
    rmSync(partialPath, { force: true });
    throw error;
  }
}

const assets = [];
const failures = [];
try {
  if (existsSync(receiptPath)) {
    const existing = readSealed(receiptPath);
    assert(existing.status === "acquired-three-nasa-models-single-request-no-retry", "v591-nasa-small-body-existing-receipt-status");
    console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  } else {
    for (const asset of definitions.assets) {
      const finalPath = resolve(root, asset.outputPath);
      const assetReceiptPath = resolve(assetReceiptDirectory, `${asset.id}.json`);
      const normalizedSourceUrl = assertAllowedUrl(asset.sourceUrl).href;
      if (requestedUrls.has(normalizedSourceUrl) && (!existsSync(finalPath) || !existsSync(assetReceiptPath))) {
        failures.push({ assetId: asset.id, reason: "previous-request-failed-no-retry", sourceUrl: normalizedSourceUrl });
        continue;
      }
      try {
        assets.push(await acquire(asset));
      } catch (error) {
        failures.push({
          assetId: asset.id,
          reason: error instanceof Error ? error.message : String(error),
          sourceUrl: normalizedSourceUrl,
        });
      }
    }
    if (failures.length > 0) throw new Error(`v591-nasa-small-body-acquisition-incomplete:${failures.map((failure) => failure.assetId).join(",")}`);
    const unsigned = {
      version: "v591-nasa-small-body-acquisition-receipt-v1",
      acquiredAt: new Date().toISOString(),
      status: "acquired-three-nasa-models-single-request-no-retry",
      metadataProbe: definitions.metadataProbe,
      policy: definitions.policy,
      requestedUrlCount: requestedUrls.size,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      urlLedgerReceiptSha256: readSealed(urlLedgerPath).receiptSha256,
      assets,
    };
    const receipt = writeSealed(receiptPath, unsigned);
    console.log(JSON.stringify({
      status: receipt.status,
      requestedUrlCount: receipt.requestedUrlCount,
      assets: assets.map(({ id, body, bytes, sha256: digest }) => ({ id, body, bytes, sha256: digest })),
      receiptSha256: receipt.receiptSha256,
    }, null, 2));
  }
} catch (error) {
  const previous = existsSync(blockedReceiptPath) ? readSealed(blockedReceiptPath) : null;
  writeSealed(blockedReceiptPath, {
    version: "v591-nasa-small-body-acquisition-blocked-v1",
    status: "blocked-no-automatic-retry",
    attempts: [
      ...(previous?.attempts ?? []),
      {
        failedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        committedAssetIds: assets.map((asset) => asset.id),
        requestedUrls: [...requestedUrls],
        failures,
      },
    ],
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
  });
  throw error;
}
