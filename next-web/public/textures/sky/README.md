# Sky equirectangular textures

## Active Universe Sandbox style sky

The default sky sphere is:

- `universe-sandbox-sky-8k.jpg`
- Build command: `npm run build-sky`
- Sources:
  - NASA SVS Deep Star Maps 2020, `milkyway_2020_8k.exr` and `hiptyc_2020_8k.exr`
  - ESO/S. Brunier Milky Way panorama, `eso0932a`
- Original source size: `8192x4096`
- Aspect ratio: strict `2:1`
- Projection: plate carree / equirectangular

The browser loads JPG because `THREE.TextureLoader` does not load EXR directly. The build script caches large source files under `.cache/sky-sources`; do not keep EXR source files under `public/`, because the Next dev server will expose and scan them.

Fallback sky:

- `nasa_milkyway_2020_4k_balanced.jpg`

## Rendering policy

Render the equirect as a real sky sphere, not as a screen-space image. `GalaxyEnvironmentSphere.tsx` applies only light shader-level exposure, contrast, saturation, and tiny-star enhancement. Do not add heavy runtime noise or procedural fog bands; rebuild the JPG instead when retuning the look.

## Important

Only use strict `2:1` equirectangular JPG/PNG assets for the sky sphere. Regular NASA photos, cropped Milky Way images, or `4:3`/`16:9` wallpapers should not be mapped onto the sphere; use those as low-opacity decorative overlays instead.
