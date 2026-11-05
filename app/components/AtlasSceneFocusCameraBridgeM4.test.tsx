import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { requestAtlasCameraPresentationLeaseV273, resetAtlasCameraPresentationLeaseForTestsV273 } from "../lib/atlasCameraPresentationLeaseV273";
import { dispatchCameraFocusDirection } from "../lib/camera-bridge";
import { celestialEntryToDirection, selectCelestialCatalogEntry } from "../lib/celestialCatalog";
import { createFloatingOrigin } from "../lib/floatingOrigin";
import { captureMainlineAObservationBookmarkM4, restoreMainlineAObservationBookmarkM4 } from "../lib/mainlineAObservationCameraBookmarkM4";
import { registerMainlineAJourneyViewportM4, resolveMainlineAJourneyViewportM4 } from "../lib/mainlineAJourneyViewportM4";
import type { ConstellationDomMeasurementV638 } from "../lib/mainlineAConstellationLabelOcclusionV638";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { CameraFocusBodyBridge } from "./AtlasSceneFocusCameraBridge";

type HookSlot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
type Harness = { slots: HookSlot[]; index: number; effects: Array<() => void>; frames: Array<(state: unknown, dt: number) => void>; state: unknown; publish?: (measurement: ConstellationDomMeasurementV638 | null) => void };
const harness = vi.hoisted(() => ({ current: null as Harness | null }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  const slot = () => {
    const current = harness.current!;
    return current.slots[current.index++] ?? (current.slots[current.index - 1] = {});
  };
  const changed = (before: readonly unknown[] | undefined, next: readonly unknown[] | undefined) => !before || !next || before.length !== next.length || before.some((value, index) => !Object.is(value, next[index]));
  return {
    ...actual,
    useRef: (initial: unknown) => { const current = slot(); return current.value ?? (current.value = { current: initial }); },
    useCallback: (callback: unknown, deps?: readonly unknown[]) => { const current = slot(); if (changed(current.deps, deps)) { current.value = callback; current.deps = deps; } return current.value; },
    useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
      const current = slot();
      if (changed(current.deps, deps)) harness.current!.effects.push(() => { current.cleanup?.(); current.cleanup = effect() || undefined; current.deps = deps; });
    },
  };
});
vi.mock("@react-three/fiber", () => ({
  useThree: (selector: (state: unknown) => unknown) => selector(harness.current!.state),
  useFrame: (callback: (state: unknown, dt: number) => void) => { harness.current!.frames.push(callback); },
}));
vi.mock("../lib/mainlineAConstellationLabelOcclusionV638", () => ({ observeMainlineAConstellationDomV638: (_canvas: unknown, publish: (measurement: ConstellationDomMeasurementV638 | null) => void) => {
  harness.current!.publish = publish;
  return () => {};
} }));

const cleanups: Array<() => void> = [];
let now = 1000;
let attributes: Map<string, string>;
beforeEach(() => {
  now = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("window", Object.assign(new EventTarget(), { matchMedia: () => ({ matches: false }) }));
  attributes = new Map();
  vi.stubGlobal("document", { querySelector: () => ({ dataset: {}, setAttribute: (key: string, value: string) => attributes.set(key, value) }) });
  resetAtlasCameraPresentationLeaseForTestsV273();
  atlasRuntimeStore.resetFocus();
  atlasRuntimeStore.setSceneMode("atlas");
  atlasRuntimeStore.setExperienceMode("explore");
  atlasRuntimeStore.closeResearchOverlay();
  atlasRuntimeStore.setScaleBand("stellar");
});
afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  atlasRuntimeStore.setSafeViewportRect(null);
  resetAtlasCameraPresentationLeaseForTestsV273();
});

