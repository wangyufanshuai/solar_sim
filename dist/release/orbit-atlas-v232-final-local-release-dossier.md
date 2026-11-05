# Orbit Atlas v232 final local release dossier

Status: **web-ga-candidate-local-validated-desktop-unsigned-install-qa-pending-science-shadow-retained**  
Web GA label applied: **no** · Desktop Beta label applied: **no** · Science promotion applied: **no**

## Passed on this host

- Next 16.2.10, React 19.2.7, R3F 9.6.1, Three ^0.170.0; standalone and Lite webpack production builds passed.
- Regression: 674/674 across 107/107 files; TypeScript and Rust fmt/check/test/release-check passed.
- Content packs: 805/805 across 6 packs; Lite: 595 files / 65.9 MiB.
- Cold Canvas-ready JavaScript: standalone 612827 B; Lite 612822 B. Both pass 600 KiB but miss 590 KiB.
- Visual: 12/12 journeys and 36 production candidate frames; fresh non-contaminated suites 7 passed / 1 expected desktop-only skip; Kerr lifecycle 2/2.
- Ten-cycle soak passed: heap growth 2921024 B; renderer textures 27→27; programs 28→28; zero console/page errors.
- RTX 4060: overview 80.1 FPS / P95 16.7 ms; earth-inspect 79.8 FPS / P95 16.8 ms; gaia-stellar 239.5 FPS / P95 8.3 ms; launch 239.8 FPS / P95 4.3 ms; kerr 80.2 FPS / P95 16.7 ms.
- Production npm audit: 0 vulnerabilities; secret scan: 0 findings; enforced CSP has no unsafe-eval; debug-log production route is 404.
- Unsigned host artifacts: NSIS 93351702 B / `a55ee023ba7d01fb5d316db67f07b1cf4ade6c48be0f133a97a79f92a3e30906`; MSI 113271481 B / `2016d3e0207b6b66402ca315f7e34852237cba6cdcf7f2061fb87dc379eaf441`.

## Fail-closed boundaries

- Vercel preview/domain migration and DNS rollback rehearsal were not authorized or performed.
- The legacy v71 full-page bright-star metric is DOM-contaminated; its frozen fixture remains unchanged and a checksummed audit records the invalid gate.
- Dense Kerr 49-shard dual-reference execution and ten-year variational STM qualification are incomplete; science remains shadow-retained.
- Azure Artifact Signing credentials were not supplied; MSI and NSIS are unsigned.
- External Windows 10/11 install, launch, uninstall, reinstall, Chinese/space-path and WebView2 QA is pending.
- Standalone and Lite pass 600 KiB but miss the 590 KiB engineering target.

The default scientific kernel remains `legacy-eih-1pn`. Dense Kerr and ten-year STM qualification are incomplete, so the research label remains `relativity-v12-shadow-retained`. No cloud deployment, signing, updater, Git staging, commit, reset, revert or clean was performed.
