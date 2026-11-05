# Independent leading43 constraint source: case12

Material Passport: academic-research-suite / experiment-agent, 2026-10-13.
AI-assisted algebraic derivation; not external expert review.
Status at creation: UNVALIDATED_CANDIDATE. The separate experiment terminal,
not this document, must establish whether its implementation passes.

## Scope, dependency and primary sources

This is an independent construction relative to the production 43-variable
subsidiary symbol and Laurent reduction. It does NOT import those routines,
fit their entries, fit eigenvalues or substitute a candidate matrix. It DOES
reuse the separately audited exact58 FO-CCZ4 source and elementary rational
helpers from `scripts/nr_profile_exact_coefficients.py`. Thus it is not a
second independent implementation of the entire nonlinear theory.

The 58 principal equations are sourced to Dumbser et al.,
[FO-CCZ4, arXiv:1707.09910v2](https://arxiv.org/pdf/1707.09910v2),
Eqs.12e-m and Appendix A.2, with the sign/profile qualifications in the frozen
`DERIVATION-20261013-case12-profile.md`. These project coordinates and their
43-dimensional quotient are our derivation, not a claim attributed to that paper.

Gundlach and Martin-Garcia,
[Hyperbolicity of second-order in space systems, Sections V-VI](https://arxiv.org/html/gr-qc/0506037v1)
([DOI](https://doi.org/10.1088/0264-9381/23/16/S06)), discuss the constraint
intertwining relation and a full-row-rank hypothesis. Their hyperbolicity
criteria also require directional regularity; one fixed matrix is insufficient.
We use only the finite-dimensional quotient argument below. This is NOT an
application of their complete theorem to our nonlinear/reduced system.
Primary HTML and arXiv metadata checked 2026-10-13; no exhaustive literature,
retraction or external-review audit is claimed.

## Coordinates and leading map, derived before numerical comparison

Use the unchanged rational case12 background: alpha=17/20, chi=18/25,
beta=(3/100,-1/25,1/20), h=L L^T with
L=((1,0,0),(3/25,1,0),(-2/25,3/50,1)), u=h^-1.
Let v=(1,2,-1), r=v.v=6, s=sqrt(r), n=v/s, z=i*rho, rho>0.
Summation includes both symmetric off-diagonal entries. Spatial derivative
indices are first on B_k^i and D_kij. The convention is q_t=A(n) partial_n q+S.

State58 order: h(6), ln(alpha), beta(3), ln(phi), a(6), K, Theta,
Gamma(3), b(3), A(3), B(9), D(18), P(3). Here chi=phi^2 and tau=u^ij a_ij.
Constraint43 order: H, M(3), Theta, Z(3), rA(3), rB(9), rD(18), rP(3), d, tau.
Definition defects are

```
rA_k   = A_k - z n_k delta ln(alpha)
rB_k^i = B_k^i - z n_k delta beta^i
rD_kij = D_kij - (z/2) n_k delta h_ij
rP_k   = P_k - z n_k delta ln(phi)
d      = u^ij delta h_ij
```

The physical constraints give

```
H = z^2 chi [(u n)^i (u n)^j delta h_ij
              - (n.u.n) d + 4 (n.u.n) delta ln(phi)]
M_i = z [(u n)^j a_ji - n_i(tau + 2 K/3)]
Z_i = [h_ij Gamma^j - z((u n)^j delta h_ij - n_i d/2)]/2.
```

The formal bridge adds
z chi [2 (u n)^l u^ij (rD_i l j-rD_l i j)+4 (u n)^k rP_k] to H
and subtracts C_i(rD)/2 from Z, where
C_i(D)=u^jl(2 D_j i l-D_i j l). The base-metric/conformal terms cancel
algebraically in these two rows; no auxiliary defect is assumed zero.

The derivative-aware transformation divides H/M by z, applies
Pt+Pl/z to each auxiliary derivative index, and replaces the determinant row
by d_star=z d+2 n^k u^ij rD_kij. Here Pl=n n^T, Pt=I-Pl are COORDINATE
projectors, not metric-normal projectors. Its z^0 state-map coefficient D0 is:

```
(D0 q)_H   = chi [2 (u n)^l u^ij(D_i l j-D_l i j)+4 (u n)^k P_k]
(D0 q)_Mi  = (u n)^j a_ji - n_i(tau+2 K/3)
(D0 q)_Theta = Theta
(D0 q)_Zi  = [h_ij Gamma^j-C_i(D)]/2
(D0 q)_rAk = Pt_kl A_l - n_k delta ln(alpha)
(D0 q)_rBk^i = Pt_kl B_l^i - n_k delta beta^i
(D0 q)_rDkij = Pt_kl D_lij - n_k delta h_ij/2
(D0 q)_rPk = Pt_kl P_l - n_k delta ln(phi)
(D0 q)_dstar = 2 n^k u^ij D_kij
(D0 q)_tau = u^ij a_ij.
```

The determinant compensation is essential; it is not projected away.
This direct tensor formula is implemented independently of production bridge,
Fourier sampling and Laurent coefficient multiplication. Full equivalence of
all lower-order/frequency coefficients is NOT checked in this batch.

## Exact rational quotient; no floating pseudoinverse

Let S multiply rows H, M1-M3 and d_star by s, and let B multiply the first
eleven state coordinates by s. Then Dhat=S D0 B is rational: substitute v
for n in H/M/d_star and in auxiliary base-field terms, retaining
Pt=I-v v^T/r. Let Kv be the independent58 principal operator on ray v.
Its first eleven rows and columns vanish, so B^-1 Kv B=Kv.

For the reduced43 coefficient A43(n), define Khat=s S A43(n) S^-1.
The principal intertwining equation becomes

```
Khat Dhat = Dhat Kv.
```

Exact Gauss-Jordan elimination with leftmost nonzero column pivots constructs
a right inverse J. Rank43 and Dhat J=I43 are mandatory. Construct
Khat=Dhat Kv J, then verify Khat Dhat=Dhat Kv on ALL 58 columns exactly.
The latter is an independent kernel-invariance condition: a right inverse
alone would not establish closure. If it fails, there is no accepted quotient.

With full row rank, any two solutions K1,K2 have
(K1-K2)Dhat=0 and hence K1-K2=0 after multiplication by J. As an additional
implementation control, reverse the pivot-column order to obtain a distinct
right inverse and require an identical Khat. Repeat the original construction
within the same batch for deterministic replay. No tolerance enters elimination.

## ODE separation, shifts and conversion

The rational O43 has vv^T/r on each auxiliary derivative-index block and
zeros elsewhere. Require O43^2=O43, trace(O43)=11, O43 Dhat=Dhat O58,
O43 Khat=Khat O43=0, with O58=diag(I11,0). Remove shift only on the PDE space:
Khat_intrinsic=Khat-(beta.v)(I43-O43). Also check its all58-column intertwining
and exact polynomial annihilation with the frozen six squared speed branches.
These are local rational witnesses, not uniform energy/boundary estimates.

Let ri=1 on the five S-scaled rows and zero elsewhere; bj=1 on the first
eleven base columns. Undo the similarity and direction scaling explicitly:

```
A43(n)_ij = Khat_ij * s^(rj-ri-1)
D0_ij     = Dhat_ij * s^(-ri-bj).
```

Only powers 0,-1,-2 occur. Use 1, 1/sqrt(r), 1/r at Decimal50 and70.
Compare the ORIGINAL saved binary64 principal, intrinsic, leading and ODE
arrays; also recheck the main58 binding. Keep per-entry signed differences,
including ideal-zero entries. Both precisions must round to identical design
arrays. No saved array, original node, projector, threshold or result is changed.

## What this cannot conclude

Passing means only the specified case12 principal coefficients and leading
map agree with this independent algebraic route. The route still shares the
exact58 theory source, and its map uses the chosen physical/formal coordinate
contract. It does not derive the independent nonlinear43 subsidiary PDE,
explain all projector sensitivity, establish a uniform directional symmetrizer,
control rho=0, validate boundaries, prove nonlinear stability, or qualify
convergence, black-hole evolutions, full66, AMR, GPU or live admission.
