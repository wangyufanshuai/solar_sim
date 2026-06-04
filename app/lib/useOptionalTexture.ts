import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useState } from "react";
import { useOptionalRenderAssetQueue } from "../context/RenderAssetQueueContext";
import { priorityForTextureUrl, type RenderAssetPriority } from "./renderAssetQueue";

function configureLoadedTexture(
  texture: THREE.Texture,
  colorSpace: THREE.ColorSpace,
  anisotropyMax: number,
  anisotropyCap = 16,
) {
  texture.colorSpace = colorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(anisotropyCap, Math.max(1, anisotropyMax));
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
}

function useQueuedOptionalTexture(
  url: string | undefined,
  colorSpace: THREE.ColorSpace,
  anisotropyCap: number,
  priorityOverride?: RenderAssetPriority,
): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const gl = useThree((state) => state.gl);
  const queue = useOptionalRenderAssetQueue();

  useEffect(() => {
    if (!url) {
      setTex(null);
      return;
    }

    let alive = true;
    const anisotropy = Math.min(anisotropyCap, Math.max(1, gl.capabilities.getMaxAnisotropy()));
    const priority = priorityOverride ?? priorityForTextureUrl(url);

    if (queue) {
      const cancel = queue.loadTexture({
        url,
        priority,
        colorSpace,
        anisotropy,
        onLoad: (t) => {
          if (alive) setTex(t);
        },
        onError: () => {
          if (alive) setTex(null);
        },
      });
      return () => {
        alive = false;
        cancel();
        setTex(null);
      };
    }

    const loader = new THREE.TextureLoader();
    let loaded: THREE.Texture | null = null;

    loader.load(
      url,
      (t) => {
        if (!alive) {
          t.dispose();
          return;
        }
        loaded = t;
        configureLoadedTexture(
          t,
          colorSpace,
          gl.capabilities.getMaxAnisotropy(),
          anisotropyCap,
        );
        setTex(t);
      },
      undefined,
      () => {
        if (alive) setTex(null);
      },
    );

    return () => {
      alive = false;
      if (loaded) loaded.dispose();
      setTex(null);
    };
  }, [anisotropyCap, colorSpace, gl, priorityOverride, queue, url]);

  return tex;
}

export function useOptionalTexture(
  url: string | undefined,
  priorityOverride?: RenderAssetPriority,
): THREE.Texture | null {
  return useQueuedOptionalTexture(url, THREE.SRGBColorSpace, 16, priorityOverride);
}

export function useOptionalDataTexture(
  url: string | undefined,
  priorityOverride?: RenderAssetPriority,
): THREE.Texture | null {
  return useQueuedOptionalTexture(url, THREE.LinearSRGBColorSpace, 8, priorityOverride);
}
