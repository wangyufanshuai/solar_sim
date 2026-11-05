# Full58 frozen FO-CCZ4 with source-inclusive SBP/SAT

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective implementation and bounded simulation
- Origin Date: 2026-10-08
- Verification Status: PLANNED; NOT YET EXECUTED
- Version Label: nr-full58-sbp-v1

## Objective and scope

Advance the selected boundary route from a scalar operator to the actual coupled
58-variable FO-CCZ4 linearization, including all zero-order sources. This is a
plane-dependent reduction of the 3-D equations about Minkowski, not a nonlinear
3-D solver, a curved-boundary prescription, or a physical CPBC admission.
The native0.5.0 solver, all247 inherited source identities, old failed receipts,
the live EIH runtime and art remain untouched.

Use the canonical58 ordering and native parameter contract: kappa1=.1,
kappa2=0, kappa3=c=e=s=1, k0=0, lapse coefficient2, shift damping0.
Use the current explicit candidate f=3*alpha*chi, mu=.2*chi, frozen at
alpha=chi=1, beta=0, h=I; use tau_inverse=1, as in the retained exterior run.
The source Jacobian includes both h-trace and A-trace relaxation. Products
involving derivatives of f vanish ONLY in this background linearization.
No change of formulation, gauge, damping, clipping or projection is allowed.

## Discrete contract

The PDE convention is q_t=A(n)*q_x+S*q; physical speeds are MINUS eigenvalues
of A. Obtain a real complete58-column basis R at the published roots using SVD
null spaces; nullity must agree at1e-9/1e-10/1e-11. No pseudoinverse, fabricated
columns, or deleted zero-speed fields. Require condition(R)<=1e6 and scaled
eigen/symmetrization residual<=2e-11. Define L=R^-1, H=L^T L, and retain source
logarithmic norm rho=lambda_max(sym(L*S*R)). This pointwise H is not a uniform
symmetrizer for all directions/coefficient values.

Use the existing SBP(4,2) derivative and diagonal spatial norm W: interior4,
boundary2. With w=Lq and prescribed incoming g, add at the left face
R*min(Lambda,0)*(w-g)/W0, and at the right face
-R*max(Lambda,0)*(w-g)/WN. Zero/outgoing boundary data must have no effect.
Check E=q^T(W tensor H)q/2: direct E_dot equals boundary flux + source + SAT.
Also independently evaluate the characteristic boundary square-completion
formula, and source<=2*rho*E. The relative numerical bound is2e-11 times
max(1, magnitudes of compared terms); all terms and residuals are retained.
This source-inclusive estimate does NOT require E to decrease when S or
incoming data inject energy. No CPBC label is earned by zero incoming data.

## Prospective campaign

Four unit normals: x,y,z,(1,2,3)/sqrt(14). Three line grids17/33/65 on[-1,1].
T=.5, RK4 dt=1/512, wavenumber pi, amplitude1e-3. Two input families:

1. Full58: complex slot j is amplitude*(sin(j+1)+i*cos(2*(j+1)))/sqrt(58).
   The continuum reference is Re(exp((S+i*k*A)*t)*v*exp(i*k*x)); generally
   off the constraint surface, deliberately exercising every variable/source.
2. TT-plus: transverse traceless h polarization, A=i*k*h/2,
   D_kij=i*k*n_k*h_ij/2, all other slots zero. Physical speed+1. Independent
   closed-form reference exp(-i*k*t) must agree with the58-matrix exponential.

Boundary data come from the respective continuum reference, only projected
onto incoming characteristics. Boundary half-step amplitudes may be advanced
with one58-matrix exponential, but are checked against direct final-time expm
within2e-12 absolute. Save final full58 states, not just pass flags.

For every case retain errors in weighted state norm, physical-metric H/M,
stored-K momentum, FO Hamiltonian, Gamma/Theta, h/A traces and A/B/D/P reduction
constraints. Exact derivatives of the continuum mode provide diagnostic
references, distinct from SBP derivatives of numerical data. Full58 constraint
magnitudes are NOT expected to vanish. TT null controls are reported separately.

At each refinement pair require state-error order>=2.5 (not an everywhere
fourth-order claim). For every constraint-error family require decreasing error
when both values exceed2e-12, or both bounded by2e-12. Mixed-floor transitions
are reported as bounded transition only when the finer error is below the
floor; no numerical order is assigned to null/transition rows. These are
frozen-linear discretization checks, not Einstein constraint-preservation proof.

Time controls: x-normal, N17, both families, dt=1/64,1/128,1/256.
Pair-difference order must be>=3.5 when both differences exceed2e-12;
otherwise time-order verdict is inconclusive, never a fabricated pass.
Direct versus split RK4 advancement must match exactly with the same time
indices and boundary table. Four N33 homogeneous-incoming runs use initial
q_j=amplitude*(1-x^2)^3*sin((j%3+1)*pi*x)*cos(j+1)/sqrt(58), T=.5,dt=1/512.
Audit source-inclusive energy bounds and all sampled constraint norms; those
off-constraint controls are not declared constraint decay.

No post-result thresholds, case removals or gauge changes. A failed gate stays
failed even if unit tests pass. A completed but failing campaign is retained.

## Implementation checks before campaign

Test source matrix against actual nonlinear Python RHS centered perturbations
at all58 columns, once constant and along all three grid axes (atol1e-7).
Cross-check the principal matrix against the separate analytic tensor assembly.
Test both face signs, incoming forcing, outgoing/zero-data invariance, constant
and source-only behavior, source relaxation, exact TT identities, all input
rejections and no mutation. Retain any development test failures separately.

## Resources and evidence

Entry: D:/python/python.exe -B scripts/run-nr-k3-full58-sbp.py
--output-directory tmp/nr-shadow-evidence/nr-k3-full58-sbp-v1-20261008
Run from this workspace, no installs. Disable pyc/pytest cache; TEMP/TMP on E.
Single-thread BLAS for small matrices. Main campaign cap600s; check budget and
disk every case and at most every32 steps; refuse output overwrite. New output
cap32MiB, reserve receipt space. Keep C>=3GiB and E>=4GiB+32MiB. Each scientific
case is finite with explicit step count; hard-timeout stop preserves failure.
Use a separate fresh directory for an identical-process replay; compare all
scientific fields and artifact bytes, excluding elapsed time and output path.

Bind the new source snapshots to the247-source compatibility receipt SHA
6db4c07fc63e9ed13ec569e5306cb2588ab264a5371818cc5831b1cb2dc8dd6a;
also snapshot the existing SBP module, test and route decision plus new files.
Reuse parameter names and canonical order from the manifest contract, but use
a distinctly named frozen-line experimental envelope, not a fabricated native
nr-run-manifest-v1 or3-D checkpoint. No native backend promotion is implied.

All physical_validation, physical_boundary_validated,
black_hole_evolution_validated, amr_validated, waveform_validated,
gpu_validated, runtime_writeback, scientificPayloadWriteback remain false.
Global goal remains active beyond this prerequisite.
