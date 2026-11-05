import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const url = "https://science.nasa.gov/photojournal/callisto-hemispherical-globes/";
const rawRelative = "source-cache/v592/major-moons/jpl-photojournal/details/callisto-hemispherical-globes.html";
const receiptRelative = "docs/release/v592/metadata-probe-major-moon-jpl/details/callisto-hemispherical-globes.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function seal(relative, body) {
  const absolute = resolve(root, relative);
  const document = { ...body, receiptSha256: canonicalSha(body) };
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`, { flag: "wx" });
  rmSync(absolute, { force: true });
  renameSync(partial, absolute);
  return document;
}
const rawPath = resolve(root, rawRelative);
const receiptPath = resolve(root, receiptRelative);
if (existsSync(receiptPath)) {
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  if (canonicalSha(unsigned) !== receipt.receiptSha256) throw new Error("callisto-hemispherical-globes-receipt-drift");
  const bytes = readFileSync(rawPath);
  if (bytes.byteLength !== receipt.metadataRequest.responseBytes || sha256(bytes) !== receipt.metadataRequest.responseSha256) throw new Error("callisto-hemispherical-globes-source-drift");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: receipt.receiptSha256 }, null, 2));
  process.exit(0);
}
if (existsSync(rawPath)) throw new Error("callisto-hemispherical-globes-raw-already-exists");
const parsed = new URL(url);
if (parsed.protocol !== "https:" || parsed.hostname !== "science.nasa.gov" || parsed.username || parsed.password || parsed.port || parsed.hash) throw new Error("callisto-hemispherical-globes-url-policy");
const response = await fetch(url, {
  method: "GET",
  redirect: "manual",
  headers: { "user-agent": "Orbit-Atlas-v592-callisto-hemispherical-globes-metadata/1.0" },
  signal: AbortSignal.timeout(60_000),
});
const bytes = Buffer.from(await response.arrayBuffer());
const redirectLocation = response.headers.get("location");
const rawPartial = `${rawPath}.part`;
mkdirSync(dirname(rawPath), { recursive: true });
writeFileSync(rawPartial, bytes, { flag: "wx" });
renameSync(rawPartial, rawPath);
const html = bytes.toString("utf8");
const assetUrls = [...new Set([...html.matchAll(/https:\/\/assets\.science\.nasa\.gov\/[^"'<>\s]+/gi)].map((match) => match[0].replaceAll("&amp;", "&").replaceAll("&#038;", "&")))].slice(0, 200);
const downloadLinks = [...new Set([...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1].replaceAll("&amp;", "&").replaceAll("&#038;", "&")).filter((href) => /download|assets\.science\.nasa\.gov|PIA03876/i.test(href)))].slice(0, 200);
const piaIds = [...new Set([...html.matchAll(/PIA\d{5}/g)].map((match) => match[0]))].sort();
const dimensions = [...new Set([...html.matchAll(/\b\d{3,6}\s*[x×]\s*\d{3,6}\b/gi)].map((match) => match[0]))].slice(0, 100);
const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replaceAll(/\s+/g, " ").trim() ?? null;
const receipt = seal(receiptRelative, {
  version: "v592-nasa-photojournal-detail-probe-v1",
  probedAt: new Date().toISOString(),
  status: response.status === 200 && response.url === url && !redirectLocation ? "nasa-photojournal-detail-probe-complete-no-visual-payload" : "blocked-no-automatic-retry",
  probeId: "callisto-hemispherical-globes-pia03876",
  target: "callisto",
  expectedNasaId: "PIA03876",
  policy: {
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    visualPayloadDownloaded: false,
    redirectFollowed: false,
    itemLevelLicenseReviewRequired: true,
    metadataDoesNotGrantVisualAssetAdmission: true,
  },
  metadataRequest: {
    url,
    finalUrl: response.url,
    status: response.status,
    contentType: response.headers.get("content-type") ?? "unreported",
    responseBytes: bytes.byteLength,
    responseSha256: sha256(bytes),
    outputPath: rawRelative,
    redirectLocation,
  },
  item: { title, piaIds, assetUrls, downloadLinks, imageDimensionText: dimensions },
  visualAssetAdmission: false,
});
console.log(JSON.stringify({ status: receipt.status, item: receipt.item, receiptSha256: receipt.receiptSha256 }, null, 2));
