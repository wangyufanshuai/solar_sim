import { afterEach, describe, expect, it, vi } from "vitest";
import { BufferGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Texture } from "three";
import { createNebulaRenderObserverV638 } from "./mainlineANebulaRenderV638";
import { createNebulaLoadAttemptV638, transitionNebulaLoadAttemptV638 } from "./mainlineANebulaLoadV638";

const start = "2026-09-27T00:00:00.000Z";
const decodedAt = "2026-09-27T00:00:00.100Z";
const timestamp = (milliseconds: number) => new Date(Date.parse(start) + milliseconds).toISOString();
const cleanup: (() => void)[] = [];
afterEach(() => { cleanup.splice(0).forEach((release) => release()); });

function setup() {
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  const root = new Group();
  const geometry = new PlaneGeometry(1, 1);
  const material = new MeshBasicMaterial();
  const texture = new Texture();
  texture.userData.atlasVisualAssetSha256 = "a".repeat(64);
  material.map = texture;
  const mesh = new Mesh(geometry, material);
  mesh.position.z = -5;
  root.add(mesh);
  let currentTexture: Texture | null = texture;
  let attempt = transitionNebulaLoadAttemptV638(createNebulaLoadAttemptV638(1, start), {
    type: "decoded", attempt: 1, at: decodedAt,
  });
  let clock = 200;
  const producer = { rendered: vi.fn(() => true), unobserved: vi.fn(() => true) };
  const observer = createNebulaRenderObserverV638({
    geometry, material, assetSha256: "a".repeat(64), producer,
    read: () => ({ mesh, texture: currentTexture, attempt }),
    write: (value) => { attempt = value; },
    now: () => timestamp(clock),
  });
  cleanup.push(() => { geometry.dispose(); material.dispose(); texture.dispose(); });
  return {
    camera, root, geometry, material, texture, mesh, producer, observer,
    inspect: () => observer.inspect(camera),
    draw: () => observer.afterDraw(mesh, camera, geometry, material),
    advance: () => { clock += 100; },
    state: () => attempt,
    setTexture: (value: Texture | null) => { currentTexture = value; },
    cancel: () => { attempt = transitionNebulaLoadAttemptV638(attempt, { type: "cancelled", attempt: 1, at: timestamp(clock) }); },
  };
}

