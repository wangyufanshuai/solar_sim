# Fixed-case12 frequency growth: original full58 L2 and weighted physical43

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, continuation of
the existing source-bound workflow. Artifact: mathematical derivation.
Date: 2026-10-15, Asia/Shanghai. Version: case12_uniform_frequency_growth_v1.
Verification Status: UNEXECUTED candidate at creation. Preparation consists
of reading fixed source/receipts and paper reasoning; no scientific import,
polynomial computation or test was executed. This is AI-assisted work,
not external peer review or proof-assistant certification. Any subsequent
execution result belongs in a separate result document.

## 1. Two theorems with different state norms

The proposed new conclusions concern the registered fixed-case12,
geometric=False, constant-background Fourier symbols. They are:

1. A frequency-uniform L2 growth estimate for the original 58-component
   state, including its zero Fourier mode.
2. A frequency-uniform growth estimate in an explicitly frequency-weighted
   norm for the physical 43-component constraint symbol. The estimate is
   not a uniform Euclidean/ordinary-L2 estimate on those 43 coordinates.

Use the original fixed alpha=17/20, chi=18/25,
beta=(3/100,-1/25,1/20), h=L L^T with

    L=[[1,0,0],[3/25,1,0],[-2/25,3/50,1]],
    r=v^T v, g=v^T h^-1 v >= (5/6)r > 0 for real v!=0.

The source profile remains tau_inverse=1, kappa1=1/10, kappa2=0,
eta=0, c=e=s=1 and f=3 alpha chi. These constants define a particular
frozen linear symbol, not a theorem for evolving or arbitrary backgrounds.

Write a spatial Fourier vector as xi=rho n, where rho=|xi|>=0 and
|n|=1 when rho>0. A star denotes complex conjugate transpose; a superscript
T denotes the transpose of a real matrix. Time below is tau, distinct from
the saved Laurent coefficient family t=rT. Every time estimate is for
tau>=0. Growth is proved on the physical Fourier line zeta=i rho at r=1;
it is not asserted uniformly over arbitrary complex zeta.

## 2. Qualified parents and the source-to-coordinate bridge

The frequency-reduction parent is
`nr-k3-case12-physical-frequency-reduction-controls-v1-20261015`, with gate
SHA `5817e42e5c38ff682146acf3ce8eb5afe439b5cfadddf0dc1e27f91c6ab2688d`,
worker SHA
`c2739fbb4c40365cecb700c73522349bdcff0e116542b3d5ef2aa5280c3d9296`
and replay SHA
`7df5f34321f744a41dce72687ad3f0511627bd0ac064a34be6d8a2f362f7802b`.
Bind its accepted complete Z[-2..6], the exact leading residual, original
Q0/Q1/Q2 and t/u parent meanings. In particular, do not replace the
nonzero Z[-1] by zero or select only the frequency powers needed for a
desired conclusion.

The full58 factorized-energy parent has gate SHA
`64bd6ca11c1ba12efa3f5e437be91aef46780c747a751f1d1706ff44786618d4`.
Its bounds record SHA is
`9359dc3a5b36e6ed267a88a31eb3198b1e1fc163d723814faf96251706f0a607`.
Together with its source/domain, complete formal energy, Gram, principal
and shift identities and accepted independent replay, it establishes

    h0 I58 <= H58(n) <= C58 I58, h0=1/14,
    H58(n) K58(n)=K58(n)^T H58(n).

H58 remains specified by its accepted full58 factorized formula. This
batch neither expands H58 nor claims to serialize a new 58-by-58 energy.
The parent bounds schema is nr-case12-full58-factorized-bound-v1, shape
[58,58], lower=1/14, m=5/6, sphere=r=1, accepted=true. Parse its actual
canonical-rational upper as C58, and require C58>=h0.

The accepted 43 principal-energy parent is the successful integer-replay
v2, gate SHA
`df247bc18a9366efa076382ad0ecf350e807277dd0fb6d59296a45a68ec07ee1`,
with bounds SHA
`476c0141567c4b8ec8dd04423f68b934bb0b8d33975c4054d209731447ec17ca`.
Bind its actual Hsym/HL/HP/Gram, source/domain and successful independent
replay. Its schema is nr-case12-energy-coefficient-bound-v1, shape [43,43],
lower_energy=1/14, g_lower=5/6 and consistent_lower_upper=true. Its actual
canonical-rational upper is C43>=h0. On the unit sphere its metric G is
I43, so the inherited theorem is

    h0 I43 <= H43(n) <= C43 I43,
    H43 Khat43=Khat43^T H43, Khat43=Ab/r.

