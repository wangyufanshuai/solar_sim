"use client";

import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import type * as THREE from "three";
import { disposeV590TextureLoader } from "../lib/useV590Texture";
import { disposeV591TextureLoader } from "../lib/useV591Texture";
import { disposeMajorMoonVisualTextureLoaderV592 } from "../lib/useMajorMoonVisualTextureV592";
import { disposeNebulaVisualTextureLoaderV592 } from "../lib/useNebulaVisualTextureV592";

let laneGenerationV592 = 0;

function retireInheritedKtx2LanesV592(gl: THREE.WebGLRenderer): void {
  disposeV590TextureLoader(gl);
  disposeV591TextureLoader(gl);
  disposeMajorMoonVisualTextureLoaderV592(gl, "v592-lane-bridge-retirement");
  disposeNebulaVisualTextureLoaderV592(gl, "v592-lane-bridge-retirement");
}

/**
 * v592 owns an additive KTX2 lane after the frozen v591 sentinel hands off.
 * A released stage can still have an inherited async decoder finishing its
 * cleanup. Retiring both inherited runtimes before passive effects mount, and
 * once more after all unmount cleanups, prevents a stale worker from surviving
 * into the next Release/Restore cycle without editing the sealed v591 code.
 */
export default function CelestialKtx2LaneBridgeV592(): null {
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    const generation = ++laneGenerationV592;
    retireInheritedKtx2LanesV592(gl);
    const root = document.querySelector<HTMLElement>(
      '[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]',
    );
    if (root) root.dataset.atlasV592Ktx2LanePolicy = "v591-sentinel-then-v592-single-lane";

    return () => {
      retireInheritedKtx2LanesV592(gl);
      queueMicrotask(() => {
        if (laneGenerationV592 === generation) retireInheritedKtx2LanesV592(gl);
      });
    };
  }, [gl]);

  return null;
}
