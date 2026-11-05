import { describe, expect, it } from "vitest";
import {
  loadKerrSpectralEigenmodeAuditV355,
  resetKerrSpectralEigenmodeAuditServerV355CacheForTests,
} from "./kerrSpectralEigenmodeAuditServerV355";

describe("v355 spectral eigenmode server", () => {
  it("serves bounded reconstructed modes and ellipses", async () => {
    resetKerrSpectralEigenmodeAuditServerV355CacheForTests();
    expect(await loadKerrSpectralEigenmodeAuditV355()).toMatchObject({
      status: "qualified-synthetic-response-eigenmode-and-ellipse-audit",
      counts: { eigenmodeCount: 12, ellipseCount: 12 },
      fullMeasuredEigenmodeAuthority: "unavailable-input-covariance-is-synthetic-not-measured",
    });
  });
});
