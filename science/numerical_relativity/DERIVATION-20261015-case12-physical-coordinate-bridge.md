# Fixed-case12 physical constraint coordinates: all-direction Laurent bridge

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: source-bound mathematical derivation. Date: 2026-10-15, Asia/Shanghai.
Version Label: case12_physical_coordinate_bridge_v1.
Verification Status: UNVERIFIED candidate before its owned execution.
Writing and reviewing this derivation uses source inspection only, with no
scientific imports, numerical evaluation or tests. AI-assisted work; external
mathematical review remains separate. Earlier accepted and failed evidence
keeps its original identity and scope.

## The exact question and its limits

The accepted full58 factorized energy establishes a smooth, uniformly positive
principal symmetrizer for the fixed-case12, `geometric=False` rational symbol
family. Its gate SHA is
`64bd6ca11c1ba12efa3f5e437be91aef46780c747a751f1d1706ff44786618d4`.
That result does not identify the physical43 constraint coordinates with the
formal leading constraint coordinates at every direction and frequency.

This candidate extends the ORIGINAL physical constraint map, algebraic source
and Laurent coordinate formulas to every real direction v=(x,y,zeta)!=0.
The spatial-derivative indeterminate below is z; it is distinct from the third
coordinate zeta. The implementation's three polynomial variable names remain
`x,y,z`, and its separate Laurent-power field records the derivative power.
No polynomial variable is silently substituted for that Laurent indeterminate.

The proposed theorem is a coordinate statement: six two-sided Laurent inverse
identities, removal of the positive powers of the transformed physical map,
and agreement of its constant term with the independently qualified Dhat.
It also binds the original zero-frequency physical39 image. It does NOT
construct a full subsidiary B(z), prove C(z)(J+zK)=B(z)C(z), estimate lower-order
growth, or prove an initial-boundary value problem.

## Fixed coefficients and physical source

Use exactly the original case12 metric, lapse, conformal factor, shift and
profile, with h=L L^T positive definite and alpha,chi positive. Put

    r=v^T v,  u=h^-1,  g=v^T u v.

The inherited exact domain certificate gives r>0 and g>=(5/6)r for real v!=0.
Only r is needed to clear the direction denominators of this coordinate
construction. The fixed inverse metric introduces rational constants, not
additional vanishing direction denominators.

The original `nr_constraint_full_symbol.physical_coefficients` defines

    C(z)=C0+z C1+z^2 C2,       Ck: 43 by 58.

These are physical Hamiltonian/momentum/Z4 constraints, the auxiliary
definition defects, and the determinant/trace constraints in the existing
ordering. Base-field derivatives in H/M/Z are retained; they are not replaced
by auxiliary variables to make the desired relation true. C0 is constant in
v; C1 and C2 are homogeneous of degree 1 and 2. Every matrix slot is retained.

The same original module's `source` defines the constant 58-by-58 algebraic
linearization J at zero dynamical and auxiliary fields. Its registered
parameters remain tau_inverse=1, kappa1=1/10, kappa2=0, eta=0, c=e=s=1,
and f=3 alpha chi. Producing J here only binds the lower-order source for a
later full-symbol proof. No equation involving a new B(z) is inferred from
the existence of this matrix or from a passed principal energy.

The bridge must pin the exact source file bytes, selected ASTs, helper ASTs,
constants and narrow symbolic adaptations. Only the specific Background type
guards and final Fraction-array validation incompatible with symbolic values
may be adapted. One additional exact-node compatibility adaptation changes
`r * low` to `low * r` in the original factors function: r is a scalar and
the NumPy array operation is elementwise, so these products are identical.
It avoids the symbolic scalar's array-truth dispatch; it does not change
matrix multiplication order. Match that original node exactly once and
record both AST hashes. No general multiplication rewrite is allowed.
Indices, in-loop guards, sums, signs and coefficients remain unchanged.
The original zero/identity/projector helper formulas are
compiled unchanged into private bindings. Canonical polynomial output checks
replace the final scalar-type assumption. A changed source or helper identity
is a rejection, not permission to continue with a nearby formula.

## Original derivative-aware coordinates

Let O be the auxiliary longitudinal projector vv^T/r on each of the original
groups (8,1),(11,3),(20,6),(38,1), and zero elsewhere. Here a pair denotes
the group's first row and the number of components repeated along its three
derivative directions. Define

    X = O + I_HM,
    Y = e_d e_d^T,                 d is coordinate 41,
    V = I_aux - O + I_Theta,Z,tau.

