# Independent initial B ordering-source audit

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective read-only retained-state analysis
- Origin Date: 2026-10-08
- Verification Status: UNVERIFIED; freeze before real input execution
- Version Label: nr-initial-ordering-source-v1

The previous goal turn completed the lower-domain independent reconstruction and
607 focused tests; it was progress. This audit tests an explicitly narrower
hypothesis in the unresolved low-face mechanism, not a replacement goal.

## Source contract and question

Dumbser et al., Phys. Rev. D 97,084053, DOI10.1103/PhysRevD.97.084053,
[author manuscript](https://ar5iv.labs.arxiv.org/html/1707.09910), Sec.II.2 Eq.(6)-(7)
and the B equation in the Eq.(12) system (12k in local numbering): after moving
the nonconservative term to the RHS, its ordering contribution is
`+s alpha^2 mu h^{ij}(partial_k P_j-partial_j P_k
-h^{nl}(partial_k D_ljn-partial_l D_kjn))`.
The original paper uses constant mu; our declared field-dependent mu=.2chi is
a repository candidate, not covered by that paper's hyperbolicity proof.

For the retained static initial slice, h=I, D=0, beta=b=B=0, s=1. The spatially
varying f product term is zero because b=0. Therefore all initial B rates must
reduce to `alpha^2 (.2chi) (FD4_k P_i-FD4_i P_k)`, with zero imposed on the two
fixed halo layers. This is a prediction for nine B slots, not all58 RHS slots.

Independently evaluate, with r=|x|, a=M/2:
`P_i=M x_i/[r^2(r+a)]`, `alpha=(r-a)/(r+a)`, `chi=[r/(r+a)]^4`.
The closed-form continuum Jacobian is symmetric. FD4 acting on sampled analytic
P need not be curl-free. Use direct weights (+1,-8,+8,-1)/(12h) at offsets
(-2,-1,+1,+2), not the production derivative or initializer, for the prediction.
A second scalar Decimal implementation uses60 digits at the exact125 shared
nodes and rational spacings1/8,1/12,1/16; compare60/80 digits as a precision check.

## Frozen input/coverage and decisions

Read all nine T=0 state/RHS pairs from
`nr-k3-initial-rhs-locality-v1-20261008/receipt.json`, SHA256
015b8b831c7a3b7042c2325279a611bfd943b0cc36abed07f1d1892187e7c9bf.
They are original N17/25/33, upper N21/31/41, both N25/37/49.
Recheck18 input hashes, the old probe/solver source identity and raw format.
Do not produce another trajectory or inject an analytic field into any state.

Require independent analytic initial fields to agree within2e-14; reject evolved
or unsupported states. Compare all nine B slots over the full grid with2e-12
absolute tolerance, including exact-zero halo/diagonal controls. Retain all125
signed core values per slot, native/Decimal errors and antisymmetry errors.
The complete result may be numerically failed while execution is complete.
Record per-slot and combined three-grid observed orders as exploratory only;
zero/below2e-12 norms have no measured order. Do not regrade old convergence.

Synthetic tests cover polynomial/Hessian identities, orientation, coefficient
scaling, high-precision agreement, all nine slots, unsupported inputs, missing
or duplicate coverage and deliberate RHS/source errors. They precede execution.

## Resources, provenance and limitations

Use a fresh E child of `tmp/nr-shadow-evidence`, 600s wall cap,16MiB output cap
and8MiB headroom. C reserve3GiB; E reserve4GiB+32MiB plus headroom. No install,
deletion, art changes, parent-repository checks, live writes or promotions.
Freeze the230 lower-study sources plus this protocol, oracle, runner and their
two test files; preserve snapshots. Bind the lower final receipt
7d8d34bc4092f3cfd523e2e04797c77803904d7a698784873aeef3ba6fad6c52 and audit
ee9afb66b19fe5a473cc600e8121ed4f6e30d915bed6bee9002f055ca16cfc54.
Retain original/upper/both/lower study failures and all eight false admission flags.

Entry: `D:\python\python.exe -B scripts/audit-nr-k3-initial-ordering-source.py`
with a fresh `--output-directory`. Run the same deterministic analysis in a
second process/fresh directory and compare scientific payloads exactly, excluding
elapsed time and artifact locations. Do not retry a crashed experiment silently.

If the source prediction fails, investigate formula/index/sign discrepancies.
If it agrees, this rules against an incorrect initial B ordering-source
implementation on these states, not against later nonlinear or boundary errors.
Do not delete ordering terms or force discrete curl zero to make gates pass.
Next move to a discriminating boundary/propagation contract, not another broad
domain matrix. This source audit is the first of at most2–3 new diagnostic
batches before an explicit gauge/boundary route decision.
