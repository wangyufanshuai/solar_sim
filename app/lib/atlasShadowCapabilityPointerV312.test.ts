import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV312 } from "./atlasShadowCapabilityPointerV312";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

describe("v312 local-shadow capability pointer", () => {
  it("promotes only corrected short geometry while keeping polarization, dense and product fail closed", () => {
    const path = resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v312.json");
    const pointer = JSON.parse(readFileSync(path, "utf8"));
    expect(isAtlasShadowCapabilityPointerV312(pointer)).toBe(true);
    const unsigned = { ...pointer };
    delete unsigned.pointerSha256;
    expect(pointer.pointerSha256).toBe(sha(unsigned));
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      capabilities: {
        v298r1: "quarantined-1-of-49-tolerance-ladder-degenerate",
        v312GeometryTolerance: "corrected-authority-qualified",
        v312Polarization: "requalification-pending",
        correctedDenseCampaign: "not-created",
        browserQualification: "not-run",
      },
    });
  });
});
