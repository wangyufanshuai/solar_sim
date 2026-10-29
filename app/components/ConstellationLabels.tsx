"use client";

import { PostV594CdpSoakHtml as Html } from "../lib/v594CdpSoakSurface";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607, type MainlineAConstellationFigureV607 } from "../data/mainlineAConstellationFiguresV607";
import { runtimeSafeViewportRect } from "../lib/atlasSceneFocusCameraRuntime";
import { mainlineAConstellationViewportV638 } from "../lib/mainlineAConstellationCameraV638";
import {
  mainlineAConstellationAnchorPositionV638,
  mainlineAConstellationStarPriorityV638,
} from "../lib/mainlineAConstellationPresentationV638";
import {
  layoutMainlineAConstellationOcclusionV638,
  observeMainlineAConstellationDomV638,
  type ConstellationDomMeasurementV638,
  type ConstellationLabelLayoutV638,
} from "../lib/mainlineAConstellationLabelOcclusionV638";

const CONSTELLATION_DISTANCE_SCENE = 9500;
const FEATURED_CODES = [
  "Ori",
  "UMa",
  "Cas",
  "Cyg",
  "Lyr",
  "Aql",
  "Sco",
  "Sgr",
  "Tau",
  "Gem",
  "Leo",
  "Cru",
] as const;

