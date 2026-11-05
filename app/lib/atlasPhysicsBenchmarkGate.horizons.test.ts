import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAtlasPhysicsBenchmarkGateSummary,
} from "./atlasPhysicsBenchmarkGate";
import { V82_DE440_SYSTEM_MASS_KG_BY_ID } from "./atlasHorizonsCandidateLab";
import {
  HORIZONS_VALIDATION_DT_DAYS,
  runHorizonsValidationDataset,
} from "./horizonsValidationRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v75 ten-year Horizons release gate", () => {
  it("runs the v89 migrated default strict gate through all future checkpoints", async () => {
    const dataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(
          process.cwd(),
          "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json",
        ),
        "utf8",
      ),
    );
    const run = await runHorizonsValidationDataset(dataset, {
      dtDays: 0.125,
      eps2Meters: 0,
      massKgByBodyId: V82_DE440_SYSTEM_MASS_KG_BY_ID,
    });
    const summary = createAtlasPhysicsBenchmarkGateSummary(run);
    const horizons = summary.results.find(
      (result) => result.id === "horizons-ten-year-eih-1pn",
    );

    expect(HORIZONS_VALIDATION_DT_DAYS).toBe(0.25);
    expect(dataset.variant).toBe("v84-outer-system-barycenter-reference");
    expect(run.status).toBe("complete");
    expect(run.modes.map((mode) => mode.mode)).toEqual(["newton", "1pn"]);
    for (const mode of run.modes) {
      expect(mode.checkpoints.map((checkpoint) => checkpoint.label)).toEqual([
        "+30d",
        "+365d",
        "+10y",
      ]);
      expect(Number.isFinite(mode.rmsPositionKm)).toBe(true);
      expect(Number.isFinite(mode.rmsVelocityMs)).toBe(true);
    }
    expect(horizons?.status, horizons?.measured).toBe("pass");
    expect(summary.runtimeStatus).toBe("pass");
    expect(summary.passCount).toBe(summary.resultCount);
    expect(summary.blockingCount).toBe(0);
  }, 120_000);
});
