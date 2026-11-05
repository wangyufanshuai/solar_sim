import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrScienceInstrumentResponseV332 } from "./kerrScienceInstrumentResponseV332";

describe("v332 generated instrument response artifact", () => {
  it("keeps the explicit instrument layer separate from detector-independent authority", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-instrument-response-v332/response-reference.json"), "utf8"));
    const response = parseKerrScienceInstrumentResponseV332(artifact.response);
    expect(artifact.version).toBe("v332-kerr-science-instrument-response-artifact-v1");
    expect(artifact.artifactSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(response.rows).toHaveLength(12);
    expect(response.model.status).toBe("synthetic-audit-fixture-not-calibrated-observatory");
    expect(response.model.stochasticNoise).toBe("disabled");
    expect(response.source.denseAggregateSha256).toBeNull();
  });
});
