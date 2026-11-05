import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrSpectralCorrelationResponseArtifactV354 } from "./kerrSpectralCorrelationResponseV354";

describe("v354 correlated spectral-shape response", () => {
  it("propagates an explicit positive-definite synthetic covariance without a measured claim", () => {
    const artifact = parseKerrSpectralCorrelationResponseArtifactV354(
      JSON.parse(
        readFileSync(
          resolve(process.cwd(), "dist/science/kerr-spectral-correlation-response-v354/audit.json"),
          "utf8",
        ),
      ),
    );
    expect(artifact).toMatchObject({
      status: "qualified-synthetic-correlated-spectral-response-audit",
      counts: { rayCount: 4, bandCount: 3, modeCount: 3, coefficientCount: 9, perturbationExecutions: 72 },
      fullMeasuredResponseEnvelope: "unavailable-synthetic-correlation-model-not-measured-spectral-covariance",
      denseCampaignStatus: "incomplete-0-of-49",
    });
    expect(artifact.positiveDefiniteness.coefficientCovarianceMinimumCholeskyPivot).toBeGreaterThan(0);
    expect(artifact.maxima.energyConservationRelativeDifference).toBeLessThan(1e-12);
    expect(artifact.maxima.responseRelativeSigma).toBeGreaterThan(0);
    expect(artifact.maxima.responseCorrelationAbsoluteOffDiagonal).toBeGreaterThan(0);
  });
});
