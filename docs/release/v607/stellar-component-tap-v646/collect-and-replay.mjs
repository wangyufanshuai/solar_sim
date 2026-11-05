import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const SOURCE = "app/data/mainlineABetaStellarStructuredCandidateV621.generated.json";
const REVIEW = "docs/release/v607/mainline-a-r66-stellar-component-review-packet-20261007.json";
const OUTPUT_ROOT = "docs/release/v607/stellar-component-tap-v646";
const ENDPOINT = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
const IDS = ["acrux", "spica", "regulus", "polaris"];
const TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 2;
const MAX_BYTES = 256 * 1024;
const CSV_HEADER = ["id", "oidref", "main_id", "ra", "dec", "otype"];
const BOUNDARY = Object.freeze({ candidateOnly: true, hold: true, notAdmitted: true, componentConfirmed: false,
  scientificPayloadWriteback: false, runtimeWrites: false, rightsApproved: false });
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const assert = (value, message) => { if (!value) throw new Error(`tap-v646:${message}`); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative));
const json = (relative) => JSON.parse(read(relative).toString("utf8"));
const now = () => new Date().toISOString();
const ref = (relative) => ({ path: relative, bytes: read(relative).length, sha256: hash(read(relative)) });

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
const digest = (value) => hash(JSON.stringify(canonical(value)));

function inputs() {
  const source = json(SOURCE), review = json(REVIEW);
  assert(source.schema === "mainline-a-beta-stellar-structured-candidate-pack-v621", "source-schema");
  assert(review.schema === "mainline-a-r66-stellar-component-review-packet-v645", "review-schema");
  assert(source.records.length === 4 && review.records.length === 4, "four-star-input");
  assert(IDS.every((id) => source.records.some((row) => row.id === id) && review.records.some((row) => row.id === id)), "star-roster");
  assert(review.summary.componentIdentitiesConfirmed === 0 && review.boundary.scientificPayloadWriteback === false, "prior-admission");
  return { source, review, sourceRef: ref(SOURCE), reviewRef: ref(REVIEW) };
}

function planFor(id, source, review) {
  const candidate = source.records.find((row) => row.id === id);
  const system = review.records.find((row) => row.id === id);
  assert(candidate && system && /^\d{5}[+-]\d{4}$/.test(system.wdsSystemId), `${id}:system`);
  const prefix = `WDS J${system.wdsSystemId}`;
  const identifiers = [...new Set([candidate.queryTitle, ...system.sourceWdsIdentifiers,
    `${prefix}A`, `${prefix}Aa`, `${prefix}Ab`, `${prefix}Aa,Ab`, `${prefix}B`, `${prefix}C`, `${prefix}D`])];
  assert(identifiers.length >= 7 && identifiers.length <= 12 && identifiers.every((value) => typeof value === "string" && value.length < 100 && !/[\x00-\x1f]/.test(value)), `${id}:identifiers`);
  const quoted = identifiers.map((value) => `'${value.replaceAll("'", "''")}'`).join(",");
  const adql = `SELECT TOP 64 i.id, i.oidref, b.main_id, b.ra, b.dec, b.otype FROM ident AS i JOIN basic AS b ON i.oidref=b.oid WHERE i.id IN (${quoted})`;
  const url = new URL(ENDPOINT);
  url.searchParams.set("REQUEST", "doQuery");
  url.searchParams.set("LANG", "ADQL");
  url.searchParams.set("FORMAT", "csv");
  url.searchParams.set("QUERY", adql);
  const requestUrl = url.toString();
  return { id, wdsSystemId: system.wdsSystemId, identifiers, adql, method: "GET", accept: "text/csv", requestUrl,
    timeoutMs: TIMEOUT_MS, maxAttempts: MAX_ATTEMPTS, requestFingerprint: digest({ method: "GET", accept: "text/csv", requestUrl }) };
}

