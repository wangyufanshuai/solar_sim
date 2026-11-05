import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

export const EVIDENCE_DIRECTORY = "docs/release/v607/mainline-a-constellation-source-20260928-081";
export const SUPPLEMENT_PATH = "app/data/mainlineAConstellationAnchorSupplementV638.ts";
export const CLOSED_BOUNDARY = Object.freeze({
  candidateOnly: true, reviewStatus: "hold", admission: "not-admitted",
  scientificPayloadWriteback: false, scientificIdentityConfirmed: false,
});
export const SOURCE_REQUESTS = Object.freeze([
  { id: "readme", file: "ReadMe", maxBytes: 256 * 1024 },
  { id: "catalog", file: "catalog.gz", maxBytes: 8 * 1024 * 1024 },
]);
export const ANCHOR_TARGETS = Object.freeze([
  { id: "delta_cyg", name: "Delta Cygni (Fawaris)", nameCn: "天鹅座 δ", constellationCode: "Cyg", bayer: "Del", suffix: "" },
  { id: "epsilon_cyg", name: "Epsilon Cygni (Aljanah)", nameCn: "天鹅座 ε", constellationCode: "Cyg", bayer: "Eps", suffix: "" },
  { id: "imai", name: "Delta Crucis (Imai)", nameCn: "南十字座 δ", constellationCode: "Cru", bayer: "Del", suffix: "" },
  { id: "zeta1_lyr", name: "Zeta1 Lyrae", nameCn: "天琴座 ζ¹", constellationCode: "Lyr", bayer: "Zet", suffix: "1" },
  { id: "delta2_lyr", name: "Delta2 Lyrae", nameCn: "天琴座 δ²", constellationCode: "Lyr", bayer: "Del", suffix: "2" },
  { id: "epsilon1_lyr", name: "Epsilon1 Lyrae / HR7051 / catalogue component A", nameCn: "天琴座 ε¹ · HR7051／目录组件A",
    constellationCode: "Lyr", bayer: "Eps", suffix: "1",
    componentSelector: { hr: 7051, rawName: "4Eps1Lyr", ads: "11635", adsComponent: "A" } },
  { id: "delta_aql", name: "Delta Aquilae", nameCn: "天鹰座 δ", constellationCode: "Aql", bayer: "Del", suffix: "" },
  { id: "zeta_aql", name: "Zeta Aquilae", nameCn: "天鹰座 ζ", constellationCode: "Aql", bayer: "Zet", suffix: "" },
  { id: "lambda_aql", name: "Lambda Aquilae", nameCn: "天鹰座 λ", constellationCode: "Aql", bayer: "Lam", suffix: "" },
  { id: "theta_aql", name: "Theta Aquilae", nameCn: "天鹰座 θ", constellationCode: "Aql", bayer: "The", suffix: "" },
  { id: "eta_aql", name: "Eta Aquilae", nameCn: "天鹰座 η", constellationCode: "Aql", bayer: "Eta", suffix: "" },
  { id: "zeta_tau", name: "Zeta Tauri", nameCn: "金牛座 ζ", constellationCode: "Tau", bayer: "Zet", suffix: "" },
  { id: "gamma_tau", name: "Gamma Tauri", nameCn: "金牛座 γ", constellationCode: "Tau", bayer: "Gam", suffix: "" },
  { id: "delta1_tau", name: "Delta1 Tauri", nameCn: "金牛座 δ¹", constellationCode: "Tau", bayer: "Del", suffix: "1" },
].map((target) => Object.freeze({ ...target,
  ...(target.componentSelector ? { componentSelector: Object.freeze(target.componentSelector) } : {}) })));
const REQUIRED_FIELDS = Object.freeze({
  HR: ["I", "---"], Name: ["A", "---"], ADS: ["A", "---"], ADScomp: ["A", "---"],
  RAh: ["I", "h"], RAm: ["I", "min"], RAs: ["F", "s"],
  "DE-": ["A", "---"], DEd: ["I", "deg"], DEm: ["I", "arcmin"], DEs: ["I", "arcsec"],
  Vmag: ["F", "mag"], n_Vmag: ["A", "---"], u_Vmag: ["A", "---"],
});
const COORDINATE_FIELDS = ["RAh", "RAm", "RAs", "DE-", "DEd", "DEm", "DEs"];
const officialHosts = new Set(["cdsarc.cds.unistra.fr", "cdsarc.u-strasbg.fr"]);
const headers = Object.freeze({
  accept: "text/plain,application/gzip,application/octet-stream",
  "accept-encoding": "identity",
  "user-agent": "SolarSim-MainlineA-V638-ConstellationAnchors/1.0",
});
const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function safeOfficialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && officialHosts.has(url.hostname)
      && !url.username && !url.password && (!url.port || url.port === "443")
      && /^\/ftp\/V\/50\/(?:ReadMe|catalog\.gz)$/.test(url.pathname)
      && !url.search && !url.hash;
  } catch { return false; }
}

export function requestFingerprint(url) {
  return sha256(JSON.stringify({ method: "GET", url, headers }));
}

