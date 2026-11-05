import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadObservationGeometryValidationInspectV372,
  resetObservationGeometryValidationInspectServerV372CacheForTests,
} from "./observationGeometryValidationInspectServerV372";

afterEach(() => resetObservationGeometryValidationInspectServerV372CacheForTests());

describe("v372 observation geometry validation inspect server", () => {
  it("loads the bounded canonical artifact", async () => {
    const artifact = await loadObservationGeometryValidationInspectV372();
    expect(artifact).toMatchObject({
      status: "blocked-validation-inputs-unavailable",
      presentInputCount: 0,
      validationExecuted: false,
      measuredAuthorityGranted: false,
    });
  });

  it("rejects a tampered artifact", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v372-"));
    const path = join(root, "dist/science/observation-geometry-v372/inspect.json");
    await mkdir(dirname(path), { recursive: true });
    const artifact = JSON.parse(
      await readFile(
        "dist/science/observation-geometry-v372/inspect.json",
        "utf8",
      ),
    );
    artifact.presentInputCount = 1;
    artifact.missingInputs = artifact.missingInputs.slice(1);
    await writeFile(path, JSON.stringify(artifact));
    await expect(loadObservationGeometryValidationInspectV372(root)).rejects.toThrow(
      "v372-inspect-sha",
    );
  });
});
