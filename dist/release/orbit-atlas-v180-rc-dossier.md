# Orbit Atlas v180 Web RC

Status: **web-dual-delivery-rc-ready-science-shadow-retained**

- Framework: Next 15.5.18, React 19.2.7, R3F 9.6.1, Three ^0.170.0
- Regression: 673/673; focused 25/25
- Browser QA: standalone 7 passed + 1 expected skip; Lite 2 passed
- Initial JS: standalone 698991 B; Lite 698991 B; budget 768000 B
- Soak: 10 measured cycles, heap 39.59 to 42.42 MiB
- GPU: ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU (0x000028E0) Direct3D11 vs_5_0 ps_5_0, D3D11)

## Delivery capability matrix

| Capability | standalone-full | vercel-lite |
|---|---:|---:|
| Interactive single Canvas | Yes | Yes |
| Six local content packs | Yes | No |
| Million-star catalog | Yes | No |
| Full observation fixtures | Yes | No |
| Loopback fallback | N/A | No |
| Cloud deployed in this release | No | No |

## Science boundary

Default: `legacy-eih-1pn`. V2 remains shadow-only; no scientific promotion was applied.

## Known limitations

- Vercel Lite omits the million-star catalog and full observation fixtures.
- V2 relativity remains shadow-only because the independent promotion gates are not satisfied.
- Cloud deployment and desktop installers are separate, unreleased tracks.
- GPU gl.info counters remain observational and are not optimization proof.
- AtlasRuntimeWorkbench is still a large integration surface even though UniverseRuntimeController is a 38-line facade.

## Rollback

1. Select standalone-full and the retained v174/v167 verified artifact set.
2. Keep legacy-eih-1pn as the default kernel and leave V2 shadow-only.
3. Restore the six checksummed content-pack manifests from retained release artifacts.
4. Re-run tsc, the 673-test atlas suite, both production builds and fresh Browser QA before promotion.
