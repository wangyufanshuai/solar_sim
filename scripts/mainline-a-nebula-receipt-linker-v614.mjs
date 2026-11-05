import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

export const RECEIPT_ROOT = "docs/release/v592";
export const MANIFEST_RECEIPT_PATHS = Object.freeze({
  "public/data/living-universe-v592/nebula-visual-assets.json": "docs/release/v592/nebula-visual-assets-receipt-v592.json",
  "public/data/living-universe-v592/nebula-extended-visual-assets.json": "docs/release/v592/nebula-extended-visual-assets-receipt-v592.json",
  "public/data/living-universe-v592/nebula-closure-visual-assets.json": "docs/release/v592/nebula-closure-visual-assets-receipt-v592.json",
});
const SHA256 = /^[a-f0-9]{64}$/i;
const BYTE_KEYS = new Set(["bytes", "byteSize"]);
const DIGEST_KEYS = new Set(["sha256", "digest"]);

export function fail(message) { throw new Error(`nebula receipt linkage v614: ${message}`); }
export function assert(condition, message) { if (!condition) fail(message); }
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
export function canonicalSha(value) { return crypto.createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex"); }

function walk(value, visit, trail = "$", seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  visit(value, trail);
  if (Array.isArray(value)) value.forEach((child, index) => walk(child, visit, `${trail}[${index}]`, seen));
  else Object.entries(value).forEach(([key, child]) => walk(child, visit, `${trail}.${key}`, seen));
}

function listReceiptFiles(root) {
  const directory = path.join(root, RECEIPT_ROOT);
  if (!fs.existsSync(directory)) fail(`receipt-root-missing:${RECEIPT_ROOT}`);
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => {
      const relativePath = path.posix.join(RECEIPT_ROOT.replaceAll("\\", "/"), entry.name);
      const absolutePath = path.join(root, RECEIPT_ROOT, entry.name);
      const raw = fs.readFileSync(absolutePath, "utf8");
      let value;
      try { value = JSON.parse(raw); } catch (error) { return { relativePath, absolutePath, raw, value: null, parseError: String(error) }; }
      return { relativePath, absolutePath, raw, value, parseError: null };
    });
}

export function readSealedDocument(root, relativePath, sealField) {
  const absolutePath = path.join(root, relativePath);
  assert(fs.existsSync(absolutePath), `sealed-document-missing:${relativePath}`);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const value = JSON.parse(raw);
  const declared = value[sealField];
  assert(typeof declared === "string" && SHA256.test(declared), `sealed-document-hash-missing:${relativePath}:${sealField}`);
  const unsigned = { ...value };
  delete unsigned[sealField];
  const computed = canonicalSha(unsigned);
  assert(declared === computed, `sealed-document-hash-mismatch:${relativePath}:${sealField}`);
  return Object.freeze({ path: relativePath, declared, computed, rawSha256: crypto.createHash("sha256").update(raw).digest("hex"), value });
}

export function readManifestSeal(root, manifestPath) {
  const manifest = readSealedDocument(root, manifestPath, "manifestSha256");
  const receiptPath = MANIFEST_RECEIPT_PATHS[manifestPath];
  assert(receiptPath, `manifest-receipt-path-missing:${manifestPath}`);
  const receipt = readSealedDocument(root, receiptPath, "receiptSha256");
  assert(receipt.value.manifestSha256 === manifest.declared, `manifest-receipt-link-mismatch:${manifestPath}`);
  return Object.freeze({ manifestPath, manifestRawSha256: manifest.rawSha256, manifestSealSha256: manifest.declared, receiptPath, receiptSha256: receipt.declared, receiptManifestSha256: receipt.value.manifestSha256 });
}

function stringValues(value) {
  const strings = [];
  const collect = (node, seen = new Set()) => {
    if (typeof node === "string") { strings.push(node); return; }
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) node.forEach((child) => collect(child, seen));
    else Object.values(node).forEach((child) => collect(child, seen));
  };
  collect(value);
  return strings;
}

