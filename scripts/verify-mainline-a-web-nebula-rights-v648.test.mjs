import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import pack from "../app/data/mainlineACanonicalCoverageV622.generated.json" with { type: "json" };
import * as assetsModule from "../app/data/mainlineANebulaVisualAssetsV607.all.generated.ts";
import * as metadataModule from "../app/data/mainlineAMetadataV607.ts";
import * as coverageModule from "../app/data/mainlineAAssetCoverageV607.ts";
import * as previewsModule from "../app/lib/mainlineAWebNebulaPreviewV648.ts";
import {
  auditWebNebulaRightsV648, canonicalSha256V648,
  inspectWebNebulaRightsInputsV648, replayWebNebulaRightsV648,
} from "./verify-mainline-a-web-nebula-rights-v648.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL: assets } = assetsModule.default ?? assetsModule;
const { MAINLINE_A3_NEBULAE: metadata } = metadataModule.default ?? metadataModule;
const { MAINLINE_A3_ASSET_COVERAGE_SUMMARY: coverage } = coverageModule.default ?? coverageModule;
const { MAINLINE_A_WEB_NEBULA_PREVIEWS_V648: previews } = previewsModule.default ?? previewsModule;
const creditsText = await readFile(path.join(ROOT, "public/textures/mainline-a/CREDITS.md"), "utf8");
const inputs = () => ({ pack, assets, previews, metadata, coverage, creditsText });
const changed = (key, value) => ({ ...inputs(), [key]: value });

test("immutable 12/12/12 digest and twelve local preview rows replay as candidate-only", () => {
  const report = inspectWebNebulaRightsInputsV648(inputs());
  assert.equal(report.status, "static-passed-local-candidate-rights-pending");
  assert.equal(report.canonicalManifestDigest, pack.manifestDigest);
  assert.equal(canonicalSha256V648(pack.records), pack.manifestDigest);
  assert.equal(report.counts.canonicalTotal, 36);
  assert.equal(report.counts.previewAvailable, 12);
  assert.equal(report.counts.currentRuntimeLicensed, 0);
  assert.equal(report.counts.humanRightsSigned, 0);
  assert.equal(report.counts.releaseAdmitted, 0);
  assert.equal(report.counts.legacySourceClearedLabels, 12);
  assert.ok(report.rows.every((row) => row.issues.length === 0
    && row.humanRightsSignoff === "pending"
    && row.releaseAdmission === "candidate-only"
    && row.scientificPayloadWriteback === false));
});

test("altered canonical rows, route bytes, source hash or boundary cannot pass", () => {
  const cases = [
    (copy) => { copy.records.find((row) => row.kind === "nebula").rowHash = "f".repeat(64); },
    (copy) => { copy.records.find((row) => row.kind === "nebula").sourceHash = "f".repeat(64); },
    (copy) => { copy.records.find((row) => row.kind === "nebula").route.assetHash = "f".repeat(64); },
    (copy) => { copy.records.find((row) => row.kind === "nebula").runtimeAdmission = "approved"; },
    (copy) => { copy.records.find((row) => row.kind === "nebula").status = "asset-delivered"; },
    (copy) => { copy.boundary.scientificPayloadWriteback = true; },
  ];
  for (const mutate of cases) {
    const copy = structuredClone(pack);
    mutate(copy);
    const report = inspectWebNebulaRightsInputsV648(changed("pack", copy));
    assert.equal(report.status, "failed");
    assert.ok(report.issues.length > 0);
  }
});

test("license labels cannot forge human signoff or current runtime approval", () => {
  const runtime = structuredClone(metadata);
  runtime[0].presentation.rightsStatus = "cleared";
  assert.ok(inspectWebNebulaRightsInputsV648(changed("metadata", runtime))
    .issues.some((issue) => issue.includes("runtime-rights-state-invalid")));
  const licensed = structuredClone(metadata);
  licensed[0].presentation.assetStatus = "licensed";
  const report = inspectWebNebulaRightsInputsV648(changed("metadata", licensed));
  assert.equal(report.counts.currentRuntimeLicensed, 1);
  assert.equal(report.status, "failed");
  const book = structuredClone(previews);
  book.rows[0].humanRightsSignoff = "signed";
  assert.ok(inspectWebNebulaRightsInputsV648(changed("previews", book))
    .issues.some((issue) => issue.includes("preview-admission-invalid")));
  const promoted = structuredClone(previews);
  promoted.rows[0].releaseAdmission = "approved";
  assert.equal(inspectWebNebulaRightsInputsV648(changed("previews", promoted)).status, "failed");
  const coveragePromoted = { ...coverage, licensed: 12, humanRightsSigned: 12 };
  assert.ok(inspectWebNebulaRightsInputsV648(changed("coverage", coveragePromoted))
    .issues.includes("runtime-coverage-invalid"));
});

