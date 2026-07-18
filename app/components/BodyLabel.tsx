"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import {
  LABEL_OCCLUDER_BODY_INDEX_KEY,
  useOptionalLabelOcclusion,
} from "../context/LabelOcclusionContext";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import {
  LABEL_SCREEN_LOD_FADE_END_PX,
  LABEL_SCREEN_LOD_FADE_START_PX,
  lodAlphaFromScreenDiameterPx,
  screenDiscDiameterPx,
} from "../lib/screenSpaceBodyLod";

/** Kept for external prop typing. */
export type BodyLabelPhysicsMetricsConfig = {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  bodyIndex: number;
  bodyId: string;
  auToScene: number;
};

export type BodyLabelTone = "sun" | "body";

type BodyLabelProps = {
  text: string;
  position?: [number, number, number];
  fadeNear?: number;
  fadeFar?: number;
  /** Scales fixed-screen sizing (larger = bigger text on screen). */
  distanceFactor?: number;
  fontSizePx?: number;
  bodyIndex?: number;
  surfaceFadeNear?: number;
  surfaceFadeFar?: number;
  labelTone?: BodyLabelTone;
  lodDiscWorldRadius?: number;
  /** 3D line from body anchor to label anchor (helps when labels crowd). */
  showLeaderLine?: boolean;
};

const raycaster = new THREE.Raycaster();
const _labelWorld = new THREE.Vector3();
const _bodyCenter = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _lineA = new THREE.Vector3();
const _lineB = new THREE.Vector3();

/**
 * Fixed distanceFactor for Drei Html.
 * We no longer update this reactively — instead we scale the CSS transform
 * directly via the ref, eliminating React re-render flicker.
 */
const FIXED_DISTANCE_FACTOR = 64_000;

