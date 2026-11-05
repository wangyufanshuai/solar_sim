import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasEvidenceObservatoryQualificationV405, parseAtlasLifecycleProvenanceDossierV405 } from "./atlasLifecycleProvenanceDossierV405";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const sha = (value: unknown, identity: string) => createHash("sha256").update(JSON.stringify(Array.isArray(value) ? value : canonical(value, identity))).digest("hex");
const canonical = (value: unknown, identity: string): unknown => Array.isArray(value) ? value.map((entry) => canonical(entry, identity)) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", identity].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry, identity)]));

describe("v405 portable lifecycle provenance", () => {
  it("publishes a four-node SHA lineage without replay cycle details", () => {
    const dossier = read("dist/science/atlas-evidence-observatory-v405/portable-dossier.json");
    expect(parseAtlasLifecycleProvenanceDossierV405(dossier)).toBe(dossier);
    expect(dossier.lineage).toMatchObject({ nodeCount: 4, edgeCount: 3 });
    expect(dossier.qualification).toMatchObject({ portableDossierQualified: true, browserSoakQualified: false, productionLifecycleQualified: false, cycleDetailsIncluded: false });
    expect(dossier).not.toHaveProperty("cycles");
    expect(JSON.stringify(dossier)).not.toContain('"cycle":');
    expect(sha(dossier, "dossierSha256")).toBe(dossier.dossierSha256);
  });

  it("keeps V13 static-only and all heavy qualifications not run", () => {
    const qualification = read("dist/science/atlas-evidence-observatory-v405/qualification.json");
    expect(parseAtlasEvidenceObservatoryQualificationV405(qualification)).toBe(qualification);
    expect(qualification).toMatchObject({ browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" });
  });
});