function mount() {
  const camera = new THREE.PerspectiveCamera(52, 1280 / 720, .01, 1e9);
  camera.position.set(-310, 108, 560);
  const controls = new OrbitControls(camera);
  const props = {
    physicsRef: { current: { n: SOLAR_SYSTEM_BODIES.length, posAu: new Float64Array(SOLAR_SYSTEM_BODIES.length * 3) } as SolarSystemPhysicsRef },
    floatingOriginRef: { current: createFloatingOrigin() }, earthMoonView: false,
    controlsRef: { current: controls }, presentationMode: "orbit-atlas" as const, atlasScaleMode: "compressed" as const,
  };
  const state = { camera, size: { width: 1280, height: 720 }, gl: { domElement: {} } };
  const instance: Harness = { slots: [], index: 0, effects: [], frames: [], state };
  const render = () => {
    harness.current = instance; instance.index = 0; instance.frames = [];
    CameraFocusBodyBridge(props);
    for (const effect of instance.effects.splice(0)) effect();
  };
  const resize = (width: number, height: number, right = width, bottom = height - 78) => {
    state.size = { width, height }; camera.aspect = width / height;
    atlasRuntimeStore.setSafeViewportRect({ left: 0, top: 108, right, bottom, viewportWidth: width, viewportHeight: height });
    render();
  };
  let unmounted = false;
  const unmount = () => {
    if (unmounted) return; unmounted = true;
    for (const slot of [...instance.slots].reverse()) slot.cleanup?.();
    controls.dispose();
  };
  cleanups.push(unmount);
  resize(1280, 720, 864, 642);
  const advance = (ms = 3000) => { now += ms; for (const callback of instance.frames) callback(state, ms / 1000); camera.updateMatrixWorld(); };
  const request = (id: string) => {
    const direction = celestialEntryToDirection(selectCelestialCatalogEntry(id)!)!;
    atlasRuntimeStore.requestFocus({ kind: "catalog-object", catalogId: id, objectId: id, direction }, "object-browser");
    dispatchCameraFocusDirection(direction, id.startsWith("constellation:") ? id : undefined);
    return atlasRuntimeStore.getSnapshot().focusRequestId;
  };
  const focus = (id: string) => { const requestId = request(id); advance(); advance(16); return requestId; };
  const orbit = () => {
    controls.dispatchEvent({ type: "start" });
    const offset = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), .31).multiplyScalar(1.3);
    camera.position.copy(controls.target).add(offset); controls.update(); advance(16);
    controls.dispatchEvent({ type: "end" }); advance(16);
  };
  return { camera, controls, resize, advance, focus, request, orbit, unmount, measure: (measurement: ConstellationDomMeasurementV638 | null) => instance.publish?.(measurement) };
}

