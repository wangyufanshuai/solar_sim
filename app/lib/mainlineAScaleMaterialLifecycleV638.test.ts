import { describe, expect, it, vi } from "vitest";
import { BufferGeometry, Group, Mesh, MeshBasicMaterial, ShaderMaterial, Texture } from "three";
import { createMainlineAScaleMaterialTrackerV638 } from "./mainlineAScaleMaterialLifecycleV638";

function fixture(opacity = 0.8) {
  const root = new Group();
  const material = new MeshBasicMaterial({ opacity });
  const mesh = new Mesh(new BufferGeometry(), material);
  root.add(mesh);
  const tracker = createMainlineAScaleMaterialTrackerV638(root);
  return { root, mesh, material, tracker };
}

describe("mainline A scale material lifecycle v638", () => {
  it("scales a replacement at stable layer opacity and immediately releases the previous state", () => {
    const { mesh, material, tracker } = fixture();
    const replacement = new MeshBasicMaterial({ opacity: 0.6 });
    tracker.update(0.5);
    mesh.material = replacement;
    tracker.update(0.5);
    expect(replacement.opacity).toBeCloseTo(0.3);
    expect(replacement.transparent).toBe(true);
    expect(replacement.depthWrite).toBe(false);
    expect(material.opacity).toBe(0.8);
    expect(material.transparent).toBe(false);
    expect(material.depthWrite).toBe(true);
    expect(tracker.materialCount).toBe(1);
    tracker.dispose();
    expect(replacement.opacity).toBe(0.6);
  });

  it("adopts externally updated base alpha without compounding across stable and zero scales", () => {
    const { material, tracker } = fixture();
    tracker.update(0.5);
    for (let i = 0; i < 100; i += 1) tracker.update(0.5);
    expect(material.opacity).toBe(0.4);
    material.opacity = 0.7;
    tracker.update(0.5);
    expect(material.opacity).toBe(0.35);
    tracker.update(0);
    material.opacity = 0.6;
    tracker.update(0);
    expect(material.opacity).toBe(0);
    tracker.update(1);
    expect(material.opacity).toBe(0.6);
    tracker.update(0.25);
    tracker.dispose();
    expect(material.opacity).toBe(0.6);
  });

  it("tracks shader alpha separately and releases replaced uniform targets", () => {
    const root = new Group();
    const originalUniform = { value: 0.8 };
    const material = new ShaderMaterial({ opacity: 0.9, uniforms: { uOpacity: originalUniform } });
    root.add(new Mesh(new BufferGeometry(), material));
    const tracker = createMainlineAScaleMaterialTrackerV638(root);
    tracker.update(0.5);
    expect(originalUniform.value).toBe(0.4);
    expect(material.opacity).toBe(0.9);
    originalUniform.value = 0.7;
    tracker.update(0.5);
    expect(originalUniform.value).toBe(0.35);
    const replacementUniform = { value: 0.6 };
    material.uniforms.uOpacity = replacementUniform;
    tracker.update(0.5);
    expect(originalUniform.value).toBe(0.7);
    expect(replacementUniform.value).toBe(0.3);
    delete material.uniforms.uOpacity;
    tracker.update(0.5);
    expect(replacementUniform.value).toBe(0.6);
    expect(material.opacity).toBe(0.45);
    tracker.dispose();
    expect(material.opacity).toBe(0.9);
  });

  it("drops disposed materials synchronously and does not touch them on later frames or cleanup", () => {
    const { mesh, material, tracker } = fixture();
    const dispose = vi.spyOn(material, "dispose");
    tracker.update(0.5);
    material.dispose();
    expect(tracker.materialCount).toBe(0);
    material.opacity = 0.72;
    tracker.update(0.25);
    expect(tracker.materialCount).toBe(0);
    expect(material.opacity).toBe(0.72);
    mesh.material = new MeshBasicMaterial({ opacity: 0.4 });
    tracker.update(0.25);
    expect(tracker.materialCount).toBe(1);
    expect(mesh.material.opacity).toBe(0.1);
    tracker.dispose();
    expect(material.opacity).toBe(0.72);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("observes nested subtree additions and releases detached nodes without waiting for another frame", () => {
    const { root, material, tracker } = fixture();
    const subtree = new Group();
    const nested = new Group();
    const addedMaterial = new MeshBasicMaterial({ opacity: 0.6 });
    subtree.add(nested);
    nested.add(new Mesh(new BufferGeometry(), addedMaterial));
    tracker.update(0.5);
    root.add(subtree);
    expect(tracker.objectCount).toBe(5);
    expect(tracker.materialCount).toBe(2);
    expect(addedMaterial.opacity).toBe(0.3);
    root.remove(subtree);
    expect(tracker.objectCount).toBe(2);
    expect(tracker.materialCount).toBe(1);
    expect(addedMaterial.opacity).toBe(0.6);
    const detachedMaterial = new MeshBasicMaterial({ opacity: 0.2 });
    nested.add(new Mesh(new BufferGeometry(), detachedMaterial));
    expect(detachedMaterial.opacity).toBe(0.2);
    expect(tracker.materialCount).toBe(1);
    root.add(subtree);
    expect(tracker.materialCount).toBe(3);
    expect(detachedMaterial.opacity).toBe(0.1);
    tracker.dispose();
    expect(material.opacity).toBe(0.8);
    expect(addedMaterial.opacity).toBe(0.6);
    expect(detachedMaterial.opacity).toBe(0.2);
  });

  it("keeps shared material ownership until its final node detaches and never disposes borrowed resources", () => {
    const root = new Group();
    const texture = new Texture();
    const material = new MeshBasicMaterial({ opacity: 0.8, map: texture });
    const geometry = new BufferGeometry();
    const first = new Mesh(geometry, [material, material]);
    const second = new Mesh(geometry, material);
    root.add(first, second);
    const disposeMaterial = vi.spyOn(material, "dispose");
    const disposeGeometry = vi.spyOn(geometry, "dispose");
    const disposeTexture = vi.spyOn(texture, "dispose");
    const tracker = createMainlineAScaleMaterialTrackerV638(root);
    tracker.update(0.5);
    expect(material.opacity).toBe(0.4);
    root.remove(first);
    expect(tracker.materialCount).toBe(1);
    expect(material.opacity).toBe(0.4);
    root.remove(second);
    expect(tracker.materialCount).toBe(0);
    expect(material.opacity).toBe(0.8);
    tracker.dispose();
    expect(disposeMaterial).not.toHaveBeenCalled();
    expect(disposeGeometry).not.toHaveBeenCalled();
    expect(disposeTexture).not.toHaveBeenCalled();
  });

  it("detects in-place material-array edits and array removal at an unchanged scale", () => {
    const root = new Group();
    const first = new MeshBasicMaterial({ opacity: 0.8 });
    const retained = new MeshBasicMaterial({ opacity: 0.6 });
    const replacement = new MeshBasicMaterial({ opacity: 0.4 });
    const mesh = new Mesh(new BufferGeometry(), [first, retained]);
    root.add(mesh);
    const tracker = createMainlineAScaleMaterialTrackerV638(root);
    tracker.update(0.5);
    mesh.material[0] = replacement;
    tracker.update(0.5);
    expect(tracker.materialCount).toBe(2);
    expect(first.opacity).toBe(0.8);
    expect(retained.opacity).toBe(0.3);
    expect(replacement.opacity).toBe(0.2);
    mesh.material.length = 0;
    tracker.update(0.5);
    expect(tracker.materialCount).toBe(0);
    expect(retained.opacity).toBe(0.6);
    expect(replacement.opacity).toBe(0.4);
    tracker.dispose();
  });

  it("preserves external writes that occur after its last composition during cleanup", () => {
    const { material, tracker } = fixture();
    tracker.update(0.5);
    material.opacity = 0.71;
    material.transparent = false;
    material.depthWrite = true;
    tracker.dispose();
    expect(material.opacity).toBe(0.71);
    expect(material.transparent).toBe(false);
    expect(material.depthWrite).toBe(true);
  });

  it("restores current external base flags instead of stale mount-time flags", () => {
    const { material, tracker } = fixture();
    tracker.update(1);
    material.transparent = true;
    material.depthWrite = false;
    tracker.update(1);
    tracker.update(0.5);
    tracker.dispose();
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(material.opacity).toBe(0.8);
  });

  it("releases every event subscription and supports Strict Mode setup-cleanup-setup", () => {
    const { root, mesh, material, tracker } = fixture();
    const removeRoot = vi.spyOn(root, "removeEventListener");
    const removeMesh = vi.spyOn(mesh, "removeEventListener");
    const removeMaterial = vi.spyOn(material, "removeEventListener");
    tracker.update(0.5);
    tracker.dispose();
    tracker.dispose();
    expect(removeRoot).toHaveBeenCalledTimes(2);
    expect(removeMesh).toHaveBeenCalledTimes(2);
    expect(removeMaterial).toHaveBeenCalledTimes(1);
    expect(tracker.objectCount).toBe(0);
    expect(tracker.materialCount).toBe(0);
    const added = new MeshBasicMaterial({ opacity: 0.6 });
    root.add(new Mesh(new BufferGeometry(), added));
    tracker.update(0.5);
    expect(added.opacity).toBe(0.6);
    const next = createMainlineAScaleMaterialTrackerV638(root);
    next.update(0.5);
    expect(material.opacity).toBe(0.4);
    expect(added.opacity).toBe(0.3);
    next.dispose();
    expect(material.opacity).toBe(0.8);
    expect(added.opacity).toBe(0.6);
  });

  it("does not traverse unchanged scene branches on each frame or retain churned materials", () => {
    const { root, mesh, tracker } = fixture();
    const branch = new Group();
    for (let i = 0; i < 100; i += 1) branch.add(new Group());
    root.add(branch);
    const rootTraversal = vi.spyOn(root, "traverse");
    const branchTraversal = vi.spyOn(branch, "traverse");
    for (let i = 0; i < 50; i += 1) {
      const previous = mesh.material;
      mesh.material = new MeshBasicMaterial({ opacity: 0.8 });
      tracker.update(0.5);
      expect(previous.opacity).toBe(0.8);
      expect(tracker.materialCount).toBe(1);
      expect(mesh.material.opacity).toBe(0.4);
    }
    expect(rootTraversal).not.toHaveBeenCalled();
    expect(branchTraversal).not.toHaveBeenCalled();
    tracker.dispose();
    expect(tracker.objectCount).toBe(0);
    expect(tracker.materialCount).toBe(0);
  });
});
