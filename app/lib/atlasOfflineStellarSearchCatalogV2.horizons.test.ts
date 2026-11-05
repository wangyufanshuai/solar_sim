import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v116 offline stellar search integration", () => {
  it("wires worker, selected close-up, root markers, evidence, docs and browser QA", () => {
    const page = read("app/UniverseRuntimeController.tsx");
    const scene = read("app/components/UniverseScene.tsx");
    const worker = read("app/workers/stellarSearch.worker.ts");
    const evidence = readProjectSourceBundle("app/lib/evidenceLedger.ts");
    const validation = read("app/lib/atlasValidationConsole.ts");
    const docs = `${read("README.md")}\n${read("docs/TECHNICAL_OVERVIEW.md")}`;
    const browser = read("tests/atlas-browser/atlas-browser-acceptance.spec.ts");
    const pkg = read("package.json");

    expect(page).toContain("data-atlas-stellar-search-catalog-version");
    expect(page).toContain("selectedStellarSearchDocument");
    expect(scene).toContain("stellarDocumentToGaiaIndex");
    expect(worker).toContain('message.type === "init-shard"');
    expect(worker).toContain('type: "query-result"');
    expect(worker).toContain('type: "query-error"');
    expect(evidence).toContain("offline-stellar-search-catalog-v2-lock");
    expect(validation).toContain("visual-launch-performance-lock");
    expect(docs).toContain("v116 Offline Stellar Search Catalog V2");
    expect(browser).toContain("v116-offline-stellar-search-catalog-v2");
    expect(pkg).toContain("build:stellar-search-index");
    expect(pkg).toContain("test:atlas:stellar-search-catalog-v2");
  });
});
