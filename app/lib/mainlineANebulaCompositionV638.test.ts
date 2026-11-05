import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdditiveBlending, BufferGeometry, Group, Material, Mesh, MeshBasicMaterial,
  NormalBlending, Object3D, PlaneGeometry, Points, Scene, ShaderMaterial, Texture,
} from "three";
import { WebGLRenderLists } from "three/src/renderers/webgl/WebGLRenderLists.js";
import { WebGLProperties } from "three/src/renderers/webgl/WebGLProperties.js";
import BrightStarCatalog from "../components/BrightStarCatalog";
import { createMainlineAScaleMaterialTrackerV638 } from "./mainlineAScaleMaterialLifecycleV638";
import { createMainlineANebulaImageMaterialV638, MAINLINE_A_NEBULA_IMAGE_RENDER_ORDER_V638 } from "./mainlineANebulaCompositionV638";

vi.mock("@react-three/fiber", () => ({ useThree: () => ({ size: { width: 0 } }) }));

function productionBackground() {
  type Props = { renderOrder: number; children: ReactElement<{ attach: string; object: BufferGeometry | ShaderMaterial }>[] };
  const capture: { props?: Props } = {};
  function Probe() { capture.props = BrightStarCatalog({}).props as Props; return null; }
  renderToStaticMarkup(createElement(Probe));
  const props = capture.props!;
  const geometry = props.children.find((child) => child.props.attach === "geometry")!.props.object as BufferGeometry;
  const material = props.children.find((child) => child.props.attach === "material")!.props.object as ShaderMaterial;
  const stars = new Points(geometry, material);
  stars.name = "catalog-stars"; stars.renderOrder = props.renderOrder;
  return stars;
}

function drawOrder(scene: Scene): string[] {
  const lists = new WebGLRenderLists(new WebGLProperties());
  const list = lists.get(scene, 0); list.init();
  function visit(object: Object3D, parentGroupOrder: number): void {
    const groupOrder = object instanceof Group ? object.renderOrder : parentGroupOrder;
    if (object instanceof Mesh || object instanceof Points) list.push(object, object.geometry, object.material as Material, groupOrder, 0, null);
    for (const child of object.children) visit(child, groupOrder);
  }
  visit(scene, 0); Reflect.apply(list.sort, list, []); list.finish();
  const names = [...list.opaque, ...list.transmissive, ...list.transparent].map((entry) => entry.object.name);
  lists.dispose(); return names;
}

function fixture(material: MeshBasicMaterial) {
  const stars = productionBackground();
  const background = new Group(); background.renderOrder = -500; background.add(stars);
  const image = new Mesh(new PlaneGeometry(1, 1), material);
  image.name = "observation-jpeg"; image.renderOrder = MAINLINE_A_NEBULA_IMAGE_RENDER_ORDER_V638;
  const billboard = new Group(); const inner = new Group(); billboard.add(inner); inner.add(image);
  const presentation = new Group(); presentation.add(billboard);
  const scene = new Scene(); scene.add(background, presentation);
  const dispose = () => { stars.geometry.dispose(); stars.material.dispose(); image.geometry.dispose(); material.dispose(); };
  return { scene, stars, image, presentation, dispose };
}

describe("observation JPEG foreground composition; real Three CPU queues, not GPU pixel acceptance", () => {
  it("reproduces the 068f background overpaint even with a high renderOrder on the opaque image", () => {
    const test = fixture(new MeshBasicMaterial({ depthWrite: false, depthTest: false, toneMapped: false }));
    expect(test.stars.material.transparent).toBe(true);
    expect(test.stars.material.depthTest).toBe(false);
    expect(test.stars.material.blending).toBe(AdditiveBlending);
    expect(drawOrder(test.scene)).toEqual(["observation-jpeg", "catalog-stars"]);
    test.image.renderOrder = 100000;
    expect(drawOrder(test.scene)).toEqual(["observation-jpeg", "catalog-stars"]);
    test.dispose();
  });

  it("draws the full-opacity production image after real catalog stars with normal source color", () => {
    const material = createMainlineANebulaImageMaterialV638();
    const test = fixture(material);
    const texture = new Texture(); texture.userData.atlasVisualAssetSha256 = "a".repeat(64); material.map = texture;
    expect(drawOrder(test.scene)).toEqual(["catalog-stars", "observation-jpeg"]);
    expect(material).toMatchObject({ transparent: true, opacity: 1, blending: NormalBlending, toneMapped: false, depthWrite: false, depthTest: false });
    expect(material.color.toArray()).toEqual([1, 1, 1]);
    expect(material.alphaMap).toBeNull(); expect(material.alphaTest).toBe(0);
    expect(material.map).toBe(texture); expect(material.map.userData.atlasVisualAssetSha256).toBe("a".repeat(64));
    test.dispose(); texture.dispose();
  });

  it("preserves queue ownership through scale fade and restores opaque pixels at full brightness", () => {
    const material = createMainlineANebulaImageMaterialV638();
    const test = fixture(material); const texture = new Texture(); material.map = texture;
    const tracker = createMainlineAScaleMaterialTrackerV638(test.presentation);
    for (const alpha of [0, .5, 1, .2, 1]) {
      tracker.update(alpha);
      expect(material.opacity).toBe(alpha);
      expect(material.transparent).toBe(true);
      expect(material.blending).toBe(NormalBlending);
      expect(drawOrder(test.scene)).toEqual(["catalog-stars", "observation-jpeg"]);
      expect(material.map).toBe(texture);
    }
    tracker.dispose();
    expect(material.opacity).toBe(1); expect(material.transparent).toBe(true);
    expect(tracker.materialCount).toBe(0);
    test.dispose(); texture.dispose();
  });

  it("owns independent materials and does not dispose a shared verified texture", () => {
    const first = createMainlineANebulaImageMaterialV638(); const second = createMainlineANebulaImageMaterialV638();
    const texture = new Texture(); const onDispose = vi.fn(); texture.addEventListener("dispose", onDispose);
    first.map = texture; second.map = texture;
    expect(first).not.toBe(second);
    first.opacity = .2; first.dispose();
    expect(second.opacity).toBe(1); expect(second.map).toBe(texture);
    expect(onDispose).not.toHaveBeenCalled();
    second.dispose(); texture.dispose(); expect(onDispose).toHaveBeenCalledTimes(1);
  });
});