function objectSignals(value, record) {
  const signals = [];
  walk(value, (node, trail) => {
    if (Array.isArray(node)) return;
    const object = node;
    const strings = stringValues(object);
    const targetMatch = object.target === record.target || object.objectId === record.target || strings.includes(record.target);
    const targetAliasMatch = record.nasaId === "PIA23646" && strings.includes("tarantula-nebula-closure");
    const nasaIdMatch = object.nasaId === record.nasaId || strings.includes(record.nasaId);
    const sourceMatch = strings.includes(record.sourceUrl);
    const pathMatch = strings.includes(record.localPath);
    const bytesMatch = [...Object.entries(object)].some(([key, item]) => BYTE_KEYS.has(key) && Number(item) === record.bytes);
    const digestMatch = [...Object.entries(object)].some(([key, item]) => DIGEST_KEYS.has(key) && String(item).toLowerCase() === record.sha256.toLowerCase());
    if (targetMatch || targetAliasMatch || nasaIdMatch || sourceMatch || pathMatch || bytesMatch || digestMatch) signals.push({ trail, targetMatch, targetAliasMatch, nasaIdMatch, sourceMatch, pathMatch, bytesMatch, digestMatch });
  });
  return signals;
}

export function extractReceiptRows(value) {
  const rows = [];
  walk(value, (node, trail) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    const object = node;
    const nestedImage = object.sourceImage ?? object.source ?? {};
    const target = typeof object.target === "string" ? object.target : null;
    const nasaId = typeof object.nasaId === "string" ? object.nasaId : null;
    if (!target || !nasaId) return;
    rows.push(Object.freeze({
      trail,
      target,
      nasaId,
      sourceUrl: object.sourceUrl ?? object.finalUrl ?? nestedImage.url ?? null,
      localPath: object.outputPath ?? object.sourcePath ?? nestedImage.path ?? null,
      bytes: Number.isInteger(object.bytes) ? object.bytes : Number.isInteger(object.byteSize) ? object.byteSize : null,
      sha256: typeof object.sha256 === "string" ? object.sha256 : typeof object.sourceSha256 === "string" ? object.sourceSha256 : null,
      status: typeof object.status === "string" ? object.status : null,
    }));
  });
  return Object.freeze(rows);
}

export function receiptRowMatches(record, row) {
  if (!row || row.nasaId !== record.nasaId) return false;
  const targetAlias = record.nasaId === "PIA23646" && row.target === "tarantula-nebula-closure";
  const targetMatches = row.target === record.target || targetAlias;
  const sourceMatches = row.sourceUrl === record.sourceUrl;
  const pathMatches = row.localPath === record.localPath;
  const bytesMatches = row.bytes === record.bytes;
  const digestMatches = row.sha256?.toLowerCase() === record.sha256.toLowerCase();
  return targetMatches && sourceMatches && pathMatches && bytesMatches && digestMatches;
}

export function receiptRowIdentityMatches(record, row) {
  return Boolean(row && row.nasaId === record.nasaId && (row.target === record.target || (record.nasaId === "PIA23646" && row.target === "tarantula-nebula-closure")));
}

export function readAllManifestSeals(root = process.cwd()) {
  return Object.freeze(Object.keys(MANIFEST_RECEIPT_PATHS).map((manifestPath) => readManifestSeal(root, manifestPath)));
}

export function receiptLinkageFingerprint(linkage) {
  return linkage.links.map((link) => `${link.key}:${link.declaredSha256}:${link.status}:${link.identityLinked}:${link.payloadLinked}`).join("|");
}

export function receiptLinkageCompletion(linkages) {
  if (linkages.length === 0) return 0;
  return Math.round((linkages.filter((linkage) => linkage.valid).length / linkages.length) * 100);
}

function requiredLevel(key) {
  if (/acquisition/i.test(key)) return "payload";
  if (/metadata|visual|license/i.test(key)) return "identity";
  return "identity";
}

function receiptFilenameScore(key, relativePath) {
  const name = relativePath.toLocaleLowerCase();
  if (/acquisition/i.test(key)) return name.includes("acquisition") ? 4 : name.includes("visual-analysis") ? 1 : 0;
  if (/metadata/i.test(key)) return name.includes("item-metadata") ? 4 : name.includes("metadata") ? 2 : 0;
  if (/visual/i.test(key)) return name.includes("visual-analysis") ? 4 : name.includes("visual") ? 2 : 0;
  if (/license/i.test(key)) return name.includes("license-review") ? 4 : name.includes("license") ? 2 : 0;
  return 1;
}

export function buildReceiptFileIndex(root = process.cwd()) {
  return Object.freeze(listReceiptFiles(root).map((file) => Object.freeze({
    relativePath: file.relativePath,
    raw: file.raw,
    value: file.value,
    parseError: file.parseError,
  })));
}

