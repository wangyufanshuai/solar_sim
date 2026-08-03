import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("scripts/build-atlas-profile.mjs", "utf8");

describe("v564 low-memory App Router overlay", () => {
  it("isolates only profile-inapplicable local-shadow and versioned evidence routes", () => {
    expect(source).toContain('profile !== "local-shadow"');
    expect(source).toContain("ATLAS_ROUTE_OVERLAY");
    expect(source).toContain("/^local-shadow-v\\d+$/");
    expect(source).toContain("/^v\\d+$/");
    expect(source).toContain("Route overlay escapes workspace");
    expect(source).not.toContain("rm(appRoot");
    expect(source).not.toContain("rm(evidenceRoot");
  });

  it("keeps the current route inventory available outside the build window", () => {
    const localShadow = readdirSync("app", { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^local-shadow-v\d+$/.test(entry.name));
    const evidence = readdirSync("app/api/atlas/relativity-evidence", { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^v\d+$/.test(entry.name));
    expect(localShadow.length).toBeGreaterThanOrEqual(55);
    expect(evidence.length).toBeGreaterThanOrEqual(202);
    expect(source).toContain("for (const entry of moved.reverse())");
    expect(source).toContain('ATLAS_TSCONFIG_PATH: ".atlas-build-tsconfig.json"');
    expect(source).toContain('"**/*.test.tsx"');
    expect(source).toContain("buildTsconfigCreated");
  });

  it("replaces the experimental workbench only in non-local-shadow production graphs", () => {
    const config = readFileSync("next.config.mjs", "utf8");
    const boundary = readFileSync("app/components/RelativityResearchWorkbenchReleaseBoundaryV564.tsx", "utf8");
    expect(config).toContain('deliveryProfile !== "local-shadow"');
    expect(config).toContain("NormalModuleReplacementPlugin");
    expect(config).toContain("RelativityResearchWorkbenchReleaseBoundaryV564.tsx");
    expect(boundary).toContain('data-atlas-v564-local-shadow-workbench-included="false"');
    expect(boundary).toContain('data-atlas-v564-science-payload-writeback="false"');
    expect(boundary).not.toContain("RelativityResearchWorkbenchV280");
    expect(boundary).not.toContain("fetch(");
    expect(boundary).not.toContain("<canvas");
  });

  it("keeps Lite build evidence separate from the standalone authority receipt", () => {
    expect(source).toContain('"atlas-lite-build-resource-v562.json"');
    expect(source).toContain('"atlas-local-shadow-build-resource-v562.json"');
    expect(source).toContain('"atlas-build-resource-v562.json"');
    expect(source).toContain("buildReceiptPath");
  });
});
