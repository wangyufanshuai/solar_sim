# Fixed-case12 physical closure division: one bounded candidate

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: preregistered code experiment. Date: 2026-10-15, Asia/Shanghai.
Method: `nr-case12-physical-closure-division-controls-v1`.
Verification Status: UNVERIFIED before execution. Writing this protocol
performs no scientific import, polynomial calculation or test. Counts and
caps below are registered obligations, not observed successful results or
runtime estimates.

## One accepted parent and one divisor

Reuse the accepted complete physical closure in
`tmp/nr-shadow-evidence/nr-k3-case12-physical-closure-controls-v1-20261015`.
Gate SHA:
`87d715e82cf705c97fcb2f61d78fc92fc152b20e87367264cee19f16f264fff0`.
Worker SHA:
`4cbb925320f895be745bd31b78078f783cc4600bd36d6edaa4d15f15a4cb41aa`.
Independent-replay SHA:
`9d081ac1d2a7df6214826a88a6cbaecd6fb63041487e495d6f5d25ed07b22228`.

The sole divisor is f=Delta^2=chi^2*r^4*g^4. Divide every slot of the three
accepted Bbar0,Bbar1,Bbar2 matrices by that same f. Require exact zero
remainders/multiplication-back, quotient homogeneity of degree0,1,2, and
the complete direct closure Q C=C(J+zeta K). Reuse original shift-retaining
K, original physical C and fixed J. No new section, old proof rerun,
different factor, sampled direction or symbolic equation solve is included.

Keep fixed case12, geometric=False, chi=18/25 and the original algebraic
source parameters tau_inverse=1, kappa1=1/10, kappa2=0, eta=0, c=e=s=1,
f_profile=3 alpha chi. The accepted g>=(5/6)r bound yields f>=r^8/4>0
for real v!=0. Any successful polynomial extension at v=0 belongs to the
new quotient symbol; no old Laurent inverse is evaluated there.

Preserve all 657 prior source entries. The planned additive closure is 664
sources: producer, runner, focused test, this document pair, the latest
physical-closure results, and the matching division-next NOTE. Preserve 25
historical directories and 17,995 files, including all 827 latest-closure
files added to the previous 24 directories / 17,168 files. Final preflight
must check exact source/history sets and byte hashes, not just counts.
Retain all earlier failures with their original status.

## Sole owned execution and original resource limits

The sole planned invocation is

    D:/python/python.exe -B scripts/run-nr-k3-case12-physical-closure-division.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-physical-closure-division-controls-v1-20261015

Require this directory to be absent. Freeze all source and control identities
and the parent registry before execution. Use one numerical thread and the
existing Windows Job supervision.

The producer `scripts/nr_case12_physical_closure_division.py` is frozen at
24,955 bytes, SHA
`81bb46b7bf42cbf63cd09c6bb17b5b8b7fe55311431624c7a38915d9a7c03344`.
This records its source identity and static review, not mathematical or
test acceptance. Execution results belong to a later separate report.

- 600 seconds total for controls, production, domain checks, negatives,
  independent division/replay and all other owned mathematical checks;
- 64 MiB output including the original 2 MiB terminal reserve;
- 8 MiB source snapshot;
- C: at least 3 GiB free;
- E: at least 4 GiB plus 32 MiB free, with a separate full output reservation
  at startup.

The output cap is a disk cap. Preserve the supervisor deadline and cleanup
contract. Full stage/save guards and the registered division-row guards
remain; independent long division checks the same owned deadline at its
entry, exit and every 32 reduction steps.
Frozen producer scalar division is unchanged, and the outside supervisor
continues to bound the worker. Exact new guard placement is source-bound;
this protocol does not promise a callback inside every CAS operation.

All mathematical work runs within the single owned worker. Finalization
reads saved JSON/XML, exact file hashes, pure source/parent manifests and
inventories; it does not replay division or multiply matrices after the
worker. No retry, budget expansion, alternate candidate, split execution
or post-stop mathematical completion is permitted.

