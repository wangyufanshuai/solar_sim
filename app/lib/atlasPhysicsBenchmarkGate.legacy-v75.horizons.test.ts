import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasPhysicsBenchmarkGateSummary } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  HORIZONS_VALIDATION_DT_DAYS,
  runHorizonsValidationDataset,
} from "./horizonsValidationRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v75 legacy ten-year Horizons blocker audit", () => {
  it("preserves the old strict fixture blocker as rollback evidence", async () => {
    const dataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(process.cwd(), "dist/content-packs/files/science-fixtures/data/horizons-validation-j2000.json"),
        "utf8",
      ),
    );
    const run = await runHorizonsValidationDataset(dataset);
    const summary = createAtlasPhysicsBenchmarkGateSummary(run);
    const horizons = summary.results.find(
      (result) => result.id === "horizons-ten-year-eih-1pn",
    );

    expect(HORIZONS_VALIDATION_DT_DAYS).toBe(0.25);
    expect(dataset.variant).toBeUndefined();
    expect(dataset.targetProvenance).toBeUndefined();
    expect(run.status).toBe("complete");
    expect(horizons?.status).toBe("fail");
    expect(horizons?.measured).toBe(V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED);
    expect(summary.runtimeStatus).toBe("fail");
  }, 120_000);
});