function parseCsv(value, allowedIdentifiers) {
  assert(!value.includes("\0") && value.length < MAX_BYTES, "csv-bounds");
  const records = [];
  let row = [], cell = "", quoted = false;
  for (let index = 0; index < value.length; index++) {
    const ch = value[index];
    if (quoted) {
      if (ch === '"' && value[index + 1] === '"') { cell += '"'; index++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') {
      assert(cell === "", "csv-stray-quote");
      quoted = true;
    } else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell.replace(/\r$/u, "")); if (row.some(Boolean)) records.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  assert(!quoted, "csv-unclosed-quote");
  if (cell || row.length) { row.push(cell); if (row.some(Boolean)) records.push(row); }
  assert(records.length >= 1 && records.length <= 65, "csv-row-count");
  assert(JSON.stringify(records[0]) === JSON.stringify(CSV_HEADER), "csv-header");
  const allowed = new Set(allowedIdentifiers), seen = new Set();
  const rows = records.slice(1).map((fields) => {
    assert(fields.length === 6, "csv-column-count");
    const [identifier, oidref, mainId, ra, dec, objectType] = fields;
    assert(allowed.has(identifier) && !seen.has(identifier), `csv-unplanned-or-duplicate-id:${identifier}`);
    seen.add(identifier);
    assert(/^\d+$/u.test(oidref) && mainId.trim() && Number.isFinite(Number(ra)) && Number.isFinite(Number(dec)) && objectType.trim(), `csv-field:${identifier}`);
    return { identifier, oidref, mainId, raDeg: Number(ra), decDeg: Number(dec), objectType };
  });
  assert(rows.length > 0, "csv-empty-result");
  return rows;
}

async function boundedBody(response) {
  const length = response.headers.get("content-length");
  if (length) assert(Number(length) <= MAX_BYTES, "body-content-length");
  const reader = response.body?.getReader();
  assert(reader, "body-missing");
  const chunks = [];
  let bytes = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.length;
    assert(bytes <= MAX_BYTES, "body-too-large");
    chunks.push(Buffer.from(part.value));
  }
  return Buffer.concat(chunks);
}

async function oneAttempt(plan, attemptNumber) {
  const startedAt = now();
  const startedMs = performance.now();
  const redirectChain = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), plan.timeoutMs);
  let currentUrl = plan.requestUrl, httpStatus = null, contentType = null, finalUrl = null;
  let bytes = null, rows = null, errorCategory = null, errorMessage = null;
  try {
    for (let hop = 0; hop <= 3; hop++) {
      const response = await fetch(currentUrl, { method: "GET", headers: { Accept: plan.accept }, redirect: "manual", signal: controller.signal });
      httpStatus = response.status;
      contentType = response.headers.get("content-type");
      finalUrl = response.url;
      if ([301, 302, 303, 307, 308].includes(httpStatus)) {
        const location = response.headers.get("location");
        const next = new URL(location ?? "", response.url);
        assert(next.protocol === "https:" && next.hostname === "simbad.cds.unistra.fr", "redirect-host-or-scheme");
        redirectChain.push({ url: response.url, status: httpStatus, location: next.toString() });
        currentUrl = next.toString();
        continue;
      }
      assert(httpStatus === 200, `http-status:${httpStatus}`);
      assert(/^text\/csv(?:;|$)/iu.test(contentType ?? ""), `content-type:${contentType}`);
      bytes = await boundedBody(response);
      assert(bytes.length > 0, "empty-response");
      rows = parseCsv(new TextDecoder("utf-8", { fatal: true }).decode(bytes), plan.identifiers);
      break;
    }
    assert(bytes && rows, "redirect-limit");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errorMessage = message.slice(0, 300);
    errorCategory = controller.signal.aborted ? "timeout" : message.includes("http-status:") ? "http-status"
      : message.includes("content-type:") ? "content-type" : message.includes("redirect") ? "redirect"
      : message.includes("csv-") ? "csv-invalid" : error instanceof TypeError ? "network" : "response-invalid";
    bytes = null; rows = null;
  } finally { clearTimeout(timeout); }
  return { attempt: attemptNumber, retryCount: attemptNumber - 1, startedAt, endedAt: now(), durationMs: Math.round(performance.now() - startedMs),
    timeoutMs: plan.timeoutMs, timeout: errorCategory === "timeout", requestFingerprint: plan.requestFingerprint, requestUrl: plan.requestUrl,
    redirectChain, httpStatus, contentType, finalUrl, errorCategory, errorMessage, bytes, rows };
}

