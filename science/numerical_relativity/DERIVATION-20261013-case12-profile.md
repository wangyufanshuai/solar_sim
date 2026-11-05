# Constant-profile coefficient source and case12 Hermite candidate

Material Passport: academic-research-suite / experiment-agent; 2026-10-13;
AI-assisted independent algebra, not expert signoff. Status at creation:
UNVALIDATED_CANDIDATE. No existing derivation, source, threshold or receipt edited.

## Scope and sources

The principal terms are traced to Dumbser et al.,
[FO-CCZ4, arXiv:1707.09910v2](https://arxiv.org/pdf/1707.09910v2),
Eqs.12e–m and Appendix A.2 (A6–A10 in this PDF). The earlier HTML audit's
equation numbers are not the PDF labels. Primary PDF retrieved 2026-10-13.
It supplies the formulation, not validation of this implementation.
Our sign convention is q_t=A(n) partial_n(q)+S, opposite to the paper's B.
Default profile only: advective 1+log, c=e=s=1, f=3 alpha chi, mu=chi/5.
No material/curved-time-evolution terms are qualified by this batch.

## Independently derived coefficient contract

`nr_profile_exact_coefficients.py` imports no production geometry, RHS,
principal-symbol or constraint-reduction routine. h, inverse u, alpha, chi,
beta and ray v are rational. A rational adjugate computes u, with exact
symmetry, positive-leading-minor and det(h)=1 checks. Floats are rejected as
design parameters. Normalisation is postponed until after matrix assembly:
n=v/sqrt(v.v). Consequently the algebraic annihilator remains rational.

Use a_ij for trace-free-extrinsic-curvature slots, T=u^ij a_ij, and
S(k,l;i)=(v_k B_l^i+v_l B_k^i)/2. Summation contracts all ordered pairs,
including both off-diagonal contributions. For the Ricci-plus-Z combination:

```
X_ij = -u^kl v_k D_lij +(v_i P_j+v_j P_i)/2
       +h_ij u^kl v_k P_l +(h_jl v_i Gamma^l+h_il v_j Gamma^l)/2
Y_ij = X_ij -(v_i A_j+v_j A_i)/2
```

A separate route forms the linearised metric Hessian
H_stij=v_s D_tij+v_t D_sij, subtracts h_ij(v_s P_t+v_t P_s), computes Ricci
by its four Hessian contractions, then adds Z through the contracted conformal
connection derivative. Exact agreement of these two routes is required for
every one of 58 basis slots. Other rates are shared between these routes:
this is NOT two independent complete theories or an external reproduction.

The curvature rates are alpha chi times the trace-free Y, tr(Y), and tr(X)/2.
The Gamma/b rate has the raised-ray terms alpha u^ik v_k(-4K/3+2Theta+2T),
the contracted S, and its one-third trace gradient. A_k has -2v_k(K-2Theta+T).
B_k^i retains f v_k b^i and alpha^2 mu times BOTH ordering curls with their
own inverse-metric contractions. D and P retain alpha, metric and trace terms.
Every PDE rate, and ONLY those 47 rates, receives (beta.v) times its own slot.
The first 11 rows AND columns are exactly zero. These independently written
component contractions are compared with the frozen solver matrix, not used
to replace it.

## Node source and case12 parameters

Let g=(v^T u v)/(v.v). The six squared positive branches are
alpha^2 chi g/20, alpha^2 chi g/10, alpha^2 chi g, 2 alpha chi g,
3 alpha chi g, 4 alpha chi g. This order requires 0<alpha<2 and chi>0.
There is no uniform-gap or strong-hyperbolicity claim over that open domain.
The function accepts only this default profile, not arbitrary gauge constants.

The case12 fixture is alpha=17/20, chi=18/25, beta=(3/100,-1/25,1/20),
L=((1,0,0),(3/25,1,0),(-2/25,3/50,1)), h=L L^T, v=(1,2,-1).
Thus v.v=6, beta.v=-1/10, f=459/250, mu=18/125. The fixture's actual
binary64 log/exp, matrix multiplication and normalisation remain a separate
input source. Decimal50/70 roots are computed from exact fractions, not fitted
eigenvalues. Their differences from original binary64 roots are saved; bit
identity with the design is not presumed. Neither input roots nor matrices
are overwritten. The frozen acceptance threshold is unchanged at 2e-12.

For the rational intrinsic 47 block K_v, check exactly:
K_v product_j[K_v^2-(v.v)*s_j*I]=0. This is one constant-background witness;
it neither proves a uniform bound nor qualifies the 43-constraint reduction.

## Candidate and perturbation contract

The unchanged v3 Hermite evaluator receives actual intrinsic float64 matrices
and explicit high-precision design roots. The additive adapter returns new
projector/energy arrays while keeping ten input arrays unchanged. All original
43/58 gates, ranks, ODE separation, state mapping, energy bounds and shift
identities still apply against ORIGINAL float64 roots and speeds.

For each sign, perturb every originally nonzero entry of the ACTUAL shifted
47 block by sign*abs(spacing(entry)), keeping exact zeros zero. Only then
subtract the unchanged beta_n*I47 and rebuild all projectors. Check against
the perturbed shifted matrix and unchanged shifted speeds, then rebuild again
for bitwise replay. Never subtract beta_n*I58 or reuse nominal projectors.
These are rounding controls, not new physical scenarios.

Remaining limitations: 43-reduction theory not rederived; nonlinear sources,
nonconstant backgrounds, physical boundaries, lapse collapse, time/space/
constraint convergence, black-hole physics and GPU performance unqualified.
