# Full58 three-dimensional frozen-cube SBP/SAT experiment

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective implementation and simulation
- Origin Date: 2026-10-08
- Verification Status: PLANNED; NOT EXECUTED
- Version Label: nr-full58-sbp-cube-v1

## Objective

Remove the plane-reduction restriction of the preceding candidate: implement
q_t=sum_d A_d D_d q+S q on a3-D Cartesian cube, all58 variables independent,
with source applied ONCE and SATs added on all six faces. Tangential derivatives,
edge/corner sums and simultaneous nonparallel waves are mandatory. This is the
full constant-coefficient linearization about Minkowski, not yet a curved or
nonlinear solver. No production/native source or old frozen protocol is changed.

Keep the existing parameter contract and f=3,mu=.2,tau_inverse=1. Each face uses
the genuine axis principal eigensystem with the physical-speed convention
-eig(A). Left SAT is R min(Lambda,0)L(q-g)/W0; right SAT is its positive-speed
counterpart -R max(Lambda,0)L(q-g)/WN. All adjacent contributions ADD at shared
edges/corners. Prescribed data are full perturbations projected onto incoming
modes only; do not clamp outgoing/zero modes or overwrite the bulk/source RHS.

## Energy accounting, not a fabricated stability proof

Use tensor-product spatial weights and the Euclidean component norm for the
cube. With sym(A)=(A+A^T)/2 and skew(A)=(A-A^T)/2, audit the exact semidiscrete
identity E_dot = source + sum(face sym(A) flux) + SAT +
sum_d <q,skew(A_d)D_d q>_W. The last term MUST be retained: direction-dependent
line symmetrizers do not establish a common3-D symmetrizer. Record its value
and the defects of the x-direction H on y/z operators. Do not call the cube
energy nonincreasing or prove strong hyperbolicity from this identity.
Relative identity residual <=2e-11*max(1, absolute compared terms).

## Frozen campaign

Box[-1,1]^3, N=9,17,33, RK4 dt=1/512, finalT=.25, amplitude1e-3.
Two families each sum THREE nonparallel modes, normals proportional to
(1,2,3),(-2,1,1),(1,-3,2), phases0,.37,.81, weight1/3 and wavenumber pi:

1. General full58 modes, all variables/source terms exercised.
2. TT-plus modes, each with an independent exp(-i*pi*t) continuum reference.

Reference generators are S+i*pi*sum(n_d A_d); check principal linearity against
the existing independently assembled oblique symbol. Incoming data use that
reference at each integer half-step, not numerical feedback. Reference tables
must match direct final-time exponentials within2e-12.

Save all six final spatial fields. Require both adjacent state-error orders
>=2.5 in tensor-product weighted L2. Reconstruct all12 constraint families from
the cube, including mixed second derivatives; use exact continuum derivatives
for reference. Every constraint error must decrease when both values exceed
2e-12, or end below that floor; bounded nulls have no invented error order.
The general family is off-constraint; no claim of constraint decay.

Time controls at N9, dt=1/96,1/192,1/384 for both families: both pair differences
must exceed2e-12 and order>=3.5, otherwise fail/inconclusive. CFL requires
dt*sum_d max|lambda_d|/dx_d<=.25 and dt*||S||inf<=.25.
For both N9 spatial cases, persist/read a half-run state and require byte-exact
continuation with the same half-step indices; this is not a native checkpoint.

Three homogeneous-incoming full58 controls at N9/17/33 use
q_j=1e-3/sqrt58 * product_d(1-x_d^2)^3 *
sin(pi*((j%3+1)*x+(j%2+1)*y+z))*cos(j+1), sameT/dt.
Retain energy balances and constraint norms. Peak absolute perturbation<=.05
is a numerical stop/sanity bound, NOT a physical stability theorem.

## Tests and independent checks

Before the campaign test constant/source-only and polynomial mixed derivatives,
all axes, anisotropic grids, both face signs, outgoing/zero data invariance,
edge/corner summation, immutable inputs, exact semidiscrete energy accounting,
and input/CFL/resource rejection. Compare cube constraint formulas against
analytic nonparallel Fourier derivatives and separate tensor formulas.
Scientific acceptance does not follow just from those unit tests.

## Resource and provenance contract

Command: D:/python/python.exe -B scripts/run-nr-k3-sbp-cube.py
--output-directory tmp/nr-shadow-evidence/nr-k3-sbp-cube-v1-20261008
No installs; single-thread BLAS, pyc/cache disabled, TEMP/TMP on E. Wall cap600s
per campaign; C>=3GiB, E>=4GiB+32MiB; output cap96MiB with4MiB receipt reserve.
Guard before each case and every16 steps. Preserve partial output on failure;
no automatic retry or post-result threshold changes. Fresh separate-process
replay only after the first complete run, compared excluding elapsed time.
Save full state artifacts and all inherited255 source snapshots plus new source,
tests, protocol and auditor identities. Bind the completed plane audit SHA256
e5d83fe051c3643abfd8e46d6a659791c287ba5f18cf50a008b12aefb75c279a.

All eight physical/runtime admission flags, cpbc_ready and
strong_hyperbolicity_validated remain false. The old T=1M failures remain false.
