import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313, createKerrPolarizationRequalificationViewV313, parseKerrPolarizationRequalificationV313, parseKerrPolarizationRequalificationViewV313 } from "./kerrAuthorityV313";

const path = resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json");
describe("v313 v312-locked polarization authority", () => {
  it("qualifies all disk rays against independent WP and KS transport", () => {
    const bytes = readFileSync(path);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313);
    const authority = parseKerrPolarizationRequalificationV313(JSON.parse(bytes.toString("utf8")));
    expect(authority.applicableExecutionCount).toBe(16);
    expect(authority.captureEscapeNotApplicableCount).toBe(96);
    expect(authority.thresholds.maxReleaseEvpaDifferenceDeg).toBeLessThan(0.5);
    expect(authority.thresholds.maxInternalEvpaDifferenceDeg).toBeLessThan(0.1);
    expect(authority.release).toMatchObject({ formalProductPointer: "v263", correctedDenseCampaignCreated: false, correctedDenseShardExecuted: false });
  });
  it("exports a bounded view without transport payload arrays", () => {
    const view = parseKerrPolarizationRequalificationViewV313(createKerrPolarizationRequalificationViewV313(JSON.parse(readFileSync(path, "utf8"))));
    expect(view.counts).toMatchObject({ applicableExecutionCount: 16, captureEscapeNotApplicableCount: 96, uniqueDiskRayCount: 4 });
    expect(JSON.stringify(view)).not.toContain("payloads");
  });
});
