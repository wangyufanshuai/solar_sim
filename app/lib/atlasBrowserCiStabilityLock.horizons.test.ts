import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAtlasBrowserCiStabilityLockSummary,
} from "./atlasBrowserCiStabilityLock";
import {
  runAtlasBrowserCiStabilityLockAudit,
  v94BrowserCiStabilityCommandContract,
} from "./atlasBrowserCiStabilityLockRunner";
import {
  readAtlasHorizonsFixtureFileAudit,
} from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v94 browser CI stability lock", () => {
  it("locks screenshot retry, pixel settle, fresh server, commands and v93 evidence", async () => {
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
      readFileSync(resolve(process.cwd(), "app/lib/atlasScientificGateMaintenanceRunbook.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasScientificGateReleaseEvidence.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasBrowserCiStabilityLock.ts"), "utf8"),
    ].join("\n");
    const browserSpecText = readFileSync(
      resolve(process.cwd(), "tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      "utf8",
    );
    const freshConfigText = readFileSync(
      resolve(process.cwd(), "playwright.atlas.fresh.config.ts"),
      "utf8",
    );

    const { audits, rows } = await runAtlasBrowserCiStabilityLockAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
      packageScripts: packageJson.scripts,
      migratedFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CANDIDATE_FIXTURE_PATH),
      legacyFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CURRENT_STRICT_FIXTURE_PATH),
      docsText,
      surfaceText,
      browserSpecText,
      freshConfigText,
    });
    const summary = createAtlasBrowserCiStabilityLockSummary({ audits, rows });
    const row = summary.stabilityRows[0]!;

    expect(v94BrowserCiStabilityCommandContract()).toEqual({
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
      productFullCommand: "npm run verify:atlas:full",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      freshBrowserPort: 3015,
      screenshotRetryAttempts: 3,
      pixelSettleAttempts: 4,
      watchpackWarningPolicy: "known-windows-noise-non-failing",
    });
    expect(packageJson.scripts["test:atlas:browser-ci-stability"]).toBe(
      "vitest run app/lib/atlasBrowserCiStabilityLock.horizons.test.ts",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      ["v93-release-evidence-lock", "ready", "ready-release-evidence-locked; release-evidence-pass"],
      ["screenshot-retry-lock", "ready", "3-attempt screenshot retry helper present"],
      ["pixel-settle-lock", "ready", "4-attempt pixel settle helpers and fresh visual checkpoints preserve assertions"],
      ["fresh-server-lock", "ready", "fresh 3015 server and Watchpack warning policy locked"],
      ["command-ownership-lock", "ready", expect.any(String)],
      ["docs-boundary-lock", "ready", "v94 browser CI docs present"],
      ["surface-contract-lock", "ready", "v94 browser CI surface present"],
      ["protected-mutation-lock", "ready", "all protected browser CI mutation flags not-applied"],
    ]);
    expect(summary.status).toBe("ready-browser-ci-locked");
    expect(summary.classification).toBe("browser-ci-stability-pass");
    expect(row.status).toBe("complete");
    expect(row.releaseEvidenceStatus).toBe("pass");
    expect(row.screenshotRetryStatus).toBe("pass");
    expect(row.pixelSettleStatus).toBe("pass");
    expect(row.freshServerStatus).toBe("pass");
    expect(row.commandOwnershipStatus).toBe("pass");
    expect(row.docsBoundaryStatus).toBe("pass");
    expect(row.surfaceContractStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.browserCiStabilityLock).toBe("applied-contract-only");
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
    expect(summary.defaultGateConfigMutation).toBe("not-applied");
    expect(summary.certificationClaimMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "browser-ci-stability-lock-not-nasa-jpl-certified",
    );
  }, 420_000);
});
