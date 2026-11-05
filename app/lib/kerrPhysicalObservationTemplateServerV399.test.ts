import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadKerrPhysicalObservationTemplateV399, resetKerrPhysicalObservationTemplateServerV399CacheForTests } from "./kerrPhysicalObservationTemplateServerV399";

describe("v399 template server", () => {
  it("loads the bounded artifact and value-free template", async () => {
    resetKerrPhysicalObservationTemplateServerV399CacheForTests();
    const result = await loadKerrPhysicalObservationTemplateV399();
    expect(result.artifact.diagnostic.missingFileCount).toBe(13);
    expect(result.template.containsObservationValues).toBe(false);
  });
  it("rejects malformed template evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v399-"));
    const artifactTarget = join(root, "dist/science/kerr-physical-observation-template-v399");
    const templateTarget = join(root, "dist/templates/kerr-physical-observation-v399");
    await Promise.all([mkdir(artifactTarget, { recursive: true }), mkdir(templateTarget, { recursive: true })]);
    await Promise.all([writeFile(join(artifactTarget, "template-diagnostic.json"), "{}\n"), writeFile(join(templateTarget, "intake-template.json"), "{}\n")]);
    resetKerrPhysicalObservationTemplateServerV399CacheForTests();
    await expect(loadKerrPhysicalObservationTemplateV399(root)).rejects.toThrow("v399-template-artifact-identity");
  });
});