export function classifyTransportError(error) {
  if (error?.code === "CAPTURE_TIMEOUT") return "timeout";
  if (error?.code === "CAPTURE_SIZE") return "size-limit";
  if (error?.code === "CAPTURE_REDIRECT") return "redirect";
  if (["EEXIST", "EACCES", "EPERM", "ENOSPC"].includes(error?.code)) return "artifact-io";
  if (["ENOTFOUND", "EAI_AGAIN"].includes(error?.code)) return "dns";
  if (/CERT|TLS|SSL/.test(error?.code ?? "")) return "tls";
  if (["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"].includes(error?.code)) return "connection";
  return "network";
}

function codedError(code, message) {
  return Object.assign(new Error(message), { code });
}

export function exclusiveJson(filename, value) {
  writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

export function requestNativeHttps(url, timeoutMs, maxBytes, reportHop) {
  if (!safeOfficialUrl(url)) throw codedError("CAPTURE_REDIRECT", "official-https-url-required");
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let settled = false;
    let response = null;
    const complete = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const request = https.get(url, { headers, agent: false, rejectUnauthorized: true }, (received) => {
      response = received;
      const hop = {
        url, httpStatus: received.statusCode ?? null,
        contentType: String(received.headers["content-type"] ?? ""),
        contentEncoding: String(received.headers["content-encoding"] ?? "identity"),
        location: typeof received.headers.location === "string" ? received.headers.location : null,
        tlsAuthorized: received.socket.authorized === true,
      };
      reportHop(hop);
      received.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          const error = codedError("CAPTURE_SIZE", "raw-response-byte-limit-exceeded");
          complete(error);
          received.destroy(); request.destroy();
          return;
        }
        chunks.push(chunk);
      });
      received.once("aborted", () => complete(codedError("ECONNRESET", "response-aborted")));
      received.once("error", (error) => complete(error));
      received.once("end", () => {
        if (!received.complete) { complete(codedError("ECONNRESET", "response-incomplete")); return; }
        complete(null, { ...hop, bytes: Buffer.concat(chunks) });
      });
    });
    const timer = setTimeout(() => {
      complete(codedError("CAPTURE_TIMEOUT", "total-https-attempt-timeout"));
      response?.destroy(); request.destroy();
    }, timeoutMs);
    request.once("error", (error) => complete(error));
  });
}

export async function captureAttempt({ url, timeoutMs, maxBytes, attempt, artifactId, root, outputDirectory }) {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const deadline = Date.now() + timeoutMs;
  const record = {
    artifactId, attempt, retryCount: attempt - 1, requestUrl: url,
    requestFingerprint: requestFingerprint(url), method: "GET", requestHeaders: headers,
    startedAt, endedAt: null, durationMs: null, timeout: false, timeoutMs,
    httpStatus: null, contentType: null, contentEncoding: null, finalUrl: url,
    redirectChain: [], hops: [], errorClass: null, errorMessage: null,
    responseCaptured: 0, artifact: null, transport: "node:https-native",
    evidenceOrigin: "live-https-capture", fixture: false, synthetic: false,
    boundary: CLOSED_BOUNDARY,
  };
  let current = url;
  try {
    for (let hop = 0; hop < 6; hop++) {
      if (!safeOfficialUrl(current)) throw codedError("CAPTURE_REDIRECT", "redirect-left-official-source");
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw codedError("CAPTURE_TIMEOUT", "total-https-attempt-timeout");
      const result = await requestNativeHttps(current, remaining, maxBytes, (item) => {
        record.hops.push(item);
        record.httpStatus = item.httpStatus;
        record.contentType = item.contentType;
        record.contentEncoding = item.contentEncoding;
        record.finalUrl = item.url;
      });
      if ([301, 302, 303, 307, 308].includes(result.httpStatus)) {
        if (!result.location) throw codedError("CAPTURE_REDIRECT", "redirect-location-missing");
        const destination = new URL(result.location, current).href;
        record.redirectChain.push({ from: current, to: destination, httpStatus: result.httpStatus });
        current = destination;
        continue;
      }
      const relative = `${outputDirectory}/raw/${artifactId}-attempt-${String(attempt).padStart(2, "0")}.raw`;
      if (result.bytes.length > 0) {
        writeFileSync(path.join(root, relative), result.bytes, { flag: "wx" });
        record.artifact = { path: relative, bytes: result.bytes.length, sha256: sha256(result.bytes) };
      }
      if (result.httpStatus !== 200) {
        record.errorClass = "http";
        record.errorMessage = `http-status-${result.httpStatus}`;
      } else if (!record.artifact) {
        record.errorClass = "empty-body";
        record.errorMessage = "response-had-no-artifact-bytes";
      } else {
        record.responseCaptured = 1;
      }
      break;
    }
    if (!record.artifact && !record.errorClass) throw codedError("CAPTURE_REDIRECT", "redirect-limit-exceeded");
  } catch (error) {
    record.errorClass = classifyTransportError(error);
    record.errorMessage = String(error?.message ?? "unknown-network-error").replace(/[\u0000-\u001f]/g, " ").slice(0, 500);
    record.timeout = record.errorClass === "timeout";
  }
  record.endedAt = new Date().toISOString();
  record.durationMs = Number((performance.now() - started).toFixed(3));
  return record;
}

