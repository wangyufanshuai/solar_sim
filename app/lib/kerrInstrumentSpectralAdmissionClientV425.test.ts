import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrInstrumentSpectralAdmissionSummaryV425 } from "./kerrInstrumentSpectralAdmissionV425";
import { getKerrInstrumentSpectralAdmissionSnapshotV425, loadKerrInstrumentSpectralAdmissionSummaryV425, resetKerrInstrumentSpectralAdmissionClientForTestsV425 } from "./kerrInstrumentSpectralAdmissionClientV425";

afterEach(() => { vi.unstubAllGlobals(); resetKerrInstrumentSpectralAdmissionClientForTestsV425(); });
describe("v425 spectral admission client", () => {
  it("single-flights a bounded three-band summary", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json", "utf8"));
    const summary = createKerrInstrumentSpectralAdmissionSummaryV425(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v425-kerr-instrument-spectral-applicability-firewall-response-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrInstrumentSpectralAdmissionSummaryV425();
    expect(loadKerrInstrumentSpectralAdmissionSummaryV425()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrInstrumentSpectralAdmissionSnapshotV425()).toMatchObject({ status: "ready", requestCount: 1 });
  });
});
