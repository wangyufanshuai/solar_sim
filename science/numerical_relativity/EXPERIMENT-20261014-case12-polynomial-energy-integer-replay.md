# Fixed-case12 energy v2: single bounded integer-replay candidate

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: code experiment preregistration. Date: 2026-10-14, Asia/Shanghai.
Method: `nr-case12-polynomial-energy-controls-v2`.
Verification Status: UNVERIFIED new arithmetic candidate before execution.
The continuing development goal authorizes this new additive design.
The old energy batch remains failed; this protocol does not resume its
timer, retry it automatically or regrade its production outputs.

## Frozen failure, accepted mathematical inputs and source closure

Keep the complete v1 directory
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-energy-controls-v1-20261014`
unchanged. Its failed terminal SHA-256 is
`f86f9a4f8d38bdb46cbe2e5e86ee75ae4e58d94a4b6ea0649c9986eede9f742e`.
The outside receipt
`science/numerical_relativity/RECEIPT-20261014-case12-polynomial-energy-post-stop-audit.json`
has SHA-256
`d200b35730e1a7d8e976ce45f81f2eeb4d29f25eed4f8b8b6b078ffbcc82e16d`.
It binds 710 stopped files / 48195623 bytes and explicitly does not qualify
the old run. Keep its four missing completion records missing. The receipt
is an integrity reference, not a successful energy parent certificate.

The accepted mathematical parent is still compression, gate
`04e3db7e90ff93ce0c9ba24f81a0cc3d7f3490e80a21b5930b97b95d7edd2fda`,
worker
`fd52af65137038fc8e3910c83a3312bfbb9014be67d9c58d5b412180d7fb50b6`.
Copy the same seventeen inputs: fourteen quotient matrices, scalars, and
domain/denominators under five `parent-inputs/` levels. Separately bind X
and Pt to projector ancestor gate
`a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1`
at `parent-inputs/X.json` and `parent-inputs/parent-inputs/Pt.json` in that
ancestor directory. The new output copies these two as `ancestor-inputs/`.
No v1 energy matrix, incomplete Gram accumulator or candidate upper bound
is a scientific input to v2.

Freeze 623 source entries: all 616 old energy sources plus the new integer
arithmetic module, its new tests, v2 runner, this derivation/protocol pair,
v1 result report and v1 post-stop receipt. Preserve 19 historical directories
/ 13411 files, including all 710 failed energy artifacts. Require exact
file sets and SHA identities at entry, exit and finalization. The failed
batch's receipt-backed inventory must not be treated as the missing
successful `artifact_hashes` in its terminal.

## Unique execution and unchanged resources

    D:/python/python.exe -B scripts/run-nr-k3-case12-polynomial-energy-v2.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-polynomial-energy-controls-v2-20261014

Require an absent output directory. Execute one fresh complete production
construction and independent replay inside one owned process budget.
No automatic retry, partial-result splicing, supplementary calculation,
weaker proof, factor/weight change, or split timing after a stop.

- 600 seconds total under the existing owned controller;
- 64 MiB disk output including a 2 MiB terminal reserve;
- 8 MiB maximum source snapshot;
- C: at least 3 GiB free;
- E: at least 4 GiB plus 32 MiB free, with the full output budget also
  reserved at startup;
- unchanged Windows Job cleanup and one numerical thread.

The disk-output cap is not a RAM cap. Python integers have no fixed
arithmetic overflow, but large LCMs or products can still exhaust time or
resources. No speedup or budget fit is claimed before measurement.

All tests, producer work, LCM/GCD clearing, integer convolution, Fraction
restoration, matrix/Gram arithmetic, coefficient bounds and negative
controls run inside this same worker. Full guards remain at rows, stages
and saves. The new kernel calls the same deadline at boundaries and every
4096 exponent pairs. Do not add a second clock or extend the outer limit.
Finalization only reads saved reports/JSON, hashes and pure source/AST/
ancestor manifests and checks inventories/dependencies/cleanup. It performs
no polynomial or matrix calculation after the budget.

## Fixed producer and new exact replay arithmetic

The producer remains `scripts/nr_case12_polynomial_energy.py`, SHA-256
`41e703c4c9f3c0186c64c4d847272f68c2d029ffe3e87fb3ac84ed6936eada6e`.
Its 15 main matrices and 2 negatives must be produced afresh. The frozen
v1 runner/source files are not edited.

The new `scripts/nr_integer_polynomial_replay.py` supplies
`multiply_polynomials` and `exact_add_product`; its frozen SHA-256 is
`5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f`.
Per input polynomial, clear
canonical coefficient denominators by their positive LCM, extract integer
content by a positive GCD, convolve all integer coefficient pairs, then
restore each nonzero output monomial with an exact Fraction. Upper-level
scalar and matrix sums still use Fractions; this is not a whole-matrix
integer-only representation.

The new runner explicitly calls the new functions at cache misses and
product-accumulation sites. Do not globally monkeypatch frozen V or the
producer. The integer module has no scientific-library dependency or
hidden cache. Preserve the canonical QQ domain, with strict Fraction and
nonnegative integer exponent triples and no arbitrary bit/exponent limit.
`exact_add_product` rejects operand/target aliasing and commits only after
the complete valid prospective result is formed.

Keep the original direct independent Fi Gram reconstruction and both-sided
HL/HP products. Scientific-library-free integer arithmetic does not imply
independent Python semantics, a separate GR solver, external replication
or proof-assistant verification. Bind the actual new arithmetic module
path and SHA in replay `arithmetic_source`; the finalizer checks that
source identity without rerunning arithmetic.

## Complete output and original mathematical gates

The scientific construction and degree caps are unchanged:

| Matrices | Count | Degree cap |
| --- | ---: | ---: |
| Gt | 1 | 2 |
| F_NO,F_N0,F_N1,...,F_N6 | 8 | 9 |
| Hbar,Cgram,Hsym,Gram | 4 | 20 |
| HL | 1 | 24 |
| HP | 1 | 22 |
| delta_Hbar | 1 negative | 0 |
| mutant_Hsym | 1 negative | 20 |

Fifteen main matrices cover 27735 slots; Hsym/HL/HP/Gram contain 7396
residual slots required zero. The two negatives add 3698 slots. Keep all
eight Fi and six paired branches, including the three absent branches'
nonzero Gram differences. Do not replace Cgram with Hbar minus the desired
lower bound. Independently construct Fi^T Gt Fi from verified actual Fi.

Retain Dbar=rg^3, etabar=rg^2, taubar=r^3g^6 and action weight g/(2cj).
Verify full Hbar-Hbar^T, Hbar X-X^T Hbar, Hbar Pt-Pt^T Hbar, and
Hbar-Dbar^2 Gt/14-Cgram, along with the real Hbar[0,1]+1 negative.
Recompute all coefficient statistics and the bound record from the newly
saved Hbar. In particular B_H is the sum of all absolute coefficients,
C=B_H/(5/6)^6, lower energy is 1/14, and C>=1/14 is required. The fixed
source/domain r>0 and g>=(5/6)r establishes smoothness of the same rational
formula on real v!=0. Original source-bridge and independent-domain checks
remain mandatory.

The 42 mathematical replay inputs are unchanged: nineteen qualified source
inputs, fifteen main matrices, two negatives and six records `stats.json`,
`scalars.json`, `bounds.json`, `domain_metadata.json`, `acceptance.json`,
`mutation.json`. Bind the bytes actually parsed, enforce this complete set
and preserve explicit zero slots and canonical rational coefficients. The
arithmetic module is bound through sources/`arithmetic_source`, not added
as a forty-third mathematical JSON input.

## Focused controls and acceptance

Rerun the unchanged 21-function / 39-instance energy suite within this new
owned batch; its prior v1 pass is not reused as a new execution. Its SHA-256
is `3c9d4d4f92ed0c898b622dfba17ea9c585d24296fef520929b6071704acfc510`.
Also run `scripts/tests/test_nr_integer_polynomial_replay.py` under its
frozen 21-function / 73-instance registration, SHA-256
`228da96b19e86f0f251751e2d76161cb58feb9a587aca201539a7d0e5fd20548`.
The registered total is 42 functions / 112 explicit instances, with the
two file contracts `(21,39)` and `(21,73)` kept separate. Bind unique JUnit
identities to both files, with no skips, errors or failures. These are
preregistered static counts, not execution results.

New controls must compare against small direct Fraction convolution and
qualify mixed/co-prime denominators, nontrivial integer content, negative
signs, zero polynomials, exact cancellation, all exponent cross terms,
nonunit scalar accumulation, malformed coefficient/exponent rejection,
no-alias/atomic failure behavior and inner guard interruption. Include
small rectangular products/weighted Gram and the actual v2 call wiring,
so a correct but unused integer helper does not qualify the new replay.
The 65-by-65 monomial-pair control crosses the 4096-product callback
boundary with 4225 pairs and an explicit 129-coefficient triangular oracle.
No complete 43-dimensional pre-run or separate performance benchmark is
authorized by these controls.

Pass only after both control suites, full fresh production, independent
reconstruction of every main/negative matrix, all original energy/Gram/
bound/domain requirements, both ancestor identities, unchanged old failed
artifacts, source snapshots, dependencies, dual success terminals and
owned-process cleanup all pass. Save complete candidates and completed
replay decisions before mathematical rejection. An exception, mismatch
or resource stop may leave a prefix; report its actual extent and keep
the failed terminal, never a stitched success.

Only the new successful terminal could qualify the fixed-case12 43-state
principal quotient energy; v1 remains failed regardless of v2. Full58,
low-order/zero-frequency/nonlinear estimates, boundaries, convergence,
black holes, AMR, waveforms, external reproduction, live admission and
scientific payload writeback remain separate. Keep physical/live/payload
false, integration/native/GPU work zero and the original physical threshold
2e-12 unchanged. Arithmetic accepts exact zero only. This candidate does
not by itself complete the overall top-tier GR goal.
