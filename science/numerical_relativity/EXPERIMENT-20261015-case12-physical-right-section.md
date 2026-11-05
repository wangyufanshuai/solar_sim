# Fixed-case12 physical right section: one bounded candidate

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: preregistered code experiment. Date: 2026-10-15, Asia/Shanghai.
Method: `nr-case12-physical-right-section-controls-v1`.
Verification Status: UNVERIFIED before execution. This additive development
candidate has not been evaluated while writing its documents. No scientific
imports, mathematical execution or tests are performed by this text work.
Registered counts and ceilings are not observed passes or timings.

## Question, parents and unchanged history

The only candidate is a nonzero-frequency right section of the actual
physical43 constraint polynomial C. Reuse the accepted all-direction
principal section and physical-coordinate bridge, retaining the nonzero
negative-first coefficient R. Do not identify the old principal section S
with a physical right inverse without the newly registered correction.

The coordinate-bridge parent directory is
`tmp/nr-shadow-evidence/nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015`.
Its gate is
`466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708`,
worker
`9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811`.
The other mathematical parent is
`nr-k3-case12-polynomial-section-controls-v1-20261014`, with its accepted
source-bound s,d,domain/denominator and section proof. Both input families
must have their actual saved bytes bound to their own qualified artifacts.

Copy exactly 20 registered parent files under the new `parent-inputs/`:

    section_gate.json, section_worker.json, section_replay.json,
    s.json, d.json, domain.json, denominators.json,
    coordinate_gate.json, coordinate_worker.json, coordinate_replay.json,
    coordinate_source_bridge.json, coordinate_stats.json,
    C0.json, C1.json, C2.json, F.json,
    t__p_m1.json, t__p_0.json, t__p_1.json, t__p_2.json.

The section matrices s/d are the parent's Stilde/Dtilde, F is the coordinate
parent's rTC__p_m1, and the t family is its rT family. The new producer's
PARENT_FILES fixes each original path and immutable SHA. Require gate/worker
success, complete accepted source and replay identity, and correspondence
between those digests and each accepted artifact. The new worker receives
these archived bytes rather than reading an unregistered parent location.
The 20 registered parent files contain 2,967,026 bytes in total; this size
does not replace verification of every individual immutable digest.

Keep all 643 previous sources immutable. Add seven sources: new producer,
runner, focused test, this derivation/protocol pair, the coordinate result
report and `NOTE-20261015-case12-physical-right-section-next.md`. The new
source closure contains 650 entries. Preserve all 23 historical directories
and 16,387 files: the preceding 22 / 15,534 plus every one of the 853
coordinate-bridge files. Failed and unresolved histories are preserved.

## Sole owned execution

The sole invocation is

    D:/python/python.exe -B scripts/run-nr-k3-case12-physical-right-section.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-physical-right-section-controls-v1-20261015

Require the output directory to be absent. Use the existing Windows Job
supervision and one numerical thread. Freeze test identities and all source
hashes before this execution.

The producer `scripts/nr_case12_physical_right_section.py` is frozen at SHA
`23b463021437307251148f8e784bd7679cb388055d125ac95cd1323c5480791d`.
It constructs and saves each complete e coefficient as soon as its ordered
products finish, without mutating an already saved matrix. This is a source
identity and persistence contract, not a passing execution receipt.

- 600 seconds total for all owned controls, production, replay and checks;
- 64 MiB output including the original 2 MiB terminal reserve;
- 8 MiB source-snapshot limit;
- C: at least 3 GiB free;
- E: at least 4 GiB plus 32 MiB free, including the separate full output
  reservation at startup.

The disk output cap is not a memory limit. Keep full guards at stage, row
and save boundaries; exact inner arithmetic uses the same owned deadline.
All new matrix products, domain arithmetic, negative calculations and
independent replay occur inside the one worker. The finalizer only checks
saved reports, bytes/hashes, pure source/parent manifests, dependency and
inventory identity, and cleanup. It performs no mathematical replay.

