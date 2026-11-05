"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import {
  BRIGHT_STARS_TIER1,
  type BrightStarDef,
} from "../data/brightStarCatalog";
import {
  chooseStellarPickCandidate,
  stellarPointerIsShortClick,
  type StellarPickCandidate,
} from "../lib/atlasFocusV2";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import {
  getGaiaPickEntries,
  gaiaStarToOverlayScenePosition,
  selectGaiaLabelStars,
  type GaiaIndexedStar,
} from "../lib/gaiaCatalogIndex";

const BRIGHT_STAR_RADIUS = 8000;

type PointerDownState = {
  x: number;
  y: number;
  atMs: number;
  pointerId: number;
  selectionEpoch: number;
};

function brightStarPosition(star: BrightStarDef, target: THREE.Vector3): THREE.Vector3 {
  const ra = (star.raHours / 24) * Math.PI * 2;
  const dec = (star.decDeg / 180) * Math.PI;
  return target.set(
    BRIGHT_STAR_RADIUS * Math.cos(dec) * Math.cos(ra),
    BRIGHT_STAR_RADIUS * Math.sin(dec),
    -BRIGHT_STAR_RADIUS * Math.cos(dec) * Math.sin(ra),
  );
}

export default function StellarPickController({
  floatingOriginRef,
  gaiaIndex,
  gaiaEnabled,
  maxGaiaCandidates,
  selectedGaiaSourceId,
  selectionEpochRef,
  onPickBrightStar,
  onPickGaiaStar,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  gaiaIndex: readonly GaiaIndexedStar[];
  gaiaEnabled: boolean;
  maxGaiaCandidates: number;
  selectedGaiaSourceId: string;
  selectionEpochRef: MutableRefObject<number>;
  onPickBrightStar?: (star: BrightStarDef) => void;
  onPickGaiaStar?: (star: GaiaIndexedStar) => void;
}) {
  const { camera, gl, size } = useThree();
  const downRef = useRef<PointerDownState | null>(null);
  const pendingFrameRef = useRef<number | null>(null);
  const pointRef = useRef(new THREE.Vector3());
  const relativeRef = useRef(new THREE.Vector3());
  const cameraForwardRef = useRef(new THREE.Vector3());

  const gaiaPickEntries = useMemo(() => {
    if (!gaiaEnabled || maxGaiaCandidates <= 0) return [];
    return getGaiaPickEntries(gaiaIndex, maxGaiaCandidates);
  }, [gaiaEnabled, gaiaIndex, maxGaiaCandidates]);

  const labelledGaiaIds = useMemo(
    () => new Set(
      selectGaiaLabelStars(gaiaIndex, size.width < 640, selectedGaiaSourceId)
        .map((entry) => entry.sourceId),
    ),
    [gaiaIndex, selectedGaiaSourceId, size.width],
  );

  useEffect(() => {
    const element = gl.domElement;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      downRef.current = {
        x: event.clientX,
        y: event.clientY,
        atMs: performance.now(),
        pointerId: event.pointerId,
        selectionEpoch: selectionEpochRef.current,
      };
    };

    const onPointerCancel = () => {
      downRef.current = null;
    };

    const onPointerUp = (event: PointerEvent) => {
      const down = downRef.current;
      downRef.current = null;
      if (!down || down.pointerId !== event.pointerId || event.button !== 0) return;
      if (!stellarPointerIsShortClick({
        downX: down.x,
        downY: down.y,
        upX: event.clientX,
        upY: event.clientY,
        elapsedMs: performance.now() - down.atMs,
      })) return;

      const pointerType = event.pointerType;
      const clientX = event.clientX;
      const clientY = event.clientY;
      pendingFrameRef.current = window.requestAnimationFrame(() => {
        pendingFrameRef.current = null;
        if (selectionEpochRef.current !== down.selectionEpoch) return;

        const rect = element.getBoundingClientRect();
        const pointerX = clientX - rect.left;
        const pointerY = clientY - rect.top;
        const candidates: StellarPickCandidate[] = [];
        const brightById = new Map<string, BrightStarDef>();
        const gaiaById = new Map<string, GaiaIndexedStar>();
        camera.getWorldDirection(cameraForwardRef.current);

        const project = (
          point: THREE.Vector3,
          candidate: Omit<StellarPickCandidate, "screenX" | "screenY">,
        ) => {
          relativeRef.current.subVectors(point, camera.position);
          if (relativeRef.current.dot(cameraForwardRef.current) <= 0) return;
          point.project(camera);
          if (point.z < -1 || point.z > 1) return;
          const screenX = (point.x * 0.5 + 0.5) * rect.width;
          const screenY = (-point.y * 0.5 + 0.5) * rect.height;
          if (screenX < -24 || screenX > rect.width + 24 || screenY < -24 || screenY > rect.height + 24) return;
          candidates.push({ ...candidate, screenX, screenY });
        };

        for (const star of BRIGHT_STARS_TIER1) {
          brightById.set(star.id, star);
          project(brightStarPosition(star, pointRef.current), {
            kind: "bright-star",
            stableId: star.id,
            catalogId: star.id === "sirius" ? "nearby-star:sirius" : `bright-star:${star.id}`,
            magnitude: star.magV,
            labelled: star.magV <= 1.5,
          });
        }

        if (gaiaEnabled) {
          const offset = floatingOriginRef.current.offsetScene;
          for (const indexed of gaiaPickEntries) {
            gaiaById.set(indexed.sourceId, indexed);
            const position = gaiaStarToOverlayScenePosition(indexed.star);
            pointRef.current.set(
              position[0] - offset.x,
              position[1] - offset.y,
              position[2] - offset.z,
            );
            project(pointRef.current, {
              kind: "gaia-star",
              stableId: indexed.sourceId,
              catalogId: indexed.id,
              magnitude: indexed.star.magG,
              labelled: labelledGaiaIds.has(indexed.sourceId),
            });
          }
        }

        const picked = chooseStellarPickCandidate(candidates, {
          screenX: pointerX,
          screenY: pointerY,
          pointerType,
        });
        if (!picked) return;
        selectionEpochRef.current += 1;
        if (picked.kind === "bright-star") {
          const star = brightById.get(picked.stableId);
          if (star) onPickBrightStar?.(star);
          return;
        }
        const star = gaiaById.get(picked.stableId);
        if (star) onPickGaiaStar?.(star);
      });
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      if (pendingFrameRef.current !== null) window.cancelAnimationFrame(pendingFrameRef.current);
    };
  }, [camera, floatingOriginRef, gaiaEnabled, gaiaPickEntries, gl, labelledGaiaIds, onPickBrightStar, onPickGaiaStar, selectionEpochRef]);

  return null;
}
