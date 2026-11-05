# Fixed-case12 full58 factorized energy: one bounded candidate

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: preregistered code experiment. Date: 2026-10-14, Asia/Shanghai.
Method: `nr-case12-full58-factorized-energy-controls-v1`.
Verification Status: UNVERIFIED before execution. This is a new additive
candidate under the continuing development goal. Writing this protocol
used no scientific imports, mathematical evaluation or test execution.
All counts are registration, not observed passes. AI-assisted work;
external review and formal runtime verification are separate.

## Scientific question, parent and preserved history

The intended result is a genuine full58 principal energy satisfying
H=H^T, HK=K^T H and I58/14<=H<=C I58 for all real nonzero directions,
with an actual computed rational C and smooth degree-zero H. The registered
evidence is an exact factorized construction and complete formal-basis
identities. This does not register expansion of H's 3364 matrix entries
or claim that their high-degree three-variable products were executed.

Use accepted full58 spectral parent
`tmp/nr-shadow-evidence/nr-k3-case12-full58-spectral-controls-v1-20261014`,
gate SHA
`b1f20875989575329e37267a8ff8eb45e57d761e34063b53df077bb007ee209f`,
worker SHA
`57059edd39496954067c33edb8ff62e9b1432a8f0ce1de2659888105200888a2`.
Copy these thirteen parent files by their actual qualified artifact hash:

    K0.json, Pi.json, Z6.json, shift_residual.json,
    embedding_residual.json, scalars.json, stats.json,
    independent-replay.json, source_bridge.json, parent_provenance.json,
    parent-inputs/K.json,
    parent-inputs/parent-inputs/domain.json,
    parent-inputs/parent-inputs/denominators.json.

They bind actual K0, Pi, the accepted complete odd annihilator and
structural residuals, fixed scalars/domain, source and parent provenance,
and independent replay. Parent success alone is insufficient. Recheck all actual
K0/Pi slots and registered homogeneous degrees, zero residual files and
the fixed SPD/domain identities. Do not rerun the accepted large spectral
products or use old failed energy outputs as scientific inputs.

Freeze 637 source entries: all 630 previous entries plus the new module,
runner, test, this derivation/protocol pair, the full58 spectral result
report and the factorized-energy next-step NOTE. Preserve 21 historical
directories / 14846 files, including all 702 full58 spectral artifacts and
all older failed evidence. Require unchanged exact source and historical
file sets/hashes at entry, exit and finalization. No prior result is
rewritten or regraded by this candidate.

## Sole owned execution and unchanged limits

    D:/python/python.exe -B scripts/run-nr-k3-case12-full58-factorized-energy.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-full58-factorized-energy-controls-v1-20261014

Require this new output directory to be absent. Use the existing owned
Windows Job, one numerical thread and original cleanup, with no automatic
retries. Freeze the focused test registration before the single run.

- 600 seconds total;
- 64 MiB output including the original 2 MiB terminal reserve;
- 8 MiB maximum source snapshot;
- C: at least 3 GiB free;
- E: at least 4 GiB plus 32 MiB free, including reservation of the full
  output budget at startup.

The output limit is a disk limit, not a memory cap. All tests, univariate
construction/division, formal Gram/action algebra, actual K0 coefficient
scan, bounds, negative controls and independent replay occur inside this
same worker. Existing full guards remain at stages, rows and saves;
arithmetic deadline callbacks use the same clock. Finalization is limited
to saved reports/JSON, SHA and pure source/AST/parent manifests, inventories,
dependency identities and cleanup. It performs no mathematical replay.

No budget extension, partial-result splicing, post-stop calculation,
coefficient fitting, alternative factor/weight search or parameter change
is permitted. Resource failure remains a failed incomplete candidate.

## Exact algebra and full output contract

Fix the six original positive distinct c_j, Pi=diag(0_11,I47), O=I-Pi,
K0=K-bPi, r=v^T v and g=v^T h^-1 v>=(5/6)r. The parent proves
K0 product_j(K0^2-c_j*g I)=0. With T=K0/sqrt(g), the relevant monic
polynomial is p(t)=t product_j(t^2-c_j), degree 13. The interpretation uses
positive sqrt(g) symbolically; no floating root is computed.

Regenerate seven Lagrange e_j(y) at 0,c1,...,c6, u_j(t)=e_j(t^2), and six
alpha_j=rem_p(t*u_j). Save 69 complete raw-polynomial/quotient/remainder
records: 49 ordered projector relations, one completeness, six action
definitions, six squared-speed relations, six action-return relations,
and one t*u0 zero-mode relation. Recompute every division and multiplication
back independently with stdlib Fractions. Require proper canonical
remainders and exact zero coefficients; preserve nonzero failures.

The actual operator factors are

    f=(O,E0,E1,...,E6,a1,...,a6),
    Ej=u_j(T)Pi, aj=T Ej=alpha_j(T)Pi.

E0 contains Pi; the separate O term must remain. The right-action coefficient
convention is f_i T=sum_k R_ik f_k. Thus R_(Ej,aj)=1 and R_(aj,Ej)=c_j;
the Pi action is P=diag(0,1,...,1). Keep this orientation when checking
the noncommuting transpose identities.

