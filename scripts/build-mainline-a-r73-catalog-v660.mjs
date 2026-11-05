import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { safeFile } from "./mainline-a-release-evidence.mjs";
import model from "../app/lib/mainlineANebulaR73CatalogV660.ts";

const { buildR73CatalogV660, inspectR73CatalogV660 } = model.default ?? model;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INPUTS = Object.freeze([
  { role: "B1B2", path: "app/data/mainlineANebulaCandidateReviewV655.generated.json" },
  { role: "R71", path: "app/data/mainlineANebulaR71SourceV658.generated.json" },
  { role: "R72", path: "app/data/mainlineANebulaR72SourceV659.generated.json" },
]);
const CATALOG = "app/data/mainlineANebulaR73CatalogV660.generated.json";
const AUDIT = "docs/release/v607/mainline-a-r73-v660-catalog-audit-20261013.json";
const MAX_FILE_BYTES = 100 * 1024 * 1024;

function fail(code, detail) {
  throw new Error(`r73-catalog-v660:${code}${detail === undefined ? "" : `:${JSON.stringify(detail)}`}`);
}
function check(condition, code, detail) {
  if (!condition) fail(code, detail);
}
function serialized(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
async function sha256File(absolute) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(absolute)) hash.update(chunk);
  return hash.digest("hex");
}
async function readSourceInput(input) {
  const file = await safeFile(ROOT, input.path);
  check(file.stat.size >= 100 && file.stat.size <= 2 * 1024 * 1024,
    "source-size-invalid", input.path);
  const bytes = await readFile(file.absolute);
  return { pin: { role: input.role, path: file.relative,
    bytes: bytes.length, sha256: sha256(bytes) },
  value: JSON.parse(bytes.toString("utf8")) };
}

function mediaPinKey(pin) {
  return `${pin.path}\0${pin.bytes}\0${pin.sha256}`;
}
function mediaPins(catalog) {
  const unique = new Map();
  for (const row of catalog.rows) {
    for (const pin of row.rawEvidence) unique.set(mediaPinKey(pin), pin);
    if (row.delivery) unique.set(mediaPinKey(row.delivery), row.delivery);
  }
  return [...unique.values()].sort((left, right) =>
    left.path.localeCompare(right.path));
}

function shouldDecode(pathname) {
  return /\.(?:jpe?g|webp)$/i.test(pathname);
}

export async function verifyCatalogMediaV660(catalog,
  { safe = safeFile, digest = sha256File, metadata = (absolute) =>
    sharp(absolute, { failOn: "error" }).metadata() } = {}) {
  const pinned = mediaPins(catalog);
  const observations = [];
  const issues = [];
  for (const pin of pinned) {
    try {
      const file = await safe(ROOT, pin.path);
      check(file.stat.size === pin.bytes && pin.bytes >= 100
        && pin.bytes <= MAX_FILE_BYTES, "media-size-mismatch", pin.path);
      const observedHash = await digest(file.absolute);
      check(observedHash === pin.sha256, "media-sha-mismatch", pin.path);
      const image = shouldDecode(pin.path)
        ? await metadata(file.absolute) : null;
      if (image) check(image.width > 0 && image.height > 0,
        "media-decode-invalid", pin.path);
      observations.push({ path: file.relative, bytes: pin.bytes,
        sha256: observedHash,
        media: image ? { width: image.width, height: image.height,
          format: image.format, orientation: image.orientation ?? null }
          : null });
    } catch (error) {
      issues.push({ path: pin.path, code: error?.message ?? String(error) });
    }
  }
  for (const row of catalog.rows) {
    if (!row.delivery) continue;
    const observed = observations.find((item) =>
      item.path === row.delivery.path);
    if (!observed?.media || observed.media.width !== row.delivery.width
      || observed.media.height !== row.delivery.height
      || observed.media.format !== (row.delivery.mimeType === "image/jpeg"
        ? "jpeg" : "webp")) {
      issues.push({ path: row.delivery.path,
        code: "delivery-dimensions-or-format-mismatch" });
    }
  }
  const distinctPaths = new Set(pinned.map((pin) => pin.path));
  if (distinctPaths.size !== pinned.length) {
    issues.push({ path: null, code: "conflicting-pins-for-one-path" });
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues),
    observations: Object.freeze(observations),
    imageFiles: observations.filter((item) => item.media).length,
    metadataFiles: observations.filter((item) => !item.media).length });
}

async function ensureAbsent(relative) {
  try { await access(path.join(ROOT, relative)); }
  catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  fail("output-exists", relative);
}

export async function buildCatalogV660(mode, options = {}) {
  check(mode === "write" || mode === "check", "mode-invalid", mode);
  const source = await Promise.all(INPUTS.map(readSourceInput));
  const pinned = source.map((item) => item.pin);
  let generatedAt;
  let existing = null;
  if (mode === "check") {
    existing = JSON.parse(await readFile(path.join(ROOT, CATALOG), "utf8"));
    generatedAt = existing.generatedAt;
  } else {
    await Promise.all([ensureAbsent(CATALOG), ensureAbsent(AUDIT)]);
    generatedAt = options.generatedAt ?? new Date().toISOString();
  }
  const catalog = buildR73CatalogV660(source[0].value,
    source[1].value, source[2].value, pinned, generatedAt);
  const inspected = inspectR73CatalogV660(catalog);
  check(inspected.ok, "catalog-invalid", inspected.issues);
  if (mode === "check") {
    check(JSON.stringify(existing) === JSON.stringify(catalog),
      "catalog-drift");
  }
  const media = await verifyCatalogMediaV660(catalog);
  check(media.ok, "media-invalid", media.issues);
  const bytes = serialized(catalog);
  const audit = {
    schema: "mainline-a-r73-catalog-audit-v660",
    status: "verified-24-candidates-19-review-images-5-policy-holds",
    verifiedAt: options.verifiedAt ?? new Date().toISOString(),
    catalog: { path: CATALOG, bytes: bytes.length,
      sha256: sha256(bytes) },
    sourceInputs: pinned,
    counts: { ...inspected.counts,
      checkedFiles: media.observations.length,
      checkedImageFiles: media.imageFiles,
      checkedMetadataFiles: media.metadataFiles },
    observations: media.observations,
    issues: [],
    boundary: catalog.boundary,
    claims: catalog.claims,
  };
  if (mode === "check") {
    const raw = await readFile(path.join(ROOT, CATALOG));
    check(raw.equals(bytes), "catalog-bytes-drift");
    const savedAudit = JSON.parse(await readFile(path.join(ROOT, AUDIT), "utf8"));
    check(savedAudit.schema === audit.schema
      && savedAudit.status === audit.status
      && JSON.stringify(savedAudit.catalog) === JSON.stringify(audit.catalog)
      && JSON.stringify(savedAudit.sourceInputs)
        === JSON.stringify(audit.sourceInputs)
      && JSON.stringify(savedAudit.counts) === JSON.stringify(audit.counts)
      && JSON.stringify(savedAudit.observations)
        === JSON.stringify(audit.observations)
      && savedAudit.issues?.length === 0,
    "saved-audit-drift");
  } else {
    await writeFile(path.join(ROOT, CATALOG), bytes, { flag: "wx" });
    await writeFile(path.join(ROOT, AUDIT), serialized(audit), { flag: "wx" });
  }
  return { status: audit.status, mode, catalog: audit.catalog,
    counts: audit.counts, auditPath: AUDIT };
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  check(process.argv.length === 3
    && ["--write", "--check"].includes(process.argv[2]),
  "usage-invalid");
  console.log(JSON.stringify(await buildCatalogV660(
    process.argv[2].slice(2))));
}
