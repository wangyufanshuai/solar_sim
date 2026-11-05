import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV404 } from "./atlasShadowCapabilityPointerV404";

describe("v404 local-shadow pointer", () => {
  it("records bounded summary qualification without advancing heavy or dense gates", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v404.json", "utf8"));
    expect(parseAtlasShadowCapabilityPointerV404(pointer)).toBe(pointer);
    expect(pointer.capabilities).toMatchObject({
      v404BoundedSummary: "qualified-cycles-omitted-response-under-128-kib",
      v404BrowserSoak: "not-run",
      v404VisualMatrix: "not-run",
      v404RtxWebGpu: "not-run",
      v314CorrectedDense: "incomplete-0-of-49",
      denseAggregate: "unavailable",
    });
    expect(pointer).toMatchObject({ formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false });
  });
});
