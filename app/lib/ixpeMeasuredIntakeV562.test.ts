import { describe, expect, it } from "vitest";
import { canonicalIxpeMeasuredIntakeV562, parseIxpeMeasuredIntakeApiV562, parseIxpeMeasuredIntakeV562 } from "./ixpeMeasuredIntakeV562";
import { readFileSync } from "node:fs";

describe("IXPE measured intake v562", () => {
  it("parses deterministic blocked negative evidence", () => {
    const artifact = JSON.parse(readFileSync("dist/science/ixpe-measured-intake-v562/intake.json", "utf8"));
    const parsed = parseIxpeMeasuredIntakeV562(artifact);
    expect(parsed.target).toBe("Cyg X-1");
    expect(parsed.inspect.missingFileIds).toHaveLength(12);
    expect(parsed.qualification.measuredAuthorityGranted).toBe(false);
    expect(canonicalIxpeMeasuredIntakeV562(parsed)).toContain("ixpe-measured-intake-v562");
  });

  it("rejects authority promotion or synthetic payload mutation", () => {
    const artifact = JSON.parse(readFileSync("dist/science/ixpe-measured-intake-v562/intake.json", "utf8"));
    artifact.qualification.measuredAuthorityGranted = true;
    expect(() => parseIxpeMeasuredIntakeV562(artifact)).toThrow();
  });

  it("keeps lite and standalone boundaries fail-closed", () => {
    expect(parseIxpeMeasuredIntakeApiV562({ version: "v1-orbit-atlas-ixpe-measured-intake-api-v562", available: false, reason: "lite-boundary", summary: null }).available).toBe(false);
    expect(() => parseIxpeMeasuredIntakeApiV562({ version: "v1-orbit-atlas-ixpe-measured-intake-api-v562", available: true, reason: "ready", summary: null })).toThrow();
  });
});
