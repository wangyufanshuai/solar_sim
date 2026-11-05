# Orbit Atlas v208 Relativity V9 research dossier

Status: **relativity-v9-research-candidate-shadow-retained**

This is a research checkpoint, not a final RC and not GA. The default scientific kernel remains `legacy-eih-1pn`; V9 remains shadow-only.

## Verified in this checkpoint

- Six local-only NAIF/DE440 research assets match their frozen SHA-256 values and are excluded from Web, Lite and desktop installers.
- The independent float64 Kerr Carter/Mino DOP853 reference was run twice. Canonical evidence hashes match: `c04fa51baffce2a0cc32aa23855f81aca99b73fc92b3fd62a91049513b3d8077`.
- Kerr reference gates pass: maximum null constraint `8.049684e-12`, Carter drift `0.000000e+0`, Schwarzschild critical-radius error `8.881784e-16 M`.
- The browser has explicit mobile-safe, interactive and science-still policies. Mobile-safe allocates no ray-trace target.
- Focused V9 science tests passed 29/29; TypeScript and the existing 674/674 regression suite passed.
- Standalone and Lite production builds passed. Cold Canvas-ready JS is 624244 B / 624245 B against the 624640 B limit (only 396 B / 395 B margin).
- Fresh QA passed 9 + 2 browser tests with one expected viewport skip; the targeted Kerr lifecycle test passed desktop and 390×844 responsive transitions.
- Ten-cycle resource/heap soak and the RTX 4060 five-scene performance gate passed. Kerr measured 80.1 median FPS and 16.6 ms P95; draw-call telemetry is observational only.
- Content integrity remains 805/805 across 6 packs; Lite remains 595 files / 65.9 MiB with no loopback fallback.

## Fail-closed weak-field status

The old V9 smoke report is rejected because its time unit was wrong and it used `rtol=1e-3`. The corrected raw-propagation program now has converged DOP853 fine/finer, IAS15 fine/finer and two independent deterministic reruns on one ICRF/J2000 barycentric TDB fixture. The prior 15-row inventory is fully present, but V9 still has {"cross-solver-regression-confirmed":7,"solver-disagreement":0,"inconclusive":2,"no-confirmed-regression":6,"provenance-mismatch":0}. Raw Mercury +10y is 45.590 m (DOP853) / 45.317 m (IAS15), with 1.527 m joint uncertainty. The separate 0-30 day fitted-initial-state calibration was rerun twice with matching canonical hashes and blindly evaluated at 365 days and 10 years. It reduces but does not remove the Mercury regression: 16.047 m / 16.114 m. Raw evidence is not replaced. Ten-year aggregate position RMS remains worse, 2PN isolation remains unresolved and no promotion is applied.

## Blocking work

- The prior 15-row inventory still contains two inconclusive rows; no unknown or solver-disagreement row remains.
- The completed 0-30 day fitted-initial-state blind holdout still confirms a Mercury ten-year regression and does not improve aggregate ten-year position RMS.
- Solar 2PN is unresolved at the required effect/U >= 5 threshold; full six-mode DOP853 effect isolation remains pending.
- An independent horizon-penetrating Kerr-Schild Hamiltonian reference is not yet present.
- GPU/offline 99.9% ray classification, redshift, polarization and pixel-error gates have not been measured.
- MSI/NSIS were not rebuilt for this research checkpoint and external clean-Windows installation QA remains pending.

## Scientific boundary

The implemented strong-field path is Kerr test-particle geometry with an analytic teaching thin disk. It is not numerical relativity, black-hole merger simulation or GRMHD. GPU certification remains pending.
