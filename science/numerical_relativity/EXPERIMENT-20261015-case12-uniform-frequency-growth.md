# Fixed-case12 uniform frequency growth: one bounded candidate

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: preregistered code experiment. Date: 2026-10-15, Asia/Shanghai.
Method: `nr-case12-uniform-frequency-growth-controls-v1`.
Verification Status: UNVERIFIED before execution. Source/receipt reading
and paper derivation only; no scientific import, polynomial evaluation or
test was performed to prepare this protocol. Counts are registered
requirements, not measured passing tests or runtime predictions. Results
must be recorded separately after the sole owned run.

## Fixed mathematical scope and accepted evidence

This batch computes explicit rational coefficient bounds and growth
constants for two separate fixed-case12, geometric=False, constant-background
families: original full58 state with a uniform L2 estimate, and physical43
constraints with a frequency-weighted estimate. The 43 result does not
promise plain-L2 control, no derivative loss or a common local energy.

The frequency-reduction parent is
`tmp/nr-shadow-evidence/nr-k3-case12-physical-frequency-reduction-controls-v1-20261015`.
Its gate, worker and independent-replay hashes are

    5817e42e5c38ff682146acf3ce8eb5afe439b5cfadddf0dc1e27f91c6ab2688d
    c2739fbb4c40365cecb700c73522349bdcff0e116542b3d5ef2aa5280c3d9296
    7df5f34321f744a41dce72687ad3f0511627bd0ac064a34be6d8a2f362f7802b

Also bind the accepted full58 factorized-energy gate
`64bd6ca11c1ba12efa3f5e437be91aef46780c747a751f1d1706ff44786618d4`
and the successful 43 energy-v2 gate
`df247bc18a9366efa076382ad0ecf350e807277dd0fb6d59296a45a68ec07ee1`.
Actual accepted bound/source/domain/formal or complete-matrix identities
and replay provenance are prerequisites; copying an upper constant alone
does not qualify an energy. The failed energy v1 is preserved history and
supplies no mathematical result.

Bind the actual original J58, Q0/Q1/Q2, t[-1..2], u[-1..2], Z[-2..6],
leading_residual and the qualified physical zero-frequency 39-image
evidence to their registered paths and hashes. J is in the original
58-state coordinates, independent of direction. K58 retains shift and
is distinct from Khat43=Ab/r. No new state similarity is applied to J.

Use n^T n=1 and physical rho>=0. At nonzero frequency zeta=i rho; T/Ti
are used only for rho>=1/2. Fixed case12 has g>=(5/6)r and the inherited
source parameters. No real/complex frequency evaluation is sampled in
this batch. Proofs at all unit directions come from complete polynomial
coefficients and the established analytic inequalities.

Preserve every old 671 source. The additive frozen closure is planned as
678 sources: producer, runner, focused tests, this derivation/protocol pair,
the previous reduction RESULTS and the matching next NOTE. Preserve all
27 historical directories / 19,556 files, including the complete previous
792-file reduction run. Verify actual members and hashes, not counts alone.

## Sole owned execution and unchanged resource limits

The only planned invocation is

    D:/python/python.exe -B scripts/run-nr-k3-case12-uniform-frequency-growth.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-uniform-frequency-growth-controls-v1-20261015

Require a previously absent output directory and a frozen final source,
parent and test registration. The producer
`scripts/nr_case12_uniform_frequency_growth.py` is frozen at 60,192 bytes,
SHA `34eaf076c5a8df03e2ac4f264f74ebbe60c720c9160af06c6519c5c09b98792c`.
This is static source identity, not an execution result. Final focused
control counts are registered below before this protocol is frozen.

The inherited limits remain:

* 600 seconds total owned worker time, including controls, parsing,
  production, negative controls, domain checks and complete replay;
* 64 MiB output, with the original 2 MiB terminal reserve;
* 8 MiB source snapshot;
* at least 3 GiB free on C:;
* at least 4 GiB plus 32 MiB free on E:, and the separate full output
  reservation at startup.

Use the unchanged Windows Job ownership/supervision and one numerical
thread. Full guards remain at registered stage and save boundaries;
inner parsing/coefficient loops use the same owned deadline where their
API supplies checks. The outside controller imposes the total hard limit
and cleans only this run's processes. All exact bound arithmetic and
controls belong to this worker. No post-stop completion, source repair,
alternative cutoff/weight, threshold weakening, increased budget or
automatic retry is permitted.

This candidate does not rebuild large spectral, section, energy or Laurent
matrix products. Finalization is pure saved-record/hash/AST/manifest,
dependency, inventory and cleanup verification, with no new norm sums,
growth arithmetic or scientific replay outside the worker.

## Complete bound tables and output inventory

Save fifteen complete main entrywise coefficient-L1 tables: J58; Q0/Q1/Q2;
Z[-2]/Z[-1]/Z0; four t and four u coefficients. One has shape 58x58 and
fourteen have shape 43x43: 29,250 explicit slots. Every row-major [i,j]
must occur once, including zero bounds, with a canonical nonnegative
rational and an independently checked total.