async function collect(runId) {
  assert(/^[a-z0-9][a-z0-9-]{2,63}$/u.test(runId), "run-id");
  assert(json("package.json").name === "solar-next-web", "wrong-workspace");
  const { source, review, sourceRef, reviewRef } = inputs();
  const artifactDir = `${OUTPUT_ROOT}/${runId}`;
  const ledgerPath = `${OUTPUT_ROOT}/ledger-${runId}.json`;
  assert(!fs.existsSync(path.join(ROOT, artifactDir)) && !fs.existsSync(path.join(ROOT, ledgerPath)), "output-exists");
  fs.mkdirSync(path.join(ROOT, artifactDir), { recursive: true });
  const startedAt = now();
  const records = [];
  for (const id of IDS) {
    const plan = planFor(id, source, review);
    const attempts = [];
    let artifact = null, parsedRows = [];
    for (let attemptNumber = 1; attemptNumber <= plan.maxAttempts; attemptNumber++) {
      const attempt = await oneAttempt(plan, attemptNumber);
      const { bytes, rows, ...telemetry } = attempt;
      attempts.push(telemetry);
      if (bytes && rows) {
        const relative = `${artifactDir}/${id}-${hash(bytes)}.csv`;
        fs.writeFileSync(path.join(ROOT, relative), bytes, { flag: "wx" });
        artifact = ref(relative);
        parsedRows = rows;
        break;
      }
      if (attemptNumber < plan.maxAttempts) await new Promise((resolve) => setTimeout(resolve, 500));
    }
    records.push({ id, plan, attempts, responseCaptured: artifact ? 1 : 0, artifact, parsedRows,
      status: artifact ? "structured-cross-id-candidate" : "capture-failed", componentIdentityConfirmed: false });
    process.stdout.write(`${id}: captured=${artifact ? 1 : 0} attempts=${attempts.length}\n`);
  }
  assert(ref(SOURCE).sha256 === sourceRef.sha256 && ref(REVIEW).sha256 === reviewRef.sha256, "inputs-changed-during-collection");
  const body = { schema: "mainline-a-stellar-tap-cross-id-capture-v646", runId, startedAt, endedAt: now(),
    sourceCandidatePack: sourceRef, priorReviewPacket: reviewRef,
    collector: { endpoint: ENDPOINT, method: "GET", format: "csv", fixture: false, timeoutMs: TIMEOUT_MS, maxAttempts: MAX_ATTEMPTS },
    counts: { total: 4, responseCaptured: records.filter((row) => row.responseCaptured === 1).length,
      failed: records.filter((row) => row.responseCaptured === 0).length }, records,
    semanticStatus: "candidate-only-unreviewed", boundary: BOUNDARY };
  const ledger = { ...body, ledgerDigest: digest(body) };
  fs.writeFileSync(path.join(ROOT, ledgerPath), JSON.stringify(ledger, null, 2) + "\n", { flag: "wx" });
  return { ledgerPath, sha256: ref(ledgerPath).sha256, counts: body.counts, status: body.semanticStatus };
}

