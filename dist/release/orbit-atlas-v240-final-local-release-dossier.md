# Orbit Atlas v240 final local release dossier

Product outcome: **orbit-atlas-web-1.0.0-ga-ready-local**  
Research outcome: **relativity-v12-research-candidate-shadow-retained**  
Desktop outcome: **desktop-1.0.0-beta.1-unsigned-rc**

## Local product gates

- Canonical regression: 674/674 across 107/107 files; TypeScript passed.
- Rust: fmt/check/test/release-check passed (3/3 unit tests).
- Production builds: standalone-full and vercel-lite passed on Next 16.2.10 / React 19.2.7 / R3F 9.6.1 / Three 0.170.0.
- Cold Canvas-ready JS: standalone 592056 B; Lite 592055 B (both below 600 KiB hard limit and 590 KiB engineering target).
- Content packs: 6 packs, 805/805 files, 539.1 MiB. Lite: 595 files, 65.9 MiB, no loopback fallback.
- Visual: 36 journey frames + 4 risk frames; formal baseline was not overwritten. Fresh QA: 9 passed, 1 expected viewport skip.
- 30-cycle soak: heap 34.90 to 37.45 MiB; last-10 OLS slope 151605 B/cycle; resources returned to baseline.
- RTX 4060: overview 120.3 FPS / P95 12.6 ms; earth-inspect 80.7 FPS / P95 16.8 ms; gaia-stellar 239.8 FPS / P95 4.3 ms; launch 240 FPS / P95 4.3 ms; kerr 240 FPS / P95 4.3 ms.
- Security: production npm audit 0 vulnerabilities, secret scan 0 findings, enforced CSP/SRI/header/API checks passed.

## Fixed contracts

- One WebGL2 Canvas, 603 historical root attributes, key hash `ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867`.
- Default kernel remains `legacy-eih-1pn`; candidates remain offline shadow.
- Mission capsule, URL, focus/camera, panel/store, scene revision, V9 sky and frozen gates remain preserved.

## Fail-closed research and release boundaries

- Dense Kerr release execution is 1/49 shards; no partial aggregate is accepted.
- Variational STM remains smoke-only (1 fit iteration, holdout 365 days); release qualification is unavailable.
- Weak-field evidence still contains 15 per-body/checkpoint regressions, so promotion is blocked.
- Vercel preview, `solar.wangyufan.xyz` migration, DNS rollback, Azure signing and external Windows install QA were not performed.
- Existing MSI/NSIS are unsigned pre-v240 desktop artifacts; no Desktop Beta or public GA claim is made by this local dossier.
- Dirty worktree preserved (1402 entries); no reset, revert, clean, stage, commit, tag, deploy or signing was performed.