export default function ConstellationLabels({
  enabled,
  selectedCatalogId,
  closeupSuppressed,
}: {
  enabled: boolean;
  selectedCatalogId: string;
  closeupSuppressed: boolean;
}) {
  const size = useThree((state) => state.size);
  const mobile = size.width < 640;
  const selectedCode = selectedCatalogId.startsWith("constellation:")
    ? selectedCatalogId.slice("constellation:".length)
    : "";
  const labels = useMemo(() => {
    const ranked = [...CONSTELLATION_LINES].sort((a, b) => {
      const aRank = FEATURED_CODES.indexOf(a.iauCode as (typeof FEATURED_CODES)[number]);
      const bRank = FEATURED_CODES.indexOf(b.iauCode as (typeof FEATURED_CODES)[number]);
      if (aRank >= 0 || bRank >= 0) {
        if (aRank < 0) return 1;
        if (bRank < 0) return -1;
        return aRank - bRank;
      }
      return a.iauCode.localeCompare(b.iauCode);
    });
    const budget = mobile ? 8 : 24;
    const visible = closeupSuppressed
      ? ranked.filter((entry) => entry.iauCode === selectedCode)
      : ranked.slice(0, budget);
    const selected = ranked.find((entry) => entry.iauCode === selectedCode);
    if (selected && !visible.some((entry) => entry.iauCode === selectedCode)) {
      visible.unshift(selected);
      visible.length = Math.min(visible.length, budget);
    }
    return visible.map((entry) => ({
      entry,
      position: constellationCentroid(entry.waypoints),
    }));
  }, [closeupSuppressed, mobile, selectedCode]);

  if (!enabled && !selectedCode) return null;
  const selectedFigure = MAINLINE_A_CONSTELLATION_FIGURES_V607[selectedCode];
  return (
    <group>
      {selectedFigure ? <SelectedConstellationLabelsV638 key={selectedCode} code={selectedCode} figure={selectedFigure} mobile={mobile} /> : null}
      {labels.map(({ entry, position }) => {
        const selected = entry.iauCode === selectedCode;
        if (selected && selectedFigure) return null;
        return (
          <Html
            key={entry.iauCode}
            position={position}
            center
            distanceFactor={selected ? undefined : 8}
            style={{ pointerEvents: "none" }}
            zIndexRange={[18, 0]}
          >
            <div
              className={`whitespace-nowrap uppercase ${
                selected
                  ? "rounded-sm border border-cyan-100/30 bg-black/75 px-2 py-1 text-[13px] text-cyan-50"
                  : "text-[8px] text-white/36 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]"
              }`}
              data-constellation-label={entry.iauCode}
              data-constellation-label-selected={selected ? "true" : "false"}
            >
              {entry.nameCn || entry.name}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function SelectedConstellationLabelsV638({ code, figure, mobile }: {
  code: string;
  figure: MainlineAConstellationFigureV607;
  mobile: boolean;
}) {
  const size = useThree((state) => state.size);
  const canvas = useThree((state) => state.gl?.domElement ?? null);
  const group = useRef<THREE.Group>(null);
  const labels = useRef(new Map<string, HTMLDivElement>());
  const leaders = useRef(new Map<string, SVGLineElement>());
  const measurement = useRef<ConstellationDomMeasurementV638 | null>(null);
  const layoutCache = useRef<{ key: string; layout: ConstellationLabelLayoutV638 } | null>(null);
  const point = useMemo(() => new THREE.Vector3(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const entries = useMemo(() => [
    { id: "title", name: figure.nameCn, position: constellationCentroid(figure.waypoints).toArray() as [number, number, number] },
    ...[...figure.stars].sort((a, b) => mainlineAConstellationStarPriorityV638(a) - mainlineAConstellationStarPriorityV638(b))
      .map((star) => ({ id: star.id, name: star.nameCn,
        position: mainlineAConstellationAnchorPositionV638(star.raDeg, star.decDeg) })),
  ], [figure]);
  useEffect(() => {
    measurement.current = null;
    layoutCache.current = null;
    if (!canvas) return;
    return observeMainlineAConstellationDomV638(canvas, (next) => {
      measurement.current = next;
      layoutCache.current = null;
    });
  }, [canvas]);
  useFrame((state) => {
    if (!group.current) return;
    group.current.updateWorldMatrix(true, false);
    matrix.multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse).multiply(group.current.matrixWorld);
    const safe = mainlineAConstellationViewportV638(size.width, size.height, runtimeSafeViewportRect(size.width, size.height)).inner;
    const observed = measurement.current;
    const screen = observed?.canvas ?? { x: 0, y: 0, width: size.width, height: size.height };
    const scaleX = screen.width / Math.max(1, size.width);
    const scaleY = screen.height / Math.max(1, size.height);
    const bounds = { x: screen.x + safe.left * scaleX, y: screen.y + safe.top * scaleY,
      width: (safe.right - safe.left) * scaleX, height: (safe.bottom - safe.top) * scaleY };
    const projected = new Map(entries.flatMap((entry) => {
      point.set(...entry.position).applyMatrix4(matrix);
      if (![point.x, point.y, point.z].every(Number.isFinite) || point.z < -1 || point.z > 1) return [];
      return [[entry.id, { x: screen.x + (point.x + 1) * screen.width / 2,
        y: screen.y + (1 - point.y) * screen.height / 2 }] as const];
    }));
    const candidates = entries.flatMap((entry) => {
      const label = labels.current.get(entry.id);
      const anchor = projected.get(entry.id);
      if (!label || !anchor) return [];
      return [{ id: entry.id, ...anchor, width: label.offsetWidth, height: label.offsetHeight }];
    });
    const nodes = [...projected].filter(([id]) => id !== "title").map(([id, anchor]) => ({ id, ...anchor, radius: 7 }));
    const segments = figure.segments.flatMap(([from, to]) => {
      const a = projected.get(from); const b = projected.get(to);
      return a && b ? [{ ax: a.x, ay: a.y, bx: b.x, by: b.y }] : [];
    });
    const key = JSON.stringify([candidates, bounds, nodes, segments], (_name, value) =>
      typeof value === "number" ? Math.round(value * 8) / 8 : value);
    if (!layoutCache.current || layoutCache.current.key !== key) layoutCache.current = {
      key, layout: layoutMainlineAConstellationOcclusionV638({ requiredIds: ["title", ...figure.requiredAnchorIds],
        candidates, measurement: observed, bounds, nodes, segments }),
    };
    const layout = layoutCache.current.layout;
    const placed = new Map(layout.placements.map((box) => [box.id, box]));
    const pending = new Map(layout.pending.map((entry) => [entry.id, entry.reason]));
    const attribute = (element: Element, name: string, value: string) => {
      if (element.getAttribute(name) !== value) element.setAttribute(name, value);
    };
    for (const [id, label] of labels.current) {
      const box = placed.get(id);
      const visibility = box ? "visible" : "hidden";
      if (label.style.visibility !== visibility) label.style.visibility = visibility;
      attribute(label, "data-mainline-a-constellation-label-state", box ? "placed" : "pending");
      attribute(label, "data-mainline-a-constellation-label-pending-reason", pending.get(id) ?? "");
      if (box) {
        const transform = `translate(${box.offsetX}px, ${box.offsetY}px)`;
        if (label.style.transform !== transform) label.style.transform = transform;
      }
      const line = leaders.current.get(id);
      if (line) {
        attribute(line, "visibility", box?.leader ? "visible" : "hidden");
        if (box?.leader) for (const name of ["x1", "y1", "x2", "y2"] as const) attribute(line, name, String(box.leader[name]));
      }
    }
    const title = labels.current.get("title");
    if (title) {
      attribute(title, "data-mainline-a-constellation-label-layout", layout.labelStatus);
      attribute(title, "data-mainline-a-constellation-presentation-layout", layout.status);
      attribute(title, "data-mainline-a-constellation-label-required-count", String(figure.requiredAnchorIds.length + 1));
      attribute(title, "data-mainline-a-constellation-label-placed-count", String(layout.placements.length));
      attribute(title, "data-mainline-a-constellation-label-pending-ids", layout.pending.map((entry) => entry.id).join(","));
      attribute(title, "data-mainline-a-constellation-node-occluded-ids", layout.occludedNodeIds.join(","));
      attribute(title, "data-mainline-a-constellation-node-clipped-ids", layout.clippedNodeIds.join(","));
      attribute(title, "data-mainline-a-constellation-node-unprojected-ids", layout.unprojectedNodeIds.join(","));
      attribute(title, "data-mainline-a-constellation-figure-visibility",
        observed && !figure.sourceComplete ? "pending" : layout.figureStatus);
    }
  });
  return <group ref={group}>
    {entries.map((entry) => <Html key={entry.id} position={entry.position} style={{ pointerEvents: "none" }} zIndexRange={[19, 0]}>
      <svg aria-hidden="true" width="1" height="1" style={{ position: "absolute", overflow: "visible", pointerEvents: "none" }}>
        <line ref={(element) => { if (element) leaders.current.set(entry.id, element); else leaders.current.delete(entry.id); }}
          visibility="hidden" stroke="#95c5d7" strokeOpacity="0.5" strokeWidth="1" />
      </svg>
      <div ref={(element) => { if (element) labels.current.set(entry.id, element); else labels.current.delete(entry.id); }}
        style={{ visibility: "hidden", fontSize: entry.id === "title" ? (mobile ? 13 : 14) : (mobile ? 11 : 12), lineHeight: "18px" }}
        className={entry.id === "title"
          ? "whitespace-nowrap rounded border border-cyan-100/25 bg-[#060d16]/90 px-2 py-1 font-medium text-cyan-50 shadow-lg"
          : "whitespace-nowrap rounded bg-[#060d16]/80 px-1.5 py-0.5 text-[#deedf6] shadow-[0_1px_5px_#000]"}
        data-constellation-label={entry.id === "title" ? code : undefined}
        data-constellation-label-selected={entry.id === "title" ? "true" : undefined}
        data-mainline-a-constellation-label-layout={entry.id === "title" ? "unobserved" : undefined}
        data-mainline-a-constellation-label-state="pending"
        data-atlas-label-layout-owner="constellation-v638"
        data-mainline-a-constellation-anchor-label={entry.id === "title" ? undefined : entry.id}>
        {entry.name}{entry.id === "title" && !figure.sourceComplete ? <span className="ml-2 text-[10px] text-amber-200">资料待补</span> : null}
      </div>
    </Html>)}
  </group>;
}

function constellationCentroid(
  waypoints: readonly [number, number][],
): THREE.Vector3 {
  const centroid = new THREE.Vector3();
  for (const [raDeg, decDeg] of waypoints) {
    const ra = (raDeg * Math.PI) / 180;
    const dec = (decDeg * Math.PI) / 180;
    centroid.add(
      new THREE.Vector3(
        Math.cos(dec) * Math.cos(ra),
        Math.sin(dec),
        Math.cos(dec) * Math.sin(ra),
      ),
    );
  }
  return centroid.normalize().multiplyScalar(CONSTELLATION_DISTANCE_SCENE);
}
