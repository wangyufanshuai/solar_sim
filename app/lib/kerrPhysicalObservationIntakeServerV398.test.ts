import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadKerrPhysicalObservationIntakeV398, resetKerrPhysicalObservationIntakeServerV398CacheForTests } from "./kerrPhysicalObservationIntakeServerV398";

describe("v398 intake server", () => {
  it("loads the bounded current inspect artifact", async () => {
    resetKerrPhysicalObservationIntakeServerV398CacheForTests();
    const artifact = await loadKerrPhysicalObservationIntakeV398();
    expect(artifact.schema.expectedFileCount).toBe(13);
    expect(artifact.inspect.stagingManifestPresent).toBe(false);
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v398-"));
    const target = join(root, "dist/science/kerr-physical-observation-intake-v398");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "intake-inspect.json"), "{}\n");
    resetKerrPhysicalObservationIntakeServerV398CacheForTests();
    await expect(loadKerrPhysicalObservationIntakeV398(root)).rejects.toThrow("v398-physical-observation-intake-artifact-identity");
  });
});