The original five scaled constraint rows are (0,1,2,3,41). Their S43 is
the identity at r=1. Away from that sphere the original S43, G and
normalization rules must be used; the displayed identity lower bound is
not silently transplanted to other constraint coordinates.

`nr_profile_exact_coefficients.py:principal_rates/matrix` uses the original
58 slots. Its `normalized` operation divides K(v) by sqrt(r), with no
state similarity transform. `nr_constraint_full_symbol.py:source` uses
the same slots, depends only on the fixed metric/inverse, alpha, chi and
beta, and does not read the ray. Thus the actual qualified J58 is a
direction-independent constant matrix in these same coordinates:

    M58(n,rho)=J58+i rho K58(n).

The actual J JSON SHA is
`19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b`;
the original K58 JSON SHA is
`e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283`.
Bind their actual accepted ancestry, not an arbitrary same-named copy.
K58 includes shift. Its energy follows from the accepted K0 and Pi
identities and K58=K0+(beta.n)Pi. Do not replace K58 by K0 or replace J58
by a similarity-transformed source taken from a different state norm.
Khat43 and J58 are different operators of different sizes.

## 3. Complete exact coefficient norm tables

For an actual polynomial matrix A(n)=sum_alpha A_alpha n^alpha, define

    ell_ij(A)=sum_alpha |(A_alpha)_ij|,
    ell(A)=sum_ij ell_ij(A).

Each of these is an exact nonnegative rational. Save every row-major
matrix slot, including zeros, and the total. On the Euclidean unit sphere
each |n_k|<=1, whence

    |A_ij(n)|<=ell_ij(A),
    ||A(n)||2 <= ||A(n)||F <= sum_ij |A_ij(n)| <= ell(A).

This argument does not assume A symmetric, normal or diagonalizable, and
works for complex state vectors. It uses the full coefficient array, not
direction samples or an approximate eigenvalue calculation.

The fifteen main tables are J58; Q0,Q1,Q2; Z[-2],Z[-1],Z[0]; the four
t[-1..2] and four u[-1..2]. There are 3364+14*1849=29,250 explicit
coefficient-bound slots. They are bound-table entries, not a new set of
29,250 zero residuals. Require J direction degree zero, Qj homogeneous of
degree j, and the registered Z/t/u degree ceilings. Do not demand a
spurious whole-matrix homogeneity from Z/t/u.

The independent route decodes the actual parent polynomials and separately
sums the absolute Fraction coefficients for every slot and total. It then
recomputes every new bound from those totals and the bound parent C values.
No production norm/growth function is called by this route. Hash and bind
the raw decoded input bytes, the actual polynomial structures and all
accepted parent residual/coordinate qualifications.

## 4. Original full58 uniform L2 growth

Set j=ell(J58). For rho>0 define E58=y*H58(n)y. Since the background and
direction are time independent, differentiation gives

    dE58/dtau
      =y*[J58^T H58+H58 J58
          +i rho(H58 K58-K58^T H58)]y
      =y*(J58^T H58+H58 J58)y
      <=2 C58 j |y|^2
      <=Gamma58 E58,
    Gamma58=2 C58 j/h0=28 C58 j.

The principal cancellation is exact for every rho and n. The last
inequality uses the actual lower energy bound; dropping 1/h0 is invalid.
Gronwall gives E58(tau)<=exp(Gamma58 tau)E58(0). These are squared-energy
growth rates: a state norm has the corresponding factor exp(Gamma58*tau/2).

At rho=0 the original system is y'=J58 y. Choose Ezero=|y|^2 and
Gamma58zero=2j; this makes no choice of n or Laurent coordinate at zero.
Because C58>=h0, max(Gamma58,Gamma58zero)=Gamma58. A single piecewise
Fourier energy has lower h0 and upper

    C58global=max(C58,1).

The maximum with 1 is necessary for the separate zero-mode metric I.
Consequently the original-state Fourier flow obeys the sufficient bound

    |y(tau,xi)|^2
       <=14 C58global exp(Gamma58 tau)|y(0,xi)|^2

