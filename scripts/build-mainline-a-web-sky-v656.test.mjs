import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildWebSkyAtlasV656, inspectSourcePacksV656,
  renderWebSkyAtlasV656, SOURCE_FILES_V656,
} from "./build-mainline-a-web-sky-v656.mjs";

async function inputs() {
  const roster = JSON.parse(await readFile(SOURCE_FILES_V656.roster, "utf8"));
  const coverage = JSON.parse(await readFile(SOURCE_FILES_V656.coverage, "utf8"));
  const pins = Object.fromEntries(Object.entries(SOURCE_FILES_V656).map(([key, file]) =>
    [key, { path: file, bytes: 100, sha256: "a".repeat(64) }]));
  return { roster, coverage, pins };
}

test("source packs retain 24/20/4 stars and twelve signoff-pending constellation routes", async () => {
  const { roster, coverage, pins } = await inputs();
  const selected = inspectSourcePacksV656(roster, coverage);
  assert.equal(selected.stars.length, 24);
  assert.equal(selected.constellations.length, 12);
  const pack = buildWebSkyAtlasV656(roster, coverage, pins);
  assert.deepEqual(pack.counts, { stars: 24, runtimeExisting: 20,
    candidateHold: 4, componentConfirmed: 0,
    constellations: 12, constellationSignoff: 0 });
  assert.equal(pack.boundary.scientificPayloadWriteback, false);
  assert.deepEqual(pack.stars.filter((row) => !row.canFocusScene).map((row) => row.id),
    ["acrux", "spica", "regulus", "polaris"]);
  assert.ok(pack.constellations.every((row) => row.reviewState === "signoff-pending"
    && row.routeCatalogId === `constellation:${row.code}`));
});

test("forged runtime admission of a hold star fails closed", async () => {
  const { roster, coverage, pins } = await inputs();
  const forged = structuredClone(roster);
  const row = forged.records.find((item) => item.id === "acrux");
  row.phase = "runtime-existing";
  row.runtimeRoute = "existing-mainline-a-runtime";
  row.decision = "existing-reference";
  forged.counts.runtimeExisting += 1;
  forged.counts.candidateHold -= 1;
  assert.throws(() => buildWebSkyAtlasV656(forged, coverage, pins),
    /source-counts-promoted|stellar-identity-or-hold/);
});

test("component confirmation cannot enter a visual-only manifest", async () => {
  const { roster, coverage, pins } = await inputs();
  const forged = structuredClone(roster);
  forged.records.find((row) => row.id === "spica").componentReview.status = "confirmed";
  assert.throws(() => buildWebSkyAtlasV656(forged, coverage, pins),
    /hold-promoted:spica/);
});

test("scientific writeback and runtime mutations remain excluded", async () => {
  const { roster, coverage, pins } = await inputs();
  const writable = structuredClone(roster);
  writable.records[0].scientificPayloadWriteback = true;
  assert.throws(() => buildWebSkyAtlasV656(writable, coverage, pins),
    /stellar-source/);
  const runtime = structuredClone(roster);
  runtime.boundary.runtimeWrites = true;
  assert.throws(() => buildWebSkyAtlasV656(runtime, coverage, pins),
    /source-boundary-promoted/);
});

test("canonical route, signoff and source cannot be forged", async () => {
  const { roster, coverage, pins } = await inputs();
  const wrongRoute = structuredClone(coverage);
  wrongRoute.records.find((row) => row.kind === "constellation").route.route = "promoted";
  assert.throws(() => buildWebSkyAtlasV656(roster, wrongRoute, pins),
    /constellation-source/);
  const signed = structuredClone(coverage);
  signed.records.find((row) => row.kind === "constellation").status = "signed";
  assert.throws(() => buildWebSkyAtlasV656(roster, signed, pins),
    /constellation-source/);
  const noSource = structuredClone(coverage);
  noSource.records.find((row) => row.kind === "constellation").source.sourceUrl = "http://fixture.invalid";
  assert.throws(() => buildWebSkyAtlasV656(roster, noSource, pins),
    /constellation-source/);
});

test("duplicate star or constellation identities cannot imitate complete coverage", async () => {
  const { roster, coverage, pins } = await inputs();
  const duplicateStar = structuredClone(roster);
  duplicateStar.records[1].id = duplicateStar.records[0].id;
  assert.throws(() => buildWebSkyAtlasV656(duplicateStar, coverage, pins),
    /stellar-identity-or-hold/);
  const duplicateConstellation = structuredClone(coverage);
  const rows = duplicateConstellation.records.filter((row) => row.kind === "constellation");
  rows[1].id = rows[0].id;
  assert.throws(() => buildWebSkyAtlasV656(roster, duplicateConstellation, pins),
    /constellation-coverage/);
});

test("input pins reject fake or missing hash records", async () => {
  const { roster, coverage, pins } = await inputs();
  const forged = structuredClone(pins);
  forged.figures.sha256 = "not-a-hash";
  assert.throws(() => buildWebSkyAtlasV656(roster, coverage, forged),
    /source-pins/);
  delete forged.figures;
  assert.throws(() => buildWebSkyAtlasV656(roster, coverage, forged),
    /source-pins/);
});

test("saved manifest exactly replays from current source bytes", async () => {
  const result = await renderWebSkyAtlasV656();
  const saved = await readFile(result.output, "utf8");
  assert.equal(saved, result.text);
  assert.equal(result.pack.stars.length, 24);
  assert.equal(result.pack.constellations.length, 12);
  assert.ok(result.pack.stars.every((row) => row.scientificPayloadWriteback === false));
});
