# Case12: full-symbol reduction and lower-order energy candidate

## Material Passport

- Origin Skill: academic-research-suite, source verification / experiment-agent;
  python-testing-patterns for executable controls.
- Origin Date: 2026-10-13.
- Verification Status: UNVERIFIED candidate derivation and implementation.
- Version Label: case12_lower_energy_v1.
- AI-assisted, no external mathematical referee or physical qualification.

The previously passed full-symbol batch proved its own fixed-background
polynomial identity. It did not test this new energy construction. No numbers
from an unexecuted candidate are presented here as observed results.

## Problem and coordinates

Keep the exact case12 background/profile and all58/43 variable orderings in
`DERIVATION-20261013-case12-full-symbol.md`. Write v=(1,2,-1), r=v.v=6,
s=sqrt(r), n=v/s and z=i*rho/s. The rational physical constraint map is
C(z)=C0+z C1+z^2 C2; the checked subsidiary symbol is
B(z)=B0+z B1+z^2 B2. Main evolution is J+z Kv. Recheck the complete exact
identity C(z)(J+z Kv)=B(z)C(z) without discarding powers.

The goal of THIS candidate is a frequency-independent growth upper bound for
ONE fixed ray in an explicitly frequency-weighted norm. It is not a proof of
strong hyperbolicity over all directions, a common symmetrizer, nonlinear
stability, dissipative boundaries, constraint convergence or live admission.

## Rational derivative-aware transform

Let O be vv^T/r on each auxiliary-definition group and zero otherwise.
Let Pperp be the complementary transverse auxiliary projector. Define

- X=O+I_HM (H and all three M coordinates);
- Y=e_d e_d^T (coordinate41);
- V=Pperp+I_Theta,Z,tau;
- t_v rD=2 v^k u^{ij} rD_kij, with symmetric off-diagonals counted twice.

Use the complete Laurent factors

    Wv(z)   = X/z + V + e_d t_v + r z Y
    Wvi(z)  = z X + V - e_d t_v/r + Y/(r z).

The compensating determinant row is r z d+t_v rD=2 v^k u^{ij}D_kij;
the base-metric derivative cancels exactly. Both products Wv Wvi and Wvi Wv
must equal I coefficient by coefficient. These factors are not evaluated at0.

The independent physical/formal bridge U(z)=I+U0_delta+z U1 has only:

    (U0_delta c)_Zi = -u^{jl}(2 rD_jil-rD_ijl)/2
    (U1 c)_H = chi [2 (u v)^l u^{ij}(rD_ilj-rD_lij)+4 (u v)^k rP_k].

All other correction rows vanish. Its inverse is I-U0_delta-z U1;
verify both inverse products, rather than assume nilpotence in code.
Set T=Wv U, Ti=Ui Wvi. Retain EVERY coefficient of T B Ti and T C,
including explicit zeros. The candidate requires:

1. Both inverse identities are exact.
2. T C has no positive powers and its constant coefficient is the independently
   derived Dhat from `nr_constraint_exact_coefficients.leading`.
3. T B Ti has no powers above1 and its degree1 coefficient is the unique
   exact quotient Ahat defined by Dhat Kv=Ahat Dhat.

If any condition fails, preserve the whole nonzero relation and reject this
candidate. In particular, negative powers are NOT discarded or assumed zero.
This Wv is not a blind scalar multiple of the old unit-normal transform;
its leading quotient is checked independently.

## Exact energy without irrational spectral coefficients

Let K=Ahat-(beta.v)(I-O), P=I-O. The six prescribed positive squared speeds
in rational ray coordinates are a_j^2=r times the existing analytical
unit-normal squared speeds; they are not fitted to the matrix. Use the
square-polynomial spectral pair projectors

    E_j = product_{t in {0,a_1^2,...,a_6^2}, t != a_j^2}
          (K^2-t P)/(a_j^2-t), acting initially on P;
    E_0 = P-sum_j E_j.

Verify all products among O,E_0,E_1,...,E_6, K E_0=0 and
K^2 E_j=a_j^2 E_j exactly. Empty characteristic branches are allowed and
retained. On case12 the registered ranks are O:11, E_0:12, pairs:8,4,8,0,0,0.
Repeated/colliding squared speeds or a Jordan remainder fail; no rank repair.