export async function collectRaw({ root = moduleRoot, outputDirectory = EVIDENCE_DIRECTORY, timeoutMs = 20_000 } = {}) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120_000) throw new Error("capture-timeout-invalid");
  if (outputDirectory !== EVIDENCE_DIRECTORY) throw new Error("capture-output-directory-not-owned");
  const output = path.join(root, outputDirectory);
  mkdirSync(output, { recursive: false });
  mkdirSync(path.join(output, "raw"));
  const ledgerPath = path.join(output, "attempts.ndjson");
  writeFileSync(ledgerPath, "", { flag: "wx" });
  const attempts = [];
  for (const source of SOURCE_REQUESTS) {
    const hosts = [...officialHosts];
    for (const [index, host] of hosts.entries()) {
      const attempt = await captureAttempt({
        root, outputDirectory, artifactId: source.id, attempt: index + 1,
        url: `https://${host}/ftp/V/50/${source.file}`, timeoutMs, maxBytes: source.maxBytes,
      });
      attempts.push(attempt);
      writeFileSync(ledgerPath, `${JSON.stringify(attempt)}\n`, { flag: "a" });
      console.log(JSON.stringify({ artifactId: source.id, attempt: attempt.attempt,
        httpStatus: attempt.httpStatus, responseCaptured: attempt.responseCaptured,
        errorClass: attempt.errorClass, artifact: attempt.artifact }));
      if (attempt.responseCaptured === 1) break;
    }
  }
  const summary = {
    schema: "mainline-a-constellation-anchor-raw-capture-v638",
    createdAt: new Date().toISOString(), evidenceOrigin: "live-https-capture",
    fixture: false, synthetic: false, boundary: CLOSED_BOUNDARY,
    status: SOURCE_REQUESTS.every((source) => attempts.some((attempt) => attempt.artifactId === source.id && attempt.responseCaptured === 1))
      ? "raw-captured-not-yet-parsed" : "source-pending",
    attempts, attemptLedger: { path: `${outputDirectory}/attempts.ndjson`,
      bytes: readFileSync(ledgerPath).length, sha256: sha256(readFileSync(ledgerPath)) },
  };
  exclusiveJson(path.join(output, "capture.json"), summary);
  return summary;
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function assertClosedBoundary(value, context) {
  for (const [key, expected] of Object.entries(CLOSED_BOUNDARY)) {
    requireCondition(value?.[key] === expected, `${context}:boundary-${key}`);
  }
}

function asciiText(bytes, context) {
  requireCondition(Buffer.isBuffer(bytes) && bytes.length > 0, `${context}:empty-bytes`);
  for (const byte of bytes) {
    requireCondition(byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126), `${context}:non-ascii-byte`);
  }
  return bytes.toString("ascii");
}

export function parseReadMe(bytes) {
  const text = asciiText(bytes, "readme");
  requireCondition(/^V\/50\s+Bright Star Catalogue, 5th Revised Ed\./m.test(text), "readme:catalogue-identity");
  const summary = /^catalog\s+(\d+)\s+(\d+)\s+The main part of the Catalogue\s*$/m.exec(text);
  requireCondition(summary, "readme:catalog-summary-missing");
  const recordLength = Number(summary[1]);
  const recordCount = Number(summary[2]);
  requireCondition(recordLength === 197 && recordCount === 9110, "readme:unexpected-v50-shape");
  const lines = text.split(/\r?\n/);
  const tableStart = lines.findIndex((line) => line.trim() === "Byte-by-byte Description of file: catalog");
  requireCondition(tableStart >= 0, "readme:catalog-byte-table-missing");
  const fields = {};
  for (let index = tableStart + 1; index < lines.length; index++) {
    if (/^-{5,}$/.test(lines[index]) && Object.keys(fields).length > 0) break;
    const match = /^\s*(\d+)\s*(?:-\s*(\d+))?\s+([AIF]\d+(?:\.\d+)?)\s+(\S+)\s+(\S+)\s+(.*)$/.exec(lines[index]);
    if (!match) continue;
    const [, first, last, format, units, label, explanation] = match;
    const start = Number(first);
    const end = last ? Number(last) : start;
    requireCondition(!fields[label], `readme:duplicate-field:${label}`);
    requireCondition(start >= 1 && start <= end && end <= recordLength, `readme:invalid-column:${label}`);
    requireCondition(Number(/^[AIF](\d+)/.exec(format)[1]) === end - start + 1, `readme:width-mismatch:${label}`);
    fields[label] = { start, end, format, units, explanation, readMeLine: index + 1 };
  }
  for (const [label, [kind, units]] of Object.entries(REQUIRED_FIELDS)) {
    const field = fields[label];
    requireCondition(field && field.format.startsWith(kind) && field.units === units, `readme:required-field:${label}`);
  }
  for (const label of COORDINATE_FIELDS) {
    requireCondition(/equinox J2000, epoch 2000\.0/.test(fields[label].explanation), `readme:j2000-definition:${label}`);
  }
  const columns = Object.values(fields).sort((left, right) => left.start - right.start);
  for (let index = 1; index < columns.length; index++) {
    requireCondition(columns[index].start > columns[index - 1].end, "readme:overlapping-fields");
  }
  return { catalogue: "V/50", recordLength, recordCount, fields, readMeSha256: sha256(bytes) };
}