at all frequencies, with the chosen zero-mode definition. Plancherel gives
the same uniform L2 estimate for the fixed constant-coefficient homogeneous
Cauchy system on all space or a periodic domain. Directionwise smoothness
of H58 is inherited; its bounded Fourier multiplier suffices for this
L2 estimate without requiring a smooth continuation through xi=0.

This is an a priori linear-symbol estimate. It is neither a new numerical
time evolution nor an estimate for the unbridged actual nonlinear RHS,
variable backgrounds, a spatial boundary, forcing or a discretization.
A possibly large conservative C58/Gamma58 does not certify practical
conditioning, damping, timestep stability or an error tolerance.

## 5. Physical43 low and high frequencies

Set the fixed cutoff rho_star=1/2 and qj=ell(Qj). For 0<=rho<rho_star,
the polynomial physical symbol is

    Q(n,i rho)=Q0(n)+i rho Q1(n)-rho^2 Q2(n).

For c'=Q c, the Euclidean squared norm satisfies

    d|c|^2/dtau <=2 ||Q||2 |c|^2 <=Gamma43low |c|^2,
    Gamma43low=2(q0+q1/2+q2/4).

Q0 has direction degree zero. Its evaluation at rho=0 therefore does not
depend on the undefined unit direction. The interpretation of physical
zero-frequency constraints is nevertheless restricted as in section 7.

For rho>=1/2 use w=T(n,i rho)c. The accepted coordinate parent gives
Ti=T^-1; T is time independent and is not an arbitrary unitary transform.
At r=1 the saved t=rT and u=rTi equal T and Ti. The accepted complete
reduction gives

    w'=[i rho Khat43(n)+Z0(n)
        +(i rho)^-1 Z[-1](n)+(i rho)^-2 Z[-2](n)]w.

The new batch must bind all Z[-2..6], check Z2..6 and the leading residual
Z1-rAb are exactly zero, and retain the actual Z[-2], Z[-1] and Z0. Their
low-frequency powers are not replaced by the 58-source J. In particular,
Z[-1] survives the accepted parent calculation. Z[-2] was zero in the
accepted parent; its complete table and actual bound are retained here.
The growth argument also permits a nonzero c[-2], so no additional zero
gate for this lower-order coefficient is needed beyond the fixed-parent
byte identity.

Let cp=ell(Z[p]) and E43=w*H43(n)w. Symmetrization of Khat43 cancels its
imaginary principal term. Since |(i rho)^-k|=rho^-k and rho>=1/2,

    dE43/dtau <=Gamma43high E43,
    Gamma43high=28 C43(c0+2 c[-1]+4 c[-2]).

Keep the c[-2] term and its actual value in the exact record rather than
hard-coding the simplification. The energy on c is the Hermitian
pullback c*T(n,i rho)* H43(n)T(n,i rho)c. Using an ordinary transpose
instead of the conjugate transpose for complex T is incorrect.

Define the low/high energy piecewise at this fixed frequency cutoff, with
the high branch at rho=1/2, and set

    Gamma43=max(Gamma43low,Gamma43high).

For each fixed frequency this energy grows by at most exp(Gamma43 tau).
There is no time-dependent switch and no assertion that the energy
multiplier is smooth across the cutoff. Positivity at each nonzero
frequency is insufficient by itself to claim a uniform Euclidean norm.

## 6. Explicit transform weights and a conservative Sobolev allowance

Read and check all 1849 coefficients of the complete t2 matrix are zero
before using first-order growth of T. Let ap=ell(tp), bp=ell(up) and

    AT=2 a[-1]+a0+a1,
    Ai=2 b[-1]+b0+b1+b2.

Both must be positive actual rationals. For rho>=1/2, the complete Laurent
supports -1..2 and t2=0 give

    ||T(n,i rho)||2<=AT(1+rho),
    ||Ti(n,i rho)||2<=Ai(1+rho)^2.

For example, the inverse-frequency term is at most twice its coefficient
norm, while rho and rho^2 are bounded by (1+rho) and (1+rho)^2. These
bounds do not drop any surviving inverse-frequency term. From
c=Ti w and the accepted energy lower/upper bounds it follows that

    h0/[Ai^2(1+rho)^4] |c|^2
       <=E43
       <=C43 AT^2(1+rho)^2 |c|^2.

