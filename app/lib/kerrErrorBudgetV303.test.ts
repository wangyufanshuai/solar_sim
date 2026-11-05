import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KERR_ERROR_COMPONENT_IDS_V303, parseKerrLayeredErrorBudgetViewV303 } from "./kerrErrorBudgetV303";
import { createKerrLayeredErrorBudgetViewV303 } from "./kerrErrorBudgetServerV303";

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));

function documents() {
  return {
    geometry: readJson("dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"),
    polarization: readJson("dist/science/kerr-reference-v297/polarization-short-gate.json"),
    rayPlan: readJson("dist/science/kerr-campaign-v298r1/ray-plan.json"),
    shardAudit: readJson("dist/science/kerr-campaign-v298r1/audits/shard-00.science-audit.json"),
    campaignState: readJson("dist/science/kerr-campaign-v298r1/campaign-state.json"),
  };
}

function view() {
  const source = documents();
  return createKerrLayeredErrorBudgetViewV303(source.geometry, source.polarization, source.rayPlan, source.shardAudit, source.campaignState);
}

describe("v303 layered Kerr error budget", () => {
  it("separates qualified sparse authority from incomplete dense shard evidence", () => {
    const result = view();
    expect(result).toMatchObject({
      version: "v303-kerr-layered-error-budget-view-v1",
      status: "sparse-qualified-dense-incomplete",
      sparse: { status: "qualified-short-authority", geometryExecutionCount: 128, polarizationExecutionCount: 16, canonicalRayCount: 16 },
      dense: {
        status: "incomplete-1-of-49",
        completedShardCount: 1,
        plannedShardCount: 49,
        auditedRayCount: 64,
        auditedExecutionCount: 512,
        statisticalGatesApplied: false,
        aggregateEligible: false,
        campaignPartialAggregate: false,
        denseAggregateSha256: null,
      },
      policy: { independenceAssumption: "not-established", scalarCombinedUncertainty: "forbidden" },
    });
    expect(result.sparse.components.map((component) => component.id)).toEqual(KERR_ERROR_COMPONENT_IDS_V303);
    expect(result.dense.components.map((component) => component.id)).toEqual(KERR_ERROR_COMPONENT_IDS_V303);
    expect(result.sparse.components.every((component) => component.observed < component.threshold && component.passed)).toBe(true);
    expect(result.dense.components.every((component) => component.observed < component.threshold && component.passed)).toBe(true);
    expect(result.maxima.sparseThresholdUtilization).toBeGreaterThan(0);
    expect(result.maxima.denseShardThresholdUtilization).toBeGreaterThan(0);
  });

  it("round-trips the bounded view and retains unreported model components", () => {
    const result = view();
    expect(parseKerrLayeredErrorBudgetViewV303(JSON.parse(JSON.stringify(result)))).toEqual(result);
    expect(Object.keys(result.unreportedComponents)).toEqual(["uReference", "uInitialState", "uFit", "uConstants", "uModel"]);
    expect(result.boundary).toBe("shard-budget-is-not-dense-aggregate-qualification");
  });

  it("fails closed on partial promotion, threshold drift and scalar-summary drift", () => {
    const source = documents();
    source.shardAudit.aggregateEligible = true;
    expect(() => createKerrLayeredErrorBudgetViewV303(source.geometry, source.polarization, source.rayPlan, source.shardAudit, source.campaignState))
      .toThrow("v303-server-dense-shard-boundary-mismatch");

    const thresholdDrift = documents();
    thresholdDrift.shardAudit.errorBudget.components.massShellNormalized.threshold = 1;
    expect(() => createKerrLayeredErrorBudgetViewV303(thresholdDrift.geometry, thresholdDrift.polarization, thresholdDrift.rayPlan, thresholdDrift.shardAudit, thresholdDrift.campaignState))
      .toThrow("v303-server-dense-component-contract-mismatch");

    const result = view();
    expect(() => parseKerrLayeredErrorBudgetViewV303({
      ...result,
      dense: { ...result.dense, aggregateEligible: true },
    })).toThrow("v303-dense-partial-boundary-failed");
    expect(() => parseKerrLayeredErrorBudgetViewV303({
      ...result,
      maxima: { ...result.maxima, sparseThresholdUtilization: 0 },
    })).toThrow("v303-error-budget-maxima-conservation-failed");
  });

  it("loads the budget only behind the error-budget workbench intent", () => {
    const workbench = readFileSync(resolve(process.cwd(), "app/components/RelativityResearchWorkbenchV280.tsx"), "utf8");
    const budget = readFileSync(resolve(process.cwd(), "app/components/KerrErrorBudgetWorkbenchV303.tsx"), "utf8");
    expect(workbench).toContain('tab === "error-budget"');
    expect(workbench).toContain("<KerrErrorBudgetWorkbenchV303");
    expect(budget).toContain("/api/atlas/relativity-evidence/artifacts/v303-error-budget");
    expect(budget).toContain("MAX_RESPONSE_BYTES = 32 * 1024");
    expect(budget).toContain("aggregateEligible=false");
  });
});