export function decodeCatalogue(gzipBytes) {
  requireCondition(Buffer.isBuffer(gzipBytes) && gzipBytes[0] === 0x1f && gzipBytes[1] === 0x8b, "catalog:gzip-signature");
  const bytes = gunzipSync(gzipBytes, { maxOutputLength: 4 * 1024 * 1024 });
  asciiText(bytes, "catalog");
  return bytes;
}

function fieldText(raw, schema, label) {
  const field = schema.fields[label];
  requireCondition(field, `catalog:undefined-field:${label}`);
  return raw.slice(field.start - 1, field.end);
}

export function parseCatalogue(bytes, schema) {
  const text = asciiText(bytes, "catalog");
  const rows = [];
  const seenHr = new Set();
  let byteStart = 0;
  while (byteStart < bytes.length) {
    const newline = bytes.indexOf(10, byteStart);
    const lineEnd = newline < 0 ? bytes.length : newline;
    const contentEnd = lineEnd > byteStart && bytes[lineEnd - 1] === 13 ? lineEnd - 1 : lineEnd;
    const raw = text.slice(byteStart, contentEnd);
    requireCondition(raw.length >= schema.fields.Vmag.end && raw.length <= schema.recordLength, `catalog:record-length:${rows.length + 1}`);
    const hrText = fieldText(raw, schema, "HR").trim();
    requireCondition(/^\d+$/.test(hrText), `catalog:invalid-hr:${rows.length + 1}`);
    const hr = Number(hrText);
    requireCondition(hr >= 1 && hr <= schema.recordCount && !seenHr.has(hr), `catalog:duplicate-or-invalid-hr:${hr}`);
    seenHr.add(hr);
    rows.push({
      hr, raw, rawName: fieldText(raw, schema, "Name"),
      ads: fieldText(raw, schema, "ADS").trim(), adsComponent: fieldText(raw, schema, "ADScomp").trim(),
      lineNumber: rows.length + 1, byteStart, byteEndExclusive: contentEnd,
      rawLineSha256: sha256(bytes.subarray(byteStart, contentEnd)),
    });
    byteStart = newline < 0 ? bytes.length : newline + 1;
  }
  requireCondition(rows.length === schema.recordCount, "catalog:record-count-mismatch");
  return rows;
}

export function parseBayerName(rawName) {
  const match = /^(?:(\d{1,3})\s*)?([A-Z][a-z]{2})(\d?)\s*([A-Z][a-z]{2})$/.exec(rawName.trim());
  return match ? { flamsteed: match[1] ? Number(match[1]) : null,
    bayer: match[2], suffix: match[3], constellationCode: match[4] } : null;
}

export function matchAnchor(rows, target) {
  const matches = rows.filter((row) => {
    const name = parseBayerName(row.rawName);
    return name && name.bayer === target.bayer && name.suffix === target.suffix
      && name.constellationCode === target.constellationCode;
  });
  requireCondition(matches.length > 0, `identity:missing:${target.id}`);
  const selector = target.componentSelector;
  if (!selector) {
    requireCondition(matches.length === 1, `identity:ambiguous-name:${target.id}`);
    return { row: matches[0], matches, policy: "unique-exact-bayer-designation" };
  }
  const required = ANCHOR_TARGETS.find((item) => item.id === target.id)?.componentSelector;
  requireCondition(required && JSON.stringify(selector) === JSON.stringify(required), `identity:component-selector-not-authorized:${target.id}`);
  const selected = matches.filter((row) => row.hr === selector.hr && row.rawName.trim() === selector.rawName
    && row.ads === selector.ads && row.adsComponent === selector.adsComponent);
  requireCondition(selected.length === 1, `identity:component-selector-mismatch:${target.id}`);
  return { row: selected[0], matches, policy: "explicit-hr-name-ads-component-presentation-rule" };
}

function numericField(row, schema, label, { integer = false, min = -Infinity, max = Infinity, nullable = false } = {}) {
  const text = fieldText(row.raw, schema, label).trim();
  if (nullable && text === "") return null;
  requireCondition(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text), `coordinate:invalid-number:${row.hr}:${label}`);
  const value = Number(text);
  requireCondition(Number.isFinite(value) && (!integer || Number.isInteger(value)) && value >= min && value <= max,
    `coordinate:out-of-range:${row.hr}:${label}`);
  return value;
}

export function coordinatesFromRow(row, schema) {
  const hours = numericField(row, schema, "RAh", { integer: true, min: 0, max: 23 });
  const minutes = numericField(row, schema, "RAm", { integer: true, min: 0, max: 59 });
  const seconds = numericField(row, schema, "RAs", { min: 0, max: 59.999999 });
  const sign = fieldText(row.raw, schema, "DE-");
  requireCondition(sign === "+" || sign === "-", `coordinate:invalid-sign:${row.hr}`);
  const degrees = numericField(row, schema, "DEd", { integer: true, min: 0, max: 90 });
  const arcminutes = numericField(row, schema, "DEm", { integer: true, min: 0, max: 59 });
  const arcseconds = numericField(row, schema, "DEs", { integer: true, min: 0, max: 59 });
  requireCondition(degrees < 90 || (arcminutes === 0 && arcseconds === 0), `coordinate:invalid-pole:${row.hr}`);
  return {
    raDeg: Number(((hours + minutes / 60 + seconds / 3600) * 15).toFixed(12)),
    decDeg: Number(((degrees + arcminutes / 60 + arcseconds / 3600) * (sign === "-" ? -1 : 1)).toFixed(12)),
    magV: numericField(row, schema, "Vmag", { nullable: true }),
  };
}

