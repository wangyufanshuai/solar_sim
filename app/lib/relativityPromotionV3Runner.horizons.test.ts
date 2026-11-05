import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { V82_DE440_SYSTEM_MASS_KG_BY_ID } from "./atlasHorizonsCandidateLab";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";
import { runRelativityPromotionV3 } from "./relativityPromotionV3Runner";

describe("v137 ten-year DE440 relativity promotion evidence", () => {
  it("writes an independent fail-closed three-mode report", async () => {
    const dataset = loadHorizonsValidationDatasetFromJson(readFileSync(resolve(process.cwd(), "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json"), "utf8"));
    const report = await runRelativityPromotionV3({ dataset, massKgByBodyId: V82_DE440_SYSTEM_MASS_KG_BY_ID, dtDays: 0.125, convergenceDays: 365, reversalDays: 30 });
    const output = resolve(process.cwd(), "dist/science/relativity-promotion-v3-report.json");
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(report, null, 2));
    const tenYear = report.modes[2]?.checkpoints.find((checkpoint) => checkpoint.label === "+10y");
    expect(tenYear?.available).toBe(true);
    expect(Number.isFinite(tenYear?.rmsPositionKm)).toBe(true);
    expect(Number.isFinite(tenYear?.rmsVelocityMs)).toBe(true);
    expect(report.liveStateMutated).toBe(false);
    expect(["legacy-eih-1pn", "relativity-force-model-v2"]).toContain(report.promotion.defaultKernel);
  }, 180_000);
});

