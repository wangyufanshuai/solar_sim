import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV336 } from "./atlasShadowCapabilityPointerV336";

describe("v336 local-shadow capability pointer", () => {
  it("records state replay qualification without dense, browser or product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v336.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV336(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v336SceneRevision: "zero-increment",
        v336CameraLease: "identity-returned-to-baseline-idempotent",
        v336SingleCanvas: "static-main-scene-host-count-one-browser-pending",
        v314CorrectedDense: "incomplete-0-of-49",
        browserQualification: "not-run",
      },
    });
  });
});
