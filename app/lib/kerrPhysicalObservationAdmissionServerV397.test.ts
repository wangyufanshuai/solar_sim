import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrPhysicalObservationAdmissionV397,
  resetKerrPhysicalObservationAdmissionServerV397CacheForTests,
} from "./kerrPhysicalObservationAdmissionServerV397";

describe("v397 observation admission server", () => {
  it("loads the bounded canonical artifact", async () => {
    resetKerrPhysicalObservationAdmissionServerV397CacheForTests();
    const artifact = await loadKerrPhysicalObservationAdmissionV397();
    expect(artifact.schema).toMatchObject({ sourceCount: 3, crossLinkCount: 3, rowCountPerSource: 12 });
    expect(artifact.productionAdmission.physicalObservationPackAvailable).toBe(false);
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v397-"));
    const target = join(root, "dist/science/kerr-physical-observation-admission-v397");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "observation-admission.json"), "{}\n");
    resetKerrPhysicalObservationAdmissionServerV397CacheForTests();
    await expect(loadKerrPhysicalObservationAdmissionV397(root)).rejects.toThrow("v397-physical-observation-admission-artifact-identity");
  });
});
