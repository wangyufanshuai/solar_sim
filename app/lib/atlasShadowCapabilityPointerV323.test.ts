import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV323 } from "./atlasShadowCapabilityPointerV323";

describe("v323 local-shadow capability pointer", () => {
  it("records sanitized JSON/CSV provenance without product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v323.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV323(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v323ProvenanceExport: "json-csv-read-only-no-ray-buffer",
        v323ProfileAB: "v5-v6-recorded-manual-local-shadow-only",
        v323ObjectUrlLifecycle: "tracked-idempotent",
        v323BrowserGate: "authored-not-run",
      },
    });
  });
});
