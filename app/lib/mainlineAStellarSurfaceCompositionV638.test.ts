import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdditiveBlending, BufferGeometry, Group, Material, Mesh, MeshBasicMaterial,
  NormalBlending, Object3D, Points, Scene, ShaderMaterial, Texture,
} from "three";
import { WebGLRenderLists } from "three/src/renderers/webgl/WebGLRenderLists.js";
import { WebGLProperties } from "three/src/renderers/webgl/WebGLProperties.js";
import BrightStarCatalog from "../components/BrightStarCatalog";
import StellarPortraitMaterial, { StellarCoronaMaterial, StellarHaloMaterial } from "../components/StellarPortraitMaterial";
import StellarPortraitMaterialV596, { StellarCoronaMaterialV596, StellarHaloMaterialV596 } from "../components/StellarPortraitMaterialV596";
import { createMainlineAScaleMaterialTrackerV638 } from "./mainlineAScaleMaterialLifecycleV638";
import {
  createMainlineAStellarSurfaceCompositionV638,
  MAINLINE_A_STELLAR_SURFACE_RENDER_ORDER_V638,
} from "./mainlineAStellarSurfaceCompositionV638";
import { stellarMaterialProfile } from "./stellarMaterialProfile";
import { STELLAR_HERO_BY_ID_V592 } from "./stellarHeroesV592";
import { createStellarPortraitProfileV7 } from "./stellarPortraitProfileV7";
import {
  createStellarPortraitProfileFromRenderContractV594,
  createStellarPortraitRenderContractV594,
} from "./stellarPortraitRenderContractV594";
import {
  createStellarPortraitProfileFromRenderContractV596,
  createStellarPortraitRenderContractV596,
} from "./stellarPortraitRenderContractV596";

vi.mock("@react-three/fiber", () => ({
  useFrame: () => undefined,
  useThree: () => ({ size: { width: 0 } }),
}));

