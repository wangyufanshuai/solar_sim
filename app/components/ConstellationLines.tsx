"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { runtimeSafeViewportRect } from "../lib/atlasSceneFocusCameraRuntime";
import { mainlineAConstellationViewportV638 } from "../lib/mainlineAConstellationCameraV638";
import type {
  AtlasCinematicCameraProfile,
  AtlasGaiaStarfieldEnhancementQualityTier,
} from "../lib/simulationDiagnosticsTypes";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607, type MainlineACoordinateSegmentV607 } from "../data/mainlineAConstellationFiguresV607";
import {
  mainlineAConstellationAppearanceM4,
  mainlineAConstellationBoundaryDashScaleM4,
  resolveMainlineAConstellationAppearanceM4,
} from "../lib/mainlineAConstellationAppearanceM4";
import {
  resolveMainlineAConstellationLayerV607,
} from "../data/mainlineAConstellationBoundaryV607";
import { getAsterismsV255Sync, loadAsterismsV255 } from "../lib/deepSkyCatalogRuntimeV255";
import { useCanonicalDisposableV635, useCanonicalProducerV635 } from "../lib/mainlineACanonicalProducerV635";
import {
  mainlineAConstellationFrameStateV638,
  projectMainlineAConstellationSegmentsV638,
  selectMainlineAConstellationFigureV638,
} from "../lib/mainlineAConstellationSelectionV638";
import {
  createMainlineAConstellationPresentationV638,
  mainlineAConstellationDrawEligibleV638,
  publishMainlineAConstellationDrawStateV638,
  updateMainlineAConstellationPresentationV638,
} from "../lib/mainlineAConstellationPresentationV638";

const CONSTELLATION_DISTANCE_SCENE = 9500;

function raDecToSceneDir(raDeg: number, decDeg: number): THREE.Vector3 {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  return new THREE.Vector3(Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra));
}

type GuideDefinition = { name: string; waypoints: readonly [number, number][]; coordinateSegments?: readonly MainlineACoordinateSegmentV607[] };
type GuideGeometry = { positions: Float32Array; segmentCount: number };

function buildGuideGeometry(definitions: readonly GuideDefinition[]): GuideGeometry {
  const allSegments = definitions.flatMap((definition) => definition.coordinateSegments
    ? [...definition.coordinateSegments]
    : definition.waypoints.slice(1).map((point, index): MainlineACoordinateSegmentV607 => [definition.waypoints[index], point]));
  const segmentCount = allSegments.length;
  const positions = new Float32Array(segmentCount * 6);
  let offset = 0;
  for (const [from, to] of allSegments) {
      const a = raDecToSceneDir(...from);
      const b = raDecToSceneDir(...to);
      positions[offset++] = a.x * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = a.y * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = a.z * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = b.x * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = b.y * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = b.z * CONSTELLATION_DISTANCE_SCENE;
  }
  return { positions, segmentCount };
}

