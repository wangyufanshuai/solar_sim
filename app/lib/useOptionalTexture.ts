import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useState } from "react";

function configureLoadedTexture(
  texture: THREE.Texture,
  colorSpace: THREE.ColorSpace,
  anisotropyMax: number,
) {
  texture.colorSpace = colorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(16, Math.max(1, anisotropyMax));
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
}

export function useOptionalTexture(url: string | undefined): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!url) {
      setTex(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    let alive = true;
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
          THREE.SRGBColorSpace,
          gl.capabilities.getMaxAnisotropy(),
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
  }, [gl, url]);

  return tex;
}

export function useOptionalDataTexture(
  url: string | undefined,
): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!url) {
      setTex(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    let alive = true;
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
          THREE.LinearSRGBColorSpace,
          Math.max(4, Math.floor(gl.capabilities.getMaxAnisotropy() / 2)),
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
  }, [gl, url]);

  return tex;
}