// Run the real components' memoized material constructors in a React render.
// These tests exercise Three's CPU render queues, not a GPU or screenshot.
function captureProps<P>(useElement: () => ReactElement): P {
  const capture: { element?: ReactElement } = {};
  function Probe() {
    capture.element = useElement();
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  if (!capture.element) throw new Error("Expected a rendered element");
  return capture.element.props as P;
}

function captureMaterial(useElement: () => ReactElement): ShaderMaterial {
  return captureProps<{ object: ShaderMaterial }>(useElement).object;
}

function productionMaterials(variant: "v596" | "baseline" | "generic", mode: "science" | "cinematic") {
  const hero = STELLAR_HERO_BY_ID_V592.vega;
  const material = stellarMaterialProfile({
    id: hero.id, colorBpRp: hero.colorBpRp,
    mag: hero.apparentMagnitudeV, parallaxMas: hero.parallaxMas,
  });
  const phaseSource = { getJulianDate: () => 2451545 };
  if (variant === "v596") {
    const renderContract = createStellarPortraitRenderContractV596(hero, mode);
    const portrait = createStellarPortraitProfileFromRenderContractV596(renderContract, material);
    return {
      surface: captureMaterial(() => StellarPortraitMaterialV596({ portrait, renderContract, phaseSource })),
      halo: captureMaterial(() => StellarHaloMaterialV596({ portrait, renderContract })),
      corona: captureMaterial(() => StellarCoronaMaterialV596({ portrait, renderContract, phaseSource })),
    };
  }
  const renderContract = variant === "baseline" ? createStellarPortraitRenderContractV594(hero, mode) : undefined;
  const portrait = renderContract
    ? createStellarPortraitProfileFromRenderContractV594(renderContract, material)
    : createStellarPortraitProfileV7({ material });
  const runtime = renderContract ? { mode, renderContract, phaseSource } : { mode };
  return {
    surface: captureMaterial(() => StellarPortraitMaterial({ material, portrait, ...runtime })),
    halo: captureMaterial(() => StellarHaloMaterial({ portrait, ...runtime })),
    corona: captureMaterial(() => StellarCoronaMaterial({ portrait, ...runtime })),
  };
}

function queueFixture(variant: "v596" | "baseline" | "generic" = "v596", mode: "science" | "cinematic" = "cinematic") {
  const materials = productionMaterials(variant, mode);
  const catalog = captureProps<{
    renderOrder: number;
    children: ReactElement<{ attach: string; object: BufferGeometry | ShaderMaterial }>[];
  }>(() => BrightStarCatalog({}));
  const geometry = catalog.children.find((child) => child.props.attach === "geometry")!.props.object as BufferGeometry;
  const catalogMaterial = catalog.children.find((child) => child.props.attach === "material")!.props.object as ShaderMaterial;
  const background = new Points(geometry, catalogMaterial);
  background.name = "background";
  background.renderOrder = catalog.renderOrder;
  const backdrop = new Group();
  backdrop.renderOrder = -500; // ScienceBackdrop's actual parent group.
  backdrop.add(background);
  const surface = new Mesh(new BufferGeometry(), materials.surface);
  surface.name = "surface";
  surface.renderOrder = 47; // Original SelectedSkyTargetProxy order.
  const halo = new Mesh(new BufferGeometry(), materials.halo);
  halo.name = "halo";
  halo.renderOrder = 45;
  const corona = new Mesh(new BufferGeometry(), materials.corona);
  corona.name = "corona";
  corona.renderOrder = 46;
  // Each Billboard has two default-order groups; neither inherits backdrop -500.
  const surfaceBillboard = new Group();
  const surfaceInner = new Group();
  surfaceBillboard.add(surfaceInner);
  surfaceInner.add(surface, corona);
  const haloBillboard = new Group();
  const haloInner = new Group();
  haloBillboard.add(haloInner);
  haloInner.add(halo);
  const portrait = new Group();
  portrait.add(surfaceBillboard, haloBillboard);
  const scene = new Scene();
  scene.add(backdrop, portrait);
  return { scene, surface, halo, corona, background, materials };
}

function drawOrder(scene: Scene) {
  const lists = new WebGLRenderLists(new WebGLProperties());
  const list = lists.get(scene, 0);
  list.init();
  function visit(object: Object3D, parentGroupOrder: number): void {
    const groupOrder = object instanceof Group ? object.renderOrder : parentGroupOrder;
    if (object instanceof Mesh || object instanceof Points) {
      list.push(object, object.geometry, object.material as Material, groupOrder, 0, null);
    }
    for (const child of object.children) visit(child, groupOrder);
  }
  visit(scene, 0);
  // Installed Three accepts omitted callbacks to select its real default sorts;
  // @types/three still marks both callbacks as required.
  Reflect.apply(list.sort, list, []);
  list.finish();
  // WebGLRenderer submits these three lists in this order, independent of
  // renderOrder values in a different list.
  return [...list.opaque, ...list.transmissive, ...list.transparent].map((item) => item.object.name);
}

function preservedState(material: ShaderMaterial) {
  return {
    vertexShader: material.vertexShader, fragmentShader: material.fragmentShader,
    uniforms: JSON.stringify(material.uniforms), userData: JSON.stringify(material.userData),
    opacity: material.opacity, blending: material.blending,
    depthWrite: material.depthWrite, depthTest: material.depthTest,
    side: material.side, toneMapped: material.toneMapped,
  };
}

describe("selected stellar surface composition v638", () => {
  it("reproduces late depth-free catalog paint with the real opaque surface even at a very high renderOrder", () => {
    const { scene, surface, background } = queueFixture();
    expect(surface.material.transparent).toBe(false);
    expect(background.material.transparent).toBe(true);
    expect(background.material.depthTest).toBe(false);
    expect(background.material.depthWrite).toBe(false);
    expect(background.material.blending).toBe(AdditiveBlending);
    expect(drawOrder(scene)).toEqual(["surface", "background", "halo", "corona"]);
    surface.renderOrder = 100000;
    expect(drawOrder(scene)).toEqual(["surface", "background", "halo", "corona"]);
  });

  it.each([
    ["v596", "cinematic"], ["v596", "science"],
    ["baseline", "cinematic"], ["baseline", "science"],
    ["generic", "cinematic"], ["generic", "science"],
  ] as const)("covers the background before halo/corona with the real %s %s shader and unchanged opaque pixels", (variant, mode) => {
    const { scene, surface, materials, background } = queueFixture(variant, mode);
    const original = preservedState(surface.material);
    const haloBefore = preservedState(materials.halo);
    const coronaBefore = preservedState(materials.corona);
    const backgroundBefore = preservedState(background.material);
    const composition = createMainlineAStellarSurfaceCompositionV638();
    composition.update(surface);
    surface.renderOrder = MAINLINE_A_STELLAR_SURFACE_RENDER_ORDER_V638;
    expect(drawOrder(scene)).toEqual(["background", "surface", "halo", "corona"]);
    expect(surface.material.fragmentShader).toContain("gl_FragColor = vec4(color, 1.0)");
    expect(surface.material.opacity).toBe(1);
    expect(surface.material.depthWrite).toBe(true);
    expect(surface.material.depthTest).toBe(true);
    expect(surface.material.blending).toBe(NormalBlending);
    expect(preservedState(surface.material)).toEqual(original);
    expect(preservedState(materials.halo)).toEqual(haloBefore);
    expect(preservedState(materials.corona)).toEqual(coronaBefore);
    expect(preservedState(background.material)).toEqual(backgroundBefore);
    composition.dispose();
    expect(surface.material.transparent).toBe(false);
  });

  it("avoids repeat shader invalidation and releases only its flag, never the borrowed resources", () => {
    const texture = new Texture();
    const material = new MeshBasicMaterial({ map: texture });
    const geometry = new BufferGeometry();
    const mesh = new Mesh(geometry, material);
    const disposeMaterial = vi.spyOn(material, "dispose");
    const disposeGeometry = vi.spyOn(geometry, "dispose");
    const disposeTexture = vi.spyOn(texture, "dispose");
    const removeListener = vi.spyOn(material, "removeEventListener");
    const composition = createMainlineAStellarSurfaceCompositionV638();
    composition.update(mesh);
    const version = material.version;
    for (let i = 0; i < 100; i += 1) composition.update(mesh);
    expect(material.version).toBe(version);
    expect(composition.materialCount).toBe(1);
    composition.dispose();
    composition.dispose();
    composition.update(mesh);
    expect(material.transparent).toBe(false);
    expect(composition.materialCount).toBe(0);
    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).not.toHaveBeenCalled();
    expect(disposeGeometry).not.toHaveBeenCalled();
    expect(disposeTexture).not.toHaveBeenCalled();
  });

  it("does not claim an already-transparent flag or overwrite an external opaque flag on release", () => {
    const material = new MeshBasicMaterial({ transparent: true });
    const mesh = new Mesh(new BufferGeometry(), material);
    const composition = createMainlineAStellarSurfaceCompositionV638();
    composition.update(mesh);
    composition.update(null);
    expect(material.transparent).toBe(true);
    expect(material.version).toBe(0);
    material.transparent = false;
    composition.update(mesh);
    material.transparent = false;
    const version = material.version;
    composition.dispose();
    expect(material.transparent).toBe(false);
    expect(material.version).toBe(version);
  });

  it("handles replacement, material-array edits, removal and Strict Mode setup-cleanup-setup", () => {
    const first = new MeshBasicMaterial();
    const replacement = new MeshBasicMaterial();
    const mesh = new Mesh(new BufferGeometry(), [first, first]);
    const added = vi.spyOn(first, "addEventListener");
    const composition = createMainlineAStellarSurfaceCompositionV638();
    composition.update(mesh);
    expect(added).toHaveBeenCalledTimes(1);
    mesh.material = [replacement];
    composition.update(mesh);
    expect(first.transparent).toBe(false);
    expect(replacement.transparent).toBe(true);
    expect(composition.materialCount).toBe(1);
    mesh.material.length = 0;
    composition.update(mesh);
    expect(replacement.transparent).toBe(false);
    expect(composition.materialCount).toBe(0);
    mesh.material.push(first);
    composition.update(mesh);
    composition.dispose();
    expect(first.transparent).toBe(false);
    const next = createMainlineAStellarSurfaceCompositionV638();
    next.update(mesh);
    expect(first.transparent).toBe(true);
    next.dispose();
    expect(first.transparent).toBe(false);
  });

  it.each([false, true])("drops a disposed material without later writes (initial transparent=%s)", (transparent) => {
    const material = new MeshBasicMaterial({ transparent });
    const mesh = new Mesh(new BufferGeometry(), material);
    const remove = vi.spyOn(material, "removeEventListener");
    const dispose = vi.spyOn(material, "dispose");
    const composition = createMainlineAStellarSurfaceCompositionV638();
    composition.update(mesh);
    material.dispose();
    expect(composition.materialCount).toBe(0);
    material.transparent = false;
    const version = material.version;
    composition.update(mesh);
    expect(material.transparent).toBe(false);
    expect(material.version).toBe(version);
    mesh.material = new MeshBasicMaterial();
    composition.update(mesh);
    expect(composition.materialCount).toBe(1);
    expect(mesh.material.transparent).toBe(true);
    composition.dispose();
    expect(material.transparent).toBe(false);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["scale-first", "scale-first"], ["scale-first", "composition-first"],
    ["composition-first", "scale-first"], ["composition-first", "composition-first"],
  ] as const)("interoperates with scale fading, replacement and cleanup: install %s / release %s", (installOrder, releaseOrder) => {
    const { surface } = queueFixture();
    const original = surface.material;
    const root = new Group();
    root.add(surface);
    const composition = createMainlineAStellarSurfaceCompositionV638();
    if (installOrder === "composition-first") composition.update(surface);
    const tracker = createMainlineAScaleMaterialTrackerV638(root);
    if (installOrder === "scale-first") composition.update(surface);
    function frame(opacity: number) {
      tracker.update(opacity); // AtlasScaleLayerGroup priority -20.
      composition.update(surface); // SelectedSkyTargetProxy priority -19.
      expect(surface.material.transparent).toBe(true);
      expect(surface.material.depthWrite).toBe(opacity === 1);
      expect(surface.material.opacity).toBe(opacity);
    }
    frame(1);
    frame(0.5);
    frame(1);
    const replacement = productionMaterials("baseline", "science").surface;
    surface.material = replacement;
    frame(0.5);
    expect(original.transparent).toBe(false);
    expect(original.depthWrite).toBe(true);
    expect(original.opacity).toBe(1);
    frame(1);
    frame(1); // The scale tracker can now observe the composition's queue flag.
    root.remove(surface);
    composition.update(null);
    expect(replacement.transparent).toBe(false);
    expect(replacement.depthWrite).toBe(true);
    expect(replacement.opacity).toBe(1);
    root.add(surface);
    frame(0.5);
    if (releaseOrder === "scale-first") {
      tracker.dispose();
      composition.dispose();
    } else {
      composition.dispose();
      tracker.dispose();
    }
    expect(replacement.transparent).toBe(false);
    expect(replacement.depthWrite).toBe(true);
    expect(replacement.opacity).toBe(1);
  });

  it("repairs a scale-first mid-fade attachment before queue construction when scale returns to one", () => {
    const root = new Group();
    const tracker = createMainlineAScaleMaterialTrackerV638(root);
    tracker.update(0.5);
    const { surface, scene } = queueFixture();
    root.add(surface); // childadded applies fading before the proxy can borrow it.
    scene.add(root);
    expect(surface.material.transparent).toBe(true);
    const composition = createMainlineAStellarSurfaceCompositionV638();
    const version = surface.material.version;
    composition.update(surface);
    expect(surface.material.version).toBe(version);
    tracker.update(1);
    expect(surface.material.transparent).toBe(false); // One-time setup would fail.
    composition.update(surface);
    surface.renderOrder = MAINLINE_A_STELLAR_SURFACE_RENDER_ORDER_V638;
    expect(drawOrder(scene)).toEqual(["background", "surface", "halo", "corona"]);
    expect(surface.material.depthWrite).toBe(true);
    expect(surface.material.opacity).toBe(1);
    tracker.update(1);
    composition.update(surface);
    tracker.dispose();
    composition.dispose();
    expect(surface.material.transparent).toBe(false);
  });
});