function geometryFromPositions(positions: Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function nodeGeometryFromDefinitions(definitions: readonly GuideDefinition[]): THREE.BufferGeometry {
  const seen = new Set<string>();
  const coords: number[] = [];
  for (const definition of definitions) {
    for (const [ra, dec] of definition.waypoints) {
      const key = `${ra.toFixed(3)}:${dec.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const direction = raDecToSceneDir(ra, dec);
      coords.push(direction.x * CONSTELLATION_DISTANCE_SCENE, direction.y * CONSTELLATION_DISTANCE_SCENE, direction.z * CONSTELLATION_DISTANCE_SCENE);
    }
  }
  return geometryFromPositions(new Float32Array(coords));
}

function ancestorsVisible(object: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (!current.visible) return false;
    current = current.parent;
  }
  return true;
}

export default function ConstellationLines({
  floatingOriginRef,
  selectedCatalogId = "",
  enabled = true,
  orbitAtlas = false,
  cinematicCameraProfile = "overview-atlas",
  qualityTier = "balanced",
  asterismEnabled = true,
  linesEnabled = true,
  boundariesEnabled = true,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  selectedCatalogId?: string;
  enabled?: boolean;
  /** A4: figure lines/anchors and the selected IAU boundary can be switched separately. */
  linesEnabled?: boolean;
  boundariesEnabled?: boolean;
  orbitAtlas?: boolean;
  cinematicCameraProfile?: AtlasCinematicCameraProfile;
  qualityTier?: AtlasGaiaStarfieldEnhancementQualityTier;
  asterismEnabled?: boolean;
}) {
  const viewport = useThree((state) => state.size);
  const projectionBounds = () => mainlineAConstellationViewportV638(
    viewport.width, viewport.height, runtimeSafeViewportRect(viewport.width, viewport.height),
  ).ndc;
  const lineRef = useRef<THREE.LineSegments>(null);
  const selectedFigureLineRef = useRef<LineSegments2>(null);
  const selectedNodeRef = useRef<THREE.Points>(null);
  const selectedProjectionRef = useRef(new THREE.Matrix4());
  const boundaryLineRef = useRef<THREE.LineSegments>(null);
  const asterismLineRef = useRef<THREE.LineSegments>(null);
  const nodeRef = useRef<THREE.Points>(null);
  const [asterisms, setAsterisms] = useState<readonly GuideDefinition[]>(() => getAsterismsV255Sync());
  const selectedFigure = useMemo(() => selectMainlineAConstellationFigureV638(
    selectedCatalogId, CONSTELLATION_LINES, CONSTELLATION_DISTANCE_SCENE,
  ), [selectedCatalogId]);
  const selectedCode = selectedFigure.iauCode;
  const selectedSource = selectedCode ? MAINLINE_A_CONSTELLATION_FIGURES_V607[selectedCode] : undefined;
  const selectedMobile = qualityTier === "mobile" || viewport.width < 640;
  const appearance = useMemo(() => selectedFigure.status === "selected"
    ? resolveMainlineAConstellationAppearanceM4(selectedCatalogId, selectedMobile) : null,
  [selectedCatalogId, selectedFigure.status, selectedMobile]);
  const selectedStyle = mainlineAConstellationAppearanceM4(selectedMobile);
  const selectedPresentation = useMemo(() => {
    const anchors = selectedSource?.stars ?? CONSTELLATION_LINES.find((entry) => entry.iauCode === selectedCode)
      ?.waypoints.map(([raDeg, decDeg]) => ({ raDeg, decDeg })) ?? [];
    const presentation = createMainlineAConstellationPresentationV638(selectedFigure.positions, anchors, selectedMobile);
    presentation.lineMaterial.color.set(selectedStyle.lineColor);
    presentation.lineMaterial.opacity = selectedStyle.lineOpacity;
    presentation.nodeMaterial.uniforms.color.value.set(selectedStyle.anchorColor);
    return presentation;
  }, [selectedCode, selectedFigure, selectedSource, selectedMobile, selectedStyle]);
  const selectedDrawTracker = selectedPresentation.drawTracker;
  const selectedFigureGeometry = selectedPresentation.lineGeometry;
  const selectedFigureMaterial = selectedPresentation.lineMaterial;
  const canonicalProducer = useCanonicalProducerV635(
    "constellation", selectedCode, "mainline-a-constellation-lines", null, selectedCode !== null,
  );
  useEffect(() => {
    if (!asterismEnabled) return;
    let disposed = false;
    void loadAsterismsV255()
      .then((next) => {
        if (!disposed) setAsterisms((previous) => previous === next ? previous : next);
      })
      .catch(() => undefined);
    return () => {
      disposed = true;
    };
  }, [asterismEnabled]);
  const asterismData = useMemo(() => buildGuideGeometry(asterisms), [asterisms]);
  const constellationData = useMemo(() => buildGuideGeometry(CONSTELLATION_LINES), []);
  const boundaryData = useMemo(() => {
    const vertices = appearance?.boundary;
    return buildGuideGeometry(appearance && vertices?.length ? [{
      name: appearance.code,
      waypoints: [...vertices.map((vertex) => [vertex.raDeg, vertex.decDeg] as [number, number]),
        [vertices[0].raDeg, vertices[0].decDeg]],
    }] : []);
  }, [appearance]);
  const constellationGeometry = useMemo(() => geometryFromPositions(constellationData.positions), [constellationData]);
  const boundaryGeometry = useMemo(() => {
    const geometry = geometryFromPositions(boundaryData.positions);
    if (boundaryData.segmentCount) geometry.computeBoundingSphere();
    return geometry;
  }, [boundaryData]);
  const asterismGeometry = useMemo(() => geometryFromPositions(asterismData.positions), [asterismData]);
  const nodeGeometry = useMemo(() => nodeGeometryFromDefinitions(CONSTELLATION_LINES), []);
  useCanonicalDisposableV635(constellationGeometry, "mainline-a-constellation-lines", "constellation-figures-geometry");
  useCanonicalDisposableV635(boundaryGeometry, "mainline-a-constellation-lines", "constellation-boundaries-geometry");
  useCanonicalDisposableV635(asterismGeometry, "mainline-a-constellation-lines", "constellation-asterisms-geometry");
  useCanonicalDisposableV635(nodeGeometry, "mainline-a-constellation-lines", "constellation-nodes-geometry");
  useCanonicalDisposableV635(selectedFigureGeometry, "mainline-a-constellation-lines", `constellation-selected:${selectedCode ?? "none"}:geometry`);
  useCanonicalDisposableV635(selectedPresentation.nodeGeometry, "mainline-a-constellation-lines", `constellation-selected:${selectedCode ?? "none"}:nodes-geometry`);
  useCanonicalDisposableV635(selectedPresentation.nodeMaterial, "mainline-a-constellation-lines", "constellation-selected-nodes-material");
  const lastSignatureRef = useRef("");

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: "#8aa0b8", transparent: true, opacity: 0.18, depthWrite: false, depthTest: false,
    toneMapped: false, blending: THREE.AdditiveBlending,
  }), []);
  const asterismMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: "#6b93bd", transparent: true, opacity: 0.12, depthWrite: false, depthTest: false,
    toneMapped: false, blending: THREE.AdditiveBlending,
  }), []);
  const boundaryMaterial = useMemo(() => new THREE.LineDashedMaterial({
    color: selectedStyle.boundaryColor, transparent: true, opacity: selectedStyle.boundaryOpacity,
    dashSize: selectedStyle.boundaryDashCssPx, gapSize: selectedStyle.boundaryGapCssPx,
    depthWrite: false, depthTest: false, toneMapped: false, blending: THREE.NormalBlending,
  }), [selectedStyle]);
  const nodeMaterial = useMemo(() => new THREE.PointsMaterial({
    color: "#d7c48f", size: 1.12, sizeAttenuation: false, transparent: true, opacity: 0.24,
    depthWrite: false, depthTest: false, toneMapped: false, blending: THREE.AdditiveBlending,
  }), []);
  useCanonicalDisposableV635(material, "mainline-a-constellation-lines", "constellation-figures-material");
  useCanonicalDisposableV635(asterismMaterial, "mainline-a-constellation-lines", "constellation-asterisms-material");
  useCanonicalDisposableV635(boundaryMaterial, "mainline-a-constellation-lines", "constellation-boundaries-material");
  useCanonicalDisposableV635(nodeMaterial, "mainline-a-constellation-lines", "constellation-nodes-material");
  useCanonicalDisposableV635(selectedFigureMaterial, "mainline-a-constellation-lines", "constellation-selected-material");

  useFrame((state) => {
    selectedDrawTracker.beginFrame();
    const line = lineRef.current;
    const boundaryLine = boundaryLineRef.current;
    const asterismLine = asterismLineRef.current;
    const nodes = nodeRef.current;
    const selectedLine = selectedFigureLineRef.current;
    if (!line || !asterismLine || !boundaryLine) return;
    const tier = floatingOriginRef.current.lodTier;
    const scaleBand = atlasRuntimeStore.getSnapshot().scaleBand;
    const overlay = enabled
      && cinematicCameraProfile !== "selected-body-cinematic"
      && (scaleBand === "solar" || scaleBand === "stellar" || scaleBand === "galactic");
    const visible = overlay && linesEnabled;
    const layer = resolveMainlineAConstellationLayerV607({
      enabled: visible,
      orbitAtlas,
      asterismEnabled,
      qualityTier,
      lodTier: tier,
      presentationScaleBand: scaleBand,
      cinematicCameraProfile,
      boundarySegmentCount: boundaryData.segmentCount,
      asterismSegmentCount: asterismData.segmentCount,
    });
    const signature = [visible, tier, scaleBand, orbitAtlas, cinematicCameraProfile, qualityTier, layer.lineOpacity, layer.nodeOpacity, layer.showAsterisms, layer.asterismOpacity, layer.showBoundaries, layer.boundaryOpacity, constellationData.segmentCount, boundaryData.segmentCount, asterismData.segmentCount].join("|");
    // A restrained phase offset keeps the guide layers alive without turning
    // the chart into a blinking overlay. This is presentation-only motion.
    const phase = state.clock.elapsedTime * 0.72;
    const linePulse = 0.95 + Math.sin(phase) * 0.05;
    const asterismPulse = 0.94 + Math.sin(phase + 0.9) * 0.06;
    const nodePulse = 0.94 + Math.sin(phase + 1.15) * 0.06;
    line.visible = visible;
    // One selected boundary remains legible on narrow screens. Background
    // boundaries stay absent; the figure's original endpoints are untouched.
    const boundaryScale = boundaryGeometry.boundingSphere ? mainlineAConstellationBoundaryDashScaleM4(
      viewport.height, state.camera.projectionMatrix.elements[5],
      state.camera.position.distanceTo(boundaryGeometry.boundingSphere.center),
    ) : 0;
    const boundaryVisible = overlay && boundariesEnabled && appearance !== null && selectedFigure.status === "selected"
      && (scaleBand === "stellar" || scaleBand === "galactic") && boundaryScale > 0;
    boundaryLine.visible = boundaryVisible;
    asterismLine.visible = layer.showAsterisms;
    if (nodes) nodes.visible = visible;
    (line.material as THREE.LineBasicMaterial).opacity = layer.lineOpacity * linePulse;
    (asterismLine.material as THREE.LineBasicMaterial).opacity = layer.asterismOpacity * asterismPulse;
    boundaryMaterial.scale = boundaryScale;
    if (nodes) (nodes.material as THREE.PointsMaterial).opacity = layer.nodeOpacity * nodePulse;
    let selectedFrameState: ReturnType<typeof mainlineAConstellationFrameStateV638> = "none";
    let selectedVisibleSegments = 0;
    updateMainlineAConstellationPresentationV638(selectedPresentation, {
      width: viewport.width, height: viewport.height, pixelRatio: state.gl.getPixelRatio(),
      mobile: selectedMobile,
      visible: visible && selectedFigure.status === "selected",
    });
    selectedFigureMaterial.linewidth = selectedStyle.lineWidthCssPx;
    selectedPresentation.nodeMaterial.uniforms.diameterCssPx.value = selectedStyle.anchorDiameterCssPx;
    if (selectedLine) {
      selectedLine.updateWorldMatrix(true, false);
      selectedProjectionRef.current.multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse)
        .multiply(selectedLine.matrixWorld);
      const projection = projectMainlineAConstellationSegmentsV638(selectedFigure.positions, selectedProjectionRef.current.elements, projectionBounds());
      selectedVisibleSegments = projection.visibleSegments;
      selectedFrameState = mainlineAConstellationFrameStateV638({
        selection: selectedFigure,
        enabled: visible,
        ancestorsVisible: ancestorsVisible(selectedLine) && ancestorsVisible(selectedPresentation.nodes)
          && mainlineAConstellationDrawEligibleV638(selectedPresentation, "line", selectedLine, selectedLine.geometry, selectedFigureMaterial)
          && mainlineAConstellationDrawEligibleV638(selectedPresentation, "nodes", selectedPresentation.nodes,
            selectedPresentation.nodeGeometry, selectedPresentation.nodeMaterial),
        opacity: selectedFigureMaterial.opacity,
        projection,
        drawObserved: false,
      });
      if (selectedFrameState === "unobserved") canonicalProducer.unobserved();
      if (selectedFrameState === "failed") canonicalProducer.failed(selectedFigure.issues.join("; ") || "selected-figure-projection-invalid");
    }
    const root = typeof document !== "undefined"
      ? document.querySelector<HTMLElement>("[data-atlas-app-shell]")
      : null;
    if (root) {
      root.dataset.mainlineAConstellationLayer = "true";
      root.dataset.mainlineAConstellationEnabled = String(visible);
      root.dataset.mainlineAConstellationQualityTier = qualityTier;
      root.dataset.mainlineAConstellationLodTier = tier;
      root.dataset.mainlineAConstellationScaleBand = scaleBand;
      root.dataset.mainlineAConstellationPresentationLodTier = layer.presentationLodTier;
      root.dataset.mainlineAConstellationBoundaryVisible = String(boundaryVisible);
      root.dataset.mainlineAConstellationBoundaryOpacity = (boundaryVisible ? boundaryMaterial.opacity : 0).toFixed(5);
      root.dataset.mainlineAConstellationBoundarySelectedCode = appearance?.code ?? "none";
      root.dataset.mainlineAConstellationBoundaryStyle = "dashed";
      root.dataset.mainlineAConstellationAsterismVisible = String(layer.showAsterisms);
      root.dataset.mainlineAConstellationAsterismOpacity = (layer.asterismOpacity * asterismPulse).toFixed(5);
      root.dataset.mainlineAConstellationFigureSegmentCount = String(constellationData.segmentCount);
      root.dataset.mainlineAConstellationBoundarySegmentCount = String(boundaryData.segmentCount);
      root.dataset.mainlineAConstellationAsterismSegmentCount = String(asterismData.segmentCount);
      root.dataset.mainlineAConstellationAsterismReady = String(asterismData.segmentCount > 0);
      root.dataset.mainlineAConstellationAsterismSource = "asterisms-v255.json";
      root.dataset.mainlineAConstellationFocusPulse = linePulse.toFixed(5);
      root.dataset.mainlineAConstellationSelectedCode = selectedCode ?? "none";
      root.dataset.mainlineAConstellationSelectedState = selectedFrameState;
      root.dataset.mainlineAConstellationSelectedSegments = String(selectedFigure.segmentCount);
      root.dataset.mainlineAConstellationSelectedVisibleSegments = String(selectedVisibleSegments);
      root.dataset.mainlineAConstellationSelectedSource = selectedSource?.sourceComplete === false ? "incomplete" : "candidate-only";
      root.dataset.mainlineAConstellationSelectedMissingAnchors = (selectedSource?.missingAnchorIds ?? []).join(",");
      root.dataset.mainlineAConstellationSelectedLineWidthCssPx = String(selectedStyle.lineWidthCssPx);
      root.dataset.mainlineAConstellationSelectedAnchorCount = String(selectedPresentation.nodeGeometry.getAttribute("position").count);
      // Retry next frame when the Canvas committed before its DOM marker root.
      lastSignatureRef.current = signature;
    }
  });

  useEffect(() => () => {
    lastSignatureRef.current = "";
    const root = typeof document !== "undefined"
      ? document.querySelector<HTMLElement>("[data-atlas-app-shell]")
      : null;
    if (!root) return;
    delete root.dataset.mainlineAConstellationLayer;
    delete root.dataset.mainlineAConstellationEnabled;
    delete root.dataset.mainlineAConstellationQualityTier;
    delete root.dataset.mainlineAConstellationLodTier;
    delete root.dataset.mainlineAConstellationScaleBand;
    delete root.dataset.mainlineAConstellationPresentationLodTier;
    delete root.dataset.mainlineAConstellationBoundaryVisible;
    delete root.dataset.mainlineAConstellationBoundaryOpacity;
    delete root.dataset.mainlineAConstellationBoundarySelectedCode;
    delete root.dataset.mainlineAConstellationBoundaryStyle;
    delete root.dataset.mainlineAConstellationAsterismVisible;
    delete root.dataset.mainlineAConstellationAsterismOpacity;
    delete root.dataset.mainlineAConstellationFigureSegmentCount;
    delete root.dataset.mainlineAConstellationBoundarySegmentCount;
    delete root.dataset.mainlineAConstellationAsterismSegmentCount;
    delete root.dataset.mainlineAConstellationAsterismReady;
    delete root.dataset.mainlineAConstellationAsterismSource;
    delete root.dataset.mainlineAConstellationFocusPulse;
    delete root.dataset.mainlineAConstellationSelectedCode;
    delete root.dataset.mainlineAConstellationSelectedState;
    delete root.dataset.mainlineAConstellationSelectedSegments;
    delete root.dataset.mainlineAConstellationSelectedVisibleSegments;
    delete root.dataset.mainlineAConstellationSelectedSource;
    delete root.dataset.mainlineAConstellationSelectedMissingAnchors;
    delete root.dataset.mainlineAConstellationSelectedLineWidthCssPx;
    delete root.dataset.mainlineAConstellationSelectedAnchorCount;
  }, []);

  function observeSelectedDraw(part: "line" | "nodes", camera: THREE.Camera, sameResource: boolean) {
    const publish = (state: ReturnType<typeof mainlineAConstellationFrameStateV638>, visibleSegments = 0) =>
      publishMainlineAConstellationDrawStateV638({
        producer: canonicalProducer, state, code: selectedCode, visibleSegments,
        error: selectedFigure.issues.join("; "),
        surface: typeof document === "undefined" ? null : document.querySelector<HTMLElement>("[data-atlas-app-shell]"),
      });
    if (!sameResource) {
      selectedDrawTracker.observe(part, selectedDrawTracker.frame, false);
      publish("unobserved");
      return;
    }
    if (!selectedDrawTracker.observe(part, selectedDrawTracker.frame, sameResource)) return;
    const line = selectedFigureLineRef.current;
    const nodes = selectedNodeRef.current;
    if (!line || !nodes || !ancestorsVisible(nodes)
      || !mainlineAConstellationDrawEligibleV638(selectedPresentation, "line", line, line.geometry, selectedFigureMaterial)
      || !mainlineAConstellationDrawEligibleV638(selectedPresentation, "nodes", nodes, nodes.geometry, selectedPresentation.nodeMaterial)) {
      publish("unobserved");
      return;
    }
    selectedProjectionRef.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(line.matrixWorld);
    const projection = projectMainlineAConstellationSegmentsV638(selectedFigure.positions, selectedProjectionRef.current.elements, projectionBounds());
    const frameState = mainlineAConstellationFrameStateV638({
      selection: selectedFigure,
      enabled: enabled && cinematicCameraProfile !== "selected-body-cinematic",
      ancestorsVisible: ancestorsVisible(line), opacity: selectedFigureMaterial.opacity,
      projection, drawObserved: true,
    });
    publish(frameState, projection.visibleSegments);
  }

  return (
    <>
      <lineSegments ref={lineRef} geometry={constellationGeometry} material={material} frustumCulled={false} renderOrder={-480} dispose={null} />
      <primitive object={selectedPresentation.line} ref={selectedFigureLineRef} dispose={null}
        onAfterRender={function (this: LineSegments2, _renderer: THREE.WebGLRenderer, _scene: THREE.Scene, camera: THREE.Camera,
          drawnGeometry: THREE.BufferGeometry, drawnMaterial: THREE.Material, drawnGroup: { start: number; count: number } | null) {
          if (selectedFigureLineRef.current !== this || this.geometry !== selectedFigureGeometry
            || this.material !== selectedFigureMaterial) { observeSelectedDraw("line", camera, false); return; }
          observeSelectedDraw("line", camera, mainlineAConstellationDrawEligibleV638(
            selectedPresentation, "line", this, drawnGeometry, drawnMaterial, drawnGroup));
        }} />
      <primitive object={selectedPresentation.nodes} ref={selectedNodeRef} dispose={null}
        onAfterRender={function (this: THREE.Points, _renderer: THREE.WebGLRenderer, _scene: THREE.Scene, camera: THREE.Camera,
          drawnGeometry: THREE.BufferGeometry, drawnMaterial: THREE.Material, drawnGroup: { start: number; count: number } | null) {
          observeSelectedDraw("nodes", camera, selectedNodeRef.current === this
            && mainlineAConstellationDrawEligibleV638(selectedPresentation, "nodes", this, drawnGeometry, drawnMaterial, drawnGroup));
        }} />
      <lineSegments ref={boundaryLineRef} geometry={boundaryGeometry} material={boundaryMaterial} visible={false}
        onUpdate={(line) => { line.computeLineDistances(); }}
        frustumCulled={false} renderOrder={-481} dispose={null} />
      <lineSegments ref={asterismLineRef} geometry={asterismGeometry} material={asterismMaterial} frustumCulled={false} renderOrder={-479} dispose={null} />
      <points ref={nodeRef} geometry={nodeGeometry} material={nodeMaterial} frustumCulled={false} renderOrder={-478} dispose={null} />
    </>
  );
}
