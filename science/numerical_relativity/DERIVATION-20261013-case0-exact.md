## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: case-0 exact coefficient derivation, before execution
- Origin Date: 2026-10-13
- Verification Status: UNVERIFIED before the registered batch
- Version Label: case0-rational-principal-v1

## Scope, source and convention

Only the original case 0: h=I, alpha=chi=1, beta=0, normal=(1,0,0),
f=3, mu=1/5, c=e=s=kappa3=1. Use the existing state ordering
`h[6], ln(alpha), beta[3], ln(phi), a[6], K, Theta, GammaHat[3], b[3], A[3], B[9], D[18], P[3]`.
Symmetric pairs are `(00,01,02,11,12,22)`; B is derivative-index first;
D has derivative-index first and its last two indices symmetric.

Primary reference: [Dumbser et al., arXiv:1707.09910v2](https://arxiv.org/pdf/1707.09910v2),
Eq. (12e-m) and (16-28). The accessible PDF identifies itself as v2; earlier
project v3 HTML links were not retrievable in this turn. No old reference is
silently rewritten. The project's state-dependent f and mu are not a theorem
from the paper: at this particular background only their fixed values enter
the principal matrix; products with the zero background b vanish.

Our K_matrix is the **RHS** derivative coefficient:
`partial_t delta q = K_matrix partial_x delta q + lower-order terms`.
It has the opposite sign to the paper's left-hand-side A_x convention.
The scalar curvature-trace variable K below is not K_matrix.
No reduction, trace or determinant constraint is imposed on perturbations.
Purely algebraic damping/relaxation terms are excluded from a principal matrix.
All eleven metric/gauge rows and columns remain zero.

## Independently simplified linear principal equations

Indices run 0..2. Let d_i = delta_(i0) partial_x, delta_ij be the identity,
T=sum_i a_ii, and sym(d_i V_j)=(d_i V_j+d_j V_i)/2.
Let

\[
X_{ij}=-\sum_k d_kD_{kij}+\tfrac12(d_iP_j+d_jP_i)
+\delta_{ij}\sum_kd_kP_k+\tfrac12(d_i\widehat\Gamma_j+d_j\widehat\Gamma_i),
\quad Y_{ij}=X_{ij}-\tfrac12(d_iA_j+d_jA_i).
\]

The principal rates are

\[
\dot a_{ij}=Y_{ij}-\delta_{ij}\operatorname{tr}Y/3,
\quad \dot K=\operatorname{tr}Y,
\quad \dot\Theta=\operatorname{tr}X/2,
\]

\[
\dot{\widehat\Gamma}_i=\dot b_i=
-\tfrac43d_iK+2d_i\Theta+2d_iT
+\sum_k d_kB_k{}^i+\tfrac16\sum_l(d_iB_l{}^l+d_lB_i{}^l),
\quad \dot A_k=-2d_kK+4d_k\Theta-2d_kT,
\]

\[
\dot B_k{}^i=3d_kb_i+\tfrac15\left[d_kP_i-d_iP_k
-\sum_l(d_kD_{lil}-d_lD_{kil})\right],
\]

\[
\dot D_{kij}=\tfrac14(d_kB_j{}^i+d_jB_k{}^i+d_kB_i{}^j+d_iB_k{}^j)
-\tfrac16\delta_{ij}\sum_l(d_kB_l{}^l+d_lB_k{}^l)
-d_ka_{ij}+\tfrac13\delta_{ij}d_kT,
\]

\[
\dot P_k=\tfrac13(d_kK+d_kT)-\tfrac16\sum_l(d_kB_l{}^l+d_lB_k{}^l).
\]

These formulas are implemented with integer/Fraction operations, without
importing the existing RHS, geometry, reduction code or saved matrices.

## Independent geometry route for X

Define the formal conformal and physical metric Hessians

\[
H_{stij}=d_sD_{tij}+d_tD_{sij},\qquad
G_{stij}=H_{stij}-(d_sP_t+d_tP_s)\delta_{ij}.
\]

Compute the linear Ricci tensor directly from G:

\[
R_{ij}=\tfrac12\sum_k(G_{kikj}+G_{kjki}-G_{kkij}-G_{ijkk}),
\quad C_{si}=\sum_j(H_{sjij}-H_{sijj}/2).
\]

Then calculate
`X_ij = R_ij + (d_i GammaHat_j + d_j GammaHat_i - C_ij - C_ji)/2`.
Require exact rational equality with the simplified X for every one of the 58
derivative-slot basis vectors. The two routes share the remaining explicit
principal equations, not two independent implementations of the entire theory.

## Exact spectral compatibility check

For the independently generated rational 47x47 block Q, check exactly
`Q product_s(Q^2-s I)=0`, with s=(1/20,1/10,1,2,3,4).
Evaluate the same polynomial on Fraction.from_float(saved K_matrix) without
rounding or rational reconstruction. Save both results and every nonzero
coefficient difference against Q. Compare the saved-matrix polynomial with
the prior Decimal70 analytical-node diagnostic, tolerance 1e-50 for this
arithmetic cross-check only. The original physical threshold stays 2e-12.

Entrywise agreement near machine precision and exact compatibility of Q would
support a coefficient-rounding explanation at this one background. It does not
prove that the general nonlinear assembly or every parameter/direction is
correct. Never replace the saved input with Q to make the v2 gate pass.