function rowSourceProof(row, schema) {
  const fields = Object.fromEntries(Object.keys(REQUIRED_FIELDS).map((label) => [label, {
    text: fieldText(row.raw, schema, label), start: schema.fields[label].start, end: schema.fields[label].end,
  }]));
  return {
    hr: row.hr, rawName: row.rawName, ads: row.ads || null, adsComponent: row.adsComponent || null,
    lineNumber: row.lineNumber, byteSpace: "gzip-decompressed-catalogue-ascii",
    byteStart: row.byteStart, byteEndExclusive: row.byteEndExclusive, rawLineSha256: row.rawLineSha256, fields,
  };
}

export function deriveParserCandidates(readMeBytes, gzipBytes) {
  const schema = parseReadMe(readMeBytes);
  const catalogueBytes = decodeCatalogue(gzipBytes);
  const rows = parseCatalogue(catalogueBytes, schema);
  const ambiguity = [];
  const records = ANCHOR_TARGETS.map((target) => {
    const match = matchAnchor(rows, target);
    const source = rowSourceProof(match.row, schema);
    if (match.matches.length > 1) {
      ambiguity.push({
        id: target.id, selectedHr: match.row.hr, selectionRule: target.componentSelector,
        reason: "explicit-presentation-rule-not-nearest-or-brightest", systemCentreClaimed: false,
        scientificIdentityConfirmed: false,
        candidates: match.matches.map((row) => ({ ...rowSourceProof(row, schema), ...coordinatesFromRow(row, schema) })),
      });
    }
    return {
      id: target.id, name: target.name, nameCn: target.nameCn, constellationCode: target.constellationCode,
      ...coordinatesFromRow(match.row, schema),
      bayerDesignation: `${target.bayer}${target.suffix} ${target.constellationCode}`,
      coordinateFrame: "equatorial-equinox-J2000-epoch-2000.0",
      displayLabelAuthority: "requested-display-label-not-IAU-name-verification",
      matchPolicy: match.policy, systemCentreClaimed: false,
      ...CLOSED_BOUNDARY, source,
    };
  });
  // This pure parser makes no transport-authenticity claim and cannot publish a supplement.
  return { evidenceClass: "parser-output-only", schema, records, ambiguity,
    catalogue: { bytes: catalogueBytes.length, sha256: sha256(catalogueBytes), records: rows.length } };
}

