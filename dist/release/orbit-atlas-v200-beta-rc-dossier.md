# Orbit Atlas v200 Web/Desktop Beta RC dossier

Status: **host-validated-install-qa-pending**  
Evidence label: `web-and-desktop-beta-rc-ready-science-shadow-retained` (not applied as final release label)

## Verified on this host

- Next 16.2.10; React 19.2.7; R3F 9.6.1; Three ^0.170.0; webpack production builds passed for standalone-full and vercel-lite.
- Cold Canvas-ready JS: standalone 624216 B, Lite 624218 B; both pass the 610 KiB target and remain below the 620 KiB stop line.
- Content integrity: 6 packs, 805/805 files, zero failures. 45 recorded recovery entries remain exact-checksummed; frozen V9 was not regenerated.
- Regression: 674/674 tests across 107/107 files; TypeScript, Rust fmt/check/test/release-check passed.
- Visual journeys: 12/12; fresh standalone QA: 9 passed and 1 expected viewport skip; Lite QA: 2/2; no console/page errors or HTTP 4xx/5xx in fresh QA.
- Lifecycle soak: 10 scene cycles passed. RTX 4060 named-hardware performance gate passed without software fallback.
- Desktop stage: 246495101 bytes / 2745 files from BUILD_ID `2UXGIwUXtOrX73IcreT9b`; MSI and NSIS are unsigned and checksummed below.

## Independent science cross-validation

- REBOUND IAS15 and SciPy DOP853 rerun hashes match.
- Attribution counts: {"cross-solver-regression-confirmed":6,"solver-disagreement":8,"provenance-mismatch":0,"inconclusive":1}.
- Mercury +10y position regression is 42.295 m; both solvers reproduce the Horizons regression, but the solver disagreement keeps the decision `shadow-retained` and does not establish a physical root cause.
- Default kernel remains `legacy-eih-1pn`; V2 remains shadow-only and was not promoted.

## External installation blocker

MSI/NSIS clean install, launch, exit, uninstall, reinstall, Chinese/space paths, content-pack fallback and WebView2 offline/online cases still require execution on the user's other Windows computer. Until that report is returned, this dossier must not be labeled GA.

## Evidence SHA-256

- `dist/science/relativity-cross-validation-v8.json`: `8fe392d61b295ffaeaf78e5ffca73db670893cdfbd292b317ebff27d35a6b0a9`
- `dist/science/content-pack-integrity-v192.json`: `fd4daf13840ae59eddca2f9f156a027941ba5b2e49d27012eb237efa10a9a6b3`
- `dist/science/client-bundle-v198-standalone-full.json`: `4bdc174b3dbf7c2c5a5ac8e6fd2537c9e6cc426427ac0f6fdfa23e699cc9aa9e`
- `dist/science/client-bundle-v198-vercel-lite.json`: `7ce7ab28932ad5bf5c5251e759168aa8123334a6bc6e26b5fb6440fbf537e258`
- `dist/science/lifecycle-soak-v200-report.json`: `a7fca35d7b15e614ef68e956a14c04455af61a238012256b6497f0e88dcebebf`
- `dist/science/performance-v200-report.json`: `6fd0ee412fe06c38d558483bbefcfff6f0768bfcb7af29704a6dd728006c99d4`
- `dist/science/desktop-rust-v200.json`: `b8adbc8bf824948cb47e846cf8b26efb74918acbb65a9d623c140e92c7ed6988`
- `dist/science/desktop-build-v200.json`: `bd4de396b8d757c755846216148038f301422e6bd254763e58005203d82e3e1a`
- `dist/release/orbit-atlas-v192-content-recovery.json`: `15cfce889709ac015e895fd36dcfe7dcfbb7ce1d0dc1e7a1be1955ba44bb887f`
- `dist/desktop-stage/v200/desktop-stage.json`: `2695741d0c9b6f1425d7e90b6c0579c3c8186a8cd01dbe5e4ce0a1d78f0a044e`
- `src-tauri/target/release/bundle/nsis/Solar Atlas_1.0.0_x64-setup.exe`: `618c728bdf7a73b1287f75a1799f3da0aa2860978152d5d9dd89e860c9065d17`
- `src-tauri/target/release/bundle/msi/Solar Atlas_1.0.0_x64_en-US.msi`: `cf3cc736868a05baf9399edbb85ecadf133ad5072ee450ee689374a86b5631e5`
