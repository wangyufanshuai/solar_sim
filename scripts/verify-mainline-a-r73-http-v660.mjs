import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = "app/data/mainlineANebulaR73CatalogV660.generated.json";
const SHA = /^[a-f0-9]{64}$/;

function fail(code, detail) {
  throw new Error(`r73-http-v660:${code}${detail === undefined ? "" : `:${JSON.stringify(detail)}`}`);
}
function check(value, code, detail) {
  if (!value) fail(code, detail);
}
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function port(value) {
  const number = Number(value);
  check(Number.isInteger(number) && number >= 1024 && number <= 65535,
    "port-invalid", value);
  return number;
}
function args(argv) {
  check(argv.length === 6 && argv[0] === "--run-id"
    && argv[2] === "--port" && argv[4] === "--disabled-port",
  "usage-invalid");
  const runId = argv[1];
  check(/^20261013v660r73web0[1-9]$/.test(runId),
    "run-id-invalid", runId);
  const enabledPort = port(argv[3]);
  const disabledPort = port(argv[5]);
  check(enabledPort !== disabledPort, "ports-not-independent");
  return { runId, enabledPort, disabledPort };
}

function paths(runId) {
  return {
    build: `docs/release/v607/mainline-a-r73-build-${runId}.json`,
    output: `docs/release/v607/mainline-a-r73-v660-http-${runId}.json`,
  };
}

export function verifyR73HttpBoundaryV660(catalog, observations,
  enabledOrigin, disabledOrigin) {
  const issues = [];
  if (catalog?.schema !== "mainline-a-r73-nebula-catalog-v660"
    || catalog.counts?.reviewImages !== 19
    || catalog.counts?.policyHolds !== 5
    || catalog.boundary?.scientificPayloadWriteback !== false
    || catalog.claims?.publicWebReleaseApproved !== false) {
    issues.push("catalog-boundary-invalid");
  }
  const rows = Array.isArray(observations?.images)
    ? observations.images : [];
  const expected = catalog?.rows?.filter((row) => row.delivery) ?? [];
  if (rows.length !== 19
    || new Set(rows.map((row) => row.id)).size !== 19
    || expected.some((row) => !rows.some((entry) =>
      entry.id === row.id && entry.status === 200
      && entry.sha256 === row.delivery.sha256
      && entry.bytes === row.delivery.bytes
      && entry.contentType === row.delivery.mimeType
      && entry.boundary === "candidate-hold"
      && entry.rights === "pending"
      && entry.scientificPayloadWriteback === "false"
      && entry.finalUrl === `${enabledOrigin}${row.delivery.route}`))) {
    issues.push("review-images-incomplete-or-incorrect");
  }
  const held = observations?.held ?? [];
  if (held.length !== 5
    || new Set(held.map((row) => row.id)).size !== 5
    || catalog.rows.filter((row) => row.imageState === "policy-hold")
      .some((row) => !held.some((entry) =>
        entry.id === row.id && entry.status === 404))) {
    issues.push("policy-holds-served-or-missing");
  }
  if (observations?.home?.status !== 200
    || observations?.health?.status !== 200
    || observations?.disabled?.status !== 404
    || observations?.disabled?.origin !== disabledOrigin
    || observations?.invalid?.status !== 404
    || observations?.foreignOrigin?.status !== 404) {
    issues.push("local-route-negative-check-invalid");
  }
  return { ok: issues.length === 0, issues };
}

async function get(url, init) {
  const response = await fetch(url, { cache: "no-store",
    redirect: "manual", signal: AbortSignal.timeout(20_000), ...init });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { response, bytes };
}

