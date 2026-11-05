import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV313 } from "./atlasShadowCapabilityPointerV313";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonical(entry)]));
}
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
describe("v313 capability pointer", () => {
  it("qualifies the full short authority while keeping corrected dense unavailable", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v313.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV313(pointer)).toBe(true);
    const unsigned = { ...pointer }; delete unsigned.pointerSha256;
    expect(pointer.pointerSha256).toBe(sha(unsigned));
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { fullKerrShortAuthority: "qualified-v312-v313-envelope", correctedDenseCampaign: "not-created", denseAggregate: "unavailable", browserQualification: "not-run" } });
  });
});