function BodyLabel({
  text,
  position = [0, 0, 0],
  fadeNear,
  fadeFar,
  distanceFactor = 50,
  fontSizePx = 480_000,
  bodyIndex,
  surfaceFadeNear,
  surfaceFadeFar,
  labelTone: _labelTone = "body",
  lodDiscWorldRadius,
  showLeaderLine = false,
}: BodyLabelProps) {
  const leaderBarH = Math.min(5_000_000, Math.max(28, Math.round(fontSizePx * 0.42)));
  const rootRef = useRef<THREE.Group>(null);
  const lineStartRef = useRef<THREE.Object3D>(null);
  const htmlRootRef = useRef<HTMLDivElement>(null);
  const lastLabelStyleRef = useRef({
    transform: "",
    opacity: "",
    leaderVisible: false,
    leaderOpacity: Number.NaN,
  });
  const { camera, size } = useThree();
  const labelOcclusion = useOptionalLabelOcclusion();

  const [lx, ly, lz] = position;
  const leaderLocal = useMemo(
    () => new THREE.Vector3(-lx, -ly, -lz),
    [lx, ly, lz]
  );

  const leaderLine = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const arr = new Float32Array(6);
    geom.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x88bbdd,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
    return new THREE.Line(geom, mat);
  }, []);

  useEffect(
    () => () => {
      leaderLine.geometry.dispose();
      (leaderLine.material as THREE.Material).dispose();
    },
    [leaderLine]
  );

  useFrame(() => {
    const root = rootRef.current;
    const el = htmlRootRef.current;
    if (!root || !el) return;

    root.getWorldPosition(_labelWorld);
    const distLabel = _labelWorld.distanceTo(camera.position);
    const cam = camera as THREE.PerspectiveCamera;

    // Compute target CSS scale to keep label at fixed screen size.
    // Instead of setState (causes re-render flicker), apply scale directly to DOM.
    if (cam.isPerspectiveCamera && distLabel > 1e-4) {
      const vFov = (cam.fov * Math.PI) / 180;
      const scaleF = 2 * Math.tan(vFov * 0.5) * distLabel;
      const parentScale = THREE.MathUtils.clamp(distanceFactor / 42, 450, 4000);
      // ratio of desired distanceFactor vs the fixed one baked into Html
      const targetDf = 38 * scaleF * parentScale;
      const scaleFactor = targetDf / FIXED_DISTANCE_FACTOR;
      // Apply as CSS transform scale on the inner content div
      const inner = el.firstElementChild as HTMLElement | null;
      const previousBodyLabelStyle = lastLabelStyleRef.current;
      const transform = `translate(-50%, 0) scale(${scaleFactor})`;
      if (inner && previousBodyLabelStyle.transform !== transform) {
        inner.style.transform = transform;
        previousBodyLabelStyle.transform = transform;
      }
    }

    let distanceAlpha = 1;
    if (
      fadeNear != null &&
      fadeFar != null &&
      fadeFar > fadeNear + 1e-6
    ) {
      distanceAlpha = 1 - THREE.MathUtils.smoothstep(fadeNear, fadeFar, distLabel);
    }

    let surfaceAlpha = 1;
    const parent = root.parent;
    if (
      parent &&
      surfaceFadeNear != null &&
      surfaceFadeFar != null &&
      surfaceFadeFar > surfaceFadeNear + 1e-6
    ) {
      parent.getWorldPosition(_bodyCenter);
      const distCenter = _bodyCenter.distanceTo(camera.position);
      surfaceAlpha = THREE.MathUtils.smoothstep(
        surfaceFadeNear,
        surfaceFadeFar,
        distCenter,
      );
    }

    let occlusionAlpha = 1;
    if (bodyIndex !== undefined && labelOcclusion) {
      const occluders = labelOcclusion.getOccluders();
      if (occluders.length > 0) {
        _rayDir.copy(_labelWorld).sub(camera.position);
        const rayLen = _rayDir.length();
        if (rayLen > 1e-8) {
          _rayDir.multiplyScalar(1 / rayLen);
          raycaster.set(camera.position, _rayDir);
          raycaster.near = 1e-4;
          raycaster.far = rayLen + 1;
          const hits = raycaster.intersectObjects(
            [...occluders] as THREE.Object3D[],
            false,
          );
          for (let i = 0; i < hits.length; i++) {
            const h = hits[i]!;
            if (h.distance >= rayLen - 0.02) continue;
            const occIdx = (h.object as THREE.Mesh).userData[
              LABEL_OCCLUDER_BODY_INDEX_KEY
            ] as number | undefined;
            if (occIdx !== undefined && occIdx !== bodyIndex) {
              occlusionAlpha = 0;
              break;
            }
          }
        }
      }
    }

    let screenLod = 1;
    if (
      lodDiscWorldRadius != null &&
      lodDiscWorldRadius > 0 &&
      parent != null
    ) {
      parent.getWorldPosition(_bodyCenter);
      const px = screenDiscDiameterPx(
        cam,
        size.height,
        _bodyCenter,
        lodDiscWorldRadius
      );
      screenLod = lodAlphaFromScreenDiameterPx(
        px,
        LABEL_SCREEN_LOD_FADE_START_PX,
        LABEL_SCREEN_LOD_FADE_END_PX,
      );
    }

    const screenLodSoft = Math.pow(
      THREE.MathUtils.clamp(screenLod, 0.08, 1),
      0.88,
    );

    const base = THREE.MathUtils.clamp(
      distanceAlpha * surfaceAlpha * occlusionAlpha * screenLodSoft,
      0,
      1,
    );
    const previousBodyLabelStyle = lastLabelStyleRef.current;
    const opacity = String(base);
    if (previousBodyLabelStyle.opacity !== opacity) {
      el.style.opacity = opacity;
      previousBodyLabelStyle.opacity = opacity;
    }

    const leaderVisible = showLeaderLine && base > 0.04;
    if (previousBodyLabelStyle.leaderVisible !== leaderVisible) {
      leaderLine.visible = leaderVisible;
      previousBodyLabelStyle.leaderVisible = leaderVisible;
    }
    if (leaderLine.visible && lineStartRef.current) {
      lineStartRef.current.getWorldPosition(_lineA);
      root.getWorldPosition(_lineB);
      const posAttr = leaderLine.geometry.attributes.position as THREE.BufferAttribute;
      _lineA.toArray(posAttr.array, 0);
      _lineB.toArray(posAttr.array, 3);
      posAttr.needsUpdate = true;
    }
    const leaderOpacity = 0.22 + 0.36 * base;
    if (previousBodyLabelStyle.leaderOpacity !== leaderOpacity) {
      (leaderLine.material as THREE.LineBasicMaterial).opacity = leaderOpacity;
      previousBodyLabelStyle.leaderOpacity = leaderOpacity;
    }
  });

  return (
    <group ref={rootRef} position={position}>
      <object3D ref={lineStartRef} position={leaderLocal} />
      {showLeaderLine ? <primitive object={leaderLine} /> : null}
      <Html
        center={false}
        distanceFactor={FIXED_DISTANCE_FACTOR}
        zIndexRange={[100, 0]}
        pointerEvents="none"
        transform
        occlude={false}
      >
        <div
          ref={htmlRootRef}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: "translate(-50%, 0)",
            transformOrigin: "50% 100%",
            willChange: "opacity, transform",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', var(--font-body), sans-serif",
              fontSize: `${fontSizePx}px`,
              fontWeight: 400,
              letterSpacing: "0.018em",
              lineHeight: 1.2,
              color: _labelTone === "sun" ? "rgba(222, 202, 165, 0.78)" : "rgba(196, 194, 188, 0.58)",
              textShadow: "0 0 12px rgba(0,0,0,0.88), 0 1px 2px rgba(0,0,0,0.7)",
              whiteSpace: "nowrap",
              marginBottom: 2,
            }}
          >
            {text}
          </div>
          <div
            style={{
              width: 1,
              height: leaderBarH,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.08))",
            }}
            aria-hidden
          />
        </div>
      </Html>
    </group>
  );
}

export default BodyLabel;
