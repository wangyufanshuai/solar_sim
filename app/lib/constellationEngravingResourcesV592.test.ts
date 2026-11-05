import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BufferAttribute, BufferGeometry, LineBasicMaterial, MeshBasicMaterial } from "three";
import { acquireAtlasResource, diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot, listAtlasRuntimeResources } from "./atlasResourceLifecycle";
import { acquireConstellationEngravingResourcesV592, CONSTELLATION_ENGRAVING_RESOURCE_OWNER_V592, type ConstellationEngravingResourcesV592 } from "./constellationEngravingResourcesV592";

const releases: Array<() => void> = [];
const baseline = getAtlasResourceSnapshot();
const identity = { code: "Ori", signature: "b1234567", deviceTier: "desktop" as const };

function geometry(vertices: number): BufferGeometry {
  const value = new BufferGeometry();
  value.setAttribute("position", new BufferAttribute(new Float32Array(vertices * 3), 3));
  return value;
}

function resources(): ConstellationEngravingResourcesV592 {
  return {
    outline: geometry(8), inner: geometry(8), hatch: geometry(12), fill: geometry(24),
    outlineMaterial: new LineBasicMaterial(), innerMaterial: new LineBasicMaterial(),
    hatchMaterial: new LineBasicMaterial(), fillMaterial: new MeshBasicMaterial(),
  };
}

function acquire(value = resources(), target = identity) {
  const release = acquireConstellationEngravingResourcesV592(value, target);
  releases.push(release);
  return { value, release };
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const release of releases.splice(0)) release();
  expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
});

describe("constellation engraving resource ownership", () => {
  it("registers all eight parts with constellation, geometry signature and device identity", () => {
    acquire();
    const current = getAtlasResourceSnapshot();
    const entries = listAtlasRuntimeResources().filter((row) => row.owner === CONSTELLATION_ENGRAVING_RESOURCE_OWNER_V592);
    expect(current.total - baseline.total).toBe(8);
    expect(current.models - baseline.models).toBe(8);
    expect(entries).toHaveLength(8);
    expect(new Set(entries.map((row) => row.label)).size).toBe(8);
    expect(entries.every((row) => row.sceneMode === "atlas" && row.label.startsWith("v592-constellation-Ori-b1234567-desktop-"))).toBe(true);
    expect(entries.every((row) => row.contentSha256 === null && row.manifestSha256 === null)).toBe(true);
  });

  it("reports position-array estimates without inventing material or physical GPU bytes", () => {
    const { value } = acquire();
    const bytes = [value.outline, value.inner, value.hatch, value.fill]
      .reduce((sum, item) => sum + item.getAttribute("position").array.byteLength, 0);
    const current = getAtlasResourceSnapshot();
    expect(current.estimatedBytes - baseline.estimatedBytes).toBe(bytes);
    expect(current.estimatedGpuBytes).toBe(baseline.estimatedGpuBytes);
    const entries = listAtlasRuntimeResources().filter((row) => row.owner === CONSTELLATION_ENGRAVING_RESOURCE_OWNER_V592);
    expect(entries.filter((row) => row.label.endsWith("Material")).every((row) => row.estimatedBytes === 0)).toBe(true);
  });

  it("disposes every part exactly once and leaves unrelated owners registered", () => {
    const otherRelease = acquireAtlasResource("model", "atlas", "unrelated-test", { owner: "other", estimatedBytes: 91 });
    releases.push(otherRelease);
    const other = getAtlasResourceSnapshot();
    const value = resources();
    const dispose = Object.values(value).map((item) => vi.spyOn(item, "dispose"));
    const { release } = acquire(value);
    release();
    release();
    expect(dispose.every((spy) => spy.mock.calls.length === 1)).toBe(true);
    expect(diffAtlasResourceSnapshotsV300(other, getAtlasResourceSnapshot()).status).toBe("baseline");
  });

  it("changes identities on constellation replacement even when numeric totals stay equal", () => {
    const first = acquire();
    const before = getAtlasResourceSnapshot();
    first.release();
    acquire(resources(), { ...identity, code: "Cyg", signature: "c1234567" });
    const after = getAtlasResourceSnapshot();
    expect(after.total).toBe(before.total);
    expect(after.estimatedBytes).toBe(before.estimatedBytes);
    expect(diffAtlasResourceSnapshotsV300(before, after)).toMatchObject({ identityChanged: true, total: 0 });
    expect(listAtlasRuntimeResources().some((row) => row.label.includes("-Ori-"))).toBe(false);
  });

  it("restores the baseline when hidden, permits reactivation and cleans up after unmount", () => {
    const first = acquire();
    first.release();
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
    const second = acquire();
    expect(getAtlasResourceSnapshot().models - baseline.models).toBe(8);
    second.release();
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });

  it("keeps concurrent matching owners separate during cleanup", () => {
    const first = acquire();
    const second = acquire();
    expect(getAtlasResourceSnapshot().models - baseline.models).toBe(16);
    first.release();
    expect(getAtlasResourceSnapshot().models - baseline.models).toBe(8);
    expect(Object.values(getAtlasResourceSnapshot().byIdentity).filter((row) => row.owner === CONSTELLATION_ENGRAVING_RESOURCE_OWNER_V592).every((row) => row.count === 1)).toBe(true);
    second.release();
  });

  it("can register again after React development effect cleanup without dropping the live owner", () => {
    const value = resources();
    const first = acquire(value);
    first.release();
    const second = acquire(value);
    first.release();
    expect(getAtlasResourceSnapshot().models - baseline.models).toBe(8);
    second.release();
  });

  it("continues disposing other parts when one fails and does not report that part as released", () => {
    const value = resources();
    const failing = vi.spyOn(value.hatch, "dispose").mockImplementationOnce(() => { throw new Error("test-disposal-failure"); });
    const other = vi.spyOn(value.fillMaterial, "dispose");
    const { release } = acquire(value);
    expect(release).toThrow("constellation-engraving-disposal-failed");
    expect(getAtlasResourceSnapshot().models - baseline.models).toBe(1);
    expect(other).toHaveBeenCalledTimes(1);
    expect(listAtlasRuntimeResources().filter((row) => row.owner === CONSTELLATION_ENGRAVING_RESOURCE_OWNER_V592)[0].label).toContain("-hatch");
    release();
    expect(failing).toHaveBeenCalledTimes(2);
    expect(other).toHaveBeenCalledTimes(1);
  });

  it("binds registration to the production effect and its identity and visibility dependencies", () => {
    const source = readFileSync("app/components/ConstellationEngravingV592.tsx", "utf8");
    expect(source).toContain('const active = profile.mode === "cinematic" && range !== null');
    expect(source).toContain("() => active && range ? buildConstellationEngravingGeometryV592(segments, range) : null");
    expect(source).toContain("if (!packet) return null");
    expect(source).toMatch(/useEffect\(\(\) => \{\s*if \(!resources \|\| !packet\) return;\s*return acquireConstellationEngravingResourcesV592\(resources,/u);
    expect(source).toContain("}, [resources, packet, profile.deviceTier])");
  });
});