## Complete division and direct-closure outputs

Use QQ[x,y,z] with lexicographic order x>y>z. The frequency index zeta is
separate from the third direction variable. f is homogeneous of degree 16;
its actual leading exponent and rational coefficient are recorded and
used. Do not assume that f is monic or a single monomial.

For j=0,1,2 compute all 43x43 entries of

    A_j=Bbar_j=f Q_j+R_j,
    M_j=A_j-f Q_j.

Save complete Qj,Rj,Mj. Verify A_j-f Q_j-R_j=0 and M_j=R_j, and verify
normal form: no remainder monomial is divisible by leading x^16. Require
both R_j and M_j to vanish. A correct nonzero remainder is a mathematical
rejection to preserve, not an algorithm exception to erase.

| Main family | Complete shape/count | Direction-degree cap | Slots |
|---|---|---:|---:|
| Q0,Q1,Q2 | three 43x43 | 6 | 5,547 |
| R0,R1,R2,M0,M1,M2 | six 43x43 | 22 | 11,094 |
| direct_closure__p_0..4 | five 43x58 | 8 | 12,470 |

The 14 main matrices have 29,111 slots. The six division residuals and five
direct closure residuals contain 23,564 required-zero slots. Quotients are
not required to be zero.

Quotients must be saved at cap 6 before accepting or rejecting their actual
degree distribution. Then independently require every nonzero term of Qj
to have total degree j; a zero polynomial satisfies the condition. Do not
use decoder cap=j to throw away a wrong-degree but otherwise valid quotient.

Compute and save every coefficient on 0..4 of

    (Q0+zeta Q1+zeta^2 Q2)C-C(J+zeta K).

The second product has natural support 0..3 and is padded by a complete
zero target at 4. Residual cap 8 permits a failed cap 6 quotient. Compute this
full direct residual even when a division or homogeneity condition fails,
subject only to the original resource/data exceptions. Do not call the
parent cleared-denominator closure a new direct-closure calculation.

## Actual numerator negative and complete failure retention

Construct bad_A=Bbar0+E_(0,0), with zero-based indices, and redo full 43x43
division by f. Save bad_A,bad_Q,bad_R,bad_M, where bad_M=bad_A-f bad_Q.
The caps are 22,6,22,22 respectively. Four matrices add 7,396 slots. All main
and negative outputs together are 18 complete matrices / 36,507 slots.

Independent replay reconstructs the actual changed input from the accepted
parent, repeats division and checks its complete identity, normal form and
multiplyback. Require the prescribed changed input and a truly nonzero
remainder/multiplyback for rejection. Do not synthesize the expected unit
residual. The main candidate must pass separately; a negative result never
repairs failed exact division, homogeneity or direct closure.

A mathematical main failure does not skip the remaining main/negative
outputs or independent replay when they can finish inside the budget.
Save the complete failed report, then reject. A data exception or resource
stop retains the actual prefix and never receives post-stop completion.
The single negative remains fixed even if it unexpectedly fails rejection.

## Arithmetic, source bridge and independent evidence

The producer reuses the unchanged exact compression helper and its bound
scalar-division source. Its original compression SHA is
`b1f46b6cff721fc242cbca152380d6b940935206458e626c195d5f74df5a6054`,
and original blocks SHA is
`5590d121ecb02a1ecb030f1cfeaa5897739d9fa1fba42c3660e3c2c59876f1d5`.
The independent long-division reference is the frozen compression runner,
SHA `3e221e127f0ba6e22a251da0a322909d853cb076180897dc4e2390f03aa05cdf`.
Its standard-library Fraction algorithm independently reconstructs quotient
and remainder. Integer multiplication-back and direct-closure products use
the qualified `scripts/nr_integer_polynomial_replay.py`, SHA
`5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f`.
No producer division answer is used as the independent answer.

