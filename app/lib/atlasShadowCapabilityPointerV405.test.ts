import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV405 } from "./atlasShadowCapabilityPointerV405";

describe("v405 local-shadow pointer", () => {
  it("advances only the portable dossier and V13 static capability", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v405.json", "utf8"));
    expect(parseAtlasShadowCapabilityPointerV405(pointer)).toBe(pointer);
    expect(pointer.capabilities).toMatchObject({ v405PortableDossier: "qualified-4-nodes-3-edges-no-cycle-details", v405V13EvidenceObservatory: "static-qualified-local-shadow-manual-only", v405BrowserQualification: "not-run", v405VisualMatrix: "not-run", v405Soak: "not-run", v405RtxWebGpu: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" });
    expect(pointer).toMatchObject({ formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false });
  });
});