Let Ttrace have only determinant row 41 nonzero, with its D-defect entries

    (Ttrace)_(41,20+6k+pair(i,j))
       = 2 v_k u_ij * (1 if i=j else 2).

The second factor for symmetric off-diagonal components is essential. In
particular, this is not a contraction over only six entries with all weights
equal. The ORIGINAL factors are

    W(z)  = z^-1 X + V + Ttrace + r z Y,
    Wi(z) = z^-1 Y/r + V - Ttrace/r + z X.

They describe an invertible coordinate transformation only for z!=0.
The determinant correction cancels the base-metric derivative in the intended
physical-to-formal relation. It must be computed and checked, not asserted
from the intended interpretation.

Write U(z)=I+U0_delta+z U1 and Ui(z)=I-U0_delta-z U1. The original
`nr_constraint_laurent_energy.bridge` defines only the following corrections:

    (U0_delta c)_Zi = -u^(j ell) (2 rD_(j i ell)-rD_(i j ell))/2,
    (U1 c)_H = chi [2 (u v)^ell u^(ij)
                         (rD_(i ell j)-rD_(ell i j))
                      +4 (u v)^k rP_k].

Here rD and rP denote definition defects; their prefix is part of their
physical name and does not denote multiplication by r. All unlisted
correction rows are zero. Both U Ui and Ui U must be verified explicitly;
the implementation is not allowed to assume nilpotence without the full
coefficient identity.

Set

    T(z)=W(z) U(z),       Ti(z)=Ui(z) Wi(z).

Both T Ti and Ti T must also be checked. Product order matters because these
are matrix-valued Laurent polynomials.

## Clearing denominators without sampling directions

Work over QQ[x,y,zeta] and retain every registered Laurent coefficient.
Use polynomial numerators

    Wbar=rW,  Wibar=rWi,  Tbar=Wbar U=rT,
    Tibar=Ui Wibar=rTi,   F=Tbar C=rTC.

U and Ui do not require this denominator. Decode or construct each entry as
a genuine polynomial, rejecting a remaining symbolic denominator. This is
an exact change of representation: real r>0 recovers W,Wi,T,Ti uniquely.
No directional samples, floating tolerance or simplification at a special
ray are used to prove a coefficient identity.

Retain these formal supports even when some coefficient matrices vanish:

| Object | Complete Laurent powers | Direction-degree ceilings by power |
|---|---|---|
| C | 0,1,2 | 0,1,2; the latter two are homogeneous |
| J | 0 | 0 |
| Wbar | -1,0,1 | 2,3,4 |
| Wibar | -1,0,1 | 0,2,2 |
| U and Ui | 0,1 | 0,1 |
| Tbar | -1,0,1,2 | 2,3,4,5 |
| Tibar | -1,0,1,2 | 0,2,3,3 |
| F=Tbar C | -1,0,1,2,3,4 | global ceiling 7 |

These ceilings are conservative rejection bounds, not claims that every
entry attains the ceiling or has one common homogeneous degree. Mixed-degree
constant Laurent coefficients are legitimate. In particular, Ttrace and
the other zeroth-Laurent terms have different direction degrees.

Construct all six inverse residuals by ordinary complete Laurent convolution:

    Wbar Wibar-r^2 I,     Wibar Wbar-r^2 I,
    r^2(U Ui-I),          r^2(Ui U-I),
    Tbar Tibar-r^2 I,     Tibar Tbar-r^2 I.

The W pair retains powers -2 through 2, the U pair 0 through 2, and the T
pair -2 through 4. The W/T residual degree ceiling is 8; the scaled U
residual ceiling is 6. The identity matrix appears only at Laurent power
zero, with explicit zero targets at every other registered power. The whole
43-by-43 coefficient matrix at every power must be exactly zero.

Multiplying the U residuals by r^2 is a uniform certificate representation,
not an extra mathematical assumption: r^2>0 on the registered real domain.
After coefficientwise zero validation, polynomial identity gives the six
relations for every real v!=0 and every complex z!=0.

## The physical leading-map gate

Let d=r Dhat be the already accepted polynomial leading map, bound to its
actual parent bytes and source identity. The new construction must satisfy

    F0-d=0,               Fp=0 for p=1,2,3,4.

Each residual is a complete 43-by-58 polynomial matrix, with degree ceiling
7. F_-1 is saved in full and is not silently discarded or required to vanish.
It follows, only after these checks, that

    T(z) C(z) = Dhat + z^-1 F_-1/r.