Decode canonical complete polynomial matrices with every row-major slot,
unique exact integer exponent triples and reduced rational coefficients.
Preserve explicit zeros. Bind every parsed input to the SHA of the actual
raw bytes. Independently reproduce every quotient, remainder, multiplyback,
homogeneity decision, direct residual and negative. Compare actual metadata
and statistics; they must not be prefilled from anticipated outcomes.
These checks are a specified certificate format, not universal JSON-schema
or scientific-library semantic verification.

The metadata files are scalars,stats,division_metadata,acceptance,mutation,
domain,source_bridge,parent_provenance, each with `.json` extension.
Archive exactly 16 qualified parent files: closure_gate.json,
closure_worker.json,closure_replay.json,closure_domain.json,
closure_scalars.json,closure_source_bridge.json; Bbar__p_0.json,
Bbar__p_1.json,Bbar__p_2.json; C0.json,C1.json,C2.json,J.json,K.json;
domain.json and denominators.json. The last seven are the parent's archived
original physical/principal inputs and direction-domain records. The new
producer's parent registry pins each original path and digest. These 16
files plus 18 matrices and eight metadata records form exactly 42 parsed
replay inputs. Scalars retain exactly r,g,sigma,delta,delta_squared. The
division metadata records all three powers, actual leading exponent and
coefficient, full division/normal-form decisions, and the quotient's actual
degree histogram and homogeneity decision.
Source/parent manifests must be pure metadata operations for finalization.
The full original source and accepted input identities remain unchanged.

Focused controls must include non-monic division, nondivisible and non-normal
remainders, wrong multiplyback, wrong homogeneous degree saved before
rejection, genuine constant perturbation, complete highest-frequency terms,
parent/source/byte drift, canonical shapes and guard/sink interruption.
The focused suite `scripts/tests/test_nr_case12_physical_closure_division.py`
is frozen at 22 functions / 64 explicit instances, 26,918 bytes, SHA
`60d035d56dfda5f5c2f977a95c9e9656a344c8c66768cd199a947642ec34325c`.
The frozen arithmetic suite `scripts/tests/test_nr_integer_polynomial_replay.py`
has 21 functions / 73 explicit instances, SHA
`228da96b19e86f0f251751e2d76161cb58feb9a587aca201539a7d0e5fd20548`.
Both are registered to run in this same worker: 43 functions / 137
instances. These are required execution counts, not passing results.
The old arithmetic receipt does not replace new JUnit evidence. Require
unique registered case identities and no skipped, failed or errored cases.
No mathematical control runs while this protocol is being prepared.

## Acceptance and limited new claim

Require qualified parent/source/domain identity; all 18 saved complete
matrices; exact main division identities, normal forms and zero R/M;
degree 0/1/2 quotient homogeneity; all five direct closure residuals zero;
the actual changed-input rejection; complete independent replay; registered
controls; unchanged source/history/dependencies; successful owned terminal
records; and zero remaining owned processes.

Only a full pass can set physical_direction_polynomial_generator_validated
and fixed_background_local_symbol_validated to true. It identifies a local
constant-background polynomial symbol and the original source's linear
constraint intertwining. Since its coefficient identity is polynomial, the
new symbol extends to the direction origin without evaluating the old
Laurent right inverse. Zero-frequency C0 still has rank39; a full43 inverse
and uniqueness of its off-image extension from zero data remain false.

local_differential_constraint_pde_derived remains false because the actual
nonlinear-RHS/source bridge is separate. Full-frequency energy, uniform
low-frequency growth, damping, geometric=True equivalence, variable
backgrounds, legal IBVP and numerical convergence are unproved here.
physical_gate, live_admission and scientificPayloadWriteback remain false.
No native/GPU or physical evolution is included. The original 2e-12 physical
comparison threshold and all original resource thresholds remain unchanged.
