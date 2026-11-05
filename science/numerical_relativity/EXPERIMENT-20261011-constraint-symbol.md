# Physical/formal constraint-symbol bridge: preregistration

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: deterministic bounded reference controls
- Origin Date: 2026-10-11
- Verification Status: PLANNED BEFORE EXECUTION
- Version Label: nr-physical-formal-constraint-symbol-v1

## Scope and mathematical contract

Freeze484 qualified sources. Retain the three constant-flat coefficient fixtures
and seven wave vectors in profile_constraint_closure, including zero frequency.
No state evolution, constraint completion, projection, coefficient fit or new
boundary is permitted. Original gauge/damping parameters and2e-12 remain fixed.

Use physical ordering H,M,Theta,Z,definitions33,determinant,trace. Construct
Cphysical directly from actual Fourier derivatives of physical gamma/K and
conformal contracted connection. The old formal rows use independent D/P.
Derive Cformal=T*Cphysical, with T=I+U, U affecting only H and Z through
definition defects. U^2=0 gives the explicit inverse I-U without inversion or
SVD. H adds the scalar Ricci contribution of rD/rP; Z subtracts one half of
the conformal metric times the contracted connection of rD.

Derive the full linear constraint symbol Bphysical directly from the explicit
constraint equations at these flat seeds, retaining advection, zero-order
damping, algebraic relaxation, auxiliary curls and second-derivative feedback.
Do not define B by fitting C*L, a pseudoinverse, or calls to the full-state RHS.
Compare Bphysical*Cphysical with Cphysical*L where L is the previously qualified
full generator J+i*k.A. Also compare transformed B with the old diagnostic
formal generator: its ACTION on Cformal always, its complete matrix only at
nonzero frequency. At k=0 constraint rank is39, not43; four unavailable H/M
directions must not be promoted to physical degrees of freedom or clipped away.

Independently check B against the qualified nonlinear constraint-jet RHS. At
constant flat background with a=K=b=0 it is polynomial of degree at most two in
constraint inputs, so (F(v)-F(-v))/2 is an exact odd-part extraction, not a
step-size fit. Use real/imaginary Fourier jets with all declared derivatives.
Four fixed complex rational probes per case use components
(((j+1)*(p+2))%11-5 + i*(((j+3)*(p+1))%13-6))/64 for j=0..42,p=0..3.
Additionally test all43 individual columns at mode0,wave(1,2,-1), amplitude1/8.
Negative determinant-defect input stays above-1. Do not tune probe amplitudes.

## Fixed gates and controls

Expected131 new tests:21 full symbol cases;43 nonlinear-RHS column controls;
21 exact triangular inverse controls;21 rank/action/full-matrix rules;
3 Minkowski analytic row checks;3 zero-frequency off-image checks;
6 omission mutations;7 malformed background/wave checks;4 malformed evidence;
1 forbidden dependency/AST check;1 fixed coverage check.
Regression: all231 preceding constraint-jet tests, no skip/xfail.

Absolute2e-12 for row conversion/inverse, analytic rows and nonlinear-RHS probes.
For operator intertwining and formal diagnostic matching use infinity-norm
residual divided by max(1,norm(reference,inf)), exactly the prior closure
tolerance2e-12. Report absolute residuals too. Rank must agree at original
1e-9,1e-10,1e-11 relative cuts:39 at zero,43 otherwise. No threshold changes.
Omitting conversion or the full source must be detected above1e-8. At k=0
the full transformed/diagnostic matrices may differ while their action agrees;
require a nonzero off-image difference, not a failed full-matrix assertion.
Persist matrices, inputs, probe vectors and both probe outputs before assertions;
replay every stored case with exact array equality in the original environment.

## Execution and limits

scripts/run-nr-k3-constraint-symbol-controls.py --output-directory PATH,
fresh direct child tmp/nr-shadow-evidence/nr-k3-constraint-symbol-controls-v1-20261011.
Python -B, one BLAS/OpenMP thread, E TEMP/TMP. Original64MiB/600sec,
2MiB finalization, explicitly authorized8MiB snapshot, C>=3GiB,
E>=4GiB+32MiB plus prospective budget. Preserve failures; no automatic retry.
Read-only complete replay after success uses remaining600sec computation budget.
No native/GPU call, installation, cleanup, N9 matrix or new scientific run.

Only finite fixed-profile symbol-bridge validation may become true. Variable-
background closure, strong/symmetric hyperbolicity, CPBC, nonlinear stability,
scientific convergence, physical/live/writeback remain unqualified. N13 remains
unresolved. Do not change historic row definitions or receipts.

Exa reread [Dumbser et al.](https://ar5iv.labs.arxiv.org/html/1707.09910)
Eq14-28 for formal/actual geometry and symmetrized derivatives. The local
conversion and subsidiary symbol are independently derived; the paper does
not validate this implementation or establish a common symmetrizer for it.
