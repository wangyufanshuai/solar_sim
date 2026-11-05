import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { MAINLINE_A_CURRENT_STARS } from "../data/mainlineAMetadataV607";
import { EARTH_BODY_INDEX, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { getAtlasCameraPresentationLeaseV273, resetAtlasCameraPresentationLeaseForTestsV273 } from "../lib/atlasCameraPresentationLeaseV273";
import { solveSkyCameraFrame, applyCameraFrameProjection } from "../lib/atlasSceneFocusCameraRuntime";
import { CAMERA_ZOOM_EVENT, dispatchCameraFocusDirection, dispatchCameraZoom } from "../lib/camera-bridge";
import { celestialEntryToDirection, selectCelestialCatalogEntry } from "../lib/celestialCatalog";
import { createFloatingOrigin } from "../lib/floatingOrigin";
import { mainlineAConstellationViewportV638, resolveMainlineAConstellationCameraTargetV638, resolveMainlineAConstellationSafeViewportV638 } from "../lib/mainlineAConstellationCameraV638";
import type { ConstellationDomMeasurementV638 } from "../lib/mainlineAConstellationLabelOcclusionV638";
import { stellarAtlasFocusTarget } from "../lib/mainlineAStellarAtlasV608";
import { mainlineAConstellationFrameStateV638, projectMainlineAConstellationSegmentsV638, selectMainlineAConstellationFigureV638 } from "../lib/mainlineAConstellationSelectionV638";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { LodOrbitControlsBridge } from "./AtlasSceneCameraBridges";
import { CameraFocusBodyBridge, type CameraBodyFocusRequest } from "./AtlasSceneFocusCameraBridge";

const harness = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  frames: [] as Array<{ callback: (state: unknown, dt: number) => void; priority: number }>,
  state: null as unknown,
  measurement: null as ConstellationDomMeasurementV638 | null,
  domPublish: null as ((value: ConstellationDomMeasurementV638 | null) => void) | null,
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => void | (() => void)) => { harness.effects.push(effect); },
}));
vi.mock("@react-three/fiber", () => ({
  useThree: (selector: (state: unknown) => unknown) => selector(harness.state),
  useFrame: (callback: (state: unknown, dt: number) => void, priority = 0) => { harness.frames.push({ callback, priority }); },
}));
vi.mock("../lib/mainlineAConstellationLabelOcclusionV638", () => ({
  observeMainlineAConstellationDomV638: (_canvas: HTMLElement, publish: (value: ConstellationDomMeasurementV638 | null) => void) => {
    harness.domPublish = publish;
    publish(harness.measurement);
    return () => { harness.domPublish = null; };
  },
}));

const codes = ["Ori", "UMa", "Cas", "Sco", "Cyg", "Gem", "Leo", "Cru", "Lyr", "Aql", "Tau", "Sgr"];
const viewports = [
  { name: "desktop passport", width: 1280, height: 720, left: 0, top: 108, right: 864, bottom: 642 },
  { name: "mobile bottom passport", width: 390, height: 844, left: 0, top: 108, right: 390, bottom: 330 },
  { name: "mobile narrow safe area", width: 390, height: 844, left: 0, top: 0, right: 390, bottom: 86 },
];
const cases = viewports.flatMap((viewport) => codes.map((code) => ({ code, viewport, label: viewport.name })));
const cleanups: Array<() => void> = [];
let now = 0;

beforeEach(() => {
  now = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("window", Object.assign(new EventTarget(), { matchMedia: () => ({ matches: false }) }));
  vi.stubGlobal("document", { querySelector: () => null });
  resetAtlasCameraPresentationLeaseForTestsV273();
  atlasRuntimeStore.resetFocus();
  atlasRuntimeStore.setSafeViewportRect(null);
  harness.frames.length = 0;
  harness.effects.length = 0;
  harness.measurement = null;
  harness.domPublish = null;
});

afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  atlasRuntimeStore.setSafeViewportRect(null);
  resetAtlasCameraPresentationLeaseForTestsV273();
});

