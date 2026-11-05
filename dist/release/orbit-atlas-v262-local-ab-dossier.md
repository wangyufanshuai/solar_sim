# Orbit Atlas v262 Local A/B Dossier

Generated: 2026-07-19T13:46:35.469Z

- Science: **science-failed-shadow-retained**; 3/49 V8 shards; no retry or partial aggregate.
- Default kernel: **legacy-eih-1pn**.
- Catalog: 1,224,219 searchable; 1,221,242 angular; 758,955 3D candidates.
- Gaia science subset: 200,000 rows; 30,028 gold; 169,972 silver.
- Gaia survey completeness: **unavailable** (pinned GaiaUnlimited dependency blocked); no substitute model.
- OpenNGC: 13,962 rows, CC-BY-SA-4.0.
- Cosmicflows-4: 55,877 rows, local only; public deployment blocked.
- Visual A/B: Legacy V9 remains default; Science Cinematic is a local visual-only candidate. Visual evidence is 40 legacy regression frames plus 8 v262 desktop/mobile extension frames (48 total).
- Builds: standalone **passed** (19OANocf2iaAVsGCShYAk); Lite **passed** (DzzBBVcnvFvwFetVCLlH-).
- Canvas-ready JS: standalone **600,370 B**; Lite **600,371 B**; target **604,160 B**.
- Content packs: **815/815** verified across 6 packs.
- Browser QA: dedicated v262 standalone, Lite boundary, mobile A/B and 48-frame visual gates passed. The corrected fresh 22-test matrix ran once against the final standalone build and returned **20 passed / 1 skipped / 1 failed** in 13.8 minutes (exit code 1). The only failure was a mobile test attempting the hidden desktop experience-mode control; the test-only viewport route fix is prepared but was not rerun, preserving the no-automatic-retry policy.
- 30-cycle soak: **passed**; heap slope 207,545 B/cycle (limit 262,144 B/cycle); resources returned to baseline. Native WebGL texture auditing was disabled and is not claimed.
- RTX hardware: **ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU (0x000028E0) Direct3D11 vs_5_0 ps_5_0, D3D11)**; all FPS/P95 gates passed. Draw-call/triangle values are excluded as success evidence because their provenance remains unreliable.
- Local validation: **blocked-fresh-matrix-not-reclosed**. Candidate remains local and is not promoted.
- Vercel/production/DNS/signing/Desktop Beta: **not applied**.