Use W=diag(1,1,(1/2)x6,(1/(2c_j))x6), s=(1x8,0x6), and eight difference
vectors d_i=epsilon_i-s/(14w_i). Independently form Cgram from
sum_first8 wi*d_i*d_i^T plus all six action diagonal terms. Do not define
Cgram as W minus the desired lower bound. Bind the original paired_energy
formula AST and its exact weights with the explicit G=I58 choice. Its
source file SHA is
`4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b`.
The new producer `scripts/nr_case12_full58_factorized_energy.py` is frozen
at SHA `0c31512044e9a748533146c8feeec1c8efa196310678c51ad9025edd7bbe38b8`.

Save nine complete 14-by-14 formal coefficient matrices H=W,Cgram,
right_action=R,pi_action=P,identity_gram=s*s^T,Hsym,HT,HPi,Gram, and the
complete 8-by-14 shifted_components array. Their 1876 rational slots include
the 784 required-zero slots of

    Hsym=W-W^T,
    HT=W R-R^T W,
    HPi=W P-P^T W,
    Gram=W-s s^T/14-Cgram.

Independently reconstruct every array from its definition. These are
formal coefficients of sum_ik M_ik*f_i^T*f_k, not expanded 58-by-58 entries.
The registered algebraic evaluation proof transfers their zero values to
the actual full58 H, intrinsic and shift symmetrization, and Gram lower
bound. An unmatched operator-action assumption invalidates the transfer.

The new main JSON records are `univariate.json`, `formal.json`,
`bounds.json`, `negatives.json`, `domain_metadata.json`, `acceptance.json`,
`source_bridge.json`, `parent_provenance.json`. Together with thirteen
parent inputs they give exactly 21 actual replay inputs. Bind each file's
parsed bytes by SHA, its full registered shape/order and canonical rational
representation. Do not describe metadata validation as a general strict
schema certification beyond the fields actually checked.

## Actual coefficient bound, domain and controls

From all 3364 qualified K0 slots compute B_ik=sum absolute coefficients and
B=sum_ik B_ik. Save every slot including zeros. From the actual e_j(y)
coefficients compute all seven q_j=sum_k |e_jk|*(B^2/m)^k with m=5/6, then

    C=1+q0^2+(1/2)sum_j q_j^2
         +(B^2/(2m))*sum_j q_j^2/c_j, j=1,...,6.

Save the actual canonical Fraction B, all termwise bases, seven q_j and C;
independent replay recomputes the full chain and requires C>=1/14. No
expected C is preset. Positive g, fixed nonzero node gaps and rational H
prove smoothness; homogeneity transfers the unit-sphere bounds to all
nonzero real directions. The final matrix energy contains Aj^T Aj/g, so
the interpretive square root cancels. Do not label a bound-only record
as energy acceptance without all formal Gram/action identities.

The focused new `scripts/tests/test_nr_case12_full58_factorized_energy.py`
is frozen with 28 functions / 100 explicit instances, SHA
`60a679f4fae57571d4fbb24c4c3911a7b334905b7830e8b1173dbf2ecd2270a8`.
This count is preregistration, not execution evidence. The previous integer
suite is not added to this batch's test count.
Controls must include all six branches, exact divisions and multiplication
back, malformed coefficient/type rejection, O/E0 separation, the direction
of R and transpose products, all eight shifted factors and denominator14,
the actual coefficient-bound arithmetic, source/parent identity, full
array/record coverage and interruption behavior. Bind unique JUnit
identities with zero skipped, failed or errored cases.

The negative record schema is `nr-case12-full58-factorized-negatives-v1`.
For N=[[0,1],[0,0]], actually evaluate N_squared, p(N),
m(N_squared) with m(y)=y*product_j(y-c_j), and N*u0(N). Save the complete
two-by-two rational tables under N,N_squared,odd_result,even_result,
zero_action_result, with actual nonzero counts and the detected Boolean.
The odd and zero-action values must be nonzero even though the square and
even polynomial values are zero. Production and independent replay use
their own exact matrix-polynomial evaluation algorithms.

The actual relation mutation is named `add-one-to-zero-action`. Add 1 to
the saved original `zero-action` polynomial t*u0, divide it by the same p,
and save the resulting polynomial,quotient,remainder,multiplyback and
rejected decision. Require nonzero remainder and zero multiplication-back
residual. The negative is not a changed full58 K or a rerun of the parent
spectral chain. These controls do not replace the candidate's independent
complete 69-relation replay.

## Acceptance and evidence boundary

Require complete source/parent/domain identity, all 69 exact relation
certificates, all 1876 formal slots, all 784 zero residual coefficients,
the actual full K0 coefficient scan and concrete upper bound, both
negatives, registered tests, complete independent replay, dependencies,
source/history preservation, dual successful terminals and cleanup.
Save completed candidates and replay decisions before mathematical
rejection. A resource stop or data exception may retain only a prefix;
record its extent and keep the failure rather than completing it later.

Only a full pass may set full58_principal_energy_validated,
direction_uniform_energy_validated and uniform_strong_hyperbolicity_validated
true for the registered fixed-case12 full58 principal family. The exact
energy_certificate_form string is "factorized Gram with exact polynomial
action and quadratic-form certificates". Keep
expanded_full58_energy_validated=false and
full58_expanded_matrix_residuals_validated=false. No full58 expanded
matrix-slot counts may be inferred from the formal 1876-slot certificate.

Physical/live/payload flags remain false, integration/native/GPU work
remains zero, and the original physical threshold 2e-12 is unchanged;
the algebraic acceptance threshold is exact zero. Low-order/full-frequency
constraints, zero frequency, changing backgrounds, nonlinear evolution,
boundaries, convergence, black holes, AMR, waveforms, external reproduction
and performance remain outside this candidate. The top-level GR goal
remains open after this local certificate.
