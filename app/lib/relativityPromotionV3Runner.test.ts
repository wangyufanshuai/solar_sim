import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { V82_DE440_SYSTEM_MASS_KG_BY_ID } from "./atlasHorizonsCandidateLab";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";
import { runRelativityPromotionV3 } from "./relativityPromotionV3Runner";

describe("v137 independent relativity promotion runner", () => {
  it("runs three isolated modes with convergence and reversal evidence", async () => {
    const dataset = loadHorizonsValidationDatasetFromJson(readFileSync(resolve(process.cwd(), "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json"), "utf8"));
    const report = await runRelativityPromotionV3({ dataset, massKgByBodyId: V82_DE440_SYSTEM_MASS_KG_BY_ID, dtDays: 0.25, maxDays: 30, convergenceDays: 10, reversalDays: 2 });
    expect(report.modes.map((mode) => mode.mode)).toEqual(["newton", "legacy-eih-1pn", "eih-1pn-2pn-lt"]);
    expect(report.modes.every((mode) => Number.isFinite(mode.rmsPositionKm))).toBe(true);
    expect(report.liveStateMutated).toBe(false);
    expect(report.promotion.defaultKernel).toBe("legacy-eih-1pn");
    expect(report.convergence.positionRmsKm).toBeGreaterThanOrEqual(0);
    expect(report.timeReversal.positionRmsM).toBeGreaterThanOrEqual(0);
  }, 120_000);
});

