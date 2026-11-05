# Orbit Atlas v186 RC dossier

Status: **web-dual-delivery-and-unsigned-desktop-compact-rc-ready-science-shadow-retained**

- Web regression: 673/673; Browser standalone 7 passed + 1 expected skip; Lite 2/2.
- Initial JS: standalone 654309 B; Lite 654315 B; target 655360 B.
- Content: 6 packs, 805 files, 539.1 MiB.
- Desktop: 232.7 MiB compact stage; unsigned MSI + NSIS generated.
- Science: default `legacy-eih-1pn`; V2 remains shadow-only.

## Capability matrix

| Capability | standalone-full | vercel-lite | desktop-compact |
|---|---:|---:|---:|
| Interactive single Canvas | Yes | Yes | Yes |
| Six content packs | Yes | No | Installable |
| Million-star catalog | Yes | No | Optional |
| Full observation fixtures | Yes | No | Optional |
| Cloud deployed | No | No | N/A |
| Signed installer | N/A | N/A | No |

## Known limitations

- Vercel Lite omits the million-star catalog and full observation fixtures.
- V2 relativity remains shadow-only because independent promotion gates are not satisfied.
- The MSI and NSIS installers are local unsigned RC artifacts; no signing or public distribution was performed.
- No Vercel or other cloud deployment was performed.
- AtlasRuntimeWorkbench remains the next decomposition surface even though UniverseRuntimeController is below the hard line gate.

## Rollback

1. Retain legacy-eih-1pn as default and leave V2 shadow-only.
2. Select standalone-full with the six checksummed content-pack manifests.
3. For desktop, uninstall the unsigned v186 RC and restore the retained standalone Web artifact.
4. Re-run tsc, 673 tests, both builds, fresh Browser QA, soak and content-pack verification before another promotion.