No retry, budget increase, split-run splicing, post-stop algebra or alternate
correction is allowed. A resource-limited prefix remains incomplete evidence.

## Fixed algebra and source binding

The frequency variable zeta is represented by a separate Laurent integer
index; it is not the third direction coordinate of QQ[x,y,z]. Define

    r=v^T v, g=v^T h^-1 v, sigma=chi*r*g^2,
    Delta=r*sigma, d=rD, s=sigma*S,
    t=rT, F=[rTC]_-1=rR,
    H=F s, N=H/Delta,
    e=s(Delta I43-zeta^-1 H)t, E=e/Delta^2.

This H is a correction numerator, not an energy. Bind the inherited exact
identities d s=Delta I, t C=d+zeta^-1 F and both T/Ti inverse directions.
Do not rerun all parent products or claim a new proof of those parents.

Independently check the fixed domain constants and the exact identities for
r,g,sigma,Delta and Delta^2. With chi=18/25 and g>=(5/6)r, the common
denominator satisfies Delta^2>=r^8/4>0 on every real v!=0. No direction
component or pivot denominator is permitted. C0/C1/C2, F, all four t
coefficients, s and d are actual qualified matrices, not regenerated from
direction samples.

The new producer composes this unique registered formula using frozen
polynomial/Laurent helpers. Bind source bytes, helper paths and interfaces;
there is no new formula-body adaptation, generic symbolic solve or new gauge.
Independent arithmetic reuses only its declared, qualified low-level
operations and does not call the producer's construction as an oracle.

## Complete main and negative outputs

Save 14 main matrices:

| Family | Complete shape/support | Direction-degree ceiling |
|---|---|---:|
| H | 43 by 43 | 8 |
| H_squared=H H | 43 by 43 | 16 |
| e | five 58-by-43 matrices, powers -2..2 | 19 |
| right_inverse=C e-Delta^2 I | seven 43-by-43 matrices, powers -2..4 | 21 |

The main certificate contains 29,111 slots. Require every coefficient of
H_squared and all seven right_inverse matrices to vanish exactly: 14,792
required-zero slots. Identity subtraction occurs only at power zero.
Other main matrices are not required to vanish. A conservative degree cap
must not be reported as the matrix's observed or homogeneous degree.

Retain all parent t powers -1..2, including the complete zero t2 matrix.
Do not omit e or residual coefficients because endpoints are expected zero.
No floating threshold substitutes for coefficientwise equality.

The only registered negative deletes -zeta^-1 H and constructs

    bad_e=s Delta t,
    bad_right_inverse=C bad_e-Delta^2 I.

Save every bad_e power -2..2 and every bad_right_inverse power -2..4 with
the same shapes/caps as their main counterparts. In particular bad_e_-2
is explicitly represented as a complete zero matrix. The 12 negative
matrices contain 25,413 slots, for 26 matrices and 54,524 slots overall.

Require a genuinely nonzero coefficient in the complete bad_right_inverse
family, then independently reproduce its exact coefficients and rejection
decision. Compute the actual product; do not substitute zeta^-1 N for the
frequency-dependent expression zeta^-1 Ti N T, and do not add a fabricated
nonzero number directly to a residual. No expected nonzero count or rank
is preset. If the actual negative is not rejected, preserve it and fail.

Matrix names use H,H_squared and the four families e,right_inverse,bad_e,
bad_right_inverse, with `__p_m2` denoting power -2 and `__p_0` denoting zero.
The seven metadata records are scalars,stats,acceptance,mutation,domain,
source_bridge,parent_provenance, each with `.json` extension. Scalars contain
exactly r,g,sigma,delta,delta_squared. Domain metadata records the nonzero
real-direction/nonzero-complex-frequency restriction and the exact lower
denominator coefficient 1/4. Thus 20 parent files, 26 complete matrices and
seven metadata files form exactly 53 parsed replay inputs.

