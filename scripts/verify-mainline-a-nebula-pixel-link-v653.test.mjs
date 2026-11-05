import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  auditNebulaPixelLinksV653, compareDecodedPixelLinksV653,
  decodedPixelDigestV653, replayNebulaPixelAuditV653,
} from "./verify-mainline-a-nebula-pixel-link-v653.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const auditPath = "docs/release/v607/mainline-a-r66-nebula-pixel-link-audit-20261011-v653pixel01.json";
const saved = JSON.parse(await readFile(path.join(root, auditPath), "utf8"));
const clone = structuredClone;

test("all six captured official JPEGs and image-API originals decode identically", async () => {
  const fresh = await auditNebulaPixelLinksV653();
  assert.equal(fresh.status, "verified-six-decoded-pixel-links-candidate");
  assert.deepEqual(fresh.issues, []);
  assert.equal(fresh.counts.decodedPixelIdentical, 6);
  assert.equal(fresh.counts.rawByteIdentical, 1);
  assert.equal(fresh.counts.rawVariantsWithIdenticalPixels, 5);
  assert.equal(fresh.counts.rightsSigned, 0);
});

test("decoder version and one real pixel digest can be recomputed", async () => {
  assert.equal(saved.decoder.library, "sharp");
  assert.match(saved.decoder.sharpVersion, /^\d+\.\d+\.\d+$/);
  const actual = await decodedPixelDigestV653(saved.rows[0].officialRaw.path);
  assert.deepEqual(actual, saved.rows[0].officialPixels);
});

test("changing a pixel hash is rejected even when dimensions match", () => {
  const candidate = clone(saved.rows[0].candidatePixels);
  candidate.pixelSha256 = "a".repeat(64);
  const result = compareDecodedPixelLinksV653(saved.rows[0].officialPixels,
    candidate, false);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("decoded-pixels-differ"));
});

test("changing dimensions or channels is rejected", () => {
  const candidate = clone(saved.rows[0].candidatePixels);
  candidate.width += 1;
  assert.equal(compareDecodedPixelLinksV653(saved.rows[0].officialPixels,
    candidate, false).ok, false);
  candidate.width -= 1;
  candidate.channels += 1;
  assert.equal(compareDecodedPixelLinksV653(saved.rows[0].officialPixels,
    candidate, false).ok, false);
});

test("raw byte identity cannot coexist with different decoded pixels", () => {
  const candidate = clone(saved.rows[3].candidatePixels);
  candidate.pixelSha256 = "b".repeat(64);
  const result = compareDecodedPixelLinksV653(saved.rows[3].officialPixels,
    candidate, true);
  assert.ok(result.issues.includes("raw-identical-pixels-differ"));
});

test("saved pixel audit replays while keeping copyright and release blocked", async () => {
  const fresh = await auditNebulaPixelLinksV653();
  const result = replayNebulaPixelAuditV653(saved, fresh);
  assert.equal(result.decodedPixelIdentical, 6);
  assert.equal(result.copyrightApproval, false);
  assert.equal(result.publicWebRelease, "blocked");
});

test("forged rights signoff or pixel equivalence fails saved replay", async () => {
  const fresh = await auditNebulaPixelLinksV653();
  const rights = clone(saved);
  rights.claims.copyrightApproval = true;
  assert.throws(() => replayNebulaPixelAuditV653(rights, fresh),
    /saved-audit-replay-mismatch/);
  const pixels = clone(saved);
  pixels.rows[0].candidatePixels.pixelSha256 = "c".repeat(64);
  assert.throws(() => replayNebulaPixelAuditV653(pixels, fresh),
    /saved-audit-replay-mismatch/);
});

test("a forged decoder version cannot inherit the pixel audit", async () => {
  const fresh = await auditNebulaPixelLinksV653();
  const forged = clone(saved);
  forged.decoder.vipsVersion = "0.0.0";
  assert.throws(() => replayNebulaPixelAuditV653(forged, fresh),
    /saved-audit-replay-mismatch/);
});
