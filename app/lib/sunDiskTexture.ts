import * as THREE from "three";
import { useEffect, useState } from "react";
import { useOptionalTexture } from "./useOptionalTexture";

/**
 * Place a high-res NASA/SDO-style disk at `public/textures/sun-nasa.jpg` to avoid hotlinking.
 * If missing, falls back to NASA GSFC SDO latest 171Å (2048², CORS anonymous).
 */
export const SUN_DISK_TEXTURE_LOCAL = "/textures/sun-nasa.jpg";

export const SUN_DISK_TEXTURE_NASA_SDO_171 =
  "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_0171.jpg";

function useCrossOriginTexture(url: string | undefined): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTex(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
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
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
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
  }, [url]);

  return tex;
}

/** NASA / local JPEG for solar disk; never throws. */
export function useSunDiskTexture(): THREE.Texture | null {
  const local = useOptionalTexture(SUN_DISK_TEXTURE_LOCAL);
  const remote = useCrossOriginTexture(
    local ? undefined : SUN_DISK_TEXTURE_NASA_SDO_171,
  );
  return local ?? remote;
}