## Independent replay and canonical data

Use complete canonical polynomial matrices, including every zero slot,
unique row-major coordinates, exact nonnegative integer direction powers
and reduced rational coefficients. Complete Laurent powers and shapes
are required separately from polynomial degree. Record actual statistics
from the saved data, not prefilled anticipated counts.

Independent standard-library replay rebuilds H, H_squared, both corrected
and uncorrected e families and both residual families from the actual
qualified input bytes. It checks every multiplication, subtraction,
coefficient, power, matrix slot, degree cap and zero/nonzero decision. It
binds each parsed file by the SHA of its actual input bytes. Metadata and
the final report must agree with those independently derived decisions.

The runner explicitly uses the accepted
`scripts/nr_integer_polynomial_replay.py`, SHA
`5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f`.
Its independent per-polynomial denominator/content clearing, complete
Python-integer convolution and conversion back to Fractions preserve the
exact QQ result. The actual direct rectangular products use exact_add_product
and scalar products use multiply_polynomials. No product, Laurent coefficient
or required slot is skipped. No frozen producer/parent function is patched.

The independent e construction associates s*((Delta I-zeta^-1 H)*t), while
the producer distributes e_k=Delta*(s*t_k)-(s*H)*t_(k+1). Both compute the
same ordered matrix expression and preserve their own arithmetic path.
This change of association is not a new mathematical assumption or a
reduction of validation coverage.

Complete but mathematically failed candidates retain all main/negative
matrices and their independent replay report before worker rejection. A
source/data exception or deadline stop may leave only a marked prefix. Do
not fill in omitted calculations outside the budget. Verify all source and
historical hashes at entry, exit and finalization without altering them.

The frozen arithmetic suite `scripts/tests/test_nr_integer_polynomial_replay.py`
has 21 functions / 73 explicit instances, SHA
`228da96b19e86f0f251751e2d76161cb58feb9a587aca201539a7d0e5fd20548`.
It is registered to run again inside this same worker, in addition to the
new focused right-section suite. Its older passing receipt is inherited
background evidence and is not substituted for this batch's JUnit results.
The new focused file `scripts/tests/test_nr_case12_physical_right_section.py`
is frozen at 18 functions / 48 explicit instances, SHA
`f7fbf529641f3896f3077c34286418f0d7239fc254feb8b53322c0e86dea64bd`.
Together the two registered files contain 39 functions / 121 instances.
These are execution requirements, not reported passes.

Controls cover Laurent product order/support, real non-unit direction
scales, true nilpotence versus a nonzero square, source/parent/scalar
identity, the deleted-correction counterexample, canonical full-slot
representation and guard/sink failure. Each executed case must have a
unique registered JUnit identity with no skipped, failed or errored result.
The new sink controls exercise the producer core and independent-section
core on small matrices, stopping at the first H sink; they do not claim a
full-size build_certificate fault-injection run.
An inherited control suite is not counted as newly executed unless it is
explicitly registered and run in the same owned worker.

## Acceptance and limits

Require bound parent/source/domain identities, all main products and their
complete exact-zero residuals, the actual deletion negative, independent
replay, registered controls, source/history/dependency integrity, dual
successful terminal reports and zero remaining owned processes.

A full pass may qualify only this nonzero-frequency physical right section
for the fixed-case12 source and all real nonzero directions. It implies
physical C has row rank43 at those frequencies. The accepted zero-frequency
map remains rank39 and has no full43 inverse. No rho->0 uniform inverse,
frequency norm, energy or damping claim follows from the Laurent section.

No B=C(J+zeta K)E construction, full-frequency closure, kernel-invariance
proof, low-order estimate, geometric=True/actual nonlinear-RHS bridge,
variable-background theorem, IBVP or convergence check occurs in this
candidate. physical_gate, live_admission and scientificPayloadWriteback
remain false. Physical integration, native/GPU work and automatic retries
remain zero, and the original 2e-12 physical comparison threshold is intact.