export function validateCaptureBundle(capture, ledgerBytes, artifactBytes) {
  requireCondition(capture?.schema === "mainline-a-constellation-anchor-raw-capture-v638", "capture:schema");
  requireCondition(capture.evidenceOrigin === "live-https-capture" && capture.fixture === false && capture.synthetic === false,
    "capture:fixture-or-synthetic-not-publishable");
  assertClosedBoundary(capture.boundary, "capture");
  requireCondition(capture.status === "raw-captured-not-yet-parsed", "capture:source-pending");
  requireCondition(capture.attemptLedger?.path === `${EVIDENCE_DIRECTORY}/attempts.ndjson`, "capture:ledger-path");
  requireCondition(Array.isArray(capture.attempts) && capture.attempts.length > 0, "capture:no-attempts");
  requireCondition(Buffer.isBuffer(ledgerBytes) && ledgerBytes.length === capture.attemptLedger?.bytes
    && sha256(ledgerBytes) === capture.attemptLedger?.sha256, "capture:attempt-ledger-sha256");
  const ledger = ledgerBytes.toString("utf8").trim().split("\n").map((line) => JSON.parse(line));
  requireCondition(JSON.stringify(ledger) === JSON.stringify(capture.attempts), "capture:attempt-ledger-content");
  const counts = new Map();
  const successful = {};
  for (const attempt of capture.attempts) {
    const spec = SOURCE_REQUESTS.find((source) => source.id === attempt.artifactId);
    requireCondition(spec, "capture:unknown-artifact-id");
    assertClosedBoundary(attempt.boundary, "attempt");
    requireCondition(attempt.evidenceOrigin === "live-https-capture" && attempt.transport === "node:https-native"
      && attempt.fixture === false && attempt.synthetic === false, "capture:fixture-transport-not-publishable");
    const next = (counts.get(spec.id) ?? 0) + 1;
    requireCondition(attempt.attempt === next && attempt.retryCount === next - 1, "capture:attempt-sequence");
    counts.set(spec.id, next);
    requireCondition(attempt.method === "GET" && safeOfficialUrl(attempt.requestUrl)
      && new URL(attempt.requestUrl).pathname.endsWith(`/${spec.file}`), "capture:request-url");
    requireCondition(attempt.requestFingerprint === requestFingerprint(attempt.requestUrl)
      && JSON.stringify(attempt.requestHeaders) === JSON.stringify(headers), "capture:request-fingerprint");
    requireCondition(Number.isFinite(Date.parse(attempt.startedAt)) && Number.isFinite(Date.parse(attempt.endedAt))
      && Date.parse(attempt.endedAt) >= Date.parse(attempt.startedAt)
      && Number.isFinite(attempt.durationMs) && attempt.durationMs >= 0
      && Number.isSafeInteger(attempt.timeoutMs) && attempt.timeoutMs >= 100 && attempt.timeoutMs <= 120_000,
    "capture:attempt-timing");
    requireCondition(Array.isArray(attempt.hops) && Array.isArray(attempt.redirectChain), "capture:redirect-ledger");
    if (attempt.artifact) {
      const expected = `${EVIDENCE_DIRECTORY}/raw/${spec.id}-attempt-${String(next).padStart(2, "0")}.raw`;
      requireCondition(attempt.artifact.path === expected, "capture:artifact-path");
      const raw = artifactBytes.get(expected);
      requireCondition(Buffer.isBuffer(raw) && raw.length > 0 && raw.length <= spec.maxBytes
        && raw.length === attempt.artifact.bytes && sha256(raw) === attempt.artifact.sha256, "capture:raw-sha256");
    }
    requireCondition(attempt.responseCaptured === 0 || attempt.responseCaptured === 1, "capture:response-flag");
    if (attempt.responseCaptured !== 1) {
      requireCondition(typeof attempt.errorClass === "string" && attempt.errorClass.length > 0, "capture:failure-class-missing");
      continue;
    }
    requireCondition(!successful[spec.id], "capture:duplicate-success");
    requireCondition(attempt.artifact && attempt.httpStatus === 200 && !attempt.timeout && attempt.errorClass === null,
      "capture:success-state");
    requireCondition(attempt.hops.length > 0 && attempt.hops.length === attempt.redirectChain.length + 1,
      "capture:redirect-chain-length");
    for (let index = 0; index < attempt.hops.length; index++) {
      const hop = attempt.hops[index];
      requireCondition(safeOfficialUrl(hop.url) && hop.tlsAuthorized === true, "capture:official-tls-hop");
      requireCondition(hop.url === (index === 0 ? attempt.requestUrl : attempt.redirectChain[index - 1].to), "capture:redirect-chain-url");
      if (index < attempt.redirectChain.length) {
        const redirect = attempt.redirectChain[index];
        requireCondition([301, 302, 303, 307, 308].includes(hop.httpStatus)
          && redirect.from === hop.url && redirect.httpStatus === hop.httpStatus
          && redirect.to === new URL(hop.location, hop.url).href, "capture:redirect-chain-status");
      }
    }
    const final = attempt.hops.at(-1);
    requireCondition(final.url === attempt.finalUrl && final.httpStatus === attempt.httpStatus
      && final.contentType === attempt.contentType && final.contentEncoding === attempt.contentEncoding
      && new URL(final.url).pathname.endsWith(`/${spec.file}`), "capture:final-response-binding");
    requireCondition(attempt.contentEncoding === "identity", "capture:unexpected-content-encoding");
    requireCondition(spec.id === "readme" ? /^text\/plain(?:;|$)/i.test(attempt.contentType)
      : /^application\/(?:x-gzip|gzip|octet-stream)(?:;|$)/i.test(attempt.contentType), "capture:content-type");
    successful[spec.id] = attempt;
  }
  requireCondition(successful.readme && successful.catalog, "capture:source-pending");
  return successful;
}

export function buildSupplement(capture, ledgerBytes, artifactBytes) {
  const sources = validateCaptureBundle(capture, ledgerBytes, artifactBytes);
  const parsed = deriveParserCandidates(artifactBytes.get(sources.readme.artifact.path), artifactBytes.get(sources.catalog.artifact.path));
  return {
    schema: "mainline-a-constellation-anchor-supplement-v638",
    evidenceClass: "external-source-candidate", fixture: false, synthetic: false, boundary: CLOSED_BOUNDARY,
    catalogue: "Yale Bright Star Catalogue V/50, 5th Revised Ed. (1991 preliminary version)",
    coordinateSource: "ReadMe-defined J2000 equinox and epoch 2000.0 fields; no proper-motion propagation",
    readMe: { sourceUrl: sources.readme.finalUrl, ...sources.readme.artifact },
    compressedCatalogue: { sourceUrl: sources.catalog.finalUrl, ...sources.catalog.artifact },
    decompressedCatalogue: parsed.catalogue,
    fieldDefinitions: Object.fromEntries(Object.keys(REQUIRED_FIELDS).map((key) => [key, parsed.schema.fields[key]])),
    records: parsed.records.map((record) => ({ ...record, sourceUrl: sources.catalog.finalUrl,
      artifactPath: sources.catalog.artifact.path, artifactSha256: sources.catalog.artifact.sha256 })),
    ambiguity: parsed.ambiguity,
    limitations: [
      "Source capture and deterministic parsing do not grant external scientific identity confirmation or copyright sign-off.",
      "epsilon1_lyr selects HR7051, Name 4Eps1Lyr, ADS11635 component A by an explicit presentation rule; HR7052 component B remains in the ambiguity ledger.",
      "No nearest-sky substitution, system-centre estimate, proper-motion propagation, scientific payload writeback, or IAU boundary identity inference.",
      "Offline replay verifies retained artifact integrity and derivation, not independent authentication of network provenance.",
    ],
  };
}

