# Finite-rate algebraic relaxation: frozen shadow integration protocol v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent, inline execution
- Origin Mode: run
- Origin Date: 2026-10-07
- Verification Status: UNVERIFIED (prospective protocol, not results)
- Version Label: nr-k3-algebraic-relaxation-v1

## Scope and source control

Implement an opt-in positive `lambda=tau_inverse` in Python and native
FO-CCZ4. No projection, auxiliary reconstruction, KO dissipation, live adapter,
art, global environment change, GPU or physical-admission change.
The zero-rate default retains checkpoint v1/v2/v3. Positive rate uses v4:
the original header, `<QQdd>` order/profile extension (order 2 or 4), then
`<Qd>` policy id 1 and a finite positive rate, then the original 58 slots.
Only dynamic solver mode is legal for v4. Restore and manifest validation
require an explicitly matching rate. Native envelope becomes 0.4.0.

The published additions are `h_t -= lambda*(det(h)-1)*h` and
`a_t -= lambda*h*tr_h(a)`, equations (12a)/(12e) in
[Dumbser et al., FO-CCZ4](https://arxiv.org/html/1707.09910v3).
Exa reread these equations on 2026-10-07. This is not the paper's separate
full-step algebraic projection procedure. All D/A/B/P remain independently
evolved; relaxation can alter their reduction residuals.

Baseline is the immutable 162-source snapshot in
`C:/Users/86137/NRShadowEvidence/nr-k3-lapse-balance-completion-v1-20261007`,
receipt SHA-256 `95447ede8a9b9ed52e285506f1bd3005febe824bc5babe227404d6e3e8d7252b`.
Compare current sources to that snapshot: only RHS metadata binding, checkpoint,
C++ solver, manifest validator may change; four new source/test/runner files.
Retained native 0.3.2 executable SHA-256:
`554c65d99590153f56e40c3943d18785658fef7ca53f2c25a5a3630f2806619b`.
Record all source hashes before/after and copy a new immutable source snapshot.
Never rerun/modify an old receipt to make it pass.

## Fixed experiments and acceptance

1. Six rollback controls: FD2/FD4 crossed with analytic gauge wave,
   dynamic gauge wave, dynamic state-dependent-profile gauge wave.
   N=8, amplitude=1e-4, dt=1/1024, eight steps. Retained 0.3.2 and fresh
   0.4.0 checkpoint bytes and both FNV identities must match exactly.
   The only permitted manifest changes are version and two control-policy keys.
2. Twelve finite-rate cases: FD2/FD4, legacy/state-dependent gauge,
   lambda=0.25/1/4, N=8, dt=1/256. Initial flat 58-slot envelope plus independent
   uniform PCG64(20261007) noise of amplitude 1e-4 in every slot.
   All cases run eight RK4 steps. Native 1/4-thread direct and 3+5 split
   checkpoint and manifest bytes must be identical. Python/native all-slot
   error <=2e-12. Save Python checkpoints as well as native artifacts.
3. Each finite-rate initial state receives actual native RHS inspection on
   one and four threads (byte equality), Python/native RHS error <=2e-12.
   Check the unchanged seven-term lapse identity and trace identity with
   the additional `lambda*(det(h)-4)*T`, each error <=2e-12.
   Probe must observe the requested real OpenMP team. No inspection is a
   time-integration or physical-admission result.
4. Four small-amplitude kinetic controls: FD2/FD4 crossed with trace/trace-free
   oblique (1,1,1) curvature perturbations, amplitude 2e-6, N=8,
   state-dependent profile, lambda=1, dt=1/256, sample t=0,.25,.5,.75,1.
   Trace initial `a_ij=delta_ij*f/3`; trace-free `a00=f/sqrt(6),
   a11=-f/sqrt(6)`, other curvature slots zero.
   Geometric trace reference `T(t)=exp(-3 lambda t)*T0`;
   lapse auxiliary residual reference
   `C_i(t)=-2*d_i(T0)*(1-exp(-3 lambda t))/(3 lambda)`.
   Both trace-family reference errors <=5e-10 absolute at each sample.
   Both trace-free responses <=1e-12. These are deliberately off-constraint
   synthetic controls, not physical gravitational waves. No requirement of a
   measurable nonzero remainder for a null control.
5. Record metric-based ADM H/M, determinant, geometric trace and reduction
   diagnostics. Do NOT claim all constraints decrease or impose a posthoc gate.
6. Negative controls must exit 2 without creating output: missing/mismatched
   explicit rate on v4 restore, positive rate on legacy restore, negative/NaN/Inf
   rate, duplicate rate, analytic relaxation, malformed id/rate/mode,
   truncated extension/payload, and wrong spatial order/profile.

No threshold may be changed after execution starts. Stop on unexpected error,
retain failed artifacts and a false receipt; no automatic retry loop.
Fresh output directory only. Windows-native MSVC2022 C++17/OpenMP Release,
no fast-math. Hard campaign timeout 1200s; subprocess limit 180s; output cap
192MiB; retain at least 4GiB on C and 1GiB on E. Time is not a performance gate.

## Command and outcome boundary

`python -B scripts/run-nr-k3-algebraic-relaxation.py --output-directory C:/Users/86137/NRShadowEvidence/nr-k3-algebraic-relaxation-v1-20261007`

Passing establishes only finite-rate plumbing, local analytic response and
bounded cross-backend/restart consistency. Constraint convergence, robustness,
long-time stability, complete constraint propagation, strong hyperbolicity,
CPBC, black-hole physics, AMR, horizons, ADM extraction and Psi4 remain pending.
`physical_validation`, `runtime_writeback`, `scientificPayloadWriteback`,
`live_admitted`, `cuda_validated` remain false. Overall goal remains active.
