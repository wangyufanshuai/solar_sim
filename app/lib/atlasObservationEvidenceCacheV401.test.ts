import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401,
  getAtlasObservationEvidenceCacheSnapshotV401,
  loadAtlasObservationEvidenceStageV401,
  resetAtlasObservationEvidenceCacheForTestsV401,
} from "./atlasObservationEvidenceCacheV401";

const ARTIFACTS = {
  constraints: JSON.parse(readFileSync("dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json", "utf8")),
  admission: JSON.parse(readFileSync("dist/science/kerr-physical-observation-admission-v397/observation-admission.json", "utf8")),
  intake: JSON.parse(readFileSync("dist/science/kerr-physical-observation-intake-v398/intake-inspect.json", "utf8")),
  provenance: JSON.parse(readFileSync("dist/science/kerr-physical-observation-template-v399/template-diagnostic.json", "utf8")),
} as const;

const stageFromUrl = (url: string) => url.includes("v396") ? "constraints" : url.includes("v397") ? "admission" : url.includes("v398") ? "intake" : "provenance";

afterEach(() => {
  vi.unstubAllGlobals();
  resetAtlasObservationEvidenceCacheForTestsV401();
});

describe("v401 observation evidence single-flight cache", () => {
  it("loads each bounded stage at most once and exposes sanitized summaries", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const stage = stageFromUrl(String(input));
      return new Response(JSON.stringify({ available: true, reason: "ready", artifact: ARTIFACTS[stage] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    for (const stage of ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401) {
      const first = loadAtlasObservationEvidenceStageV401(stage);
      const second = loadAtlasObservationEvidenceStageV401(stage);
      expect(second).toBe(first);
      await Promise.all([first, second]);
    }
    const snapshot = getAtlasObservationEvidenceCacheSnapshotV401();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(snapshot).toMatchObject({ requestCount: 4, cacheEntryCount: 4, maximumEntries: 4, maximumResponseBytes: 128 * 1024, automaticRetryAllowed: false });
    expect(snapshot.cachedBytes).toBeGreaterThan(0);
    expect(snapshot.stages.constraints).toMatchObject({ status: "ready", requestCount: 1, summary: "structure qualified", reason: null });
    expect(snapshot.stages.constraints.responseBytes).toBeGreaterThan(0);
    expect(snapshot.stages.admission.summary).toBe("0 / 3 sources");
    expect(snapshot.stages.intake.summary).toBe("0 / 13 files");
    expect(snapshot.stages.provenance.summary).toBe("0 actual sources");
    await Promise.all(ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.map((stage) => loadAtlasObservationEvidenceStageV401(stage)));
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("retains the first failure and never retries within the same cache lifetime", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ available: false, reason: "evidence-corrupt", artifact: null }), { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadAtlasObservationEvidenceStageV401("constraints");
    await expect(first).rejects.toThrow("evidence-corrupt");
    await expect(loadAtlasObservationEvidenceStageV401("constraints")).rejects.toThrow("evidence-corrupt");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAtlasObservationEvidenceCacheSnapshotV401().stages.constraints).toMatchObject({ status: "unavailable", requestCount: 1, summary: "unavailable", reason: "evidence-corrupt" });
  });

  it("rejects an oversized response before parsing and retains the failure", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200, headers: { "Content-Length": String(128 * 1024 + 1) } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadAtlasObservationEvidenceStageV401("provenance")).rejects.toThrow("response-too-large");
    await expect(loadAtlasObservationEvidenceStageV401("provenance")).rejects.toThrow("response-too-large");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAtlasObservationEvidenceCacheSnapshotV401().stages.provenance).toMatchObject({ status: "unavailable", responseBytes: 0, reason: "response-too-large" });
  });
});
