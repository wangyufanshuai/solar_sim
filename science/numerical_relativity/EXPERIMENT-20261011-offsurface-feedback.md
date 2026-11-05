# Offsurface physical H/M feedback: preregistration

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: deterministic controls
- Origin Date: 2026-10-11
- Verification Status: PLANNED BEFORE EXECUTION
- Version Label: nr-offsurface-physical-feedback-v1

## Scope and independent calculations

Keep all471 qualified sources frozen. Recover the true physical gamma/K/Z from
the canonical fields and actual derivatives, while the FO rate retains its
independent A/B/D/P formal derivatives and algebraic relaxation (tau=1).
Fixed kappa1=.1,kappa2=0 and the current gauge are unchanged. Only the14 rates
needed for gamma/K are Taylor-implemented; this is not another full58 solver.

Let V=gamma_t(FO)-gamma_t(physicalZ4) and W=Kij_t(FO)-Kij_t(physicalZ4).
Compare raw product-rule H/M derivatives with the physical subsidiary rate
plus a separately implemented covariant first variation D(H,M)[V,W].
The latter uses deltaR=div(divV)-Laplacian(trV)-Ric:V and the connection
variation .5*gamma^kl*(DiVlj+DjVli-DlVij). Include all raising-index terms.
No unknown spatial derivatives are padded: only fixture fields explicitly
defined as cubic polynomials have exactly zero higher coefficients.

This quantifies instantaneous offsurface feedback, not a closed evolution
system for all43 constraints, offsurface Theta/Z propagation, CPBC, common
symmetrizer, nonlinear stability or grid convergence. No projection/repair.

## Fixed coverage and criteria

Three curved-background points x42 patterns=126 cases. Each point has: clean,
each33 independent auxiliary slots, six symmetric metric components (with
consistent D but algebraic violations), trace perturbation, combined defects.
Complete inputs20x58 and both time-rate paths are saved. All comparisons use
absolute2e-12, rtol0. Clean feedback must vanish; nonclean defects >1e-6.
Single auxiliary-slot cases must leave every other35-constraint entry zero
to2e-12. Combined negative controls drop all feedback, V, or W; error >1e-8.

Check the new gamma/K rate values and first metric-rate gradients against
qualified G/R. Independently probe the K-rate first gradient and metric-rate
second gradient at fixed +/-1/64 and +/-1/128 using cubic Richardson. This
probe is validation only; propagation itself uses analytic Taylor products.
No derivative steps, tolerances or fixture amplitudes are adjusted after data.
Additional tests: raw-versus-covariant variation, exact curved uniform scaling,
input/evidence rejection, complete slot coverage. Four memory-only snapshot
controls cover exact8MiB, missing key, changed hash and cap+1; all rejected
snapshots must perform zero writes. Expected160 new tests plus
67 prior curved controls. No skips/xfails/statistical inference.

## Execution and resource contract

Windows Python -B; new direct evidence directory via
scripts/run-nr-k3-offsurface-feedback-controls.py --output-directory PATH.
One batch64MiB/600sec,2MiB finalization; C>=3GiB,E>=4GiB+32MiB plus prospective
allocation. Before this first execution the user explicitly authorized raising
only the source-snapshot cap from4MiB to8MiB. The additive saver validates all
keys, byte payloads, size and hashes before its first exclusive write. The
frozen4MiB saver, original receipts, all other budgets, physical thresholds
and separate large-experiment authority remain unchanged.
No native call, evolution, N9 matrix, art/live/writeback, cleanup or install.
Preserve failure, stop owned child at original resource limits, no auto-retry.

## Primary sources

Exa five candidates, one university source selected (forums excluded):
[UTK geometry notes](https://web.math.utk.edu/~freire/teaching/m668s23/Curvature_linearization.pdf),
section1, fixes scalar-curvature/connection variation signs (Laplacian=trace Hessian).
Directly reread [Dumbser et al. FO-CCZ4](https://ar5iv.labs.arxiv.org/html/1707.09910)
II.2 auxiliary definitions and Eq12a,d,e,f. These are formula references, not
external cross-code evolution validation. No external implementation copied.
