# Orbit Atlas v224 visual polish and relativity research dossier

Status: **visual-polish-rc-relativity-research-candidate-shadow-retained**  
Release label applied: **no**

## Verified

- Production builds: standalone-full `3jt4sjuRFXfGA5Ls36hGf`; vercel-lite `ePdye02XIK0cWJ1Zmzmp7`.
- Root contract: 603 attributes; key hash `ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867`.
- Visual matrix: 36 frames, 12/12 journeys; fresh QA 9 passed / 1 expected viewport skip; Kerr lifecycle 2/2.
- Regression: 674/674 across 107 files. Content packs: 805/805 across 6 packs.
- Cold Canvas-ready JS: standalone 624410 B; Lite 624410 B. Both pass 610 KiB and miss the 600 KiB recommendation.
- Ten-cycle soak passed; final renderer textures 27, programs 28, heap growth 3114956 B.
- RTX 4060 performance passed: overview 83.2 FPS / P95 18 ms; earth-inspect 62.2 FPS / P95 18.1 ms; gaia-stellar 170.8 FPS / P95 6.1 ms; launch 168.9 FPS / P95 6.2 ms; kerr 83.8 FPS / P95 17.6 ms.

## Relativity evidence

- Analytic Kerr-Schild fine deterministic hash: `8e394c5a12e9dc87561c7db5f6e1d133664d05450e52c3be5b5a35824313e2e5`; maximum null drift 3.3296935487083403e-13.
- Analytic Kerr-Schild finer deterministic hash: `14514ef74133393fe594bdbecbaccfe837abb9352f2ba3e4934a1080dbf05deb`; maximum null drift 1.0913471137149842e-14.
- Carter/Mino vs Kerr-Schild canonical classification agreement: 1; redshift and polarization gates pass for the 256-ray stratified teaching-disc report.
- Dense 2048/1024 dual-CPU execution is **not complete**. The manifest is checksummed and the gate remains fail closed.
- Weak-field integrated variational STM is **not complete**. Default `legacy-eih-1pn` remains unchanged; all candidates remain shadow-only.

## Release blockers

- The 2048 low-discrepancy and 1024 critical-bracket Kerr rays are frozen as a deterministic manifest but have not been executed by both independent CPU references.
- A true integrated variational STM and unregularized conditioning report are not yet available; weak-field promotion remains fail closed.
- Standalone and Lite initial JavaScript pass 610 KiB but remain above the 600 KiB recommended target.
- External MSI/NSIS install, launch, uninstall, reinstall, Chinese/space-path and WebView2 QA is still pending on another Windows computer.

This dossier does not claim numerical relativity, GRMHD, black-hole mergers, desktop GA, cloud deployment or signing.
