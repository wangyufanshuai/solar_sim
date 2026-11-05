import { describe, expect, it } from "vitest";
import {
  loadKerrBandpassRedshiftCommutatorV534,
  resetKerrBandpassRedshiftCommutatorServerCacheForTestsV534,
} from "./kerrBandpassRedshiftCommutatorServerV534";

describe("v534 bandpass-redshift server", () => {
  it("uses a bounded mtime + size + SHA fingerprint cache", async () => {
    resetKerrBandpassRedshiftCommutatorServerCacheForTestsV534();
    const first = await loadKerrBandpassRedshiftCommutatorV534();
    const second = await loadKerrBandpassRedshiftCommutatorV534();
    expect(first).toBe(second);
    expect(first.summary.rows).toHaveLength(4);
    expect(first.summary.qualification.nonCommutativityDetected).toBe(true);
  });
});
