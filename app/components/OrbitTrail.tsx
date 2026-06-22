"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { orbitColorForBodyId } from "../lib/orbitCinematicTokens";
import {
  createGradientOrbitLineBundle,
  setGradientLinePositions,
  setGradientLineColor,
  type GradientOrbitLineBundle,
} from "../lib/orbitTrailGradientMaterial";
import { MAJOR_PLANET_IDS } from "../data/planetsJ2000";

/* ── Types ── */

export type OrbitTrailHandle = {
  updatePosition: (newPos: THREE.Vector3) => void;
  clear: () => void;
};

export type OrbitTrailProps = {
  maxPoints?: number;
  minVertexDistance?: number;
  bodyIndex: number;
  bodyId?: string;
  lodWorldRadius: number;
  selected?: boolean;
  renderOrder?: number;
};

const OrbitTrail = forwardRef<OrbitTrailHandle, OrbitTrailProps>(
  function OrbitTrail(
    {
      maxPoints = 1000,
      minVertexDistance = 0.02,
      bodyIndex,
      bodyId,
      lodWorldRadius,
      selected = false,
      renderOrder = -30,
    },
    ref
  ) {
    const minDistSq = minVertexDistance * minVertexDistance;
    const { size } = useThree();

    /* ── Ring buffer ── */
    const sampleStartRef = useRef(0);
    const sampleCountRef = useRef(0);
    const dirtyRef = useRef(false);
    const prevSelectedRef = useRef(selected);

    const samplePool = useMemo(
      () => Array.from({ length: maxPoints }, () => new THREE.Vector3()),
      [maxPoints]
    );
    const orderedScratch = useMemo(
      () => Array.from({ length: maxPoints }, () => new THREE.Vector3()),
      [maxPoints]
    );

    /* ── Gradient trail bundle (ShaderMaterial with comet-tail fade) ── */
    const color = useMemo(
      () => orbitColorForBodyId(bodyId ?? `body-${bodyIndex}`),
      [bodyId, bodyIndex]
    );

    const bundle = useMemo<GradientOrbitLineBundle>(
      () =>
        createGradientOrbitLineBundle(color, {
          closed: false,
          renderOrder,
          maxVertices: maxPoints,
          headAlpha: 0.98,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [maxPoints, renderOrder]
    );

    const glowBundle = useMemo<GradientOrbitLineBundle>(() => {
      const glowColor = color.clone().lerp(new THREE.Color("#fff2ce"), 0.24);
      return createGradientOrbitLineBundle(glowColor, {
        closed: false,
        renderOrder: renderOrder - 1,
        maxVertices: maxPoints,
        headAlpha: 0.54,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxPoints, renderOrder]);

    useEffect(() => {
      setGradientLineColor(bundle.material, color);
      setGradientLineColor(
        glowBundle.material,
        color.clone().lerp(new THREE.Color("#fff2ce"), 0.24)
      );
    }, [bundle.material, glowBundle.material, color]);

    useEffect(() => {
      return () => {
        bundle.geometry.dispose();
        bundle.material.dispose();
        glowBundle.geometry.dispose();
        glowBundle.material.dispose();
      };
    }, [bundle, glowBundle]);

    useEffect(() => {
      sampleStartRef.current = 0;
      sampleCountRef.current = 0;
      bundle.geometry.setDrawRange(0, 0);
      glowBundle.geometry.setDrawRange(0, 0);
    }, [bundle.geometry, glowBundle.geometry, maxPoints]);

    /* ── Ring buffer push ── */
    const pushSample = useCallback(
      (v: THREE.Vector3) => {
        const cap = maxPoints;
        const pool = samplePool;
        const start = sampleStartRef.current;
        const len = sampleCountRef.current;

        if (len > 0) {
          const lastIdx = (start + len - 1) % cap;
          const last = pool[lastIdx]!;
          if (last.distanceToSquared(v) < minDistSq) return;
        }

        if (len < cap) {
          const ni = (start + len) % cap;
          pool[ni]!.copy(v);
          sampleCountRef.current = len + 1;
        } else {
          const newStart = (start + 1) % cap;
          sampleStartRef.current = newStart;
          const ni = (newStart + cap - 1) % cap;
          pool[ni]!.copy(v);
        }
        dirtyRef.current = true;
      },
      [maxPoints, minDistSq, samplePool]
    );

    useImperativeHandle(
      ref,
      () => ({
        updatePosition: (newPos: THREE.Vector3) => {
          pushSample(newPos);
        },
        clear: () => {
          sampleStartRef.current = 0;
          sampleCountRef.current = 0;
          dirtyRef.current = false;
          bundle.geometry.setDrawRange(0, 0);
          glowBundle.geometry.setDrawRange(0, 0);
        },
      }),
      [pushSample, bundle.geometry, glowBundle.geometry]
    );

    /* ── Per-frame update ── */
    useFrame(() => {
      const cap = maxPoints;
      const start = sampleStartRef.current;
      const nSamples = sampleCountRef.current;
      const prominentTrail = bodyId ? MAJOR_PLANET_IDS.has(bodyId) || bodyId === "moon" : false;

      if (prevSelectedRef.current !== selected) {
        prevSelectedRef.current = selected;
        dirtyRef.current = true;
      }

      if (nSamples < 2) {
        bundle.line.visible = false;
        glowBundle.line.visible = false;
        return;
      }

      if (dirtyRef.current) {
        for (let i = 0; i < nSamples; i++) {
          orderedScratch[i]!.copy(samplePool[(start + i) % cap]!);
        }

        setGradientLinePositions(bundle.geometry, orderedScratch, nSamples, "openHeadAtEnd");
        if (selected) {
          setGradientLinePositions(
            glowBundle.geometry,
            orderedScratch,
            nSamples,
            "openHeadAtEnd"
          );
        }
        dirtyRef.current = false;
      }
      bundle.line.visible = true;
      glowBundle.line.visible = selected;

      const mat = bundle.material;
      mat.uniforms.uOpacityScale.value = selected
        ? 1.28
        : prominentTrail
          ? 0.72
          : 0.46;
      mat.uniforms.uRgbMul.value = selected
        ? 1.85
        : prominentTrail
          ? 1.36
          : 1.12;
      if (selected) {
        glowBundle.material.uniforms.uOpacityScale.value = 0.86;
        glowBundle.material.uniforms.uRgbMul.value = 1.45;
      } else if (!prominentTrail) {
        glowBundle.material.uniforms.uOpacityScale.value = 0.56;
        glowBundle.material.uniforms.uRgbMul.value = 1.12;
      }
    });

    return (
      <group renderOrder={renderOrder} frustumCulled={false}>
        <primitive object={glowBundle.line} />
        <primitive object={bundle.line} />
      </group>
    );
  }
);

export default OrbitTrail;