async function imageResponse(row, origin) {
  const { response, bytes } = await get(`${origin}${row.delivery.route}`);
  check(response.status === 200 && !response.redirected,
    "image-http-invalid", { id: row.id, status: response.status });
  const observed = {
    id: row.id, cohort: row.cohort,
    route: row.delivery.route, status: response.status,
    finalUrl: response.url, bytes: bytes.length,
    sha256: sha256(bytes),
    contentType: response.headers.get("content-type"),
    contentLength: Number(response.headers.get("content-length")),
    boundary: response.headers.get("x-mainline-a-review-only"),
    rights: response.headers.get("x-mainline-a-rights"),
    scientificPayloadWriteback: response.headers.get("x-scientific-payload-writeback"),
    artifactHeader: response.headers.get("x-artifact-sha256"),
    candidateRawHeader: response.headers.get("x-candidate-raw-sha256"),
    nasaIdHeader: response.headers.get("x-nasa-id"),
  };
  check(observed.finalUrl === `${origin}${row.delivery.route}`
    && observed.bytes === row.delivery.bytes
    && observed.sha256 === row.delivery.sha256
    && observed.contentLength === observed.bytes
    && observed.contentType === row.delivery.mimeType
    && observed.boundary === "candidate-hold"
    && observed.rights === "pending"
    && observed.scientificPayloadWriteback === "false"
    && observed.artifactHeader === observed.sha256,
  "image-content-or-boundary-invalid", row.id);
  if (row.cohort === "B1" || row.cohort === "B2") {
    check(observed.candidateRawHeader === row.rawEvidence.find((pin) =>
      pin.role === "candidate-raw")?.sha256,
    "candidate-raw-header-invalid", row.id);
  } else {
    check(observed.nasaIdHeader === row.nasaId,
      "nasa-id-header-invalid", row.id);
  }
  return observed;
}

export async function runR73HttpV660(config) {
  const { build: buildPath, output } = paths(config.runId);
  const [build, catalog] = await Promise.all([
    readFile(path.join(ROOT, buildPath), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, CATALOG), "utf8").then(JSON.parse),
  ]);
  const before = await captureBuildInputs();
  check(build.status === "passed" && build.sourceStable === true
    && SHA.test(build.inputAfterSha256)
    && build.inputAfterSha256 === before.sha256,
  "build-source-invalid");
  const enabled = `http://127.0.0.1:${config.enabledPort}`;
  const disabled = `http://127.0.0.1:${config.disabledPort}`;
  const home = await get(`${enabled}/`);
  const health = await get(`${enabled}/api/health`);
  const images = [];
  for (const row of catalog.rows.filter((entry) => entry.delivery)) {
    images.push(await imageResponse(row, enabled));
  }
  const held = [];
  for (const row of catalog.rows.filter((entry) => !entry.delivery)) {
    const result = await get(`${enabled}/api/atlas/mainline-a-r72-source/${row.id}`);
    held.push({ id: row.id, status: result.response.status,
      bytes: result.bytes.length });
  }
  const probe = catalog.rows[0].delivery.route;
  const disabledImage = await get(`${disabled}${probe}`);
  const invalid = await get(`${enabled}/api/atlas/mainline-a-r72-source/not-a-candidate`);
  const foreign = await get(`${enabled}${probe}`, {
    headers: { Origin: "https://example.invalid" },
  });
  const observations = {
    home: { status: home.response.status,
      bytes: home.bytes.length, sha256: sha256(home.bytes) },
    health: { status: health.response.status,
      bytes: health.bytes.length, sha256: sha256(health.bytes) },
    images, held,
    disabled: { status: disabledImage.response.status, origin: disabled },
    invalid: { status: invalid.response.status },
    foreignOrigin: { status: foreign.response.status },
  };
  const verified = verifyR73HttpBoundaryV660(catalog, observations,
    enabled, disabled);
  check(verified.ok, "http-matrix-invalid", verified.issues);
  const after = await captureBuildInputs();
  check(before.sha256 === after.sha256,
    "source-drift-during-http");
  const receipt = {
    schema: "mainline-a-r73-local-http-v660",
    status: "passed-current-source-local-production-build",
    buildReceipt: buildPath, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    sourceSha256: before.sha256,
    enabledOrigin: enabled, disabledOrigin: disabled,
    observations,
    totals: { images: images.length, held: held.length,
      imageShaMatches: images.filter((item) =>
        item.artifactHeader === item.sha256).length,
      heldImagesServed: held.filter((item) => item.status === 200).length },
    claims: { publicDeployment: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false,
      realUserValidation: false, physicalMobile: false,
      scientificPayloadWriteback: false },
  };
  await writeFile(path.join(ROOT, output),
    `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  return { status: receipt.status, totals: receipt.totals, output };
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR73HttpV660(
    args(process.argv.slice(2)))));
}
