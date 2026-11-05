import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrTemperatureSystematicsTransferV390,
  resetKerrTemperatureSystematicsTransferServerV390CacheForTests,
} from "./kerrTemperatureSystematicsTransferServerV390";

describe("v390 systematics transfer server", () => {
  it("loads the bounded canonical operator", async () => {
    resetKerrTemperatureSystematicsTransferServerV390CacheForTests();
    const artifact = await loadKerrTemperatureSystematicsTransferV390();
    expect(artifact.counts).toMatchObject({
      transferCount: 12,
      coefficientCount: 72,
      rowRank: 2,
    });
    expect(artifact.admission).toMatchObject({
      physicalSystematicVectorAdmitted: false,
      covarianceProjectionExecuted: false,
    });
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v390-"));
    const target = join(
      root,
      "dist/science/kerr-temperature-systematics-transfer-v390",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "transfer-operator.json"), "{}\n");
    resetKerrTemperatureSystematicsTransferServerV390CacheForTests();
    await expect(loadKerrTemperatureSystematicsTransferV390(root)).rejects.toThrow(
      "v390-systematics-transfer-artifact-identity",
    );
  });
});
