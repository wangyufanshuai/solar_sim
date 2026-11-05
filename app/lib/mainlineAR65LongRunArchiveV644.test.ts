import { describe, expect, it } from "vitest";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  createMainlineAR65ArchiveRecordV644,
  decodeMainlineAR65ArchiveRecordV644,
  mainlineAR65ArchiveBuildKeyV644,
  restoreMainlineAR65ObservationsV644,
  saveMainlineAR65ObservationV644,
  type MainlineAR65ArchivePortV644,
  type MainlineAR65ArchivedObservationV644,
} from "./mainlineAR65LongRunArchiveV644";
import {
  MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643,
  createMainlineAR65LongRunBuildIdentityV643,
  createMainlineAR65LongRunObservationV643,
  createMainlineAR65LongRunResourceCheckpointV643,
  createMainlineAR65LongRunViewportV643,
} from "./mainlineAR65LongRunV643";

const BUILD = createMainlineAR65LongRunBuildIdentityV643({
  buildId: "r65-v644-archive-test",
  runtimeBuildId: "mainline-a-r65-v644-test",
  branch: "codex/solar-sim-mainline-a",
  head: "156ec7790a99be2f89f5d8f44831cb118c9437e1",
  route: "/",
  source: "runtime-marker",
});

function memoryPort() {
  const records = new Map<string, MainlineAR65ArchivedObservationV644>();
  const port: MainlineAR65ArchivePortV644 = {
    async list(buildKey) { return [...records.values()].filter((item) => item.buildKey === buildKey); },
    async put(record) { records.set(record.id, record); },
  };
  return { port, records };
}

function observation(sessionId: string, change = true) {
  const baseline = getAtlasResourceSnapshot();
  let active = baseline;
  let final = baseline;
  if (change) {
    const release = acquireAtlasResource("subscription", "atlas", `test-real-resource-${sessionId}`, { owner: "archive-test" });
    active = getAtlasResourceSnapshot();
    release();
    final = getAtlasResourceSnapshot();
  }
  const viewport = createMainlineAR65LongRunViewportV643({ width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" });
  const checkpoint = (snapshot: typeof baseline, phase: "baseline" | "active" | "final", atMs: number) => createMainlineAR65LongRunResourceCheckpointV643(snapshot, phase, atMs, new Date(atMs).toISOString());
  return createMainlineAR65LongRunObservationV643({
    sessionId,
    independenceKey: `independent-${sessionId}`,
    device: "desktop",
    scenario: "atlas",
    viewport,
    build: BUILD,
    startedAt: new Date(0).toISOString(),
    endedAt: new Date(MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643).toISOString(),
    observedDurationMs: MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643,
    frameSamples: [{ atMs: 0, deltaMs: 0, longTaskMs: 0 }, { atMs: MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643, deltaMs: 16, longTaskMs: 0 }],
    memorySamples: [{ atMs: 0, usedBytes: null, totalBytes: null, limitBytes: null, source: "unavailable" }, { atMs: MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643, usedBytes: null, totalBytes: null, limitBytes: null, source: "unavailable" }],
    resources: {
      baseline: checkpoint(baseline, "baseline", 0),
      active: checkpoint(active, "active", 5_000),
      final: checkpoint(final, "final", MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643),
    },
    visibility: { startedVisible: true, endedVisible: true, interruptions: 0, canvasCount: 1, rootVisible: true, documentVisibility: "visible" },
    source: "browser-runtime",
    physicalDevice: false,
  });
}

describe("R65 V644 browser observation archive", () => {
  it("stores raw observations additively and reconstructs a blocked receipt without inventing valid runs", async () => {
    const { port, records } = memoryPort();
    const first = observation("session-a");
    const second = observation("session-b", false);
    await saveMainlineAR65ObservationV644(port, first, BUILD);
    await saveMainlineAR65ObservationV644(port, second, BUILD);
    await saveMainlineAR65ObservationV644(port, first, BUILD);
    expect(records.size).toBe(2);
    const restored = await restoreMainlineAR65ObservationsV644(port, BUILD);
    expect(restored.status).toBe("restored");
    expect(restored.records).toBe(2);
    expect(restored.receipt?.observations.map((item) => item.sessionId)).toEqual(["session-a", "session-b"]);
    expect(restored.receipt?.status).toBe("blocked");
    expect(restored.receipt?.claims.productionPerformance).toBe(false);
    expect(restored.receipt?.boundary.scientificPayloadWriteback).toBe(false);
  });

  it("rejects changed bytes, a changed build, and a fixture source", () => {
    const row = observation("session-integrity");
    const record = createMainlineAR65ArchiveRecordV644(row, BUILD, new Date(100).toISOString());
    expect(decodeMainlineAR65ArchiveRecordV644(record, BUILD).digest).toBe(row.digest);
    expect(() => decodeMainlineAR65ArchiveRecordV644({ ...record, rawJson: `${record.rawJson} ` }, BUILD)).toThrow("archive:byte-length");
    expect(() => decodeMainlineAR65ArchiveRecordV644({ ...record, sha256: "0".repeat(64) }, BUILD)).toThrow("archive:sha256");
    expect(() => decodeMainlineAR65ArchiveRecordV644(record, { ...BUILD, buildId: "other" })).toThrow("archive:build-mismatch");
    expect(() => createMainlineAR65ArchiveRecordV644({ ...row, source: "fixture" as const }, BUILD)).toThrow("archive:browser-observation-required");
  });

  it("fails closed on a conflicting session id or a corrupt archived row", async () => {
    const { port, records } = memoryPort();
    const original = observation("session-conflict");
    await saveMainlineAR65ObservationV644(port, original, BUILD);
    const conflicting = observation("session-conflict", false);
    await expect(saveMainlineAR65ObservationV644(port, conflicting, BUILD)).rejects.toThrow("archive:session-conflict");
    const key = `${mainlineAR65ArchiveBuildKeyV644(BUILD)}:session-conflict`;
    const record = records.get(key)!;
    records.set(key, { ...record, sha256: "f".repeat(64) });
    await expect(saveMainlineAR65ObservationV644(port, observation("session-new"), BUILD)).rejects.toThrow("archive:existing-corrupt");
    const restored = await restoreMainlineAR65ObservationsV644(port, BUILD);
    expect(restored.status).toBe("corrupt");
    expect(restored.receipt).toBeNull();
    expect(restored.issues.join(" ")).toContain("archive:sha256");
  });

  it("separates missing browser storage from an empty current-build archive", async () => {
    const empty = await restoreMainlineAR65ObservationsV644(memoryPort().port, BUILD);
    expect(empty.status).toBe("empty");
    const unavailable = await restoreMainlineAR65ObservationsV644({
      list: async () => { throw new Error("indexeddb unavailable"); },
      put: async () => undefined,
    }, BUILD);
    expect(unavailable.status).toBe("unavailable");
    expect(unavailable.receipt).toBeNull();
  });
});