S43 is diagonal s on H,M,d and1 elsewhere. To keep the old unit-normal
Euclidean energy convention, use G=S43^-T S43^-1: diagonal1/r on those five
coordinates and1 elsewhere. Construct the rational matrix

    Hhat = O^T G O + E_0^T G E_0
           + (1/2) sum_j [E_j^T G E_j + (K E_j)^T G (K E_j)/a_j^2].

This equals the sum of the thirteen individual real-speed projector Gram
terms plus the ODE Gram term, without needing square roots in the calculation.
Require exact Hhat=Hhat^T, Hhat K=K^T Hhat and Hhat P=P^T Hhat;
therefore Hhat Ahat=Ahat^T Hhat. Approximate symmetry of a binary64 matrix
does not substitute for this exact gate at unbounded frequency.

For an explicit lower-bound witness, set F=(O,E_0,E_1,...,E_6),
w=(1,1,1/2,...,1/2), N=sum_i 1/w_i=14. Then

    Hhat-G/14 = sum_i w_i (F_i-I/(14 w_i))^T G (F_i-I/(14 w_i))
                + sum_j (K E_j)^T G (K E_j)/(2 a_j^2).

Every weight is positive and G is positive diagonal. Check the equality
exactly. This gives Hhat>=G/14>=I/84. Pulling back by S43 returns the
ORIGINAL unit-normal energy floor I/14; the threshold is not relaxed.
The original saved Hermite energy/projectors remain separate binary64 inputs.
Compare them to the ideal design after the explicit coordinate conversion;
never replace them with exact-design values to manufacture a pass.

## Low/high frequency split, including zero

Fix rho0=1/2 BEFORE any execution. For rho>=rho0 write

    T B Ti = z Ahat + R(z),   R(z)=sum_{p<=0} z^p R_p.

The first-order term has zero energy production by exact symmetry. Let
Nentry(M)=sum_ij |M_ij|, a rational upper bound on the spectral norm.
Since 2<=sqrt6<=3 and |z|>=rho0/sqrt6, a conservative bound is

    Rmax = sum_{p<=0} Nentry(R_p) (3/rho0)^(-p),
    Gamma_high = 2 Nentry(Hhat) Rmax / (1/84),
    d/dt (w* Hhat w) <= Gamma_high (w* Hhat w), w=T c.

For 0<=rho<rho0 use the original physical variable c and energy c*c, not T.
Here |z|<=rho0/2, so

    Gamma_low = 2 sum_{p=0}^2 Nentry(B_p)(rho0/2)^p
    d/dt(c*c) <= Gamma_low (c*c).

At exactly0, physical C0 has only39 reachable independent rows. Recheck their
invariance and use B0[4:,4:] on that image. A possible nonphysical full43
extension is NOT a zero-frequency inverse or an additional physical degree
of freedom. The low bound includes0 without any division by rho.

The piecewise energy uses a fixed cutoff, not a time-dependent switch; thus
no time derivative of the cutoff is involved. It need not be smooth in rho.
The maximum of the two bounds would be independent of rho on this fixed ray
IF every exact prerequisite passes. This defines its own frequency-weighted
norm; it does not establish uniform equivalence to unweighted full43 L2 or
a complete mixed-Sobolev well-posedness theorem. It is intentionally not a
claim of damping: conservative positive upper bounds permit growth.

Registered point comparisons at0,1/8,1/4,1/2,1,2,4,8 check implementation
agreement, NOT the all-frequency statement. The latter rests on the exact
identities, positive Gram certificate and analytic bounds. No time step is run.

## Source verification and limits

[Sarbach and Tiglio, Sections3.1.4-3.1.5](https://arxiv.org/html/1203.6443v1)
separate principal symmetrization from lower-order growth and require bounds
uniform over direction for strong hyperbolicity. Their review is a framework,
not a certificate for these project coefficients. The formulas above are a
project-specific derivation. [Gundlach and Martin-Garcia](https://arxiv.org/html/gr-qc/0506037v1)
likewise distinguish characteristic completeness, smooth directional dependence
and energy estimates for first/second-order formulations. Neither citation
proves this candidate, its discretization, nonlinear dynamics or boundaries.

## Status

This document describes intended exact checks and conditional implications.
No new batch has been executed. Execution needs separate user consent and
the unchanged 64 MiB/600 s owned supervisor. Old full-symbol/energy receipts
are preserved, not regraded; scientific/live flags remain false.