This identifies the formal leading map and the explicitly retained lower
Laurent term. It does not prove that the physical C(z) has a right inverse at
every nonzero frequency, that a subsidiary B(z) exists, or that transforming
its generator produces a bounded lower-order remainder. Those are different
relations and require their own certificates.

For a physical Fourier covector rho*v/sqrt(r), the substitution is
z=i*rho/sqrt(r). The Laurent identities apply when rho!=0. This substitution
does not authorize evaluating W,Wi,T or Ti at rho=0, nor does it identify a
frequency-weighted norm with unweighted L2.

## Zero frequency and inherited evidence

The original C0 has zero Hamiltonian/momentum rows 0 through 3; its remaining
39 rows are independent in the accepted fixed-background full-symbol result.
Since C0 and J are direction-independent, exact equality with those saved
original matrices transports their source identity to this all-direction
construction. Denote D39=C0[4:,:] and bind the actual saved old section S39,
reduced operator B39 and off-image ambiguity E. This batch rechecks

    D39 S39-I39=0,
    B39 D39-D39 J=0,
    E C0=0 with E!=0.

The full residuals, rather than just the old summary Booleans, are saved and
independently replayed. The first identity and the four zero C0 rows prove
rank(C0)=39; the second verifies the inherited physical-image transport;
the third exhibits nonuniqueness of a full43 extension. No new right inverse
or subsidiary operator is solved for.

A metadata field saying rank=39 is not a rank proof. The reused section,
operator and ambiguity retain their old gate and artifact hashes, while
the complete identities above are newly checked. A full43 zero-frequency
inverse is unavailable because C0's first four rows vanish. No off-image
extension is promoted to an additional physical mode, and no new
zero-frequency subsidiary operator or energy is constructed here.

## Negative controls and independent verification

The determinant trace row and its off-diagonal factor must be tested with
actual formula mutations. One candidate removes the determinant trace part
of Wbar's power-zero coefficient. The other halves its [41,21] off-diagonal
coefficient. Each mutation must rebuild the affected Tbar and F products and
save the complete 43-by-58 Laurent-power-one residual, including all zeros.
An exact incremental implementation uses

    F1_mutated = F1 + delta_Wbar0 U0 C1 + delta_Wbar0 U1 C0.

This is the complete coefficient of the genuinely mutated product; it
does not require recalculating unrelated Laurent powers. Save the complete
43-by-43 delta_Wbar0 as well as the resulting residual.
The accepted construction must give F1=0 while each registered mutant gives
at least one exactly nonzero polynomial coefficient. A synthetic change to
the residual file is not the same control.

The independent replay reads canonical saved bytes and compares all slots
of constant C0 and J to their immutable, qualified original rational
matrices. These two constants reuse the original source qualification;
they are not rederived by a second new formula implementation. C1 and C2
are independently rebuilt from their indexed physical formulas. The replay
also reconstructs the original coordinate formulas, all products and all
residuals with its own standard-library rational polynomial operations.
It checks all shapes, supports, degree ceilings, coefficient identities
and parent comparisons.
It does not import the producer's formula helper as its oracle. Reuse of
qualified low-level exact arithmetic is recorded explicitly; this is not
external-code or human-independent theoretical validation.

Every expected zero is an exact coefficient test. Nonzero candidates and
completed negative evidence must be preserved before mathematical failure;
a timeout may leave a marked prefix but cannot be completed outside the
owned batch. Full pass additionally requires registered controls, source and
history integrity, complete independent replay and successful cleanup.

## What follows only in later candidates

The next algebraic dependency is the full-direction identity
C(z)(J+zK)=B(z)C(z), including all powers 0 through 4 for a registered
degree-two B. After that, retain every coefficient of T B Ti, including
negative powers, and derive an all-direction low/high-frequency bound and
an explicit function-space interpretation. The earlier one-ray growth
bound cannot be re-labelled as this result by removing a ray guard.

The current geometric=False certificate also does not prove all-direction
equivalence with the geometric=True route or the actual off-constraint
nonlinear grid RHS. That source bridge and a stated coefficient/background
domain precede any such extension. A true boundary theorem must then handle
physical, gauge and constraint incoming data, tangential frequencies,
zero/glancing modes, initial-boundary compatibility and an energy estimate.
Direction-dependent H(n) is not by itself a common local SBP symmetrizer.

Physical/live/payload admission, full-frequency closure/energy, variable
backgrounds, nonlinear stability, IBVP, constraint convergence and black-hole
evolution remain unchanged. This document is a candidate derivation, not a
record of passed checks or observed runtime.
