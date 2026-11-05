# Nonlinear SBP/SAT: separated spatial and temporal refinement

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective deterministic numerical experiment
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE; NO NEW PHYSICAL ADMISSION
- Version Label: nr-nonlinear-refinement-v1

## Question and unchanged physics

Does the actual nonlinear 58-variable SBP/SAT candidate exhibit resolved
spatial and temporal refinement at a common positive time, beyond the closed
9^3, T=1/256M coupling screen? This experiment does not answer long-time
stability, physical radiation/CPBC or black-hole questions.

Keep M=1, G=c=1, domain [1,3]^3, independent analytic Schwarzschild A/P
initial data, the existing advective 1+log/Gamma-driver/state-dependent
profile, all sources, no algebraic projection or auxiliary reconstruction,
the same six stage-local characteristic SATs and static analytic incoming
targets. Do not change the production volume, nonlinear driver or gauge.
Retain the exact three-direction 1e-4 perturbation of slots 11..57 from the
closed screen. No perturbation enters the initial first 11 metric/gauge slots.

## Frozen matrix

All six cases end at T=1/32M, eight times the old coupling window.

| Case | Grid | Initial data | dt | Steps |
|---|---:|---|---:|---:|
| spatial-9 | 9^3 | static analytic | 1/256 | 8 |
| spatial-13 | 13^3 | static analytic | 1/256 | 8 |
| spatial-17 | 17^3 | static analytic | 1/256 | 8 |
| temporal-coarse | 13^3 | declared perturbed | 1/128 | 4 |
| temporal-medium | 13^3 | declared perturbed | 1/256 | 8 |
| temporal-fine | 13^3 | declared perturbed | 1/512 | 16 |

This is 52 complete RK4 steps / 208 curved stage records. Store each initial
and final state, and case/attempt/last-completed-step metadata before fallible
work. On failure retain the last accepted state when storage permits, clearly
separate from a completed final state. A failed case terminates the attempt;
do not reset its clock, continue missing cases silently or auto-retry it.

## Norms, decisions and limitations

Use tensor-product SBP norm weights, component-averaged RMS in canonical
slots. Static state error is relative to the time-independent analytic state
on that same grid; H and M have continuum target zero. They are absolute
norms, not fractional physical errors. Report all metric/reduction constraints
at the initial and final times. Also report the same norms on a fixed central
physical box [1.5,2.5]^3 and disjoint boundary-node strata: exactly one, two or
three coordinates on the domain boundary (faces, edges and corners). The
central box is NOT guaranteed to contain only fourth-order stencil rows on
the coarsest grid; no fourth-order-core claim follows from this matrix.

Primary spatial metrics: final full-domain state error, H_metric and M_metric.
For each adjacent grid pair, p=log(E_coarse/E_fine)/log(h_coarse/h_fine), with
h=2/(N-1). Every primary error must exceed the fixed 2e-13 RMS measurement
floor, decrease, and both adjacent orders must be >=1.5. This conservative
mixed-order screen reflects the second-order SBP boundary closure and the
extra metric derivatives in constraints; it is not an assertion of universal
fourth-order constraints. Missing/unresolved data is inconclusive, never a
passing spatial gate. The old fixed-halo FD4 >=3 gate remains failed and is
not changed, inherited as passed, or regraded by this new-method criterion.

At N=13 compare the final perturbed states for dt, dt/2, dt/4. Both successive
full-state weighted RMS differences must exceed 2e-13. Require decreasing
differences and 3.5<=log2(E_dt,dt/2/E_dt/2,dt/4)<=4.5. Below-floor differences
are unresolved, not evidence of 16-digit physical accuracy or fourth order.
The time comparison is same-grid self-convergence, not an exact solution.

Keep every existing stage safeguard: finite positive metric/lapse/chi,
0<lapse<2, CFL<=.25 (existing arithmetic allowance only), characteristic
condition<=1e6, residual<=2e-11, det(h) error<=1e-10, four ordered stages and
six distinct signed faces. Require nonzero perturbed SAT (>2e-12) and changing
coefficient hashes. Report all failed and unresolved primary checks; an
aggregate pass needs both spatial and temporal decisions plus all safeguards.
Independent saved-state diagnostic recomputation and separate-process replay
are additional closure requirements, not implied by the runner's decision.

## Identity and validation prerequisites

Inherit the closed 20261009 nonlinear primary, replay and independent audit
by their unchanged SHA256 identities. Verify both retained artifact sets and
all inherited source snapshots. Apply ONLY the three old-to-new source
transitions allowed by EXPERIMENT-20261009-deadline-transition-v2.md, each
with explicit old and new SHA256. The changes correct resource guards only.
Preserve all previous failed regression XMLs and the old T=1M receipt.

Require the expanded previous 46-file regression to pass after that fix;
also require the new runner's own tests. Bind reports and source snapshots
to each fresh experiment receipt. Recheck inherited files and retained
receipt/native identities after the run. Do not disable old verifiers'
strict current-source checks or overwrite any historical artifact.

## Resources and execution

- Windows native environment, D:/python/python.exe -B, FP64 NumPy.
- One BLAS/OpenMP thread; TEMP/TMP and fresh output directory on workspace E.
- C>=3GiB and E>=4GiB+32MiB remain mandatory, before/after each stage.
- New experiment allocation: 2400 seconds, 64MiB output including snapshots
  and receipt; reserve 8MiB for failure/final reporting. This does NOT extend
  the old experiment's 1200-second/32MiB budget.
- One absolute cooperative deadline checked at stage boundaries. A running
  NumPy call is not preempted; any overrun fails, with no grace or renewed
  budget. Monitor the process, not just a stale file or wall-clock timeout.
- Fresh direct child of tmp/nr-shadow-evidence only; no cleanup or install.

Entry: scripts/run-nr-k3-nonlinear-refinement.py --output-directory <fresh>.
Do not start numerical execution until regression and runner tests pass.
All physical, CPBC, strong-hyperbolicity, black-hole, AMR, waveform, GPU,
live and scientificPayloadWriteback flags remain false even if this screen
passes. The full goal continues beyond this experiment.
