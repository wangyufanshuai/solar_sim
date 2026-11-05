# Orbit Atlas v587 Design QA

Source visual truth: `C:\Users\86137\.codex\generated_images\019fc2a4-5b20-7081-9c6d-fe3cfb7e4ac1\exec-931fd7f0-7aac-4862-b921-19cdb2c1a5ed.png`

Primary post-build screenshot: `E:\86137\myai\solar_sim\next-web\docs\release\v587\postbuild-qa\final-desktop-cinematic-1440x900.png`

Science post-build screenshot: `E:\86137\myai\solar_sim\next-web\docs\release\v587\postbuild-qa\final-desktop-science-1440x900.png`

Viewport: desktop `1440×900`; mobile `390×844`.

State: v587 local-shadow research candidate. Cinematic is used for hero-art fidelity; Science remains linear and shows only verified classification, redshift, delay, and reference-EVPA projections. Stokes, radiative transfer, measured authority, GPU authority, dense image authority, production deployment, and public release remain locked.

The original `visual-qa` images remain as pre-build design evidence. The four `postbuild-qa/final-*` images are the accepted build-output captures and contain the final `REFERENCE`, `KS 64/64`, `0 UNRES. · 168 MASK` HUD. They were replayed from the isolated local-shadow Next build, not from the development server.

## Full-view comparison evidence

- Reference vs Cinematic: `E:\86137\myai\solar_sim\next-web\docs\release\v587\visual-qa\comparison-reference-vs-cinematic.png`
- Reference vs Science: `E:\86137\myai\solar_sim\next-web\docs\release\v587\visual-qa\comparison-reference-vs-science.png`
- Final desktop Science: `E:\86137\myai\solar_sim\next-web\docs\release\v587\postbuild-qa\final-desktop-science-1440x900.png`
- Final desktop Cinematic: `E:\86137\myai\solar_sim\next-web\docs\release\v587\postbuild-qa\final-desktop-cinematic-1440x900.png`
- Final mobile Science: `E:\86137\myai\solar_sim\next-web\docs\release\v587\postbuild-qa\final-mobile-science-390x844.png`
- Final mobile Cinematic: `E:\86137\myai\solar_sim\next-web\docs\release\v587\postbuild-qa\final-mobile-cinematic-390x844.png`

## Focused comparison evidence

- Hero crop, reference vs Cinematic: `E:\86137\myai\solar_sim\next-web\docs\release\v587\visual-qa\comparison-hero-reference-vs-cinematic.png`

The focused crop is retained because the photon ring, event-horizon silhouette, accretion-disk filaments, star sharpness, and masking quality are too small to judge reliably from the full two-up view.

## Findings

No actionable P0, P1, or P2 visual findings remain.

- Fonts and typography: the condensed scientific mono hierarchy, serif M87* display title, optical weights, tracking, and truncation match the selected research-film direction. Live engine values intentionally replace the concept's fictional values.
- Spacing and layout rhythm: top instrument bar, left context rail, right inspector, bottom instrument rail, and dominant center stage retain the source hierarchy. The implementation uses a smaller bottom rail because Stokes plots are authority-locked rather than fabricated.
- Colors and tokens: both states preserve the near-black/copper/cyan palette. Science intentionally replaces the concept's artistic gold intensity with a linear redshift field; Cinematic carries the warm copper-gold art direction.
- Image quality and asset fidelity: the Cinematic hero is a dedicated, source-directed raster with smooth horizon masking, high-frequency disk filaments, photon-ring glow, and sparse sharp stars. It is loaded through the verified KTX2-first v587 namespace; no CSS, SVG, or div substitute is used.
- Copy and content: geometry and polarization display `REFERENCE`; the independently integrated Kerr–Schild oracle is `64 / 64`; unresolved quadtree cells are `0`; 168 strong-discontinuity cells are explicitly masked from derived Web interpolation; measured authority is `OFF`; Stokes is `LOCKED`.
- Responsiveness and accessibility: `390×844` has no horizontal overflow, keeps the stage primary, exposes mode controls above the rail, and presents the inspector as a solid, scrollable bottom sheet. Visible controls have semantic buttons, labels, and keyboard focus treatment.
- Interaction states: Science/Cinematic switching, inspector open/close, EVPA visibility, and exposure controls are functional. The scientific payload SHA remains unchanged across presentation state changes.

## Patches made during v587 QA

- Replaced blocky raw classification edges with a deterministic supersampled, smoothed presentation projection while preserving canonical sidecar bytes.
- Added a dedicated desktop/mobile KTX2-first Cinematic hero derived from the selected visual target, with a deterministic shader fallback.
- Removed the old low-resolution Cinematic ray-map blocks from the visible hero path.
- Restricted EVPA glyphs to the disk/lensing region and reduced visual rain outside the subject.
- Enlarged and recentered the black-hole composition to match the selected hero scale.
- Made the mobile inspector background opaque and kept it within `72dvh`.
- Moved the desktop settings panel clear of the inspector and made its surface opaque.
- Compacted the inspector so all authority rows fit without a visible scrollbar.
- Advanced the HUD from the earlier `8 / 64` and `256 UNRES.` candidate state to the verified `REFERENCE`, `KS 64 / 64`, `0 UNRES. · 168 MASK` state without changing the scientific payload during Science/Cinematic switching.

## Post-build browser and soak gate

- Accepted route: `http://127.0.0.1:3001/local-shadow-v587` from local-shadow build `_ZWwNGZ9302JyU1FlhuMm`.
- Desktop Science/Cinematic and mobile Science/Cinematic all reached `ready` with one Canvas and zero console, page, or renderer errors.
- The soak ran for `1837.95 s`, with 30 steady cycles and 32 total samples. The minimum median FPS was `168.4`; worst frame P95 was `11.79 ms`.
- Scene release returned exactly to `3 programs / 1 texture / 0 render targets / 1 MiB`, matching the entry baseline.
- Scientific payload SHA remained `784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674` for every sampled Science/Cinematic and desktop/mobile state.
- Post-build acceptance receipt: `E:\86137\myai\solar_sim\next-web\docs\release\v587\postbuild-acceptance-v587.json`.

## Scientific promotion boundary

Image-area convergence remains a separate negative gate. The depth 3→4 maximum area change is about `2.14%`, above the preregistered `0.1%` threshold. This does not revoke geometry/polarization reference status, but it blocks dense image authority and automatic promotion. The 168 masked cells remain honest exclusions in derived Web validity maps; canonical HDF5/FITS ray and event arrays are not interpolated or altered.

## Implementation checklist

- [x] Desktop and mobile hero composition
- [x] Science/Cinematic shared scientific payload
- [x] KTX2-first desktop/mobile assets with SHA verification
- [x] Single Canvas
- [x] Inspector and settings states
- [x] No console/page/renderer errors in accepted states
- [x] FPS thresholds exceeded
- [x] KS oracle 64/64 and zero unresolved cells shown from verified summary
- [x] Post-build desktop/mobile Science/Cinematic replay
- [x] 30-minute soak and exact resource-baseline return
- [x] Formal product pointer remains v263
- [ ] Image-area convergence at or below `1e-3`

## Follow-up polish

- P3: replace the honest uncompressed KTX2 reference packaging with UASTC once a qualified Basis/KTX toolchain is available; the current manifest does not claim compression it did not perform.
- P3: increase adaptive image-area resolution until adjacent-depth area change is at most `1e-3`; current geometry/polarization reference artifacts remain valid while dense image authority stays false.

Final result: visual and post-build browser/soak gates passed; image-area convergence remains pending.