export function linkReceiptReferences(root, record, receiptRefs, index = buildReceiptFileIndex(root)) {
  assert(record?.target && record?.nasaId && record?.sourceUrl && record?.localPath && Number.isInteger(record.bytes) && SHA256.test(record.sha256), `record identity incomplete:${record?.id ?? "unknown"}`);
  const links = Object.entries(receiptRefs ?? {}).map(([key, declaredSha256]) => {
    assert(SHA256.test(String(declaredSha256)), `receipt hash invalid:${record.target}:${key}`);
    const allMatches = index.filter((file) => file.raw.includes(String(declaredSha256)));
    const preferredScore = Math.max(0, ...allMatches.map((file) => receiptFilenameScore(key, file.relativePath)));
    const matches = preferredScore > 0 ? allMatches.filter((file) => receiptFilenameScore(key, file.relativePath) === preferredScore) : allMatches;
    const candidates = matches.map((file) => {
      const signals = file.value ? objectSignals(file.value, record) : [];
      const rows = file.value ? extractReceiptRows(file.value) : [];
      const exactRowMatch = rows.some((row) => receiptRowMatches(record, row));
      const identityRowMatch = rows.some((row) => receiptRowIdentityMatches(record, row));
      const identityMatch = signals.some((signal) => (signal.targetMatch || signal.targetAliasMatch) && signal.nasaIdMatch) || (file.raw.includes(record.target) && file.raw.includes(record.nasaId)) || (record.nasaId === "PIA23646" && file.raw.includes("tarantula-nebula-closure") && file.raw.includes(record.nasaId));
      const payloadMatch = exactRowMatch || signals.some((signal) => signal.sourceMatch && signal.pathMatch && signal.bytesMatch && signal.digestMatch);
      const sourceMatch = signals.some((signal) => signal.sourceMatch);
      const bytesMatch = signals.some((signal) => signal.bytesMatch);
      const digestMatch = signals.some((signal) => signal.digestMatch);
      const receiptSha256 = file.value?.receiptSha256;
      const unsigned = file.value ? { ...file.value } : null;
      if (unsigned) delete unsigned.receiptSha256;
      const sealValid = Boolean(receiptSha256 && SHA256.test(receiptSha256) && unsigned && canonicalSha(unsigned) === receiptSha256);
      return { path: file.relativePath, parseable: file.parseError === null, sealValid, receiptSha256: receiptSha256 ?? null, identityMatch: identityMatch || identityRowMatch, exactRowMatch, alias: record.nasaId === "PIA23646" && file.raw.includes("tarantula-nebula-closure"), sourceMatch, pathMatch: signals.some((signal) => signal.pathMatch), bytesMatch, digestMatch, payloadMatch, fileSha256: null };
    });
    const identityLinked = candidates.some((candidate) => candidate.sealValid && candidate.identityMatch);
    const payloadLinked = candidates.some((candidate) => candidate.sealValid && candidate.payloadMatch);
    const level = requiredLevel(key);
    const status = payloadLinked ? "payload-linked" : identityLinked ? "identity-linked" : candidates.length ? "reference-only" : "missing-reference";
    return { key, declaredSha256: String(declaredSha256), requiredLevel: level, status, identityLinked, payloadLinked, candidates };
  });
  return Object.freeze({ candidateId: record.id, links: Object.freeze(links), valid: links.every((link) => link.status !== "missing-reference" && link.identityLinked && (link.requiredLevel !== "payload" || link.payloadLinked)), payloadLinked: links.filter((link) => link.payloadLinked).length, identityLinked: links.filter((link) => link.identityLinked).length, missing: links.filter((link) => link.status === "missing-reference").length });
}

export function assertReceiptLinkage(linkage) {
  if (!linkage.valid) {
    const failures = linkage.links.filter((link) => link.status === "missing-reference" || !link.identityLinked || (link.requiredLevel === "payload" && !link.payloadLinked)).map((link) => `${link.key}:${link.status}`);
    fail(`receipt-linkage-failed:${linkage.candidateId}:${failures.join(",")}`);
  }
  return linkage;
}

export function summarizeReceiptLinkage(linkages) {
  const links = linkages.flatMap((linkage) => linkage.links);
  return Object.freeze({ candidates: linkages.length, receiptReferences: links.length, validCandidates: linkages.filter((linkage) => linkage.valid).length, payloadLinked: links.filter((link) => link.payloadLinked).length, identityLinked: links.filter((link) => link.identityLinked).length, referenceOnly: links.filter((link) => link.status === "reference-only").length, missing: links.filter((link) => link.status === "missing-reference").length });
}