Decode all source polynomial coordinates and rational coefficients
strictly. Require J constant and Qj direction-homogeneous of degree j.
Use inherited caps for Z/t/u; do not reinterpret caps as whole-matrix
homogeneity. Verify the whole t2 matrix is zero. Bind complete Z2..6 and
leading_residual and require every coefficient zero. Preserve the actual
Z[-2], Z[-1] and Z0; specifically retain the surviving inverse-frequency
Z[-1] term. Preserve the complete Z[-2] table and use its actual total in
the formula; its parent value was zero, but the bound itself permits a
nonzero value and this batch adds no separate Z[-2] zero gate. The six
frequency residuals and T2 contain 7*1849=12,943 required zero slots.

The exact degree registration is:

| Table input | Total direction degree cap | Additional homogeneity |
| --- | --- | --- |
| J58 | 0 | degree 0 |
| Q0,Q1,Q2 | 0,1,2 | respectively degree 0,1,2 |
| Z[-2],Z[-1],Z0 | 2,4,5 | none |
| t[-1],t0,t1,t2 | 2,3,4,5 | none |
| u[-1],u0,u1,u2 | 0,2,3,3 | none |

All nine inherited Z inputs retain their caps 2,4,5,6,7,8,9,10,10 for
powers -2..6; leading_residual has cap 6. Actual mutant J retains cap 0
and degree-0 homogeneity; mutant T2 retains cap 5 and has its exact
prescribed x^2 addition checked separately.

The two real input changes each save a complete changed polynomial matrix
and complete changed norm table, adding 3364+1849=5213 slots of each kind.
There are 19 table/matrix JSON outputs in total: fifteen main tables, two
changed tables and two changed matrices. Nine metadata records complete
28 new outputs. Main table names are norm_J58, norm_Q0/norm_Q1/norm_Q2,
norm_Z_m2/norm_Z_m1/norm_Z_0, norm_T_m1/norm_T_0/norm_T_1/norm_T_2 and
norm_Ti_m1/norm_Ti_0/norm_Ti_1/norm_Ti_2. Actual changed matrix names are
mutant_J58 and mutant_T2; each has a matching complete norm table. File
extensions are .json; changed table names are norm_mutant_J58 and
norm_mutant_T2. Metadata names are growth58, growth43,
transform_bounds, mutations, acceptance, stats, domain, source_bridge and
parent_provenance. The final contract has 72 parent files in six qualified
groups and 28 new outputs, giving 100 independent-replay inputs. Actual
paths, raw-byte hashes and strict schema fields are fixed by the producer
and independent runner registration before launch.
The exact parent payload totals 8,946,161 bytes. The source bridge records
four original AST function groups without executing or adapting them;
the old fixed-ray growth function is bound for interpretation only.

Main and changed table schema is nr-case12-growth-coefficient-bound-v1,
with shape, degree_cap, homogeneous_degree, entries, total, slots,
nonzero_slots, coefficients, max_degree and all_zero. Degree of the zero
polynomial is -1. The bound is not a matrix polynomial and uses a separate
schema from the actual canonical changed matrices. Growth schemas are
nr-case12-full58-frequency-growth-v1 and
nr-case12-physical43-frequency-growth-v1; transform metadata uses
nr-case12-transform-frequency-bounds-v1. All numeric outputs representing
rationals are reduced Fraction strings; powers and counts are exact integers.

Do not label norm-table entries as new zero matrix residuals. Statistics
must agree with actual complete decoded arrays; zero/nonzero outcomes
and constants are not prefilled from this protocol or old statistics.

## Exact bound formulas and required decisions

Read C58/C43 from their actual bound records as canonical Fractions and
require each >=h0=1/14. Validate the original schema, shape, domain and
accepted-parent qualifications. Compute every displayed number, not just
an unevaluated formula string.

For j=ell(J58), save

    Gamma58=28 C58 j,
    Gamma58zero=2j,
    Gamma58combined=max(Gamma58,Gamma58zero),
    C58global=max(C58,1), lower58=1/14.

The global upper accounts for the independent Euclidean zero-mode energy.
Require that the two growth values combine consistently, with Gamma58
the nonzero-frequency rate. Do not omit the coercivity divisor 1/h0.

For qj=ell(Qj) and cp=ell(Z[p]), save the fixed cutoff and actual values

    rho_star=1/2,
    Gamma43low=2(q0+q1/2+q2/4),
    Gamma43high=28 C43(c0+2 c[-1]+4 c[-2]),
    Gamma43combined=max(Gamma43low,Gamma43high).

For ap=ell(tp), bp=ell(up), compute

    AT=2 a[-1]+a0+a1 > 0,
    Ai=2 b[-1]+b0+b1+b2 > 0,
    lower43_weight=1/(14 Ai^2), upper43_weight=C43 AT^2.