export function validateSupplement(actual, expected) {
  requireCondition(actual?.schema === expected.schema, "supplement:schema");
  requireCondition(actual.fixture === false && actual.synthetic === false && actual.evidenceClass === "external-source-candidate",
    "supplement:fixture-promotion");
  assertClosedBoundary(actual.boundary, "supplement");
  requireCondition(Array.isArray(actual.records) && actual.records.length === ANCHOR_TARGETS.length, "supplement:missing-or-extra-records");
  const ids = new Set();
  for (const record of actual.records) {
    requireCondition(!ids.has(record.id), "supplement:duplicate-id");
    ids.add(record.id);
    const target = ANCHOR_TARGETS.find((item) => item.id === record.id);
    requireCondition(target && record.constellationCode === target.constellationCode, "supplement:wrong-constellation");
    requireCondition(Number.isFinite(record.raDeg) && record.raDeg >= 0 && record.raDeg < 360
      && Number.isFinite(record.decDeg) && Math.abs(record.decDeg) <= 90
      && (record.magV === null || Number.isFinite(record.magV)), "supplement:invalid-coordinate");
    assertClosedBoundary(record, "supplement-record");
  }
  requireCondition(JSON.stringify(actual) === JSON.stringify(expected), "supplement:recomputed-content-mismatch");
  return { status: "verified-candidate-only", records: actual.records.length, scientificPayloadWriteback: false };
}

export function renderSupplementModule(supplement) {
  return `// Recomputed from retained official CDS V/50 bytes by collect-mainline-a-constellation-anchors-v638.mjs.\n`
    + `// Candidate presentation anchors only; source capture is not scientific identity confirmation.\n`
    + `export type MainlineAConstellationAnchorSupplementRecordV638 = Readonly<{\n`
    + `  id: string; name: string; nameCn: string; constellationCode: string; raDeg: number; decDeg: number; magV: number | null;\n`
    + `  sourceUrl: string; artifactPath: string; artifactSha256: string; bayerDesignation: string; coordinateFrame: string;\n`
    + `  displayLabelAuthority: string; matchPolicy: string; systemCentreClaimed: false;\n`
    + `  candidateOnly: true; reviewStatus: "hold"; admission: "not-admitted"; scientificPayloadWriteback: false; scientificIdentityConfirmed: false;\n`
    + `  source: Readonly<{ hr: number; rawName: string; ads: string | null; adsComponent: string | null; lineNumber: number;\n`
    + `    byteSpace: string; byteStart: number; byteEndExclusive: number; rawLineSha256: string;\n`
    + `    fields: Readonly<Record<string, Readonly<{ text: string; start: number; end: number }>>>; }>;\n`
    + `}>;\n\n`
    + `export const MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_BOUNDARY_V638 = ${JSON.stringify(CLOSED_BOUNDARY, null, 2)} as const;\n\n`
    + `export const MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638 = ${JSON.stringify(supplement.records, null, 2)} as const satisfies readonly MainlineAConstellationAnchorSupplementRecordV638[];\n`;
}

function ownedRead(root, relative) {
  requireCondition(typeof relative === "string" && !relative.includes("\\") && !path.isAbsolute(relative)
    && !relative.split("/").includes("..") && relative.startsWith(`${EVIDENCE_DIRECTORY}/`), "evidence:path-outside-owned-directory");
  const filename = path.join(root, relative);
  const stat = lstatSync(filename);
  requireCondition(stat.isFile() && !stat.isSymbolicLink(), "evidence:regular-file-required");
  const scope = realpathSync(path.join(root, EVIDENCE_DIRECTORY));
  const actual = realpathSync(filename);
  requireCondition(actual.startsWith(`${scope}${path.sep}`), "evidence:symlink-escape");
  return readFileSync(filename);
}

export function readCaptureInputs(root = moduleRoot) {
  const capture = JSON.parse(ownedRead(root, `${EVIDENCE_DIRECTORY}/capture.json`).toString("utf8"));
  requireCondition(capture.attemptLedger?.path === `${EVIDENCE_DIRECTORY}/attempts.ndjson`, "capture:ledger-path");
  const ledgerBytes = ownedRead(root, capture.attemptLedger.path);
  const artifactBytes = new Map(capture.attempts.filter((attempt) => attempt.artifact)
    .map((attempt) => [attempt.artifact.path, ownedRead(root, attempt.artifact.path)]));
  return { capture, ledgerBytes, artifactBytes };
}

export function deriveAndWrite(root = moduleRoot) {
  const inputs = readCaptureInputs(root);
  const supplement = buildSupplement(inputs.capture, inputs.ledgerBytes, inputs.artifactBytes);
  const output = path.join(root, EVIDENCE_DIRECTORY);
  for (const filename of ["supplement.json", "identity-ambiguities.json", "derivation.json"]) {
    requireCondition(!existsSync(path.join(output, filename)), "derive:existing-artifact-preserved");
  }
  requireCondition(!existsSync(path.join(root, SUPPLEMENT_PATH)), "derive:existing-module-preserved");
  exclusiveJson(path.join(output, "supplement.json"), supplement);
  exclusiveJson(path.join(output, "identity-ambiguities.json"), {
    schema: "mainline-a-constellation-anchor-ambiguity-v638", boundary: CLOSED_BOUNDARY,
    catalogueArtifact: supplement.compressedCatalogue, candidates: supplement.ambiguity,
  });
  const moduleText = renderSupplementModule(supplement);
  writeFileSync(path.join(root, SUPPLEMENT_PATH), moduleText, { flag: "wx", encoding: "utf8" });
  const outputs = [SUPPLEMENT_PATH, `${EVIDENCE_DIRECTORY}/supplement.json`, `${EVIDENCE_DIRECTORY}/identity-ambiguities.json`]
    .map((relative) => { const bytes = readFileSync(path.join(root, relative)); return { path: relative, bytes: bytes.length, sha256: sha256(bytes) }; });
  exclusiveJson(path.join(output, "derivation.json"), {
    schema: "mainline-a-constellation-anchor-derivation-v638", createdAt: new Date().toISOString(),
    status: "derived-candidate-only", records: supplement.records.length, boundary: CLOSED_BOUNDARY,
    inputCapture: { path: `${EVIDENCE_DIRECTORY}/capture.json`, sha256: sha256(readFileSync(path.join(output, "capture.json"))) },
    outputs, scientificIdentityConfirmed: false,
  });
  return { records: supplement.records.length, outputs };
}

