# Fixed-case12 numerator compression: preregistered single bounded batch

## Material Passport

Origin Skill: academic-research-suite / experiment-agent (existing workflow).
Artifact: code experiment protocol. Date: 2026-10-14, Asia/Shanghai.
Method: `nr-case12-polynomial-compression-controls-v1`.
Verification Status: UNVERIFIED before the single owned execution.
The active user-authorized development goal supplies this additive scope.
This is a new fixed candidate, not a retry or regrading of prior evidence.
AI-assisted design; no external reproduction or proof-assistant acceptance.

## Parent, identity and fixed scope

Parent directory:
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-projectors-controls-v1-20261014`.
Qualification-gate SHA-256:
`a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1`.
Worker-result SHA-256:
`7fb37e236fd4754b6378ea779c7da49fba4751557935babf57173342cf3695d9`.
Both passed projector/action terminals remain immutable.

The seventeen parent inputs are the fourteen `NO.json`, `N0.json`,
`N1.json` through `N6.json`, `M1.json` through `M6.json`; `scalars.json`;
and the two records at
`parent-inputs/parent-inputs/parent-inputs/parent-inputs/domain.json` and
`parent-inputs/parent-inputs/parent-inputs/parent-inputs/denominators.json`.
Bind their actual bytes to the accepted parent terminal and copy only
these required mathematical records. No K, section, closure, spectral
chain, projector/action construction or H is rerun.

Freeze 610 source entries: 604 parent entries plus the new module, test,
runner, derivation, this protocol and the parent's projector result report.
Preserve all 17 historical directories / 11943 files, including the 705-file
projector parent and every older failure. Current, before, after and source
snapshot inventories must agree at registered checkpoints, as must the
full historical inventories.

## One command and unchanged protection

    D:/python/python.exe -B scripts/run-nr-k3-case12-polynomial-compression.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-polynomial-compression-controls-v1-20261014

The output directory must not already exist. One attempt only; no retry,
weaker factor search, sampling, fitting, arithmetic repair or expanded
budget follows failure in this protocol.

- 600-second owned run;
- 64 MiB disk-output maximum, including 2 MiB terminal reserve;
- 8 MiB source-snapshot maximum;
- at least 3 GiB free on C:;
- at least 4 GiB plus 32 MiB free on E:, with the full output budget also
  reserved at startup;
- unchanged Windows Job ownership and cleanup, with one numerical thread.

The output cap is a disk limit, not a RAM limit. Tests, all division and
scalar arithmetic, negative controls and the complete independent Fraction
replay stay inside the owned worker. The finalizer only checks saved
reports, JSON, bytes/SHA, pure source/AST/parent manifests, dependencies,
inventories and cleanup. It must not redo division, multiplication,
coefficient statistics or matrix reconstruction.

In independent `verify_division`, every matrix row invokes the unchanged
full budget guard. Within one entry's division, no file is written: the
entry/exit and every 32 long-division steps check the same budget deadline
via `_check_deadline`, avoiding a whole-directory scan at every scalar
step. All stage/save boundaries retain the full guard. This changes
guard placement, not limits, the inventory scanner, or the external
owned-process supervisor.

Use and record the existing Python environment, SymPy 1.13.3 and NumPy
2.2.6, including loaded numerical dependency file identities. This does
not attest to every system library or OS component.

## Exact candidate and saved division outputs

Fix the order

    NO,N0,N1,N2,N3,N4,N5,N6,M1,M2,M3,M4,M5,M6.

Set fN=r^5 for the first eight matrices, and fM=r^4 for the last six.
Use QQ[x,y,z], lex order x>y>z, with exact rational coefficients. For
each original entry a compute q and rho, then separately verify

    division_identity = a-f q-rho,
    multiplyback = a-f q.

Require the division identity to be zero and the remainder to be normal:
no remainder monomial is divisible by the divisor's leading monomial.
Its x exponent must be below 10 for fN or below 8 for fM. Compression
requires both rho and multiplyback to vanish completely. A division with
nonzero rho remains valid rejected-candidate evidence and is saved.

For each input save `<name>_quotient`, `<name>_remainder` and
`<name>_multiplyback` as complete 43-by-43 matrices with explicit zero
slots. There are 42 main matrices / 77658 slots. All 25886 input slots
are divided; the remainder and multiplyback matrices together contain
51772 slots required to be zero on acceptance. Division-identity checks
cover every input slot and are retained in the division metadata.

Verify the sharper parent input caps N<=19, M<=16 before deriving the
quotient caps N<=9 and M<=8. Remainders and multiplyback use the original
19/16 caps. Zero degree is represented by -1. Keep explicit outputs for
all three absent original branches. Do not infer divisibility from caps.

The division metadata uses `nr-case12-compression-divisions-v1`, lex order
and fourteen ordered rows. Each row has exactly `name`, `factor_power`,
`division_identity_zero`, `remainder_zero`, `multiplyback_zero`,
`normal_form_verified`, `accepted`, `divisor_leading_exponent`, and
`divisor_leading_coefficient`. The full factors are in the scalar record;
their powers and leading data bind each row to its prescribed division.
Overall acceptance separately reports division identity,
zero remainder, zero multiplyback and normal form. Row/status booleans
must match independently reconstructed coefficients.

Save matrix stages as they complete, including elapsed stage time, encoded
bytes, term counts, degree and coefficient-character statistics. Continue
through a mathematical nondivisibility result so that the complete fixed
candidate can be retained before rejection; do not continue after a
resource/controller stop.

## Scalar records and future-energy boundary

Bind r, g and parent D=r^6 g^3, eta=r^5 g^2 to the fixed-case12 domain.
Record canonical scalar polynomials

    r,g,factor_N,factor_M,Dbar,etabar,taubar,
    factor_N=r^5, factor_M=r^4,
    Dbar=r g^3, etabar=r g^2, taubar=r^3 g^6.

Those seven keys are the exact new scalar schema. D and eta are verified
from the parent record, not duplicated as new scalar fields.

These compressed denominator formulas are candidate scalars until every
division passes. Parent positivity gives g>=(5/6)r>0 on real v!=0.
After acceptance the quotients represent exactly the accepted projectors
over Dbar and actions over etabar. No expression is evaluated at v=0.

The derivation fixes the conditional future formula

    Hbar = sum_i wi Nbar_i^T Gt Nbar_i
           + sum(j=1..6) g/(2cj) Mbar_j^T Gt Mbar_j,
    H=Hbar/taubar.

Keep eight weights (1,1,1/2,...,1/2), all six original branches and all
eight Gram difference factors. The action weight is g/(2cj), not the old
r^2 g/(2cj). Hbar<=20, HL numerator<=24 and HP numerator<=22 are future
conditional degree ceilings. This batch computes none of those matrices,
Gram/coercivity residuals or an explicit uniform upper constant.

## Real negative control and focused tests

Copy the actual parent N1, add polynomial 1 at [0,0], and divide by r^5.
Save complete `mutation_N1_quotient`, `mutation_N1_remainder`, and
`mutation_N1_multiplyback`. These add 5547 slots outside the main count.
The mutation record uses `nr-case12-compression-mutation-v1`, name
`add-one-to-N1-00`, entry [0,0], actual nonzero counts and
`remainder_coefficients` / `multiplyback_coefficients`, normal-form and
division-identity results, and rejection. Independent replay reconstructs
the changed input itself. If the main candidate passes, the mutant's
remainder and multiplyback must be the unit [0,0] matrix; a nonconstant
r^5 cannot divide 1. Preserve actual main and mutant results if the main
candidate fails; never replace a residual by its expected summary.

The new test file is `scripts/tests/test_nr_case12_polynomial_compression.py`.
Its frozen static contract is 27 test functions / 75 explicit AST instances,
SHA-256
`399f2c36b81f52f627fbbbc50bd03647f048b92574369b294ab9d5de1a050353`.
The runner binds those counts and requires all 75 unique JUnit identities,
with no skipped, failed or errored controls. These are preregistered static
counts, not execution results, scientific acceptance, or substitutes for
all-slot reconstruction.

Controls should qualify exact divisible and nondivisible examples,
zero-polynomial branches, nonunit factors, lex normal form and the
distinction between a-fq and a-fq-rho; altered quotient, remainder or
normal-form claims; full-slot/sink order, degree/type/source/parent guards;
and the actual constant-offset mutation. Controls use small matrices,
not an additional complete 43-dimensional parent reconstruction.

## Independent replay and final gates

Use standard-library Fraction sparse lex long division, independently of
the producer's SymPy routine. Read the seventeen exact parent inputs;
independently rebuild both factors, scalars, all 42 main outputs and the
three mutant outputs. Verify every division identity, normal form,
multiplyback equality, coefficient statistic and acceptance record.
The input factor remains fixed even when a remainder is nonzero.

Bind every actual parsed replay input byte digest and enforce its complete
registered filename set in the finalizer: exactly 67 files, comprising
seventeen parent inputs, forty-two main matrices, three negative matrices
and five metadata files (`stats.json`, `scalars.json`, `acceptance.json`,
`division_metadata.json`, `mutation.json`). The canonical matrix format
retains all row-major slots and reduced rational coefficients. Required
field/coefficient validation is not a general strict-schema certificate.
Original source/parent manifests must remain pure JSON/hash/AST operations
when called by the finalizer.

Only pass after fixed parent/source identity, focused controls, all-slot
divisibility, exact mutation rejection, full independent replay, unchanged
source/history inventories, saved artifact inventory, dual success
terminals and owned-process cleanup all pass. Save complete nonzero
results and candidate decisions before mathematical rejection. A completed
mathematical rejection, including a main candidate failure or an unexpectedly
unrejected mutation, still writes the full independent replay with
`passed=acceptance.accepted and mutation.rejected` before the worker records
failure. A passing finalizer additionally requires `mutation_rejected=true`.
Malformed/tampered records and exceptions may stop reconstruction and retain
the completed prefix rather than claim a complete rejected certificate.
A timeout,
disk/output limit, drift or exception remains partial evidence; it does
not authorize a weaker factor, automatic retry or budget change.

Keep all energy, direction-uniform strong-hyperbolicity, physical, live
admission and scientific-payload flags false. The original physical
threshold 2e-12 is unchanged; this unit accepts only exact polynomial
zeros. Integration steps, native calls, GPU work and historical regrading
remain zero/false. A successful compression is preparation for a separate
original-weight H/Gram batch, not completion of the top-tier GR goal.
