# Frozen vacuum-slice relaxation convergence audit v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent, inline
- Origin Mode: run / deterministic numerical validation
- Origin Date: 2026-10-07
- Verification Status: UNVERIFIED (prospective protocol)
- Version Label: nr-k3-relaxation-convergence-v1

## Purpose and frozen implementation

Test whether the existing 0.4.0 FD2/FD4 FO-CCZ4 shadow converges toward
vacuum constraints with and without finite algebraic relaxation. This is not
another all-58 independent-noise fixture. No production source, stencil,
gauge, damping constant, projection or runtime integration changes this round.

Retain 166 current sources and immutable prior artifacts from
`C:/Users/86137/NRShadowEvidence/nr-k3-algebraic-relaxation-v1-20261007`.
Parent receipt SHA-256:
`7398ecaa7563a0e1df58e45903721b6b21be3fe86b7dca74dec88c1e79133c80`.
Use its exact native binary, SHA-256:
`20402d8e8ac65e1c24d87df4a5ad828846c40929c10af5f64b2c8b3ce1c27e38`.
Add only diagnostic/runner modules and tests; snapshot all 170 sources.

## Initial data and gauge distinction

Periodic unit cube. Amplitude a=0.01, phase=0, integer wave vector k=(1,1,1)
(main matrix), or (1,0,0) for two axis controls. n=k/|k|.
At t=0, H=1-a*sin(2pi*k.x), H_t=2pi*|k|*a*cos(2pi*k.x),
gamma_ij=delta_ij+(H-1)n_i n_j, alpha=sqrt(H), beta=b=0,
K_ij=-H_t/(2sqrt(H))*n_i n_j. Set chi=H^(-1/3), h=chi*gamma,
K=-H_t/(2H^(3/2)), a_ij=chi*(K_ij-gamma_ij*K/3), Theta=0,
GammaHat_i=-(2/3)H_t*H^(-5/3)*n_i. Initialize A/B/D/P using the
existing centered derivative builder, then evolve all 58 stored fields.

This is a rotated flat-vacuum harmonic gauge-wave initial slice. Evolution is
the implemented advective 1+log/Gamma-driver, with state-dependent profile
shift_scale=3 and ordering_scale=0.2. Do NOT compare the evolved state to the
harmonic analytic wave at t>0: those are different gauge evolution problems.
The expected continuum H/M, algebraic and auxiliary constraints are zero.

## Declared 26 cases

- 12 spatial cases: FD2/FD4 x lambda=0/1 x N=8/16/32; dt=1/512.
- 12 temporal cases: FD2/FD4 x lambda=0/1 x dt=1/64,1/128,1/256;
  fixed N=16. Spatial N=16 at dt=1/512 is the extra temporal contamination control.
- 2 axis controls: N=16, dt=1/512, lambda=1, FD2/FD4, k=(1,0,0).
- Save initial and t=1/8,1/4 checkpoints/diagnostics for every case (78 samples).
- Four N=8 spatial cases: Python evolves the complete first 64-step interval;
  all-slot native/Python discrepancy <=2e-12.
- FD4/N16/lambda1/dt1/512/oblique: repeat directly to t=1/4 on one thread;
  checkpoint AND manifest bytes must equal the sampled 4-thread 64+64-step run.
- Zero/nonzero-rate cases must have identical initial 58-slot payload values.

## Independent diagnostics and fixed tests

Metric-only H/M are recomputed from gamma=h/chi and
K_ij=(a_ij+h_ij*K/3)/chi. Use the actual metric trace of K_ij even off the
algebraic constraint surface. Rebuild Christoffels and Ricci from these fields;
do not use RHS geometry or evolved Gamma/A/B/D/P to construct H/M.
Derivatives use independent FFT symbols of the centered FD2/FD4 operator,
with Nyquist symbol set explicitly to zero. This is an independent diagnostic,
not a separate full Einstein evolution code. Also record A, B, D, P reduction
residuals, GammaHat minus contracted metric Christoffel, Theta, det(h)-1 and
tr_h(a). L2 means RMS of all cells/components; also save infinity norms.

At each positive sample time, H/M/A/B/D/P/Ghat/Theta/determinant/trace L2
norms must show both N-doubling orders >=1.5 for FD2 or >=3.0 for FD4.
Predeclared absolute diagnostic floors: H 5e-11; M/A/B/D/P/Ghat 5e-12;
Theta/determinant/trace 5e-13. If ALL three norms are <=floor, classify
bounded-null (not measured convergence). Mixed floor/nonfloor is inconclusive,
not a pass; no retrospective floor adjustment. Initial norms are reported
separately and not used as positive-time propagation evidence.

Compare final all-58 state differences at common N=8 nodes between N8/N16
and N16/N32. Require self-convergence order >=1.5/3.0, respectively.
Compare final dt1/64,1/128,1/256 states at N16; require RK4 order >=3.5.
State-difference measurement floor=2e-12 RMS: below it is inconclusive.
The N16 dt1/256 vs1/512 difference, sampled on N8 nodes, must be <=5% of
the N16/N32 spatial difference. Report lambda1/lambda0 constraint ratios
descriptively; there is no assumption that every constraint must improve.

Evaluate the full declared matrix even if numerical convergence is poor,
provided finite positive metric/lapse state and artifact contracts remain
valid. Stop on crash, invalid artifact, nonfinite state, budget or source drift.
Never loosen thresholds or rerun a failed campaign silently. Separate
`completed` from `convergence_passed`; completion alone is not success.

## Resources, command and admission

Windows-native MSVC2022 C++17/OpenMP 0.4.0 binary (no rebuild), 4 threads;
one deterministic replay uses 1 thread. No hardware/PATH/software changes.
Campaign 1800s; each native process <=180s; output <=384MiB with 32MiB
in-flight reserve; keep C free >=4GiB, E >=1GiB. No deletion of old evidence.

`python -B scripts/run-nr-k3-relaxation-convergence.py --output-directory C:/Users/86137/NRShadowEvidence/nr-k3-relaxation-convergence-v1-20261007`

Physical validation, full constraint propagation proof, strong hyperbolicity,
CPBC, black holes, AMR, horizons, Psi4, CUDA, live admission, runtime writeback
and scientificPayloadWriteback stay false regardless of this finite test.
Passing supports only the specified vacuum-slice finite-window convergence.
