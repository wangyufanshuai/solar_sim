# Actual nonlinear FO-CCZ4 SBP/SAT coupling: first bounded window

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective numerical implementation and bounded simulation
- Origin Date: 2026-10-08
- Verification Status: PROSPECTIVE; NOT EXECUTED
- Version Label: nr-nonlinear-sbp-sat-v1

## Required capability and non-goals

The independently closed nonlinear volume is the parent. Couple its actual
RHS to six simultaneous characteristic SAT faces and a new explicitly named
RK4 reference driver. Every RK stage must use its own h, alpha, chi and beta
for each face node's principal matrix, not the flat matrix or the initial
coefficient matrix. Keep all independent auxiliary fields and sources.

This first candidate prescribes the incoming part of analytic Schwarzschild
boundary data. It is NOT a physical radiative/constraint-preserving boundary,
nor a new black-hole or old-T=1M acceptance experiment. Outgoing and zero-speed
data are not clamped. Surface RHS is volume+SAT, not replaced. Edge/corner SATs
add with the actual diagonal SBP face norm. No auxiliary regeneration or
algebraic projection is permitted. No native checkpoint format is changed.

## Stage-local characteristic construction

The implementation convention is q_t=A(n) partial_n q+S. With the outward
coordinate normal, positive eigenvalues of A(n) are incoming physical modes.
Use SAT=-H_face^-1 A_positive(q)*(q-g). Require explicit six-face targets.

Use the actual pointwise contraction in `fo_ccz4_frozen_symbol.py` and the
published speed-family contract already audited in the repository. The11 ODE
rows/columns are exactly zero. Work on the remaining47-dimensional block and
subtract beta.n*I before the eigenspace SVD; re-add beta.n to the roots only
after constructing the basis. This exploits the implemented exact ODE/PDE
decoupling and prevents tiny shift advection being numerically merged with
the11 unrelated ODE modes. It is not a pseudoinverse, projection, or change of
physical parameters. Group only coincident PDE speed families.

Keep the existing rank thresholds1e-9/1e-10/1e-11, residual ceiling2e-11,
condition ceiling1e6, and speed contract det(h)=1 within1e-10. Reject invalid
or ambiguous states. The directional symmetrizer is only a pointwise algebra
check, NOT a common3-D energy estimate or nonlinear strong-hyperbolicity proof.
Caches may reuse only exact coefficient bytes within ONE RHS evaluation;
there is no inter-stage frozen coefficient cache.

## Frozen bounded campaign

Same advective1+log, Gamma-driver, profile(shift_scale3,ordering_scale.2),
kappa1=.1, tau_inverse1, c=e=s=1 as the parent. Use FP64 CPU and single-thread
BLAS/OpenMP. New files only; do not alter any of the268 inherited source files.

1. Point tests: flat and non-diagonal unit-determinant metrics; signed normals,
   tiny nonzero shifts; eigenspace rank/residual, positive/negative splitting,
   no ODE penalties, source/current-state dependence and invalid-state rejection.
   Compare the flat operator to the retained coupled linear solver.
2. Exact Minkowski control onN9: one dt=1/1024 step with exact constant targets
   must remain zero perturbation to <=2e-14. Finite nontrivial output alone is
   never a physics result.
3. Curved static input: M=1,[1,3]^3,N9; analytic independent A/P fields. Evolve
   four dt=1/1024 steps toT=1/256 with analytic incoming targets. Save initial
   and final full58 arrays. No analytic resetting of any evolved surface slot.
4. Same endpoint with eight dt=1/2048 steps. Require final full58 RMS difference
   <=1e-4 of the initial-state RMS (a bounded implementation screen, NOT measured
   temporal order). Also execute two+two steps with saved/reloaded midpoint;
   require byte-identical final array to the continuous four-step result.
5. Nonlinear disturbance: perturb slots11..57 by1e-4 times the fixed smooth
   three-direction pattern from the parent campaign, keep the11 kinematic
   coefficients initially analytic, and run four dt=1/1024 steps with the same
   analytic targets. Require a nonzero SAT response >2e-12, changing stage
   coefficient hashes, and finite positive metrics/lapse/chi at every stage.
6. For both curved cases, report initial/final metric-reconstructed Hamiltonian
   and momentum independently of the evolved A/B/D/P; additionally report
   auxiliary and algebraic residuals. This short window requires only finite
   values and state departure RMS <1e-2; it does NOT establish constraint decay,
   nonlinear stability or spatial convergence. Do not turn it into such a gate.
7. Record all stage CFL values (cap.25), coefficient hashes, basis build counts,
   worst basis condition/residual and SAT magnitudes. Reject any failed stage.
   All physical/runtime flags remain false. Repeat the campaign in a fresh
   process; all scientific records/array/source hashes must match excluding
   elapsed seconds only.

## Resources and identity

Parent `nr-k3-sbp-volume-v2-20261008/receipt.json` SHA256
`4bf230893494e98eeea5f60d6405ee90c1d4dd90e579b3ad0676d6c2c32039b5`;
independent closure `nr-k3-sbp-volume-audit-v1-20261008.json` SHA256
`cd40eb247972a021a7e48bda4b5f7debe36b009584bc2b37d5539670e283a446`.
The final receipt snapshots the268 unchanged parent files and the new
module/test/protocol/runner/test source identities. Retain native0.5.0 and all
prior failures. The total new run cap is1200s and32MiB; check between steps.
C>=3GiB; E>=4GiB+32MiB. New output directories only; no cleanup/install.

Entry: `D:/python/python.exe -B scripts/run-nr-k3-nonlinear-sat.py
--output-directory tmp/nr-shadow-evidence/nr-k3-nonlinear-sat-v1-20261008`.
Replay uses `nr-k3-nonlinear-sat-replay-v1-20261008`. Next after this gate is a
separately frozen spatial/time/domain and incident/returning disturbance study,
not automatic admission or native porting of an unvalidated physical boundary.
