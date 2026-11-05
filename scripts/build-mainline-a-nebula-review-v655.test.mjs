import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  bindReviewCandidatesV655, buildNebulaReviewV655,
  renderReviewDerivativeV655, reviewDerivativePathV655,
  V655_B1_AUDIT, V655_B2_AUDIT, V655_B1_BATCH,
  V655_B2_BATCH, V655_B1_OVERLAY, V655_B2_LINK_LEDGER,
  V655_B2_PAGE_LEDGER, V655_OUTPUT,
} from "./build-mainline-a-nebula-review-v655.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const paths = [V655_B1_AUDIT, V655_B2_AUDIT,
  V655_B1_BATCH, V655_B2_BATCH, V655_B1_OVERLAY,
  V655_B2_LINK_LEDGER, V655_B2_PAGE_LEDGER];
const load = async (relative) => JSON.parse(await readFile(
  path.join(ROOT, relative), "utf8"));
const inputs = async () => Promise.all(paths.map(load));
const clone = (value) => structuredClone(value);

test("B1+B2 audit pins bind exactly twelve candidate-only rows", async () => {
  const result = bindReviewCandidatesV655(...await inputs());
  assert.equal(result.ok, true);
  assert.equal(result.candidates.length, 12);
  assert.equal(result.candidates.filter((row) => row.batchId === "B1").length, 6);
  assert.equal(result.candidates.filter((row) => row.batchId === "B2").length, 6);
  assert.equal(result.candidates.filter((row) => row.rawByteIdentical).length, 1);
});

test("a forged B1 rights promotion invalidates cross-audit binding", async () => {
  const args = await inputs();
  args[2] = clone(args[2]);
  args[2].rows[0].rights.status = "approved";
  const result = bindReviewCandidatesV655(...args);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.startsWith("B1:heart-nebula")));
});

test("a changed B2 page credit or image hash cannot enter the review manifest", async () => {
  const args = await inputs();
  args[6] = clone(args[6]);
  args[6].rows[0].expectedCredit = "unknown";
  assert.equal(bindReviewCandidatesV655(...args).ok, false);
  const second = await inputs();
  second[1] = clone(second[1]);
  second[1].rows[0].candidateRaw.sha256 = "0".repeat(64);
  assert.equal(bindReviewCandidatesV655(...second).ok, false);
});

test("duplicate or missing IDs cannot masquerade as twelve distinct images", async () => {
  const args = await inputs();
  args[1] = clone(args[1]);
  args[1].rows[1].id = args[1].rows[0].id;
  const result = bindReviewCandidatesV655(...args);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("twelve-unique-candidates-missing"));
});

test("derived names are content addressed and reject path traversal", () => {
  const name = reviewDerivativePathV655("heart-nebula", "thumb",
    "a".repeat(64));
  assert.match(name, /^docs\/release\/v607\/nebula-review-derivatives\/v655\/heart-nebula-thumb-a{64}\.webp$/);
  assert.throws(() => reviewDerivativePathV655("../escape", "thumb",
    "a".repeat(64)));
  assert.throws(() => reviewDerivativePathV655("heart-nebula", "raw",
    "a".repeat(64)));
});

test("real candidate raw deterministically renders the retained review image", async () => {
  const pack = await load(V655_OUTPUT);
  const row = pack.rows[0];
  const raw = await readFile(path.join(ROOT, row.candidateRaw.path));
  assert.equal(sha(raw), row.candidateRaw.sha256);
  const thumb = await renderReviewDerivativeV655(raw, "thumb");
  const retained = await readFile(path.join(ROOT, row.preview.thumb.path));
  assert.equal(thumb.sha256, row.preview.thumb.sha256);
  assert.equal(sha(retained), thumb.sha256);
  assert.equal(thumb.width, row.preview.thumb.width);
  assert.equal(thumb.height, row.preview.thumb.height);
  assert.equal(pack.counts.rightsSigned, 0);
});

test("offline replay re-renders all twenty-four previews and checks all input audits", async () => {
  const result = await buildNebulaReviewV655({ check: true });
  assert.equal(result.status, "replayed-twelve-local-review-derivatives");
  assert.equal(result.counts.previewPairs, 12);
  assert.equal(result.counts.decodedPixelIdentical, 12);
  assert.equal(result.counts.rightsSigned, 0);
});
