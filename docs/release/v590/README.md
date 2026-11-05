# Orbit Atlas v590 governance

v590 is an additive local-shadow visual candidate. Formal product v263 and all
v589/V9 inputs remain read-only.

Hard gates:

- Hero admission is derived from each body's exact `requiredAssets` list; a
  manifest cannot self-declare admission.
- Full texture channels carry desktop/mobile minimum dimensions. A 1K KTX2 is
  displayable for fallback diagnostics but cannot pass Full qualification.
- Full mobile selection never promotes a desktop 8K asset into the mobile
  slot. An exact, dimension-qualified `fullMobile` raster is reported as
  `full-raster`; a Lite fallback remains a blocked Full-quality result.
- A current KTX2 parse timeout disposes its loader generation and worker pool.
  A stale timer first checks generation ownership and cannot invalidate the
  newer loader that replaced it.
- Seal and read-only verification parse KTX2/JPEG/WebP/PNG headers and compare
  actual dimensions with the manifest instead of trusting declared sizes.
- Hero admission also requires a renderer capability. Future irregular-body
  assets cannot self-promote before this route has a consumer for them. Sun
  requires exact photosphere/chromosphere channels, while Bennu requires all
  three regolith texture channels used by its renderer.
- `npm run verify:atlas:celestial-v590:readonly` reads and hashes the sealed
  chain without creating or modifying any artifact.
- Sealing covers all 22 v589 source-manifest entries and enforces source-cache,
  Full-compressed, Lite-increment, and Lite-total byte budgets.
- Operational coverage explicitly includes Next 16 `proxy.ts`, the proxy
  contract, the shared profile builder and the standalone launcher.
- The base Milky Way is identified as a v588 read-only dependency; the catalog
  star and dust overlays retain their distinct V9 read-only identity.

Science/Cinematic and Clean view mutate presentation state only. The browser
probe loads and validates the real v587 `ObservationSummaryV3` projection. If
that artifact is unavailable or invalid, v590 reports `blocked-not-connected`;
it never certifies stability from a locally constructed constant.
