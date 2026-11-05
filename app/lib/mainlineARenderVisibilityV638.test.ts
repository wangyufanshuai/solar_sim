import { describe, expect, it } from "vitest";
import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, ShaderMaterial, SphereGeometry } from "three";
import { createMainlineARenderVisibilityV638 } from "./mainlineARenderVisibilityV638";

function setup() {
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  const root = new Group();
  const mesh = new Mesh(new SphereGeometry(1), new MeshBasicMaterial());
  mesh.position.z = -5;
  root.add(mesh);
  const visible = createMainlineARenderVisibilityV638();
  return { camera, root, mesh, visible: () => visible(mesh, camera) };
}
describe("render visibility invalidation", () => {
  it("tracks hidden ancestors and camera movement without producing a ready event", () => {
    const test = setup();
    expect(test.visible()).toBe(true);
    test.root.visible = false;
    expect(test.visible()).toBe(false);
    test.root.visible = true;
    test.camera.rotation.y = Math.PI;
    expect(test.visible()).toBe(false);
    test.camera.rotation.y = 0;
    expect(test.visible()).toBe(true);
  });
  it("rejects a hidden material, opacity zero, camera layer mismatch and empty draw range", () => {
    const test = setup();
    test.mesh.material.visible = false;
    expect(test.visible()).toBe(false);
    test.mesh.material.visible = true;
    test.mesh.material.opacity = 0;
    expect(test.visible()).toBe(false);
    test.mesh.material.opacity = 1;
    test.mesh.layers.set(2);
    expect(test.visible()).toBe(false);
    test.mesh.layers.set(0);
    test.mesh.geometry.setDrawRange(0, 0);
    expect(test.visible()).toBe(false);
  });
  it("checks shader alpha and transparent shared material arrays", () => {
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    const shader = new ShaderMaterial({ uniforms: { uOpacity: { value: 0 } } });
    const mesh = new Mesh(new SphereGeometry(1), [shader]);
    mesh.position.z = -5;
    const visible = createMainlineARenderVisibilityV638();
    mesh.geometry.addGroup(0, mesh.geometry.index!.count, 0);
    expect(visible(mesh, camera)).toBe(false);
    shader.uniforms.uOpacity.value = 0.2;
    expect(visible(mesh, camera)).toBe(true);
    shader.uniforms.uOpacity.value = NaN;
    expect(visible(mesh, camera)).toBe(false);
  });

  it.each([[0, -1], [0, NaN], [-1, Infinity], [NaN, Infinity], [1000000, Infinity], [0, 2]])(
    "rejects a renderer callback whose range start=%s count=%s cannot draw a triangle", (start, count) => {
      const test = setup();
      expect(test.visible()).toBe(true);
      test.mesh.geometry.setDrawRange(start, count);
      expect(test.visible()).toBe(false);
      test.mesh.geometry.setDrawRange(0, Infinity);
      expect(test.visible()).toBe(true);
    },
  );

  it("uses the actual index count and supports non-indexed geometry without accepting empty buffers", () => {
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    const geometry = new BufferGeometry();
    const material = new MeshBasicMaterial();
    const mesh = new Mesh(geometry, material);
    mesh.position.z = -5;
    const visible = createMainlineARenderVisibilityV638();
    expect(visible(mesh, camera)).toBe(false);
    geometry.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 0, 1, 0], 3));
    expect(visible(mesh, camera)).toBe(true);
    geometry.setIndex([]);
    expect(visible(mesh, camera)).toBe(false);
    geometry.setIndex([0, 1, 2]);
    expect(visible(mesh, camera)).toBe(true);
    geometry.setDrawRange(1, Infinity);
    expect(visible(mesh, camera)).toBe(false);
  });

  it("requires a nonempty group for the actual callback material, not another visible material", () => {
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    const geometry = new SphereGeometry(1);
    const hidden = new MeshBasicMaterial({ opacity: 0 });
    const shown = new MeshBasicMaterial();
    const mesh = new Mesh(geometry, [hidden, shown]);
    mesh.position.z = -5;
    const visible = createMainlineARenderVisibilityV638();
    expect(visible(mesh, camera)).toBe(false);
    geometry.addGroup(0, 6, 0);
    geometry.addGroup(6, 6, 1);
    expect(visible(mesh, camera)).toBe(true);
    expect(visible(mesh, camera, hidden, geometry.groups[0])).toBe(false);
    expect(visible(mesh, camera, shown, geometry.groups[1])).toBe(true);
    expect(visible(mesh, camera, shown, geometry.groups[0])).toBe(false);
    expect(visible(mesh, camera, new MeshBasicMaterial(), geometry.groups[1])).toBe(false);
    geometry.setDrawRange(0, 6);
    expect(visible(mesh, camera)).toBe(false);
    geometry.setDrawRange(0, Infinity);
    expect(visible(mesh, camera)).toBe(true);
  });

  it("invalidates offscreen meshes even if the renderer disables automatic frustum culling", () => {
    const test = setup();
    test.mesh.frustumCulled = false;
    test.mesh.position.x = 1000;
    expect(test.visible()).toBe(false);
    test.mesh.position.x = 0;
    expect(test.visible()).toBe(true);
    test.mesh.position.z = NaN;
    expect(test.visible()).toBe(false);
  });
});
