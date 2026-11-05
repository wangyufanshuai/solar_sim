import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import {
  buildMainlineAR65LongRunReportV643,
  createMainlineAR65LongRunPendingV643,
  runMainlineAR65LongRunBuilderV643,
} from "./build-mainline-a-r65-longrun-v643";

describe("R65 V643 builder", () => {
  it("builds a pending report without declaring performance qualification", () => {
    const receipt = createMainlineAR65LongRunPendingV643(process.cwd());
    const report = buildMainlineAR65LongRunReportV643(receipt, process.cwd());
    assert.equal(report.schema, "mainline-a-r65-longrun-builder-v643");
    assert.equal(report.verification.ok, false);
    assert.equal(report.inputVerification.ok, false);
    assert.equal(report.verification.status, "pending");
    assert.equal(report.classification.static, "pending");
    assert.equal(report.classification.browser, "not-run");
    assert.equal(report.classification.performance, "pending");
    assert.equal(report.claims.productionPerformance, false);
    assert.equal(report.claims.realUserValidation, false);
    assert.equal(report.boundary.scientificPayloadWriteback, false);
    assert.equal(report.sourceSha256, createHash("sha256").update(JSON.stringify(receipt)).digest("hex"));
    assert.match(report.sourceSha256, /^[a-f0-9]{64}$/);
  });

  it("does not heal a changed raw digest by finalizing the export", () => {
    const receipt = createMainlineAR65LongRunPendingV643(process.cwd());
    const changed = { ...receipt, staticEvidence: { ...receipt.staticEvidence, digest: "00000000" } };
    const report = buildMainlineAR65LongRunReportV643(changed, process.cwd());
    assert.ok(report.inputVerification.issues.includes("receipt:static-digest"));
    assert.equal(report.claims.qualified, false);
  });

  it("keeps output paths scoped to next-web", () => {
    const receipt = createMainlineAR65LongRunPendingV643(process.cwd());
    const report = buildMainlineAR65LongRunReportV643(
      receipt,
      process.cwd(),
      "app/data/mainlineAR65LongRunV643.pending.generated.json",
      "docs/release/v607/mainline-a-r65-longrun-v643.json",
      "docs/release/v607/mainline-a-r65-longrun-replay-v643.json",
    );
    assert.equal(report.input.startsWith("app/"), true);
    assert.equal(report.output.startsWith("docs/release/v607/"), true);
    assert.equal(report.replay.startsWith("docs/release/v607/"), true);
  });

  it("refuses a parent repository output path before writing", () => {
    const receipt = createMainlineAR65LongRunPendingV643(process.cwd());
    assert.throws(() => buildMainlineAR65LongRunReportV643(
      receipt, process.cwd(), "app/data/mainlineAR65LongRunV643.pending.generated.json",
      "../outside-r65-output.json", "docs/release/v607/mainline-a-r65-longrun-replay-v643.json",
    ), /evidence-path-outside-workspace/);
  });

  it("refuses to overwrite an existing workspace file", async () => {
    const file = path.join(process.cwd(), "scripts", "build-mainline-a-r65-longrun-v643.ts");
    const before = await readFile(file);
    await assert.rejects(() => runMainlineAR65LongRunBuilderV643([
      "--init", "--input", "scripts/build-mainline-a-r65-longrun-v643.ts",
      "--output", "docs/release/v607/unused-r65-output.json",
      "--replay", "docs/release/v607/unused-r65-replay.json",
    ]), /EEXIST/);
    const after = await readFile(file);
    assert.deepEqual(after, before);
  });
});
