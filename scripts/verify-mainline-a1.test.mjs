import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const verifier = path.join(root, "scripts/verify-mainline-a1.mjs");
const docs = "docs/release/v607/";
const names = ["mainline-a-stage-a1-acceptance.json", "mainline-a-stage-a1-inventory.json", "mainline-a-coverage-matrix.json", "mainline-a-stage-a3-candidate-audit.json", "mainline-a-stage-a3-rights-review.json", "mainline-a-stage-a3-local-delivery.json", "mainline-a-stage-a3-image-acquisition.json"];
const readJson = (fixture, name) => JSON.parse(fs.readFileSync(path.join(fixture, docs, name), "utf8"));
const writeJson = (fixture, name, value) => fs.writeFileSync(path.join(fixture, docs, name), JSON.stringify(value));

function withDeliveryFixture(check) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a3-verify-"));
  try {
    fs.mkdirSync(path.join(fixture, docs), { recursive: true });
    for (const name of names) fs.copyFileSync(path.join(root, docs, name), path.join(fixture, docs, name));
    const acceptance = readJson(fixture, names[0]);
    acceptance.artifacts = names.map((name) => docs + name);
    acceptance.evidence.artifactAudit = { artifactCount: names.length, missing: 0 };
    writeJson(fixture, names[0], acceptance);
    for (const asset of readJson(fixture, "mainline-a-stage-a3-local-delivery.json").assets) {
      fs.mkdirSync(path.dirname(path.join(fixture, asset.localPath)), { recursive: true });
      fs.copyFileSync(path.join(root, asset.localPath), path.join(fixture, asset.localPath));
    }
    check(fixture);
  } finally {
    assert.equal(path.dirname(path.resolve(fixture)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(fixture).startsWith("mainline-a3-verify-"));
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

function verify(fixture) {
  const result = spawnSync(process.execPath, [verifier], { cwd: fixture, encoding: "utf8", timeout: 15_000 });
  assert.equal(result.error, undefined);
  return { status: result.status, output: JSON.parse(result.stdout) };
}

test("A3 verifier accepts the six cleared local assets and leaves historical evidence unchanged", () => withDeliveryFixture((fixture) => {
  const before = fs.readFileSync(path.join(fixture, docs, "mainline-a-stage-a3-image-acquisition.json"));
  const { status, output } = verify(fixture);
  assert.equal(status, 0);
  assert.equal(output.licensedLocalAssetCount, 6);
  assert.equal(output.verifiedLocalByteSize, 1_971_256);
  assert.deepEqual(fs.readFileSync(path.join(fixture, docs, "mainline-a-stage-a3-image-acquisition.json")), before);
}));

test("A3 verifier rejects a credited image whose per-image exception has not been cleared", () => withDeliveryFixture((fixture) => {
  const review = readJson(fixture, "mainline-a-stage-a3-rights-review.json");
  review.candidates[0].explicitException = "additional permission required";
  writeJson(fixture, "mainline-a-stage-a3-rights-review.json", review);
  const { status, output } = verify(fixture);
  assert.equal(status, 1);
  assert.ok(output.failures.includes("candidate audit lacks matching per-image license clearance"));
}));

test("A3 verifier rejects a changed JPEG despite unchanged size and license metadata", () => withDeliveryFixture((fixture) => {
  const asset = readJson(fixture, "mainline-a-stage-a3-local-delivery.json").assets[0];
  const filename = path.join(fixture, asset.localPath);
  const bytes = fs.readFileSync(filename);
  bytes[bytes.length - 1] ^= 1;
  fs.writeFileSync(filename, bytes);
  const { status, output } = verify(fixture);
  assert.equal(status, 1);
  assert.ok(output.failures.includes("candidate audit has an unverified local JPEG or mismatched delivery metadata"));
}));

test("A3 verifier rejects retroactive promotion of the historical in-memory acquisition", () => withDeliveryFixture((fixture) => {
  const acquisition = readJson(fixture, "mainline-a-stage-a3-image-acquisition.json");
  acquisition.localPayload.licensed = true;
  writeJson(fixture, "mainline-a-stage-a3-image-acquisition.json", acquisition);
  const { status, output } = verify(fixture);
  assert.equal(status, 1);
  assert.ok(output.failures.includes("historical acquisition receipt was improperly promoted"));
}));