describe("nebula local render lifecycle; static Three fixtures, not browser evidence", () => {
  it("never promotes a decoded texture during visibility inspection", () => {
    const test = setup();
    test.inspect();
    test.advance();
    test.inspect();
    expect(test.state().status).toBe("decoded");
    expect(test.producer.rendered).not.toHaveBeenCalled();
    expect(test.draw()).toBe(true);
    expect(test.state()).toMatchObject({ status: "ready", decodedAt, renderedAt: timestamp(300) });
  });

  it("revokes ready for a hidden band and waits for a new draw after the band returns", () => {
    const test = setup();
    expect(test.draw()).toBe(true);
    test.advance();
    test.root.visible = false;
    test.inspect();
    expect(test.state()).toMatchObject({ status: "decoded", endedAt: null, renderedAt: null, renderInvalidatedAt: timestamp(300) });
    expect(test.producer.unobserved).toHaveBeenCalled();
    expect(test.draw()).toBe(false);
    test.root.visible = true;
    test.advance();
    test.inspect();
    expect(test.state().status).toBe("decoded");
    expect(test.producer.rendered).toHaveBeenCalledTimes(1);
    expect(test.draw()).toBe(true);
    expect(test.state()).toMatchObject({ status: "ready", renderedAt: timestamp(400), endedAt: timestamp(400) });
    expect(test.producer.rendered).toHaveBeenCalledTimes(2);
  });

  it("revokes offscreen ready even when renderer frustum culling is disabled", () => {
    const test = setup();
    test.mesh.frustumCulled = false;
    expect(test.draw()).toBe(true);
    test.advance();
    test.camera.rotation.y = Math.PI;
    test.inspect();
    expect(test.state().status).toBe("decoded");
    expect(test.draw()).toBe(false);
    test.camera.rotation.y = 0;
    test.inspect();
    expect(test.state().status).toBe("decoded");
    test.advance();
    expect(test.draw()).toBe(true);
  });

  it.each([0, 1, 2, -1, NaN])("a callback with drawRange.count=%s cannot report ready", (count) => {
    const test = setup();
    test.geometry.setDrawRange(0, count);
    expect(test.draw()).toBe(false);
    expect(test.producer.rendered).not.toHaveBeenCalled();
    expect(test.state().status).toBe("decoded");
  });

  it("rejects a callback beyond the index buffer and a zero-sized draw group", () => {
    const test = setup();
    test.geometry.setDrawRange(9999, Infinity);
    expect(test.draw()).toBe(false);
    test.geometry.setDrawRange(0, Infinity);
    expect(test.observer.afterDraw(test.mesh, test.camera, test.geometry, test.material, { start: 0, count: 0 })).toBe(false);
    expect(test.observer.afterDraw(test.mesh, test.camera, test.geometry, test.material, { start: 0, count: 3 })).toBe(true);
  });

  it("rejects malformed draw-group metadata instead of treating it as an ungrouped draw", () => {
    const test = setup();
    for (const group of [{}, "draw", { start: "0", count: 3 }, { start: 0, count: 3, materialIndex: "0" }]) {
      expect(test.observer.afterDraw(test.mesh, test.camera, test.geometry, test.material, group)).toBe(false);
    }
    expect(test.producer.rendered).not.toHaveBeenCalled();
  });

  it("rejects a plane collapsed by its own scale or an ancestor even with triangle indices", () => {
    const test = setup();
    test.mesh.scale.x = 0;
    expect(test.draw()).toBe(false);
    test.mesh.scale.x = 1;
    expect(test.draw()).toBe(true);
    test.advance();
    test.root.scale.y = 0;
    test.inspect();
    expect(test.state().status).toBe("decoded");
    expect(test.draw()).toBe(false);
    test.root.scale.y = 1;
    test.inspect();
    expect(test.state().status).toBe("decoded");
    expect(test.draw()).toBe(true);
  });

  it("revokes readiness when the material is hidden or the verified map is detached", () => {
    const test = setup();
    expect(test.draw()).toBe(true);
    test.advance();
    test.material.opacity = 0;
    test.inspect();
    expect(test.state().status).toBe("decoded");
    expect(test.draw()).toBe(false);
    test.material.opacity = 1;
    expect(test.draw()).toBe(true);
    test.advance();
    test.material.map = null;
    test.inspect();
    expect(test.state().status).toBe("decoded");
    expect(test.draw()).toBe(false);
    test.material.map = test.texture;
    expect(test.draw()).toBe(true);
  });

  it("rejects a stale texture or changed asset fingerprint", () => {
    const test = setup();
    test.setTexture(null);
    expect(test.draw()).toBe(false);
    test.setTexture(test.texture);
    test.texture.userData.atlasVisualAssetSha256 = "b".repeat(64);
    expect(test.draw()).toBe(false);
    expect(test.producer.rendered).not.toHaveBeenCalled();
  });

  it("ignores callbacks from replaced meshes, geometries, and materials", () => {
    const test = setup();
    const oldGeometry = new BufferGeometry();
    const oldMaterial = new MeshBasicMaterial();
    const oldMesh = new Mesh(oldGeometry, oldMaterial);
    cleanup.push(() => { oldGeometry.dispose(); oldMaterial.dispose(); });
    expect(test.observer.afterDraw(oldMesh, test.camera, test.geometry, test.material)).toBe(false);
    expect(test.observer.afterDraw(test.mesh, test.camera, oldGeometry, test.material)).toBe(false);
    expect(test.observer.afterDraw(test.mesh, test.camera, test.geometry, oldMaterial)).toBe(false);
    expect(test.producer.rendered).not.toHaveBeenCalled();
  });

  it("does not revive cancellation from a later callback before React flushes", () => {
    const test = setup();
    test.cancel();
    test.advance();
    test.inspect();
    expect(test.draw()).toBe(false);
    expect(test.state().status).toBe("cancelled");
    expect(test.producer.rendered).not.toHaveBeenCalled();
  });

  it("does not claim ready after the canonical producer loses its lease", () => {
    const test = setup();
    expect(test.draw()).toBe(true);
    test.advance();
    test.producer.rendered.mockReturnValue(false);
    expect(test.draw()).toBe(false);
    expect(test.state().status).toBe("decoded");
    expect(test.producer.unobserved).toHaveBeenCalled();
  });
});
