import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrGlobalObservabilityAdversarialFixturesV395,
  createKerrGlobalObservabilityBundleV395,
  decomposeKerrNuisanceModeV395,
  parseKerrGlobalObservabilityArtifactV395,
  validateKerrGlobalObservabilityBundleV395,
  V395_ORACLE_RELATIVE_LIMIT,
  V395_RESIDUAL_LIMIT,
} from "./kerrGlobalObservabilityV395";
import { createKerrGlobalCovarianceControlFixtureV394 } from "./kerrGlobalCovariancePropagationV394";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const transfer = () =>
  read(
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  );
const admission = () =>
  read(
    "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
  );
const dossier = () =>
  read(
    "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
  );
const globalArtifact = () =>
  read(
    "dist/science/kerr-global-covariance-propagation-v394/global-propagation.json",
  );

describe("v395 global observability", () => {
  it("builds a rank-24 Jacobian with a 12-dimensional analytic nullspace", () => {
    const transferArtifact = transfer();
    const global = globalArtifact();
    const bundle = createKerrGlobalObservabilityBundleV395(
      transferArtifact,
      global,
    );
    expect(bundle).toMatchObject({ rank: 24, nullity: 12 });
    expect(bundle.jacobian).toHaveLength(24);
    expect(bundle.pseudoinverse).toHaveLength(36);
    expect(bundle.nullBasis).toHaveLength(12);
    const validation = validateKerrGlobalObservabilityBundleV395(
      bundle,
      transferArtifact,
      global,
    );
    expect(validation.status).toBe("qualified");
    expect(Math.max(...Object.values(validation.maxima))).toBeLessThan(
      V395_RESIDUAL_LIMIT,
    );
  });

  it("separates synthetic modes without assigning physical attribution", () => {
    const transferArtifact = transfer();
    const global = globalArtifact();
    const bundle = createKerrGlobalObservabilityBundleV395(
      transferArtifact,
      global,
    );
    const model = createKerrGlobalCovarianceControlFixtureV394(
      transferArtifact,
      admission(),
      dossier(),
    );
    const modes = model.nuisanceModes.map((mode) =>
      decomposeKerrNuisanceModeV395(mode.modeId, mode.loadings, bundle),
    );
    expect(modes).toHaveLength(3);
    expect(
      modes.every(
        (mode) =>
          Math.abs(mode.observableFraction + mode.nullFraction - 1) < 2e-12 &&
          mode.physicalAttributionAllowed === false,
      ),
    ).toBe(true);
    expect(modes.find((mode) => mode.modeId === "disk-flux-band-tilt")?.nullFraction).toBe(0);
  });

  it("rejects all pre-registered observability attacks", () => {
    const transferArtifact = transfer();
    const global = globalArtifact();
    const fixtures = createKerrGlobalObservabilityAdversarialFixturesV395(
      transferArtifact,
      global,
    );
    expect(fixtures).toHaveLength(8);
    for (const fixture of fixtures) {
      const result = validateKerrGlobalObservabilityBundleV395(
        fixture.value,
        transferArtifact,
        global,
      );
      expect(result.status, fixture.id).toBe("rejected");
      expect(result.rejectionReasons, fixture.id).toContain(
        fixture.expectedReason,
      );
    }
  });

  it("parses only the generated structural-only artifact", () => {
    const artifact = read(
      "dist/science/kerr-global-observability-v395/observability.json",
    );
    expect(parseKerrGlobalObservabilityArtifactV395(artifact)).toBe(artifact);
    expect(artifact.residuals.maximumPythonOracleRelativeDifference).toBeLessThan(
      V395_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.productionAdmission).toMatchObject({
      physicalNuisanceModesAvailable: false,
      physicalModeAttributionExecuted: false,
      nullspacePriorAssigned: false,
      unobservableDirectionsTreatedAsZero: false,
      probabilityContentAssigned: false,
    });
  });
});
