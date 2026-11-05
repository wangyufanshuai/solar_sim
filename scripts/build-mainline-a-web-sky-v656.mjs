import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "app/data/mainlineAWebSkyAtlasV656.generated.json";
export const SOURCE_FILES_V656 = Object.freeze({
  roster: "app/data/mainlineABetaStellarRosterV641.generated.json",
  coverage: "app/data/mainlineACanonicalCoverageV622.generated.json",
  heroes: "app/data/stellarHeroesV592.generated.ts",
  figures: "app/data/mainlineAConstellationFiguresV607.ts",
});
const PENDING = ["acrux", "spica", "regulus", "polaris"];
const SHA = /^[a-f0-9]{64}$/;
const fail = (code) => { throw new Error(`web-sky-v656:${code}`); };
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const distinct = (values) => new Set(values).size === values.length;
const exact = (actual, expected) => actual.length === expected.length
  && expected.every((value) => actual.includes(value));

export function inspectSourcePacksV656(roster, coverage) {
  if (roster?.schema !== "mainline-a-beta-stellar-roster-v641"
    || coverage?.schema !== "mainline-a-canonical-coverage-v622") fail("source-schema");
  if (!Array.isArray(roster.records) || roster.records.length !== 24
    || !Array.isArray(coverage.records) || coverage.records.length !== 36) fail("source-count");
  if (roster.counts.total !== 24 || roster.counts.runtimeExisting !== 20
    || roster.counts.candidateHold !== 4 || roster.counts.componentConfirmed !== 0
    || coverage.counts.total !== 36 || coverage.counts.stars !== 12
    || coverage.counts.nebulae !== 12 || coverage.counts.constellations !== 12
    || coverage.counts.signoffPending !== 12) fail("source-counts-promoted");
  const boundary = roster.boundary;
  const other = coverage.boundary;
  if (boundary.candidateOnly !== true || boundary.hold !== true
    || boundary.notAdmitted !== true || boundary.runtimeWrites !== false
    || boundary.measurementWrites !== false
    || boundary.scientificPayloadWriteback !== false
    || boundary.snapshotMutation !== false
    || other.candidateOnly !== true || other.hold !== true
    || other.notAdmitted !== true || other.scientificPayloadWriteback !== false
    || other.runtimeWrites !== false || other.measurementWrites !== false) {
    fail("source-boundary-promoted");
  }
  if (!distinct(roster.records.map((row) => row.id))
    || !exact(roster.records.filter((row) => row.phase === "candidate-hold")
      .map((row) => row.id), PENDING)) fail("stellar-identity-or-hold");
  for (const row of roster.records) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)
      || !row.displayName || !SHA.test(row.fingerprint ?? "")
      || !SHA.test(row.sourceSnapshotSha256 ?? "")
      || !Array.isArray(row.sourceRefs) || !row.sourceRefs.length
      || row.sourceRefs.some((ref) => !/^https:\/\//.test(ref.url))
      || row.runtimeAdmission !== "candidate-only"
      || row.measurementAdmission !== "not-admitted"
      || row.scientificPayloadWriteback !== false) fail(`stellar-source:${row.id}`);
    if (row.phase === "candidate-hold") {
      if (row.runtimeRoute !== "candidate-review-only"
        || row.decision !== "hold"
        || row.componentReview?.status === "confirmed"
        || !row.componentReview?.reason) fail(`hold-promoted:${row.id}`);
    } else if (row.phase !== "runtime-existing"
      || row.runtimeRoute !== "existing-mainline-a-runtime"
      || row.decision !== "existing-reference") fail(`runtime-route:${row.id}`);
  }
  const constellations = coverage.records.filter((row) => row.kind === "constellation");
  if (constellations.length !== 12 || !distinct(constellations.map((row) => row.id))) {
    fail("constellation-coverage");
  }
  for (const row of constellations) {
    if (!/^[A-Z][A-Za-z]{2}$/.test(row.id) || !row.displayName
      || row.route?.assetId !== row.id
      || row.route.route !== "mainline-a-constellation-lines"
      || row.status !== "signoff-pending"
      || !/^https:\/\//.test(row.source?.sourceUrl ?? "")
      || !row.source?.credit || !SHA.test(row.rowHash ?? "")
      || row.candidateOnly !== true
      || row.runtimeAdmission !== "candidate-only"
      || row.measurementAdmission !== "not-admitted"
      || row.scientificPayloadWriteback !== false) {
      fail(`constellation-source:${row.id}`);
    }
  }
  return { stars: roster.records, constellations };
}

