import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildPack, inspectHeroArt, loadHeroCatalog, loadProjection, readPack, run, verifyPack, writePack, HERO_PACKET_SHA256, OUTPUT_PATH } from "./build-mainline-a-beta-hero-art-evidence-pack-v615.mjs";

const root = process.cwd();

test("builds a deterministic 24-record art evidence pack with a 20/4 boundary", () => {
  const pack = buildPack({ root });
  assert.equal(pack.schema, "mainline-a-beta-hero-art-evidence-pack-v615");
  assert.deepEqual(pack.counts, { total: 24, runtimeBaseline: 20, candidateOnly: 4, artReady: 20, evidencePending: 4 });
  assert.equal(pack.heroCatalog.packetSha256, HERO_PACKET_SHA256);
  assert.equal(pack.presentationBoundary.runtimeWrites, false);
  assert.equal(pack.records.length, 24);
  assert.deepEqual(pack.records.filter((record) => record.status === "candidate-only").map((record) => record.id), ["acrux", "spica", "regulus", "polaris"]);
});

test("keeps current baseline visual models separate from pending source records", () => {
  const pack = buildPack({ root });
  const current = pack.records.find((record) => record.id === "vega");
  const pending = pack.records.find((record) => record.id === "spica");
  assert.equal(current?.artStatus, "runtime-baseline");
  assert.equal(current?.runtimeAdmission, "admitted");
  assert.equal(pending?.artStatus, "evidence-pending");
  assert.equal(pending?.runtimeAdmission, "candidate-only");
  assert.match(pending?.blockers.join(" ") ?? "", /component-identity-ambiguous/);
  assert.equal(pending?.visualProfile.textureMode, "parameterized-photosphere");
});

test("inspects presentation fields without treating them as observation textures", () => {
  const { heroes } = loadHeroCatalog(root);
  const { projection } = loadProjection(root);
  const hero = heroes.find((entry) => entry.id === "polaris");
  const row = projection.rows.find((entry) => entry.id === "polaris");
  const inspection = inspectHeroArt(hero, row, false);
  assert.equal(inspection.checks.presentationBoundary, true);
  assert.equal(inspection.checks.shader, true);
  assert.equal(inspection.checks.corona, true);
  assert.equal(inspection.checks.sourceReference, false);
  assert.ok(inspection.blockers.includes("runtime-allowlist-closed"));
});

test("fails closed when the hero packet seal or a visual field is tampered", () => {
  const pack = buildPack({ root });
  assert.throws(() => verifyPack({ ...pack, heroCatalog: { ...pack.heroCatalog, packetSha256: "f".repeat(64) } }, pack), /sealed input/);
  const changed = structuredClone(pack);
  changed.records[0].visualProfile.shaderProfile = "forged-profile";
  assert.throws(() => verifyPack(changed, pack), /sealed input/);
});

test("rejects opened admission or measurement writeback", () => {
  const pack = buildPack({ root });
  const runtimeForged = structuredClone(pack);
  runtimeForged.records[0].measurementAdmission = "admitted";
  assert.throws(() => verifyPack(runtimeForged, pack), /sealed input/);
  const writebackForged = structuredClone(pack);
  writebackForged.presentationBoundary.scienceWrites = true;
  assert.throws(() => verifyPack(writebackForged, pack), /sealed input/);
});

test("CLI generation and check mode remain deterministic", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-v615-"));
  fs.mkdirSync(path.join(tempRoot, "app/data"), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, "scripts"), { recursive: true });
  for (const relative of ["app/data/stellarHeroesV592.generated.ts", "app/data/mainlineABetaStellarProjectionV607.generated.ts", "scripts/project-mainline-a-beta-stellar.mjs"]) {
    const target = path.join(tempRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relative), target);
  }
  const first = writePack(tempRoot);
  assert.equal(first.total, 24);
  assert.deepEqual(run({ root: tempRoot, check: true }), { status: "verified", total: 24, runtimeBaseline: 20, candidateOnly: 4, output: OUTPUT_PATH });
  const changed = JSON.parse(fs.readFileSync(path.join(tempRoot, OUTPUT_PATH), "utf8"));
  changed.records.reverse();
  fs.writeFileSync(path.join(tempRoot, OUTPUT_PATH), JSON.stringify(changed));
  assert.throws(() => run({ root: tempRoot, check: true }), /sealed input/);
});

test("generated output carries all source boundary fields", () => {
  const pack = buildPack({ root });
  for (const record of pack.records) {
    assert.equal(record.source.presentationOnly, true);
    assert.equal(record.scientificPayloadWriteback, false);
    assert.equal(record.measurementAdmission, "not-admitted");
    assert.ok(Object.keys(record.checks).length >= 7);
  }
  assert.equal(readPack(root).schema, pack.schema);
});