function mount(viewport = viewports[0], bodyRequest?: CameraBodyFocusRequest) {
  const { width, height, ...rect } = viewport;
  atlasRuntimeStore.setSafeViewportRect({ ...rect, viewportWidth: width, viewportHeight: height });
  const camera = new THREE.PerspectiveCamera(52, width / height, .01, 1e9);
  camera.position.set(-310, 108, 560);
  const controls = new OrbitControls(camera);
  const controlsRef = { current: controls };
  const floatingOriginRef = { current: createFloatingOrigin() };
  harness.state = { camera, size: { width, height }, gl: { domElement: {} } };
  renderToStaticMarkup(createElement(LodOrbitControlsBridge, {
    controlsRef, floatingOriginRef, presentationMode: "orbit-atlas",
  }));
  renderToStaticMarkup(createElement(CameraFocusBodyBridge, {
    // Read-only pose fixture; no physical integration or engine state is mutated.
    physicsRef: { current: { n: SOLAR_SYSTEM_BODIES.length, posAu: new Float64Array(SOLAR_SYSTEM_BODIES.length * 3) } as SolarSystemPhysicsRef },
    floatingOriginRef, earthMoonView: false,
    cameraBodyFocusRequest: bodyRequest,
    controlsRef, presentationMode: "orbit-atlas", atlasScaleMode: "compressed",
  }));
  for (const effect of harness.effects.splice(0)) {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  }
  cleanups.unshift(() => controls.dispose());
  const advance = (ms = 3000) => {
    now += ms;
    for (const frame of [...harness.frames].sort((a, b) => a.priority - b.priority)) frame.callback(harness.state, ms / 1000);
    camera.updateMatrixWorld(true);
  };
  const focus = (id: string) => {
    dispatchCameraFocusDirection(directionFor(id), id.startsWith("constellation:") ? id : undefined);
    advance();
  };
  return { camera, controls, advance, focus, viewport };
}

function directionFor(id: string): [number, number, number] {
  return id.startsWith("stellar-hero:")
    ? stellarAtlasFocusTarget(MAINLINE_A_CURRENT_STARS.find((star) => id === "stellar-hero:" + star.id)!).direction
    : celestialEntryToDirection(selectCelestialCatalogEntry(id)!)!;
}

function expectFramed(test: ReturnType<typeof mount>, code: string) {
  const selected = selectMainlineAConstellationFigureV638("constellation:" + code, CONSTELLATION_LINES, 9500);
  const safe = mainlineAConstellationViewportV638(test.viewport.width, test.viewport.height,
    resolveMainlineAConstellationSafeViewportV638(test.viewport.width, test.viewport.height, atlasRuntimeStore.getSnapshot().safeViewportRect, harness.measurement));
  const matrix = new THREE.Matrix4().multiplyMatrices(test.camera.projectionMatrix, test.camera.matrixWorldInverse);
  for (let index = 0; index < selected.positions.length; index += 3) {
    const point = new THREE.Vector4(selected.positions[index], selected.positions[index + 1], selected.positions[index + 2], 1).applyMatrix4(matrix);
    expect(point.w).toBeGreaterThan(0);
    const x = point.x / point.w, y = point.y / point.w, z = point.z / point.w;
    expect(x).toBeGreaterThanOrEqual(safe.ndc.left);
    expect(x).toBeLessThanOrEqual(safe.ndc.right);
    expect(y).toBeGreaterThanOrEqual(safe.ndc.bottom);
    expect(y).toBeLessThanOrEqual(safe.ndc.top);
    expect(z).toBeGreaterThan(-1);
    expect(z).toBeLessThan(1);
    if (harness.measurement) {
      const canvas = harness.measurement.canvas;
      const screenX = canvas.x + (x + 1) * canvas.width / 2;
      const screenY = canvas.y + (1 - y) * canvas.height / 2;
      for (const blocker of harness.measurement.blockers) {
        const { rect } = blocker;
        expect(screenX < rect.x || screenX > rect.x + rect.width || screenY < rect.y || screenY > rect.y + rect.height,
          `${code} endpoint intersects ${blocker.id}`).toBe(true);
      }
    }
  }
  const projection = projectMainlineAConstellationSegmentsV638(selected.positions, matrix.elements, safe.ndc);
  expect(projection.fullyFramed).toBe(true);
  expect(mainlineAConstellationFrameStateV638({ selection: selected, projection, enabled: true, ancestorsVisible: true, opacity: .34, drawObserved: false })).toBe("awaiting-draw");
}