export function buildWebSkyAtlasV656(roster, coverage, sourcePins) {
  const { stars, constellations } = inspectSourcePacksV656(roster, coverage);
  if (Object.keys(sourcePins).length !== Object.keys(SOURCE_FILES_V656).length
    || Object.entries(SOURCE_FILES_V656).some(([key, file]) =>
      sourcePins[key]?.path !== file || !SHA.test(sourcePins[key]?.sha256 ?? "")
      || !Number.isInteger(sourcePins[key]?.bytes) || sourcePins[key].bytes < 100)) {
    fail("source-pins");
  }
  const starRows = stars.map((row) => {
    const hold = row.phase === "candidate-hold";
    const sourcePage = row.sourceRefs.find((ref) => ref.role === "object-page")
      ?? row.sourceRefs[0];
    return {
      id: row.id,
      displayName: row.displayName,
      phase: row.phase,
      canFocusScene: !hold,
      focusCatalogId: hold ? null : `stellar-hero:${row.id}`,
      visualState: hold ? "identity-hold-placeholder" : "existing-parametric-photosphere",
      componentReview: row.componentReview.status,
      componentReason: hold ? row.componentReview.reason : null,
      sourcePageUrl: sourcePage.url,
      sourceClass: row.sourceClass,
      rightsStatus: row.rightsStatus,
      sourceSnapshotSha256: row.sourceSnapshotSha256,
      sourceFingerprint: row.fingerprint,
      candidateOnly: true,
      notAdmitted: true,
      scientificPayloadWriteback: false,
    };
  });
  const constellationRows = constellations.map((row) => ({
    code: row.id,
    displayName: row.displayName,
    routeCatalogId: `constellation:${row.id}`,
    reviewState: "signoff-pending",
    sourcePageUrl: row.source.sourceUrl,
    sourceCredit: row.source.credit,
    sourceHash: row.sourceHash,
    coverageRowHash: row.rowHash,
    candidateOnly: true,
    notAdmitted: true,
    scientificPayloadWriteback: false,
  }));
  return {
    schema: "mainline-a-web-sky-atlas-v656",
    evidenceClass: "candidate-web-navigation-only",
    generatedFrom: sourcePins,
    counts: {
      stars: starRows.length,
      runtimeExisting: starRows.filter((row) => row.canFocusScene).length,
      candidateHold: starRows.filter((row) => !row.canFocusScene).length,
      componentConfirmed: 0,
      constellations: constellationRows.length,
      constellationSignoff: 0,
    },
    boundary: {
      candidateOnly: true,
      hold: true,
      notAdmitted: true,
      scientificPayloadWriteback: false,
      runtimeMutation: false,
      measurementMutation: false,
      publicReleaseApproved: false,
    },
    stars: starRows,
    constellations: constellationRows,
  };
}

export async function renderWebSkyAtlasV656(root = ROOT) {
  const entries = await Promise.all(Object.entries(SOURCE_FILES_V656).map(async ([key, file]) => {
    const bytes = await readFile(path.join(root, file));
    return [key, { path: file, bytes: bytes.byteLength, sha256: sha256(bytes), data: bytes }];
  }));
  const inputs = Object.fromEntries(entries);
  const roster = JSON.parse(inputs.roster.data.toString("utf8"));
  const coverage = JSON.parse(inputs.coverage.data.toString("utf8"));
  const pins = Object.fromEntries(Object.entries(inputs).map(([key, input]) =>
    [key, { path: input.path, bytes: input.bytes, sha256: input.sha256 }]));
  const pack = buildWebSkyAtlasV656(roster, coverage, pins);
  return { pack, text: `${JSON.stringify(pack, null, 2)}\n`,
    output: path.join(root, OUTPUT) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { pack, text, output } = await renderWebSkyAtlasV656();
  if (process.argv.includes("--check")) {
    const existing = await readFile(output, "utf8");
    if (existing !== text) fail("generated-manifest-drift");
  } else {
    await writeFile(output, text, "utf8");
  }
  console.log(JSON.stringify({ status: process.argv.includes("--check")
    ? "replayed-web-sky-manifest" : "generated-web-sky-manifest",
  output: OUTPUT, sha256: sha256(Buffer.from(text)), counts: pack.counts,
  boundary: pack.boundary }, null, 2));
}
