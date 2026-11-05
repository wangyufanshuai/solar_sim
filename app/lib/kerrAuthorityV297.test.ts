import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isKerrPolarizationQualificationV297 } from "./kerrAuthorityV297";

describe("v297 Kerr polarization authority", () => {
  it("accepts the generated formal short gate", () => {
    const evidence = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v297/polarization-short-gate.json"), "utf8"));
    expect(isKerrPolarizationQualificationV297(evidence)).toBe(true);
    expect(evidence.status).toBe("full-kerr-short-authority-qualified");
    expect(evidence.applicableExecutionCount).toBe(16);
    expect(evidence.captureEscapeNotApplicableCount).toBe(96);
    expect(evidence.gates.branchDeterministic).toBe(true);
    expect(evidence.gates.symmetryFixtures).toBe(true);
  });

  it("locks the portable envelope to the v297 authority source", () => {
    const envelope = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v297/portable-envelope.json"), "utf8"));
    expect(envelope.status).toBe("full-kerr-short-authority-qualified");
    expect(envelope.authority.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(envelope.authority.sourceGeometryVersion).toBe("v296");
    expect(envelope.release.denseShardExecuted).toBe(false);
  });

  it("rejects a fake qualification without a canonical SHA", () => {
    expect(isKerrPolarizationQualificationV297({ version: "v297-kerr-disk-polarization-short-gate-v1", status: "full-kerr-short-authority-qualified", qualified: true })).toBe(false);
  });
});
