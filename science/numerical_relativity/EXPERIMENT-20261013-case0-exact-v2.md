## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: run; exact-source audit and independent v2 case-0 candidate
- Origin Date: 2026-10-13 (Asia/Shanghai)
- Verification Status: PLANNED BEFORE EXECUTION
- Version Label: nr-case0-exact-v2-controls-v1

## Authorized scope

The user accepted the next 64 MiB / 600 second batch: only case-0 coefficient
provenance and independent v2 validation, full matrix still deferred.
No original source, threshold, failure receipt, art or live runtime may change.

Entry: `D:/python/python.exe -B scripts/run-nr-k3-case0-exact-v2.py --output-directory tmp/nr-shadow-evidence/nr-k3-case0-exact-v2-controls-v1-20261013`.
Work only in `E:/86137/myai/solar_sim/next-web`.
Use the unchanged Windows-owned supervisor, a fresh direct evidence child,
single BLAS/OpenMP/MKL thread, no bytecode, E TEMP/TMP, no automatic retry.
64 MiB artifact cap, 600 seconds, 2 MiB finalization headroom, 8 MiB source
snapshot; C>=3 GiB, E>=4 GiB+32 MiB plus prospective full batch admission.
Polling is not an OS quota or hard real-time guarantee; cleanup may extend a
deadline. This is an artifact budget, not a 64 MiB RAM guarantee.

## Pinned ancestry

- Prior diagnostic: `nr-k3-case0-energy-diagnostic-v1-20261013`, gate SHA-256
  `4407d9c2fa7d6ddfd2c627b524c5cf2d31611e3e64778c34038ca8ed4049584f`.
- Original failure: `nr-k3-constraint-energy-controls-v1-20261012`, gate SHA-256
  `786b3b86ae9d4fd9035ae05e0bc6058b03147c27e2c9dfbad336a85db673b370`.
- Verify all 510 inherited sources/current and snapshot, all 567 prior
  diagnostic files and 532 original-failure files, before and after.
- Snapshot the 510 inherited sources plus this plan, the derivation, the exact
  coefficient module, the independent v2 module and new runner: 515 sources.

## Fixed sequence and gates

1. Intake, pinned inventories, source snapshot and exact reproduction of the
   original saved case-0 metrics; no fresh legacy principal matrix generation.
2. Follow `DERIVATION-20261013-case0-exact.md`: build the 58x58 rational RHS
   principal coefficient matrix by two curvature routes. They must agree
   exactly, including all eleven zero ODE rows/columns. No matrix fitting or
   `limit_denominator`. All 3,364 saved entries are compared, with original
   2e-12 normalized infinity residual required. Record nearest-float/ULP
   differences without inventing a new physical acceptance threshold.
3. Compute exact rational annihilators for Q and the saved binary64 matrix.
   Require m(Q)=0 exactly and the latter to reproduce the prior saved Decimal70
   analytical-node result to 1e-50 (diagnostic arithmetic cross-check only).
   Full numerator/denominator evidence and coefficient witnesses are retained.
4. New v2 module: direct degree-12 Lagrange polynomials, exactly converted
   binary64 input, prescribed unchanged nodes, Decimal70 default; no fitted
   eigenvectors, clipping, rank correction, or production integration.
   On a PDE complement P, start each polynomial with P and use K-bP factors,
   so the ODE component is not promoted to the zero-speed PDE projector.
5. Eight synthetic controls: dimensions 43/47, diagonal/nonnormal integer
   similarity, precision 50/70; compare with known projectors at original
   2e-12. Six invalid inputs must be rejected (nonfinite, shape, nonprojector P,
   duplicate roots, invalid precision, wrong dimension).
6. Compute v2 full43/full58 on the **original saved matrices, nodes, leading
   state map, shift and ODE projectors**. Rebuild H=O^T O+sum E^T E. Save all 14
   arrays before applying the unchanged `constraint_energy_controls.metrics`
   and `require_gates`: every projector, rank, state-map, energy, lower-bound,
   positivity and symmetrizer condition must pass. Original tolerance 2e-12;
   ranks at 1e-9,1e-10,1e-11, sums 32/47; no relaxed criteria.
7. Require the v2 full47 array to equal the preceding direct-Lagrange diagnostic
   exactly. Repeat only this same candidate case once, require exact array and
   metric replay; also compare Decimal50/70 using original 2e-12.
8. Compute a predeclared rounding-sensitivity diagnostic, not new physical
   scenarios: take saved47 plus/minus one binary64 spacing at its nonzero
   coefficients, fixed roots, v2 only. Record all seven projector residuals and
   all ranks for both; do not clip or drop failures. Both must pass original
   projector/rank gates for `case0_rounding_robustness=true`; otherwise report
   failure and do not qualify this bounded candidate. These artificial input
   perturbations do not test physical convergence or the other 65 cases.
9. Final source and both old inventory checks, new inventory, durable terminal.

Any resource, source/control failure stops without retry. A physics/rank or
sensitivity failure is persisted, with false candidate qualification and a
failed terminal; no hidden replacement by the exact rational matrix is allowed.
Only `case0_v2_validated` and `case0_rounding_robustness` may become true for
this one bounded candidate. `fixed_projector_energy_validated`, physical gates,
global hyperbolicity, nonlinear stability, boundary validity, scientific
admission, live and payload flags remain false. No 66-case campaign, 100/52
suites, native/GPU, N9/N13, checkpoints or time evolution are authorized.
