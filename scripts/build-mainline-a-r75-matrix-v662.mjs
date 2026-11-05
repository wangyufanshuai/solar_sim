import { createHash } from "node:crypto";
import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import acceptanceModule from "../app/lib/mainlineAWebAcceptanceV662.ts";

const { assembleMainlineAWebAcceptanceV662 } =
  acceptanceModule.default ?? acceptanceModule;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INPUTS = Object.freeze({
  canonical: "app/data/mainlineACanonicalCoverageV622.generated.json",
  sky: "app/data/mainlineAWebSkyAtlasV656.generated.json",
  nebula: "app/data/mainlineANebulaR73CatalogV660.generated.json",
  alternatives: "app/data/mainlineANebulaR74AlternativesV661.generated.json",
});

export function sha256V662(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
export function safeWorkspacePathV662(relative) {
  if (typeof relative !== "string" || !relative
    || relative.includes("\\") || relative.includes("\0")
    || path.posix.isAbsolute(relative) || /^[a-zA-Z]:/.test(relative)) {
    throw new Error("r75-matrix:unsafe-path");
  }
  const parts = relative.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error("r75-matrix:unsafe-path-segment");
  }
  const absolute = path.resolve(ROOT, ...parts);
  if (!absolute.toLowerCase().startsWith(`${ROOT.toLowerCase()}${path.sep}`)) {
    throw new Error("r75-matrix:path-outside-workspace");
  }
  return absolute;
}
export async function pinFileV662(relative) {
  const absolute = safeWorkspacePathV662(relative);
  const stats = await lstat(absolute);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error(`r75-matrix:non-file:${relative}`);
  }
  const actual = await realpath(absolute);
  if (!actual.toLowerCase().startsWith(`${ROOT.toLowerCase()}${path.sep}`)) {
    throw new Error(`r75-matrix:real-path-outside:${relative}`);
  }
  const bytes = await readFile(absolute);
  return { path: relative, bytes: bytes.length, sha256: sha256V662(bytes) };
}
export async function readMatrixInputsV662() {
  const records = await Promise.all(Object.entries(INPUTS).map(
    async ([role, relative]) => {
      const bytes = await readFile(safeWorkspacePathV662(relative));
      const pin = { path: relative, bytes: bytes.length,
        sha256: sha256V662(bytes) };
      return { role, pin, data: JSON.parse(bytes.toString("utf8")) };
    }));
  const byRole = Object.fromEntries(records.map((record) =>
    [record.role, record.data]));
  const matrix = assembleMainlineAWebAcceptanceV662(byRole.canonical,
    byRole.sky, byRole.nebula, byRole.alternatives);
  if (matrix.status !== "valid" || matrix.rows.length !== 96) {
    throw new Error(`r75-matrix:invalid-data:${matrix.issues.join(",")}`);
  }
  return { inputs: records.map(({ role, pin }) => ({ role, ...pin })),
    packs: byRole, matrix };
}
function uniquePathsV662(packs, matrix) {
  const paths = new Set();
  for (const row of packs.canonical.records) {
    if (row.kind === "nebula") {
      if (!row.route.assetPath || !row.route.assetHash) {
        throw new Error(`r75-matrix:a-nebula-asset-missing:${row.id}`);
      }
      paths.add(row.route.assetPath);
    }
  }
  for (const row of packs.nebula.rows) {
    if (row.delivery) {
      paths.add(row.delivery.path);
      const source = row.rawEvidence.find((record) =>
        record.sha256 === row.sourceRawSha256);
      if (!source) throw new Error(`r75-matrix:raw-chain-missing:${row.id}`);
      paths.add(source.path);
    } else if (row.sourceRawSha256 !== null) {
      throw new Error(`r75-matrix:held-raw-claim:${row.id}`);
    }
  }
  for (const held of packs.alternatives.rows) {
    if (!matrix.rows.some((row) => row.group === "beta-nebula"
      && row.id === held.id && row.imageRoute === null)) {
      throw new Error(`r75-matrix:alternative-for-nonhold:${held.id}`);
    }
    for (const alternative of held.alternatives) {
      if (alternative.imageRequestExecuted !== false
        || alternative.imageResponseCaptured !== 0
        || !alternative.rawArtifact?.path) {
        throw new Error(`r75-matrix:held-image-claim:${held.id}`);
      }
      paths.add(alternative.rawArtifact.path);
    }
  }
  return [...paths].sort();
}
export async function buildMatrixSnapshotV662() {
  const before = await captureBuildInputs();
  const { inputs, packs, matrix } = await readMatrixInputsV662();
  const paths = uniquePathsV662(packs, matrix);
  const pins = await Promise.all(paths.map(pinFileV662));
  const expected = new Map();
  for (const row of packs.canonical.records) {
    if (row.kind === "nebula") expected.set(row.route.assetPath,
      row.route.assetHash);
  }
  for (const row of packs.nebula.rows) {
    if (!row.delivery) continue;
    expected.set(row.delivery.path, row.delivery.sha256);
    const raw = row.rawEvidence.find((record) =>
      record.sha256 === row.sourceRawSha256);
    expected.set(raw.path, row.sourceRawSha256);
  }
  for (const row of packs.alternatives.rows) {
    for (const alternative of row.alternatives) {
      expected.set(alternative.rawArtifact.path,
        alternative.rawArtifact.sha256);
    }
  }
  for (const pin of pins) {
    if (expected.get(pin.path) !== pin.sha256) {
      throw new Error(`r75-matrix:asset-sha-mismatch:${pin.path}`);
    }
  }
  const after = await captureBuildInputs();
  if (before.sha256 !== after.sha256) {
    throw new Error("r75-matrix:source-changed-during-pin");
  }
  const rows = matrix.rows.map((row) => ({ key: row.key, id: row.id,
    group: row.group, state: row.state, route: row.route,
    sourceUrl: row.sourceUrl, sourceSha256: row.sourceSha256,
    imageRoute: row.imageRoute, imageSha256: row.imageSha256,
    rights: row.rights, componentIdentity: row.componentIdentity,
    alternatives: row.alternatives }));
  const rowDigest = sha256V662(JSON.stringify(rows));
  return { schema: "mainline-a-r75-web-acceptance-matrix-v662",
    status: "verified-static-candidate-hold",
    generatedAt: new Date().toISOString(),
    repository: { root: ROOT.replaceAll("\\", "/"),
      branch: "codex/solar-sim-mainline-a",
      parentGitTouched: false },
    appSourceSha256: before.sha256,
    inputScope: before.scope,
    inputs, assetPins: pins, rows, rowDigest,
    counts: matrix.counts,
    boundary: matrix.boundary,
    evidenceClass: "static-local-file-replay",
    claims: { browserAccepted: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false,
      realUserValidation: false, publicWebReleaseApproved: false } };
}
export function parseRunIdV662(argv) {
  if (argv.length !== 2 || argv[0] !== "--run-id"
    || !/^20261013v662r75web0[1-9]$/.test(argv[1])) {
    throw new Error("r75-matrix:usage:--run-id 20261013v662r75webNN");
  }
  return argv[1];
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const runId = parseRunIdV662(process.argv.slice(2));
  const result = await buildMatrixSnapshotV662();
  const relative = `docs/release/v607/mainline-a-r75-v662-matrix-${runId}.json`;
  await writeFile(safeWorkspacePathV662(relative),
    `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: result.status,
    sourceSha256: result.appSourceSha256,
    rows: result.rows.length, assets: result.assetPins.length,
    output: relative }));
}
