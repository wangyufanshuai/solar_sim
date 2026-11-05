import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV380 } from "./atlasShadowCapabilityPointerV380";
describe("v380 pointer", () => {
  it("records twelve fail-closed fixtures without granting measured authority", () => {
    const pointer = parseAtlasShadowCapabilityPointerV380(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v380.json"), "utf8")));
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v379SchemaContracts: "qualified-7-of-7", v379BoundedAuthorityReads: "qualified-8-of-8-v375-inputs", v379MeasuredInputs: "missing-0-of-7-present", v380AdversarialCampaign: "qualified-12-of-12-fail-closed", v380DeterministicReplay: "qualified-identical-a-b", v380PromotionBoundary: "fixture-only-zero-authority-zero-observed-counts", v380RuntimeConsumer: "v11-fault-injection-oscilloscope-wired", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", browserQualification: "not-run" } });
    const evidence = JSON.parse(readFileSync(resolve(process.cwd(), pointer.evidence.path), "utf8")) as { sourceManifest: { path: string; sha256: string }[] };
    for (const entry of evidence.sourceManifest) expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), entry.path))).digest("hex"), entry.path).toBe(entry.sha256);
  });
});