This establishes a frequency-weighted energy norm, whose upper and lower
Euclidean comparisons carry different weights. Combining the comparisons
at the same frequency gives the sufficient high-frequency flow estimate

    |c(tau,xi)|
      <=sqrt(14 C43) AT Ai (1+rho)^3
        exp(Gamma43 tau/2)|c(0,xi)|.

Along with the finite low-frequency bound, this supplies a conservative
H^(s+3)-to-H^s allowance for the fixed linear symbol. It does not prove
that three derivatives are necessary or optimal, and does not establish
an H^s-to-H^s or plain-L2 uniform flow estimate for physical43. Nothing
here rules out a sharper norm/argument in a separate future certificate.
The norms are based on original physical43 coordinates; one cannot label
the uniformly bounded energy in w as a uniformly equivalent energy in c.

If t2 is nonzero or either AT/Ai fails its positive gate, this fixed
candidate fails. It must not silently increase the registered transform
degree, choose a different cutoff or search for another weight.

## 7. The physical zero mode and absent extensions

The polynomial Q0 acts algebraically on 43 coordinates, and its norm
bound is valid there. The accepted physical map C0 has only a 39-dimensional
reachable image. Bind its complete zero-frequency evidence: C0, the
accepted D39/S39 right-section identity, B39 transport identity and the
nonzero off-image ambiguity. This batch uses the qualified coefficients
and their accepted replay; it does not solve for another section.

Physical zero-mode interpretation therefore remains on im(C0). A bound
for the 43-dimensional polynomial extension does not create a 43-by-43
inverse of C0 or make an off-image generator unique. Never evaluate T/Ti
at rho=0 or infer a uniform inverse near zero from the high-frequency
branch. The 58-state zero mode is a distinct full58 ordinary ODE.

## 8. Actual changes and two inference controls

The first actual-data negative copies the qualified J58 and changes only
[57,57] by +1, after verifying the original slot is zero. Save the complete
changed matrix and independently recomputed full coefficient-norm table.
Compare every slot to the actual original table and reject reusing that
old certificate. Do not fill a presumed total increment without summing
the changed coefficients. This is a provenance/bound-table rejection;
it does not disprove a correctly recomputed bound for the changed system.

The second actual-data negative copies the verified zero t2 and adds x^2
at [0,0]. Save that complete polynomial matrix and its full norm table.
Its nonzero coefficient rejects the first-order T growth qualification.
The polynomial vanishes on x=0, so the negative is not claimed to fail
pointwise in every direction. Full coefficient detection is the gate.

Two small exact inference controls expose otherwise plausible mistakes:

* H=h0=C=1/14, J=1, K=0 and scalar state 1 give E'=2/14. The erroneous
  rate 2 C J without division by h0 gives rate-times-energy 2/196, so the
  actual gap is positive. The correct rate 2 C J/h0 gives equality.
* T=diag(rho,rho^-1), Ti=diag(rho^-1,rho), H=I, rho=2 and state e2 give
  pullback energy 1/4, below the claimed uniform Euclidean lower bound 1.
  Positivity and invertibility alone cannot justify that lower bound.

Retain the actually computed rational differences and rejection decisions.
These are small logical controls, not claimed counterexamples to case12.
They do not replace the real J/t2 changes or the actual coefficient tables.

## 9. Acceptance and trusted base

Only complete parent/source/domain qualification, all full coefficient
tables, actual rational constants, all required zero/positive checks,
independent Fraction reconstruction, successful changes/inference controls
and an intact bounded-run terminal can qualify the two exact new claims:

    full58_uniform_frequency_l2_growth_validated
    physical43_weighted_frequency_growth_validated.

Retain the generic full_frequency_energy_validated=false; the exact named
claims prevent it from being mistaken for every possible full-frequency
energy statement. In particular
physical43_uniform_euclidean_growth_validated=false,
constraint_derivative_loss_absent_proved=false and
variable_background_energy_validated=false. The separate actual nonlinear
RHS, damping, legal IBVP, convergence, physical evolution, live admission
and scientific payload gates also remain false.

The trusted base consists of the frozen formulas and source-coordinate
interpretation, accepted exact parent theorems, canonical input decoder,
producer and independent Fraction arithmetic, coefficient norm lemma,
energy differentiation/Gronwall/Plancherel argument, Python runtime and
owned-run controller. Replaying exact arithmetic is not proof-assistant
verification of this entire chain. No numerical simulation or new large
matrix product is needed or licensed by this proof unit.
