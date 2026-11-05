# Mixed-order constraint reduction and characteristic obstruction controls

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded algebraic implementation controls, not time evolution
- Origin Date: 2026-10-12
- Verification Status: PLANNED BEFORE EXECUTION
- Version Label: nr-constraint-order-reduction-v1

## Question and fixed derivation

The qualified43 physical constraint equations contain first and second spatial
derivatives. Their raw finite-frequency eigenvalues are not a first-order
characteristic analysis. Retain all43 rows and every lower-order term. Do not
fit a closed system, project away constraint violations, change physical
parameters, alter the frozen bridge or use eigenvector clipping.

For nonzero k=rho*n, ||n||_2=1, set z=i*rho. The explicit bridge is a polynomial
B(rho*n)=B0+z*B1+z^2*B2. Extract these three EXACT polynomial coefficients by
even/odd parity at n,-n,0 (not a large-frequency fit or approximate derivative).
For integer orders s, y_i=z^(-s_i)*C_i, retain every coefficient of
z^(degree+s_j-s_i). The principal coefficient is the coefficient of z, only if
all powers above one vanish. Keep the zero and inverse-power terms explicitly.
Zero frequency is excluded from this invertible reduction; the original B(0)
and rank39 result are unchanged. No extension through zero is asserted.

Two prescriptions are fixed BEFORE running controls:

1. `hm-only`: s=(1 for H/M, 0 for the remaining39). This deliberately insufficient
   comparator leaves a first-order forcing of rA by the algebraic trace c.
2. `algebraic-weighted`: same, except s_d=s_c=-1. Thus gradients of the algebraic
   errors enter the norm. This moves rA<-c to a bounded lower-order term, without
   deleting it. It is a candidate reduction, not an assumption of hyperbolicity.

Analytic obstruction checks, not post-hoc failure regrading:

- Minkowski/hm-only: with l1=n.rA and l2=-2*c, l1*A=l2, l2*A=0, l2!=0. This is a
  left Jordan chain, even though its eigenvalue is real (zero).
- Nonzero shift with n.beta=0: the reduction-error equation contains
  (rA)_t=i*rho*((beta.n)*I-n*beta^T)*rA. For the algebraic-weighted prescription,
  l1=n.rA, l2=-beta.rA obey the same nontrivial chain. The hm-only comparator
  has the additional -2*c in l2. These are obstructions to THESE norms/symbols,
  not a proof that the original58-state FO evolution is ill-posed.
- For algebraic-weighted Minkowski, the first chain's rA<-c coefficient must
  disappear from A but remain exactly -2*n in the zero-order coefficient.

A counterexample is a successful diagnostic, never a passed hyperbolicity gate.
No CPBC is to be derived from a defective candidate. Next work must account
for longitudinal/transverse derivative order and the relation to the main
system, not tune damping or discard algebraic/definition errors.

## Fixed coverage and criteria

Three unchanged flat coefficient seeds. Nine directions per seed: the six
previous nonzero wave vectors normalized; a direction perpendicular to beta;
that direction plus/minus (1/64)*unit(beta), normalized. At beta=0 use x for
the perpendicular fixture and y as the perturbation direction. Both order
prescriptions give54 cases, each at rho=1/2,1,2,4,8. All direct bridge calls
remain within its original wave-component bound8.

Require unchanged2e-12 bounds: raw polynomial reconstruction, normalized full
operator reconstruction, retained lower terms, forbidden powers, principal
reality, and registered left-chain residuals. No gate on a conveniently small
eigenvector condition number. Raw eigenvalues are diagnostic only; a real
spectrum is not sufficient. Preserve all eigenvalues including imaginary parts.

93 controls:54 full cases,9 Minkowski comparator chains,4 shifted tangent
chains,9 algebraic-weighted lower-term checks,12 rejected inputs,4 omitted/
corrupted-coefficient negative controls,1 coverage/scope check. Regress all131
previous bridge tests, not the old231 suite. Require zero failures/errors/skips.
Persist13 arrays per case, metrics, per-case replay progress, XML/logs and final
receipt. Recompute all54 cases from unchanged inputs before publishing terminal;
require exact array equality, complete inventory and unchanged current/saved
source identities. A bounded source/input implementation check is not an
independent external NR oracle.

## Runtime and provenance

Entry: `D:/python/python.exe -B scripts/run-nr-k3-constraint-order-controls.py
--output-directory tmp/nr-shadow-evidence/nr-k3-constraint-order-controls-v1-20261012`.
Only a fresh direct evidence directory is accepted. Budget64MiB/600sec,
2MiB finalization reserve, C>=3GiB, E>=4GiB+32MiB plus prospective64MiB,
authorized8MiB source snapshot; BLAS/OpenMP/MKL threads1, E TEMP/TMP, no bytecode.
Monitor owned child and budget; preserve error/timeout terminal, no automatic retry.

Pin original bridge gate46199dc7bf8e710bd8dc1261f368c50b41a848980e901660cfdb36ce109c7dfd
and new read-only terminal2cccb52dfdc6bb336a0e3881fbc7e93b89b8e88f71fd3d7e31610886aed66dbc.
Keep491 parent/audit source identities plus the five new implementation/control
files. No edits to frozen sources, no original receipt overwrite, no native/GPU
execution, no N9/N13, no integration or altered science thresholds. Physical,
uniform strong-hyperbolicity, common-energy, convergence, live and writeback
gates remain false irrespective of software-control outcome.

## Primary reference

Gundlach and Martin-Garcia, [gr-qc/0402079](https://ar5iv.labs.arxiv.org/html/gr-qc/0402079),
sections II-III: Fourier pseudodifferential reduction, uniform well-posedness
bounds and the distinction from a local boundary-energy argument. Exa retrieved
the original text. The two local gradings and counterexamples are derived from
our frozen equations; the paper does not certify this implementation.