test("swapped local asset identity, source credit or preview hash fails closed", () => {
  const modifiedAssets = [
    (copy) => { copy[0].sha256 = "f".repeat(64); },
    (copy) => { copy[0].credit = "anonymous"; },
    (copy) => { copy[0].sourcePage = "https://example.org/fixture"; },
    (copy) => { copy[0].imageId = "different-image"; },
    (copy) => { copy[0].objectId = "different-object"; },
    (copy) => { copy[0].localPath = "public/textures/mainline-a/../../wrong.jpg"; },
  ];
  for (const mutate of modifiedAssets) {
    const copy = structuredClone(assets);
    mutate(copy);
    const report = inspectWebNebulaRightsInputsV648(changed("assets", copy));
    assert.equal(report.status, "failed");
    assert.ok(report.issues.length > 0);
  }
  const swappedPreview = structuredClone(previews);
  swappedPreview.rows[0].localSha256 = previews.rows[1].localSha256;
  assert.equal(inspectWebNebulaRightsInputsV648(changed("previews", swappedPreview)).status, "failed");
});

test("missing signed-pending disclosure, duplicate credit or fake credit cannot pass", () => {
  const absentNotice = creditsText.replace("individual human rights signoff is pending for all twelve", "all cleared");
  assert.ok(inspectWebNebulaRightsInputsV648(changed("creditsText", absentNotice))
    .issues.includes("credits-signoff-disclosure-invalid"));
  const duplicate = `${creditsText}\n- [fake](https://example.org/fixture) — fake\n`;
  assert.ok(inspectWebNebulaRightsInputsV648(changed("creditsText", duplicate))
    .issues.includes("credits-inventory-invalid"));
  const wrongCredit = creditsText.replace(assets[0].credit, "anonymous");
  assert.ok(inspectWebNebulaRightsInputsV648(changed("creditsText", wrongCredit))
    .issues.some((issue) => issue.includes("credit-entry-missing")));
});

test("local file bytes and JPEG envelope are recomputed, while injected fixtures are not release evidence", async () => {
  const source = { sha256: "a".repeat(64) };
  const local = await auditWebNebulaRightsV648({ source });
  assert.equal(local.evidenceClass, "injected-test-input");
  assert.equal(local.status, "passed-local-candidate-rights-pending");
  assert.equal(local.rows.filter((row) => row.localByteMatch).length, 12);
  await assert.rejects(replayWebNebulaRightsV648(local), /saved-report-not-current-local-evidence/);
  const corrupted = await auditWebNebulaRightsV648({
    source,
    readLocal: async (absolute) => {
      const bytes = await readFile(absolute);
      if (absolute.endsWith(`${assets[0].imageId}.jpg`)) {
        const changedBytes = Buffer.from(bytes);
        changedBytes[32] ^= 1;
        return changedBytes;
      }
      return bytes;
    },
  });
  assert.equal(corrupted.evidenceClass, "injected-test-input");
  assert.equal(corrupted.status, "failed");
  assert.equal(corrupted.rows.filter((row) => row.localByteMatch).length, 11);
  assert.ok(corrupted.issues.some((issue) => issue.includes("local-byte-or-hash-mismatch")));
});

test("saved local report replays only against the same current source, rows and claims", async () => {
  const actual = await auditWebNebulaRightsV648();
  assert.equal(actual.evidenceClass, "local-static-byte-verification");
  assert.equal(actual.status, "passed-local-candidate-rights-pending");
  const replay = await replayWebNebulaRightsV648(actual);
  assert.equal(replay.status, "verified-local-candidate-rights-pending");
  assert.equal(replay.matchedImages, 12);
  assert.equal(replay.humanRightsSigned, 0);
  const stale = { ...actual, sourceSha256: "f".repeat(64) };
  await assert.rejects(replayWebNebulaRightsV648(stale), /replay-mismatch/);
  const forged = structuredClone(actual);
  forged.rows[0].humanRightsSignoff = "signed";
  await assert.rejects(replayWebNebulaRightsV648(forged), /replay-mismatch/);
});