export function verifyExisting(root = moduleRoot) {
  const inputs = readCaptureInputs(root);
  const expected = buildSupplement(inputs.capture, inputs.ledgerBytes, inputs.artifactBytes);
  const actual = JSON.parse(ownedRead(root, `${EVIDENCE_DIRECTORY}/supplement.json`).toString("utf8"));
  const result = validateSupplement(actual, expected);
  const actualModule = readFileSync(path.join(root, SUPPLEMENT_PATH), "utf8");
  requireCondition(actualModule === renderSupplementModule(expected), "verify:module-recompute-mismatch");
  const ambiguity = JSON.parse(ownedRead(root, `${EVIDENCE_DIRECTORY}/identity-ambiguities.json`).toString("utf8"));
  requireCondition(JSON.stringify(ambiguity) === JSON.stringify({
    schema: "mainline-a-constellation-anchor-ambiguity-v638", boundary: CLOSED_BOUNDARY,
    catalogueArtifact: expected.compressedCatalogue, candidates: expected.ambiguity,
  }), "verify:ambiguity-recompute-mismatch");
  const derivation = JSON.parse(ownedRead(root, `${EVIDENCE_DIRECTORY}/derivation.json`).toString("utf8"));
  const requiredOutputs = [SUPPLEMENT_PATH, `${EVIDENCE_DIRECTORY}/supplement.json`, `${EVIDENCE_DIRECTORY}/identity-ambiguities.json`];
  const outputBytes = new Map(requiredOutputs.map((filename) => [filename,
    filename === SUPPLEMENT_PATH ? Buffer.from(actualModule) : ownedRead(root, filename)]));
  validateDerivationReceipt(derivation, ownedRead(root, `${EVIDENCE_DIRECTORY}/capture.json`), outputBytes);
  return { ...result, rawCatalogueSha256: expected.compressedCatalogue.sha256,
    catalogueRecords: expected.decompressedCatalogue.records, ambiguousNamesRetained: expected.ambiguity.length,
    independentNetworkAuthenticationClaimed: false, moduleSha256: sha256(actualModule) };
}

export function validateDerivationReceipt(derivation, captureBytes, outputBytes) {
  assertClosedBoundary(derivation.boundary, "derivation");
  requireCondition(derivation.schema === "mainline-a-constellation-anchor-derivation-v638"
    && derivation.status === "derived-candidate-only" && derivation.records === ANCHOR_TARGETS.length
    && derivation.scientificIdentityConfirmed === false && Number.isFinite(Date.parse(derivation.createdAt)),
  "verify:derivation-state");
  requireCondition(derivation.inputCapture?.path === `${EVIDENCE_DIRECTORY}/capture.json`
    && derivation.inputCapture.sha256 === sha256(captureBytes), "verify:capture-sha256");
  const requiredOutputs = [SUPPLEMENT_PATH, `${EVIDENCE_DIRECTORY}/supplement.json`, `${EVIDENCE_DIRECTORY}/identity-ambiguities.json`];
  requireCondition(Array.isArray(derivation.outputs) && derivation.outputs.length === requiredOutputs.length
    && derivation.outputs.every((item, index) => item.path === requiredOutputs[index]), "verify:output-set");
  for (const output of derivation.outputs) {
    const bytes = outputBytes.get(output.path);
    requireCondition(Buffer.isBuffer(bytes) && bytes.length === output.bytes && sha256(bytes) === output.sha256, "verify:output-sha256");
  }
  return true;
}

async function main() {
  const mode = process.argv[2];
  requireCondition(process.argv.length === 3 && ["--collect", "--collect-raw", "--derive", "--verify"].includes(mode),
    "usage: --collect | --collect-raw | --derive | --verify");
  if (mode === "--verify") { console.log(JSON.stringify(verifyExisting(), null, 2)); return; }
  if (mode === "--derive") { console.log(JSON.stringify(deriveAndWrite(), null, 2)); return; }
  requireCondition(!existsSync(path.join(moduleRoot, EVIDENCE_DIRECTORY)), "capture-directory-already-exists-preserved");
  const summary = await collectRaw();
  console.log(JSON.stringify({ status: summary.status, directory: EVIDENCE_DIRECTORY }));
  if (summary.status === "source-pending") { process.exitCode = 2; return; }
  if (mode === "--collect") console.log(JSON.stringify(deriveAndWrite(), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
