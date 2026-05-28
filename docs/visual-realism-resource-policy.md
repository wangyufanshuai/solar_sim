# Visual Realism Resource Policy

Solar Sim now treats deep-space visuals as anchored sky content instead of screen overlays.

## Runtime Layers

- `GalaxyEnvironmentSphere`: base 8K equirectangular sky sphere, tuned for Milky Way dust lanes, dark-cloud contrast, and restrained star glow.
- `NebulaMilkyWay`: lightweight galactic-coordinate dust enhancement. It follows camera position like a sky dome, but does not rotate with the screen, so the Milky Way remains anchored to sky direction.
- `DeepSkyImageSprites`: real deep-sky images rendered as anchored sky-sphere decals. Core targets load first; deferred targets load during idle time; high-quality targets are enabled only in high-quality mode.

## Manifest

Run the manifest builder after adding or replacing deep-sky resources:

```powershell
npm run build-realism-manifest
```

The generated `public/textures/deep-sky/realism-manifest.json` records source URL, credit, approximate galactic coordinates, render tier, and file size.

## Performance Policy

- Keep default mode stable: core targets first, no full deep-sky preload on first paint.
- Keep single committed files below GitHub's 50 MB recommendation where possible.
- Move future high-resolution originals to CDN/object storage or Git LFS.
- High-quality targets should be enabled only by the high-quality layer switch.

## Scientific Credibility

UI labels distinguish:

- real/generated ephemeris state,
- osculating sampled orbit trails,
- nonlinear visual scale,
- artistic lighting/material enhancement.

Mission Designer remains a first-pass patched-conics planning aid. DeepSeek advisor text must not claim GMAT/STK/NASA validation or real mission feasibility.