describe("V638 real direction event, camera bridge and OrbitControls framing", () => {
  const measuredDesktop = (): ConstellationDomMeasurementV638 => ({
    canvas: { x: 0, y: 0, width: 1280, height: 720 },
    viewport: { x: 0, y: 0, width: 1280, height: 720 },
    blockers: [
      { id: "navigation", kind: "navigation", rect: { x: 103, y: 12, width: 720, height: 92.8333 } },
      { id: "two-line-hud", kind: "topline", rect: { x: 551.5886, y: 113.0833, width: 176.823, height: 45.5 } },
    ],
  });
  it.each(codes)("keeps every $0 endpoint below actual navigation and double-line HUD without a hardcoded top inset", (code) => {
    harness.measurement = measuredDesktop();
    const test = mount({ ...viewports[0], top: 0 });
    test.focus("constellation:" + code);
    expectFramed(test, code);
    test.advance(16);
    dispatchCameraZoom(1); test.advance(16);
    expectFramed(test, code);
  });

  it("reframes a locked Crux when measured HUD height changes, then releases the observer on unmount", () => {
    harness.measurement = measuredDesktop();
    const test = mount({ ...viewports[0], top: 0 });
    test.focus("constellation:Cru"); test.advance(16);
    const before = test.camera.projectionMatrix.clone();
    harness.measurement = { ...measuredDesktop(), blockers: [
      ...measuredDesktop().blockers,
      { id: "expanded-topline", kind: "topline", rect: { x: 300, y: 130, width: 550, height: 95 } },
    ] };
    harness.domPublish?.(harness.measurement);
    test.advance(16);
    expect(test.camera.projectionMatrix.equals(before)).toBe(false);
    expectFramed(test, "Cru");
    while (cleanups.length) cleanups.pop()?.();
    expect(harness.domPublish).toBeNull();
  });

  it("does not invent a visible fit while the canvas is fully covered, and resumes when it opens", () => {
    harness.measurement = { ...measuredDesktop(), blockers: [
      { id: "covered", kind: "other", rect: { x: 0, y: 0, width: 1280, height: 720 } },
    ] };
    const test = mount({ ...viewports[0], top: 0 });
    const before = test.camera.position.clone();
    test.focus("constellation:Cru");
    expect(test.camera.position.distanceTo(before)).toBeLessThan(1e-8);
    harness.measurement = measuredDesktop(); harness.domPublish?.(harness.measurement);
    test.advance(16);
    expectFramed(test, "Cru");
  });

  const measuredMobile = (passportTop: number): ConstellationDomMeasurementV638 => ({
    canvas: { x: 0, y: 0, width: 390, height: 844 },
    viewport: { x: 0, y: 0, width: 390, height: 844 },
    blockers: [
      { id: "navigation", kind: "navigation", rect: { x: 10, y: 8, width: 370, height: 61.8125 } },
      { id: "topline", kind: "topline", rect: { x: 136, y: 78.8125, width: 117, height: 29 } },
      { id: "passport", kind: "passport", rect: { x: 8, y: passportTop, width: 374, height: 754 - passportTop } },
    ],
  });
  const setMobilePassport = (passportTop: number) => {
    atlasRuntimeStore.setSafeViewportRect({ left: 0, top: 0, right: 390, bottom: passportTop - 12, viewportWidth: 390, viewportHeight: 844 });
    harness.measurement = measuredMobile(passportTop);
    harness.domPublish?.(harness.measurement);
  };
  const mountMobile = () => {
    harness.measurement = measuredMobile(650);
    return mount({ name: "measured mobile", width: 390, height: 844, left: 0, top: 0, right: 390, bottom: 638 });
  };
  const settle = (test: ReturnType<typeof mount>) => { test.advance(); test.advance(); };

  it("preserves the locked pose through a full sheet and restores distance intent after half/full/collapse", () => {
    const test = mountMobile();
    test.focus("constellation:Ori"); settle(test);
    const originalPosition = test.camera.position.clone();
    const originalTarget = test.controls.target.clone();
    const originalQuaternion = test.camera.quaternion.clone();
    const originalProjection = test.camera.projectionMatrix.clone();
    const originalDistance = originalPosition.distanceTo(originalTarget);
    setMobilePassport(430); settle(test);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeGreaterThan(originalDistance);
    const halfPosition = test.camera.position.clone();
    const halfProjection = test.camera.projectionMatrix.clone();
    const halfMinDistance = test.controls.minDistance;
    const halfMaxDistance = test.controls.maxDistance;
    setMobilePassport(78.8125); settle(test);
    const coveredZoom = new CustomEvent(CAMERA_ZOOM_EVENT, { detail: { delta: -1 }, cancelable: true });
    window.dispatchEvent(coveredZoom);
    expect(coveredZoom.defaultPrevented).toBe(true);
    dispatchCameraZoom(1); settle(test);
    expect(test.camera.position.distanceTo(halfPosition)).toBeLessThan(1e-8);
    expect(test.camera.projectionMatrix.equals(halfProjection)).toBe(true);
    expect(test.controls.minDistance).toBe(halfMinDistance);
    expect(test.controls.maxDistance).toBe(halfMaxDistance);
    expect(test.controls.target.distanceTo(originalTarget)).toBeLessThan(1e-8);
    setMobilePassport(430); settle(test);
    expect(test.camera.position.distanceTo(halfPosition)).toBeLessThan(1e-6);
    setMobilePassport(650); settle(test);
    expect(test.camera.position.distanceTo(originalPosition)).toBeLessThan(1e-6);
    expect(test.controls.target.distanceTo(originalTarget)).toBeLessThan(1e-8);
    expect(test.camera.quaternion.angleTo(originalQuaternion)).toBeLessThan(1e-7);
    expect(test.camera.projectionMatrix.equals(originalProjection)).toBe(true);
    expectFramed(test, "Ori");
    test.advance(16);
    expect(test.camera.position.distanceTo(originalPosition)).toBeLessThan(1e-6);
  });

  it("keeps a user's zoom made in a half sheet when the full sheet closes", () => {
    const test = mountMobile(); test.focus("constellation:Ori"); settle(test);
    const originalDistance = test.camera.position.distanceTo(test.controls.target);
    setMobilePassport(430); settle(test);
    const halfDistance = test.camera.position.distanceTo(test.controls.target);
    dispatchCameraZoom(-1); settle(test);
    const chosenPosition = test.camera.position.clone();
    expect(chosenPosition.distanceTo(test.controls.target)).toBeGreaterThan(originalDistance);
    expect(chosenPosition.distanceTo(test.controls.target)).toBeCloseTo(halfDistance * 1.24, 6);
    setMobilePassport(78.8125); settle(test);
    expect(test.camera.position.distanceTo(chosenPosition)).toBeLessThan(1e-8);
    setMobilePassport(650); settle(test);
    expect(test.camera.position.distanceTo(chosenPosition)).toBeLessThan(1e-6);
    expectFramed(test, "Ori");
  });

  it("applies the first zoom in from an explicit half-sheet zoom out and respects the framing floor", () => {
    const test = mountMobile(); test.focus("constellation:Ori"); settle(test);
    setMobilePassport(430); settle(test);
    const halfDistance = test.camera.position.distanceTo(test.controls.target);
    dispatchCameraZoom(-1); settle(test);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeCloseTo(halfDistance * 1.24, 6);
    dispatchCameraZoom(1); settle(test);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeCloseTo(halfDistance, 6);
    dispatchCameraZoom(1); settle(test);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeCloseTo(halfDistance, 6);
    setMobilePassport(650); settle(test);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeCloseTo(halfDistance, 6);
    expectFramed(test, "Ori");
  });

  it("accumulates consecutive explicit zooms from intent while the actual camera is still interpolating", () => {
    const test = mountMobile(); test.focus("constellation:Ori"); settle(test);
    setMobilePassport(430); settle(test);
    const halfDistance = test.camera.position.distanceTo(test.controls.target);
    dispatchCameraZoom(-1); test.advance(16);
    const interpolatedDistance = test.camera.position.distanceTo(test.controls.target);
    expect(interpolatedDistance).toBeGreaterThan(halfDistance);
    expect(interpolatedDistance).toBeLessThan(halfDistance * 1.24);
    dispatchCameraZoom(-1); settle(test);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeCloseTo(halfDistance * 1.24 ** 2, 6);
    setMobilePassport(650); settle(test);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeCloseTo(halfDistance * 1.24 ** 2, 6);
  });

  it("applies the first zoom in after a collapsed sheet clamps a farther intent to its smaller maximum", () => {
    const test = mountMobile(); test.focus("constellation:Ori"); settle(test);
    setMobilePassport(350); settle(test);
    for (let index = 0; index < 10; index++) dispatchCameraZoom(-1);
    settle(test);
    const halfMaximum = test.controls.maxDistance;
    expect(test.camera.position.distanceTo(test.controls.target)).toBeCloseTo(halfMaximum, 6);
    setMobilePassport(650); settle(test);
    const collapsedMaximum = test.controls.maxDistance;
    expect(halfMaximum).toBeGreaterThan(collapsedMaximum / 0.78);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeCloseTo(collapsedMaximum, 6);
    dispatchCameraZoom(1); settle(test);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeCloseTo(collapsedMaximum * 0.78, 6);
    expectFramed(test, "Ori");
  });

  it("waits to apply a new constellation focus while a full sheet leaves only edge slivers", () => {
    const test = mountMobile(); test.focus("constellation:Ori"); settle(test);
    const before = test.camera.position.clone();
    const beforeTarget = test.controls.target.clone();
    setMobilePassport(78.8125);
    test.focus("constellation:Cru"); settle(test);
    expect(test.camera.position.distanceTo(before)).toBeLessThan(1e-8);
    expect(test.controls.target.distanceTo(beforeTarget)).toBeLessThan(1e-8);
    // A new selection clears the old target's projection before waiting;
    // it must not invent a new projection or camera pose for an edge sliver.
    expect(test.camera.view?.enabled).toBe(false);
    expect(atlasRuntimeStore.getSnapshot().focusTransition).toBe("transition");
    setMobilePassport(650); settle(test);
    expect(atlasRuntimeStore.getSnapshot().focusTransition).toBe("locked");
    expectFramed(test, "Cru");
  });

  it.each(cases)("fits every $code anchor after Alpha A -> constellation -> locked in $label", ({ code, viewport }) => {
    const test = mount(viewport);
    test.focus("stellar-hero:alpha-centauri-a");
    test.focus("constellation:" + code);
    expectFramed(test, code);
    test.advance(16); // Exercise the persistent lock, including its distance clamp.
    expectFramed(test, code);
    expect(test.controls.target.toArray()).toEqual(resolveMainlineAConstellationCameraTargetV638("constellation:" + code)!.center);
  });

  it("rejects the old cropped Orion pose even though visible lines were drawn", () => {
    const test = mount();
    const direction = new THREE.Vector3(...celestialEntryToDirection(selectCelestialCatalogEntry("constellation:Ori")!)!);
    const frame = solveSkyCameraFrame(test.camera, 1280, 720);
    applyCameraFrameProjection(test.camera, frame, 1280, 720, { current: "" });
    test.controls.target.copy(direction).multiplyScalar(9500);
    test.camera.position.copy(test.controls.target).addScaledVector(direction, -frame.distance).add(new THREE.Vector3(0, 110, 0));
    test.controls.update(); test.camera.updateMatrixWorld(true);
    const selection = selectMainlineAConstellationFigureV638("constellation:Ori", CONSTELLATION_LINES, 9500);
    const matrix = new THREE.Matrix4().multiplyMatrices(test.camera.projectionMatrix, test.camera.matrixWorldInverse);
    const projection = projectMainlineAConstellationSegmentsV638(selection.positions, matrix.elements);
    expect(projection.visibleSegments).toBeGreaterThan(0);
    expect(projection.fullyFramed).toBe(false);
    expect(mainlineAConstellationFrameStateV638({ selection, projection, enabled: true, ancestorsVisible: true, opacity: .34, drawObserved: true })).toBe("unobserved");
  });

  it("preserves full framing through a manual orbit, zoom request and smaller safe viewport", () => {
    const test = mount();
    test.focus("constellation:Ori"); test.advance(16);
    test.controls.dispatchEvent({ type: "start", target: test.controls });
    const distance = test.camera.position.distanceTo(test.controls.target);
    test.camera.position.copy(test.controls.target).addScaledVector(new THREE.Vector3(.7, -.4, .5).normalize(), distance * 1.2);
    test.controls.update(); test.advance(16);
    expectFramed(test, "Ori");
    test.controls.dispatchEvent({ type: "end", target: test.controls });
    dispatchCameraZoom(1); test.advance(16);
    expectFramed(test, "Ori");
    atlasRuntimeStore.setSafeViewportRect({ left: 0, top: 110, right: 520, bottom: 420, viewportWidth: 1280, viewportHeight: 720 });
    test.advance(16);
    expectFramed(test, "Ori");
  });

  it.each(["stellar-hero:alpha-centauri-a", "nebula:m42"])("restores the original proxy framing for %s after Orion", (id) => {
    const test = mount(); test.focus("constellation:Ori"); test.advance(16);
    test.focus(id); test.advance(16);
    const direction = new THREE.Vector3(...directionFor(id));
    const frame = solveSkyCameraFrame(test.camera, 1280, 720);
    const target = direction.clone().multiplyScalar(9500);
    const expected = target.clone().addScaledVector(direction, -frame.distance).add(new THREE.Vector3(0, Math.min(110, frame.distance * .14), 0));
    expect(test.controls.target.distanceTo(target)).toBeLessThan(1e-7);
    expect(test.camera.position.distanceTo(expected)).toBeLessThan(1e-6);
    expect(test.controls.maxDistance).toBe(6800);
    expect(test.camera.fov).toBe(52);
  });

  it("releases the constellation lock when a body focus arrives through props", () => {
    const request: CameraBodyFocusRequest = { bodyIndex: EARTH_BODY_INDEX, mode: "orbit", nonce: 1 };
    const test = mount(viewports[0], request);
    test.advance();
    test.focus("constellation:Ori"); test.advance(16);
    // The frame callback consumes the updated request just as the next React props do.
    request.nonce += 1;
    test.advance(); // The props request begins its transition on this frame.
    test.advance();
    const bodyTarget = test.controls.target.clone();
    expect(bodyTarget.length()).toBeLessThan(1e-8);
    test.advance(16);
    expect(test.controls.target.distanceTo(bodyTarget)).toBeLessThan(1e-8);
    const zoom = new CustomEvent(CAMERA_ZOOM_EVENT, { detail: { delta: 1 }, cancelable: true });
    window.dispatchEvent(zoom);
    expect(zoom.defaultPrevented).toBe(false);
  });

  it("restores ordinary zoom bounds after a user interrupts the constellation transition", () => {
    const test = mount();
    test.advance(16); // Populate the ordinary LOD cache before borrowing its range.
    const ordinaryMaxDistance = test.controls.maxDistance;
    expect(ordinaryMaxDistance).toBe(2400);
    dispatchCameraFocusDirection(directionFor("constellation:Ori"), "constellation:Ori");
    test.advance(100);
    expect(test.controls.maxDistance).toBeGreaterThan(ordinaryMaxDistance);
    expect(getAtlasCameraPresentationLeaseV273()?.owner).toBe("focus-lock");
    test.controls.dispatchEvent({ type: "start", target: test.controls });
    test.advance(16); // The focus bridge releases its lease at priority 2.
    test.advance(16); // The priority-0 LOD bridge restores its cached bound.
    expect(getAtlasCameraPresentationLeaseV273()).toBeNull();
    expect(test.controls.maxDistance).toBe(ordinaryMaxDistance);
    expect(test.camera.position.distanceTo(test.controls.target)).toBeLessThanOrEqual(ordinaryMaxDistance + 1e-8);
    const zoom = new CustomEvent(CAMERA_ZOOM_EVENT, { detail: { delta: 1 }, cancelable: true });
    window.dispatchEvent(zoom);
    expect(zoom.defaultPrevented).toBe(false);
  });
});
