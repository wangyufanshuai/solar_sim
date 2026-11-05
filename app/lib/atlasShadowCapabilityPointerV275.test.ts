import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseAtlasShadowCapabilityPointerV275 } from "./atlasShadowCapabilityPointerV275";

const pointer = () => ({
  version: "orbit-atlas-current-local-shadow-candidate-v275",
  generatedAt: "2026-07-20T00:00:00Z",
  formalProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  formalProductPointerAdvanced: false,
  promotionApplied: false,
  localShadowVisualDefaultApplied: false,
  capabilities: {
    v271: { state: "implemented-awaiting-browser-qualification", reason: "aggregate and API passed" },
    v272: { state: "incomplete", reason: "shards are downloading" },
    v273: { state: "implemented-awaiting-browser-qualification", reason: "focused tests passed" },
    v274: { state: "implemented-awaiting-browser-qualification", reason: "asset/browser qualification pending" },
    v275: { state: "incomplete", reason: "heavy gates pending" },
  },
  publicDeploymentBlocked: true,
});

describe("v275 capability pointer", () => {
  it("keeps independent phase states without moving v263", () => {
    expect(parseAtlasShadowCapabilityPointerV275(pointer()).capabilities.v271.state).toBe("implemented-awaiting-browser-qualification");
  });

  it("blocks a visual default before all v273-v275 gates qualify", () => {
    const value = pointer();
    value.localShadowVisualDefaultApplied = true;
    expect(() => parseAtlasShadowCapabilityPointerV275(value)).toThrow(/before v273-v275 qualification/);
  });

  it("accepts the generated capability-level pointer", () => {
    const generated = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v275.json", "utf8"));
    expect(parseAtlasShadowCapabilityPointerV275(generated).capabilities).toMatchObject({
      v271: { state: "implemented-awaiting-browser-qualification" },
      v272: { state: "implemented-awaiting-browser-qualification" },
      v273: { state: "implemented-awaiting-browser-qualification" },
      v274: { state: "implemented-awaiting-browser-qualification" },
      v275: { state: "blocked" },
    });
  });
});
