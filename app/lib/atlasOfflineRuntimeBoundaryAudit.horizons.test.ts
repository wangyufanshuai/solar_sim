import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAtlasOfflineRuntimeBoundaryAuditSummary,
} from "./atlasOfflineRuntimeBoundaryAudit";
import {
  runAtlasOfflineRuntimeBoundaryAudit,
  v91OfflineRuntimeBoundaryCommandContract,
} from "./atlasOfflineRuntimeBoundaryAuditRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v91 offline/runtime boundary audit", () => {
  it("audits migrated offline scientific gate boundaries without runtime mutation claims", async () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const baselineDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(resolve(process.cwd(), V87_CURRENT_STRICT_FIXTURE_PATH), "utf8"),
    );
    const v82HierarchyDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(process.cwd(), "public/data/horizons-validation-j2000-barycenter-candidate.json"),
        "utf8",
      ),
    );
    const v84OuterSystemDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(resolve(process.cwd(), V87_CANDIDATE_FIXTURE_PATH), "utf8"),
    );
    const docsText = [
      readFileSync(resolve(process.cwd(), "README.md"), "utf8"),
      readFileSync(resolve(process.cwd(), "docs/TECHNICAL_OVERVIEW.md"), "utf8"),
    ].join("\n");
    const surfaceText = [
      readFileSync(resolve(process.cwd(), "app/UniverseRuntimeController.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/RelativityObservableAtlasPanel.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/evidenceLedger.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasValidationConsole.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasOfflineRuntimeBoundaryAudit.ts"), "utf8"),
    ].join("\n");

    const { lockAudits, rows } = await runAtlasOfflineRuntimeBoundaryAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
      packageScripts: packageJson.scripts,
      docsText,
      surfaceText,
    });
    const summary = createAtlasOfflineRuntimeBoundaryAuditSummary({
      lockAudits,
      rows,
    });
    const row = summary.boundaryRows[0]!;

    expect(v91OfflineRuntimeBoundaryCommandContract()).toEqual({
      defaultScientificCommand: "npm run test:atlas:horizons-scientific-gate",
      legacyV75Command: "npm run test:atlas:horizons-scientific-gate:legacy-v75",
      provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
    });
    expect(packageJson.scripts["test:atlas:offline-runtime-boundary"]).toBe(
      "vitest run app/lib/atlasOfflineRuntimeBoundaryAudit.horizons.test.ts",
    );
    expect(summary.status).toBe("ready-boundary-locked");
    expect(summary.classification).toBe("offline-runtime-boundary-pass");
    expect(summary.lockAudits.map((audit) => [audit.id, audit.status])).toEqual([
      ["v90-provenance-freeze-lock", "ready"],
      ["command-ownership-lock", "ready"],
      ["docs-boundary-lock", "ready"],
      ["browser-surface-lock", "ready"],
      ["runtime-claim-lock", "ready"],
      ["scientific-certification-claim-lock", "ready"],
      ["protected-mutation-lock", "ready"],
    ]);
    expect(row.status).toBe("complete");
    expect(row.commandBoundaryStatus).toBe("pass");
    expect(row.docsBoundaryStatus).toBe("pass");
    expect(row.browserSurfaceStatus).toBe("pass");
    expect(row.runtimeClaimStatus).toBe("pass");
    expect(row.scientificCertificationClaimStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.offlineRuntimeBoundaryAudit).toBe("applied-contract-only");
    expect(summary.defaultGateConfigMutation).toBe("not-applied");
    expect(summary.livePhysicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.backgroundMutation).toBe("not-applied");
    expect(summary.materialMutation).toBe("not-applied");
    expect(summary.fixtureDataMutation).toBe("not-applied");
    expect(summary.budgetMutation).toBe("not-applied");
    expect(summary.certificationClaimMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "offline-gate-frozen-not-nasa-jpl-certified",
    );
  }, 420_000);
});