function replay(ledgerPath, expectedSha256) {
  assert(/^docs\/release\/v607\/stellar-component-tap-v646\/ledger-[a-z0-9-]+\.json$/u.test(ledgerPath), "ledger-path");
  assert(/^[a-f0-9]{64}$/u.test(expectedSha256) && ref(ledgerPath).sha256 === expectedSha256, "ledger-sha");
  const ledger = json(ledgerPath);
  const { ledgerDigest, ...content } = ledger;
  assert(digest(content) === ledgerDigest && ledger.schema === "mainline-a-stellar-tap-cross-id-capture-v646", "ledger-digest-or-schema");
  const { source, review, sourceRef, reviewRef } = inputs();
  assert(JSON.stringify(ledger.sourceCandidatePack) === JSON.stringify(sourceRef) && JSON.stringify(ledger.priorReviewPacket) === JSON.stringify(reviewRef), "input-reference");
  assert(JSON.stringify(ledger.boundary) === JSON.stringify(BOUNDARY) && ledger.semanticStatus === "candidate-only-unreviewed", "boundary");
  assert(Array.isArray(ledger.records) && ledger.records.length === 4 && ledger.counts.total === 4, "record-count");
  let captured = 0;
  for (let index = 0; index < IDS.length; index++) {
    const row = ledger.records[index], plan = planFor(IDS[index], source, review);
    assert(row.id === IDS[index] && JSON.stringify(row.plan) === JSON.stringify(plan), `${row.id}:plan-drift`);
    assert(row.componentIdentityConfirmed === false && row.attempts.length >= 1 && row.attempts.length <= MAX_ATTEMPTS, `${row.id}:admission-or-attempts`);
    for (let i = 0; i < row.attempts.length; i++) {
      const attempt = row.attempts[i];
      assert(attempt.attempt === i + 1 && attempt.retryCount === i && attempt.timeoutMs === TIMEOUT_MS && attempt.requestFingerprint === plan.requestFingerprint, `${row.id}:attempt-sequence`);
      assert(Date.parse(attempt.endedAt) >= Date.parse(attempt.startedAt) && attempt.timeout === (attempt.errorCategory === "timeout"), `${row.id}:attempt-time`);
      assert(Array.isArray(attempt.redirectChain) && attempt.redirectChain.length <= 3, `${row.id}:redirect-chain`);
    }
    if (row.responseCaptured === 1) {
      captured++;
      assert(row.status === "structured-cross-id-candidate" && row.artifact && row.artifact.path.startsWith(`${OUTPUT_ROOT}/${ledger.runId}/`), `${row.id}:artifact-path`);
      assert(JSON.stringify(ref(row.artifact.path)) === JSON.stringify(row.artifact), `${row.id}:artifact-sha`);
      const parsed = parseCsv(read(row.artifact.path).toString("utf8"), plan.identifiers);
      assert(JSON.stringify(parsed) === JSON.stringify(row.parsedRows), `${row.id}:parsed-rows`);
      const final = row.attempts.at(-1);
      assert(final.httpStatus === 200 && /^text\/csv(?:;|$)/iu.test(final.contentType ?? "") && final.errorCategory === null, `${row.id}:capture-telemetry`);
    } else assert(row.artifact === null && row.parsedRows.length === 0 && row.status === "capture-failed", `${row.id}:failure-boundary`);
  }
  assert(captured === ledger.counts.responseCaptured && 4 - captured === ledger.counts.failed, "counts");
  return { schema: "mainline-a-stellar-tap-cross-id-replay-v646", status: "verified-candidate-only", ledger: ref(ledgerPath),
    counts: ledger.counts, rows: ledger.records.map((row) => ({ id: row.id, responseCaptured: row.responseCaptured,
      matchedIdentifiers: row.parsedRows.length, distinctSimbadObjects: new Set(row.parsedRows.map((item) => item.oidref)).size,
      status: row.status })), boundary: BOUNDARY, componentIdentityConfirmed: false };
}

async function main(argv) {
  if (argv.length === 2 && argv[0] === "--collect") return collect(argv[1]);
  if (argv.length === 4 && argv[0] === "--check" && argv[2] === "--expected-sha256") return replay(argv[1], argv[3]);
  throw new Error("Usage: node collect-and-replay.mjs --collect <run-id> | --check <ledger-path> --expected-sha256 <sha256>");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
}