The weighted comparison is lower43_weight*(1+rho)^-4 below and
upper43_weight*(1+rho)^2 above the physical43 squared Euclidean norm on
rho>=1/2. It yields a conservative flow allowance with (1+rho)^3; it is
not a proof of necessary/optimal loss or a no-loss/plain-L2 theorem.
T2 nonzero or AT/Ai nonpositive is failure, with no alternate exponent.
Save the rational squared-flow prefactor
upper43_weight/lower43_weight=14 C43 AT^2 Ai^2 and integer powers 6 for
the squared flow and 3 for the flow. A floating square root is unnecessary.

The Hermitian pullback is T(n,i rho)* H43 T(n,i rho), using complex
conjugate transpose. The low branch uses Q directly and includes rho=0;
the actual zero-frequency physical interpretation remains the accepted
39-dimensional image of C0. T/Ti are never evaluated at zero.

## Real mutations and logical countercontrols

For the J negative, require the actual original [57,57] zero, copy J and
add 1 only at that slot. Save its actual full matrix and bound table.
Independent arithmetic must compare every changed table slot with the
original, detect a nonzero source/table change and reject old-table reuse.
Recompute the total; do not hard-code its increment. This does not
disprove the changed system's own correctly recomputed growth estimate.

For the T negative, copy the actual zero t2 and add x^2 at [0,0]. Save
its full matrix/table, detect actual nonzero polynomial coefficients and
reject the registered first-order T bound qualification. No assertion
that the chosen error is nonzero at every direction is made.

The first logical control evaluates H=h0=C=1/14, J=1, K=0 and state 1.
Its actual energy derivative must exceed the erroneous rate-times-energy
that omits 1/h0, while the correct rate is consistent. The second uses
T=diag(rho,rho^-1), Ti inverse, H=I, rho=2 and state e2; the actual
pullback is below the incorrectly claimed Euclidean lower bound 1.
Save complete rational calculations and actual gaps. These controls are
small inference examples, not case12 counterexamples.

## Independent Fraction replay and final qualification

The independent path reads and hashes every raw saved input, reconstructs
all main/mutated coefficient tables and totals, actual mutation matrices,
both C values, every bound constant, both inference controls, domain and
acceptance decisions using its own standard-library Fraction logic. It
does not call producer norm/growth functions or scientific matrix code.
Source-coordinate interpretation and inherited proof identities are
explicit parent/source obligations, not inferred from matching numbers.

Require complete canonical schemas, dimensions, slot sets and exact types;
bool/float equality cannot stand in for integer indices or rational fields.
Require complete registered input hashes and actual statistics to match
independent results. Coefficient acceptance is exact-rational-equality;
required-zero acceptance is separately exact-zero-only. Neither is the
unchanged 2e-12 physical threshold, and the positive growth constants are
not required to be zero. No generic claim of validating every arbitrary JSON
schema is made beyond the implemented fixed contract.

The focused suite `scripts/tests/test_nr_case12_uniform_frequency_growth.py`
is frozen at 28 functions / 87 explicit instances, 30,674 bytes, SHA
`ecc38682238792b7276df016206092f05dd4c1286339576dcc4b5649d395ce53`.
Also run the unchanged integer suite
`scripts/tests/test_nr_integer_polynomial_replay.py`, 21 functions / 73
explicit instances, SHA
`228da96b19e86f0f251751e2d76161cb58feb9a587aca201539a7d0e5fd20548`.
That arithmetic regression does not imply that new matrix convolution
or scientific matrix rebuilding occurs in this bound-only candidate.
The combined registration is 49 functions / 160 instances. These are
required executions, not observed passing results.
The focused controls must cover coefficient cancellation versus
absolute sums, zero and nonzero slots, every complete table, J/t2 actual
changes, coercivity and pullback mistakes, parent/domain/source drift,
canonical-type errors, and guard/sink propagation. Every registered test
must run in this worker with unique JUnit identities, no skips/errors or
failures. Prior receipts cannot replace this run's controls.

On a mathematical rejection, retain complete finishable candidate tables,
constants, negatives and replay with accepted=false before failing the
worker. Malformed input, interruption or resource failure preserves only
the actual marked prefix; it does not qualify a result. Finalization checks
the frozen input/output identities and successful terminal without rerunning
the calculation. All historical source/evidence hashes must remain intact.

The independent parent check also decodes the five accepted physical
zero-image residuals in shapes 4x58, 39x58, 39x39, 39x58 and 43x58 and
checks their 8771 slots are zero. It reads the actual C0, D39, S39, B39 and
off-image ambiguity and binds their accepted rank39/source qualification.
These are complete rereads of qualified parent products, not newly
recomputed matrix multiplications or extra new residual outputs. The
zero-mode image restriction remains explicit in the saved domain.

The only two new true flags permitted by a complete pass are
full58_uniform_frequency_l2_growth_validated and
physical43_weighted_frequency_growth_validated. Retain the previous
seventeen false scope flags, including full_frequency_energy_validated,
and additionally keep physical43_uniform_euclidean_growth_validated,
constraint_derivative_loss_absent_proved and
variable_background_energy_validated false. Keep actual nonlinear RHS,
boundary/IBVP, damping, convergence, physical evolution, live admission,
scientific payload writeback and the original physical threshold separate.
