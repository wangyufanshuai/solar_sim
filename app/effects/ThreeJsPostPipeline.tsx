"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useLayoutEffect, useRef } from "react";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { createVignetteShaderPass } from "./vignetteShaderPass";

type PassRefs = {
  composer: EffectComposer;
  bloomPass: UnrealBloomPass;
  vignettePass: ShaderPass;
};

export default function ThreeJsPostPipeline({
  visualEnhance = false,
}: {
  visualEnhance?: boolean;
}) {
  const { gl, scene, camera, size } = useThree();
  const refs = useRef<PassRefs | null>(null);

  useLayoutEffect(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.14,
      0.16,
      0.96
    );
    const vignettePass = createVignetteShaderPass(0.58, 1.08);
    const outputPass = new OutputPass();

    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(vignettePass);
    composer.addPass(outputPass);

    composer.setPixelRatio(1);
    composer.setSize(size.width, size.height);

    refs.current = { composer, bloomPass, vignettePass };

    return () => {
      bloomPass.dispose();
      vignettePass.dispose();
      outputPass.dispose();
      composer.dispose();
      refs.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    const b = refs.current?.bloomPass;
    const v = refs.current?.vignettePass;
    if (!b) return;
    if (visualEnhance) {
      b.strength = 0.2;
      b.radius = 0.2;
      b.threshold = 0.94;
    } else {
      b.strength = 0.14;
      b.radius = 0.16;
      b.threshold = 0.96;
    }
    if (v?.uniforms.darkness && v.uniforms.offset) {
      v.uniforms.darkness.value = visualEnhance ? 0.52 : 0.58;
      v.uniforms.offset.value = visualEnhance ? 0.98 : 1.08;
    }
  }, [visualEnhance]);

  useEffect(() => {
    const c = refs.current?.composer;
    if (!c) return;
    c.setPixelRatio(1);
    c.setSize(size.width, size.height);
  }, [gl, size.width, size.height, size]);

  useFrame(() => {
    const composer = refs.current?.composer;
    if (!composer) return;
    composer.render();
  }, 1);

  return null;
}