describe("M4 actual sky camera bridge restoration", () => {
  it("restores a manually orbited pose and holds it on the following frame", () => {
    const rig = mount(); rig.focus("constellation:Ori"); rig.orbit();
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    expect(bookmark).not.toBeNull();
    expect(atlasRuntimeStore.getSnapshot().focusTransition).toBe("locked");
    rig.focus("nebula:m42");
    const requestId = rig.focus("constellation:Ori");
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(true);
    rig.advance(16);
    expect(rig.camera.position.distanceTo(new THREE.Vector3().fromArray(bookmark.pose.position))).toBeLessThan(1e-7);
    expect(rig.controls.target.toArray()).toEqual(bookmark.pose.target);
    expect(attributes.get("data-mainline-a-bookmark-distance-bound-adjusted")).toBe("false");
    expect(attributes.get("data-atlas-camera-actual-quaternion")).toBeDefined();
  });
  it("allows a locked subscriber to restore synchronously after its own request", () => {
    const rig = mount(); rig.focus("constellation:Ori"); rig.orbit();
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    rig.focus("nebula:m42");
    const requestId = rig.request("constellation:Ori");
    let restored: boolean | undefined;
    const unsubscribe = atlasRuntimeStore.subscribe(() => {
      if (atlasRuntimeStore.getSnapshot().focusTransition === "locked") restored = restoreMainlineAObservationBookmarkM4(bookmark, requestId);
    });
    rig.advance(); unsubscribe();
    expect(restored).toBe(true); rig.advance(16);
    expect(rig.camera.position.distanceTo(new THREE.Vector3().fromArray(bookmark.pose.position))).toBeLessThan(1e-7);
  });
  it.each(["scale-journey", "scene-handoff"] as const)("rejects %s ownership without camera mutation", (owner) => {
    const rig = mount(); rig.focus("constellation:Ori");
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    const requestId = rig.focus("constellation:Ori");
    requestAtlasCameraPresentationLeaseV273(owner, 100);
    const position = rig.camera.position.clone();
    expect(captureMainlineAObservationBookmarkM4()).toBeNull();
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
    rig.advance(16); expect(rig.camera.position.equals(position)).toBe(true);
  });
  it("rejects a new selection, wrong request and transition before touching the camera", () => {
    const rig = mount(); const first = rig.focus("constellation:Ori");
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    const requestId = rig.request("constellation:Ori");
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
    rig.advance();
    expect(restoreMainlineAObservationBookmarkM4(bookmark, first)).toBe(false);
    const other = rig.focus("nebula:m42"); const position = rig.camera.position.clone();
    expect(restoreMainlineAObservationBookmarkM4(bookmark, other)).toBe(false);
    expect(rig.camera.position.equals(position)).toBe(true);
  });
  it("keeps its capability across resize and re-solves the safe view without replaying old offset", () => {
    const rig = mount(); rig.focus("constellation:Ori"); rig.orbit();
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    const oldView = { ...rig.camera.view };
    rig.resize(390, 844, 390, 270);
    const requestId = rig.focus("constellation:Ori");
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(true);
    const restored = rig.camera.position.clone(); rig.advance(16);
    expect(rig.camera.position.distanceTo(restored)).toBeLessThan(1e-7);
    expect(rig.camera.view?.fullWidth).toBe(390);
    expect(rig.camera.view?.offsetX).not.toBe(oldView.offsetX);
    const oldDirection = new THREE.Vector3().fromArray(bookmark.pose.position).sub(new THREE.Vector3().fromArray(bookmark.pose.target)).normalize();
    expect(rig.camera.position.clone().sub(rig.controls.target).normalize().distanceTo(oldDirection)).toBeLessThan(1e-10);
    expect(attributes.get("data-mainline-a-bookmark-distance-bound-adjusted")).toBe("true");
  });
  it.each(["kerr", "scene-lab", "relativity-lab"] as const)("refuses scene %s and refuses return after a scene revision", (scene) => {
    const rig = mount(); rig.focus("constellation:Ori");
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    const requestId = rig.focus("constellation:Ori");
    atlasRuntimeStore.setSceneMode(scene);
    expect(captureMainlineAObservationBookmarkM4()).toBeNull();
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
    atlasRuntimeStore.setSceneMode("atlas");
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
  });
  it("refuses research, active user input, and even a same-band manual scale request", () => {
    const rig = mount(); rig.focus("constellation:Ori");
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    const requestId = rig.focus("constellation:Ori");
    rig.controls.dispatchEvent({ type: "start" });
    expect(captureMainlineAObservationBookmarkM4()).toBeNull();
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
    rig.controls.dispatchEvent({ type: "end" });
    atlasRuntimeStore.setExperienceMode("research");
    expect(captureMainlineAObservationBookmarkM4()).toBeNull();
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
    atlasRuntimeStore.setExperienceMode("explore");
    atlasRuntimeStore.setScaleBand("stellar");
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
  });
  it("revokes an unmounted bridge even after another bridge focuses the same object", () => {
    const rig = mount(); rig.focus("constellation:Ori");
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    rig.unmount(); expect(captureMainlineAObservationBookmarkM4()).toBeNull();
    const next = mount(); const requestId = next.focus("constellation:Ori");
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
    expect(captureMainlineAObservationBookmarkM4()).not.toBeNull();
  });
  it("requires a catalogue command matching the actual locked sky direction", () => {
    const rig = mount(); rig.focus("constellation:Ori");
    atlasRuntimeStore.requestFocus({ kind: "solar-body", objectId: "earth", bodyIndex: 3, mode: "lock" }, "object-browser");
    atlasRuntimeStore.setFocusTransition("locked");
    expect(captureMainlineAObservationBookmarkM4()).toBeNull();
    const direction = celestialEntryToDirection(selectCelestialCatalogEntry("nebula:m42")!)!;
    atlasRuntimeStore.requestFocus({ kind: "catalog-object", objectId: "nebula:m42", catalogId: "nebula:m42", direction }, "object-browser");
    atlasRuntimeStore.setFocusTransition("locked");
    expect(captureMainlineAObservationBookmarkM4()).toBeNull();
  });
  it("shares measured journey occlusion with ordinary sky objects and refuses a fully covered return", () => {
    const rig = mount(); rig.focus("nebula:m42");
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    const requestId = rig.focus("nebula:m42");
    cleanups.push(registerMainlineAJourneyViewportM4());
    const position = rig.camera.position.clone();
    // An active journey waits for the existing observer to publish its layout.
    rig.advance(16); expect(rig.camera.position.equals(position)).toBe(true);
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
    const bounds = { x: 0, y: 0, width: 1280, height: 720 };
    rig.measure({ canvas: bounds, viewport: bounds, blockers: [{ id: "journey", rect: bounds }] });
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(false);
    rig.measure({ canvas: bounds, viewport: bounds, blockers: [{ id: "journey", rect: { x: 0, y: 108, width: 350, height: 534 } }] });
    expect(restoreMainlineAObservationBookmarkM4(bookmark, requestId)).toBe(true);
    const safe = resolveMainlineAJourneyViewportM4(1280, 720, atlasRuntimeStore.getSnapshot().safeViewportRect!)!;
    expect(safe.left).toBeGreaterThan(350);
    expect(rig.camera.view?.offsetX).toBeCloseTo(640 - (safe.left + safe.right) / 2, 5);
    const restored = rig.camera.position.clone(); rig.advance(16);
    expect(rig.camera.position.distanceTo(restored)).toBeLessThan(1e-7);
    rig.unmount();
    expect(resolveMainlineAJourneyViewportM4(1280, 720, atlasRuntimeStore.getSnapshot().safeViewportRect!)).toBeNull();
  });
});
