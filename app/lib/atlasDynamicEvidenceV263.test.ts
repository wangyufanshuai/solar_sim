import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ATLAS_DYNAMIC_EVIDENCE_V263 } from "./atlasDynamicEvidenceV263.generated";

const sha256 = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");

describe("v263 corrected fresh local-validation evidence", () => {
  it("records the passing 21 plus one expected skip matrix from machine evidence", () => {
    const browser = ATLAS_DYNAMIC_EVIDENCE_V263.validation.browserQa;
    expect(browser.status).toBe("passed-corrected-fresh-matrix");
    expect(browser.correctedFreshMatrix).toMatchObject({
      playwrightExitCode: 0,
      wrapperExitCode: 0,
      summary: { expected: 21, skipped: 1, unexpected: 0, flaky: 0 },
      runtimeTotals: { consoleErrors: 0, pageErrors: 0, missingResources: 0, rendererFaults: 0 },
      automaticRetryApplied: false,
      assertionOrThresholdRelaxationApplied: false,
    });
    expect(browser.correctedFreshMatrix.expectedSkip).toHaveLength(1);
    expect(browser.correctedFreshMatrix.expectedSkip[0]).toMatchObject({
      project: "desktop-chrome-1440x900",
      title: "mobile gas giant close-up keeps a low-noise background",
    });
  });

  it("keeps the frozen science and compatibility contracts unchanged", () => {
    expect(ATLAS_DYNAMIC_EVIDENCE_V263.science).toMatchObject({
      status: "science-failed-shadow-retained",
      defaultKernel: "legacy-eih-1pn",
      runtimePromotionApplied: false,
      v8: {
        codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
        screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
      },
    });
    expect(ATLAS_DYNAMIC_EVIDENCE_V263.contracts).toMatchObject({
      legacyRootAttributes: 603,
      evidenceLedgerClaims: 84,
      singleCanvas: true,
      workerPhysicsMutation: "not-applied",
      eihOnePnMutation: "not-applied",
    });
  });

  it("publishes local validation while retaining only public-data blockers", () => {
    expect(ATLAS_DYNAMIC_EVIDENCE_V263.release).toMatchObject({
      localCandidateValidationStatus: "local-validation-passed-public-deployment-blocked",
      publicDeploymentBlocked: true,
      vercelApplied: false,
      productionApplied: false,
    });
    expect(ATLAS_DYNAMIC_EVIDENCE_V263.release.blockers).toEqual([
      "Cosmicflows-4 redistribution license unconfirmed",
      "GaiaUnlimited completeness dependency blocked",
    ]);
  });

  it("keeps the current-product pointer bound to the generated manifest bytes", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8")) as { source: string; sourceSha256: string };
    const source = readFileSync(resolve(process.cwd(), pointer.source));
    expect(sha256(source)).toBe(pointer.sourceSha256);
  });
});
