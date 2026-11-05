import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV368 } from "./atlasShadowCapabilityPointerV368";

describe("v368 capability pointer", () => {
  it("keeps measured response unavailable and synthetic v332 separate", () => {
    const pointer = parseAtlasShadowCapabilityPointerV368(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v368.json"), "utf8")));
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v368MeasuredResponseGate: "implemented-manifest-file-canonical-sha-authority-locked", v368MeasuredResponse: "unavailable-v367-authority-artifacts-missing", v368SyntheticBoundary: "v332-separate-qualified-fixture-never-measured-fallback", v314CorrectedDense: "incomplete-0-of-49", browserQualification: "not-run" } });
    const evidence = JSON.parse(readFileSync(resolve(process.cwd(), pointer.evidence.path), "utf8")) as { sourceManifest: { path: string; sha256: string }[] };
    for (const entry of evidence.sourceManifest) expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), entry.path))).digest("hex"), entry.path).toBe(entry.sha256);
  });
});
