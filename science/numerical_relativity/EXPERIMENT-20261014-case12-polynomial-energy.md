# Fixed-case12 full energy and original Gram identity: bounded protocol

## Material Passport

Origin Skill: academic-research-suite / experiment-agent (existing workflow).
Artifact: code experiment protocol. Date: 2026-10-14, Asia/Shanghai.
Method: `nr-case12-polynomial-energy-controls-v1`.
Verification Status: UNVERIFIED before the single owned execution.
The active user-authorized development goal supplies this additive scope.
No new approval or rerun of a prior candidate is part of this protocol.
AI-assisted design; no external reproduction or proof-assistant acceptance.

## Inputs, provenance and unchanged history

Compression parent:
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-compression-controls-v1-20261014`.
Gate SHA-256:
`04e3db7e90ff93ce0c9ba24f81a0cc3d7f3490e80a21b5930b97b95d7edd2fda`.
Worker-result SHA-256:
`fd52af65137038fc8e3910c83a3312bfbb9014be67d9c58d5b412180d7fb50b6`.

Take its fourteen `<name>_quotient.json` files for names
NO,N0,N1,...,N6,M1,...,M6; `scalars.json`; and the domain/denominators
records under five repeated `parent-inputs/` levels. These are seventeen
compression inputs. Independently bind two additional ancestor matrices
to the accepted projector gate
`a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1`:
`parent-inputs/X.json` and `parent-inputs/parent-inputs/Pt.json` in that
projector directory. Their nineteen-entry manifest must distinguish the
two parent roots; they are not all present in the compression directory.
Copy the seventeen compression files under `parent-inputs/` and the two
ancestor matrices as `ancestor-inputs/X.json` and `ancestor-inputs/Pt.json`.

Bind the original paired_energy formula, SCALED_ROWS, six cj constants,
intrinsic J=L+bP relationship and fixed positive metric through the exact
source/ancestor manifests. No K, section, closure, spectral, projector,
action or compression batch is rebuilt.

Freeze 616 source entries: 610 parent entries plus the new module, test,
runner, derivation, this protocol and the compression result report.
Preserve 18 historical directories / 12701 files, including the 758-file
compression parent and every older failure. Current/before/after/snapshot
source inventories and all historical inventories must agree at their
registered checkpoints.

## One command and resource boundary

    D:/python/python.exe -B scripts/run-nr-k3-case12-polynomial-energy.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-polynomial-energy-controls-v1-20261014

The destination must be absent. One attempt; no retry, budget expansion,
fitted energy, discarded zero branches or replacement coercivity constant.

- 600-second owned execution;
- 64 MiB disk output, including 2 MiB terminal reserve;
- 8 MiB source-snapshot maximum;
- C: at least 3 GiB free;
- E: at least 4 GiB plus 32 MiB free, with the full output budget additionally
  reserved at startup;
- unchanged Windows Job ownership/cleanup and one numerical thread.

This is an output limit, not a RAM limit. All tests, matrix/scalar arithmetic,
negative controls, coefficient bounds and independent Fraction replay stay
inside the owned worker. Full guards remain at registered row/stage/save
boundaries; bounded arithmetic with no file writes may use the same
deadline internally. The unchanged supervisor enforces the outer limit.
Finalization checks saved JSON/reports, SHA, pure source/AST/ancestor
manifests, dependencies, inventories and cleanup, without mathematical
reconstruction or coefficient statistics outside the worker.

Record the existing Python environment, SymPy 1.13.3, NumPy 2.2.6 and loaded
runtime file identities. No all-OS/DLL attestation is implied. Compressed
input size and prior timings do not guarantee this larger Gram calculation
will finish within the existing limits.

## Complete construction and saved matrices

Use the exact accepted Nbar/Mbar, X, Pt, r and g. Preserve scalars
r,g,Dbar,etabar,taubar as canonical polynomials, with

    Dbar=r g^3, etabar=r g^2, taubar=r^3 g^6.

Construct diagonal Gt with 1 on SCALED_ROWS=(0,1,2,3,41) and r elsewhere.
Keep all eight weights wi=(1,1,1/2,...,1/2) and the six original positive
speed constants cj. Compute actual Ki=Nbar_i^T Gt Nbar_i and
Tj=Mbar_j^T Gt Mbar_j, then

    Hbar=sum_i wi Ki+sum_j g/(2cj) Tj,
    Fi=Nbar_i-Dbar I43/(14wi).

Before skipping any last-three action multiplication, the producer checks
all slots of Nbar_4..6 and Mbar_4..6 are zero. This is an arithmetic
optimization of zero terms; all six branch identities and eight Fi remain.
The independent route retains all six action terms in its reconstruction.
The producer may group identical diagonal weights 1 and r before multiplying
their accumulated row outer products; this preserves the same full Gram.

The producer may reuse Ki/Tj and form the difference Gram through

    ai=Dbar/(14wi),
    Bi=Ki-ai(Nbar_i^T Gt+Gt Nbar_i)+ai^2 Gt,
    Cgram=sum_i wi Bi+sum_j g/(2cj) Tj.

This expansion must not be replaced by Hbar minus its expected lower bound.
The independent algorithm checks each saved Fi and directly reconstructs
sum_i wi Fi^T Gt Fi plus all six action terms. The last three Fi remain
nonzero and cannot be omitted even though their original projectors vanish.

Save every slot of these fifteen 43-by-43 matrices:

| Matrices | Count | Degree cap |
| --- | ---: | ---: |
| Gt | 1 | 2 |
| F_NO,F_N0,F_N1,...,F_N6 | 8 | 9 |
| Hbar,Cgram,Hsym,Gram | 4 | 20 |
| HL | 1 | 24 |
| HP | 1 | 22 |

The four residuals are

    Hsym=Hbar-Hbar^T,
    HL=Hbar X-X^T Hbar,
    HP=Hbar Pt-Pt^T Hbar,
    Gram=Hbar-(Dbar^2/14)Gt-Cgram.

The 15 main matrices cover 27735 slots. The four residual matrices cover
7396 slots, all required to be zero. The eight Fi cover 14792 slots, not
zero slots. Ki/Tj can remain internal shared products; this does not permit
omitting Hbar, Cgram or any complete residual from saved evidence.

The general shared-product residual formula is S=Hbar-Hbar^T,
U=Hbar X, HL=U-U^T-X^T S, and similarly HP with Pt. Fully test S first;
when zero, the correction is an explicit zero matrix, otherwise compute
X^T S / Pt^T S inside the same registered budget. The order cannot be
changed to S X. This saves a product on the successful symmetric path
while preserving the actual defining residual on a failed path.

Save matrices as they complete, with elapsed stage time, encoded bytes,
term counts, degree and coefficient-character statistics. Keep every
nonzero residual and candidate decision before mathematical rejection.

## Actual uniform bound and domain certificate

From the actual saved Hbar coefficients independently compute every
Bij=sum_alpha|h_ij,alpha|, total B_H=sum_ij Bij, and

    C=B_H/(5/6)^6.

The record schema is `nr-case12-energy-coefficient-bound-v1`, containing
shape, complete ordered entries `[i,j,str(Bij)]`, `total`,
`g_lower='5/6'`, `denominator_power=6`, `upper=str(C)`,
`lower_energy='1/14'`,
`method='entrywise coefficient l1 / g_lower^6'`, and
`consistent_lower_upper=(C>=1/14)`. All rationals are canonical and
calculated, not estimated before execution. Enforce the full coefficient
identity and consistency in independent replay.

For r=1, |v_k|<=1, taubar=g^6 and g>=5/6, so the entrywise coefficient
bound gives ||H||_2<=C. Once the full Gram residual passes, H>=I43/14.
Verify the fixed source/domain r=v^T v, g=v^T h^-1 v, g>=(5/6)r and
taubar=r^3g^6. Positive denominators give a smooth rational H on all real
v!=0, including the unit sphere. A saved `smooth` flag without the bound
formula/domain identities is insufficient. Do not extend these rational
coordinates to physical zero frequency.

Only the combined full matrix, lower-bound, upper-bound, source and domain
certificate can admit a fixed-case12 43-dimensional direction-uniform
energy. HP and HL together also symmetrize the original J=L+bP principal
family. This does not qualify the full 58-state or low-order system.

## True symmetry negative and focused controls

Add the constant 1 to the actual Hbar[0,1]. Save complete delta_Hbar and
mutant_Hsym=(Hbar+delta_Hbar)-(Hbar+delta_Hbar)^T; reconstruct them
independently. Their caps are 0 and 20, respectively. These two 43-by-43
matrices add 3698 slots. When the main
Hsym is zero, the mutant residual has exactly the +1/-1 off-diagonal pair.
On a failed main candidate retain the actual pattern, not an assumed
two-entry witness. The negative is a certificate-matrix perturbation,
not a new physical simulation.

The new test file is `scripts/tests/test_nr_case12_polynomial_energy.py`.
Its frozen static contract is 21 test functions / 39 explicit AST instances,
SHA-256
`3c9d4d4f92ed0c898b622dfba17ea9c585d24296fef520929b6071704acfc510`.
The runner binds those counts and requires all 39 registered unique JUnit
identities without error, failure or skip. These are preregistered static
counts, not execution results or energy evidence.

Small controls must qualify original weights and all eight differences,
absent-branch nonzero Fi, nonunit r/g denominator factors, independent
direct-vs-expanded Gram, the nonsymmetric noncommuting correction order,
true H perturbation, exact coefficient upper bounds, canonical records,
source/ancestor/shape/degree guards and complete sink/failure preservation.
Do not run a second complete 43-dimensional energy calculation in controls.

## Independent reconstruction and gates

The Fraction route rebuilds Gt and Fi from nineteen exact inputs, Hbar
from the original weighted Nbar/Mbar Gram formula, and Cgram directly
from the saved verified Fi. It reproduces all four full residuals,
statistics, coefficient bound, scalars, domain and negative witness.
Every saved matrix coefficient must match. This is not acceptance by a
producer boolean, sampled eigenvalues or a source hash alone.

Independent sparse products may normalize a polynomial by its exact leading
rational coefficient and cache products of the resulting canonical tuples;
restore all extracted scalars in the sum. Gram construction may group equal
normalized diagonal factors and compute the symmetric upper triangle before
copying it below the diagonal. These are exact arithmetic identities, not
numerical approximations or tolerance-based deduplication. The independent
route still constructs the actual eight Fi Gram terms and evaluates both
sides of HL/HP directly, even when the producer uses its safe shortcut.

Bind all actual parsed replay input byte digests and enforce the exact
filename set during finalization: 42 files comprising nineteen source
inputs, fifteen main matrices, two negatives and six metadata files
(`stats.json`, `scalars.json`, `bounds.json`, `domain_metadata.json`,
`acceptance.json`, `mutation.json`). Canonical row-major matrices include
zero slots and reduced rational coefficients. Validate the designated
required fields; do not claim general strict-schema certification.

Pass only with qualified source/ancestor identities, complete controls,
full matrix reconstruction, all 7396 zero residual slots, original Gram
positivity, actual rational uniform bound, smooth positive domain,
real negative rejection, independent replay, unchanged source/history,
artifact inventory, dual success terminals and owned-process cleanup.
Mathematical rejection should first preserve the full candidate and
available completed replay; malformed data or resource interruption may
leave a prefix, which must be reported as partial evidence. No failure
authorizes a retry, revised energy weight or expanded budget.

Successful energy admission is restricted to the registered fixed 43-state
constraint quotient principal family. General backgrounds, full58,
low-order/zero-frequency/nonlinear estimates, boundaries, convergence,
black holes, AMR, waveforms, external reproduction, live admission and
scientific payload writeback remain outside this gate. Keep physical/live/
payload flags false, integration/native/GPU work zero, and the original
physical relative threshold 2e-12 unchanged. This batch accepts only exact
polynomial zeros and does not complete the whole top-tier GR goal.
