# Fixed-case12 physical constraints: nonzero-frequency right section

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: source-bound mathematical derivation. Date: 2026-10-15, Asia/Shanghai.
Version Label: case12_physical_right_section_v1.
Verification Status: UNVERIFIED candidate before its owned execution.
This document was written by reading frozen sources and accepted records;
no scientific import, polynomial calculation or test was executed to write it.
AI-assisted work; external mathematical review remains separate.

## Why the principal section alone is insufficient

The accepted coordinate-bridge parent proves, for the fixed case12 source
and every real v=(x,y,z)!=0,

    T(zeta) C(zeta) = D + zeta^-1 R,
    T Ti = Ti T = I43,

with C=C0+zeta C1+zeta^2 C2. The derivative-frequency indeterminate zeta
is separate from the three direction variables. It may be any nonzero
complex number. The original principal section satisfies D S=I43, but R
is actually nonzero in the accepted parent. Consequently S is not, merely
by that principal identity, a right inverse of the physical C(zeta).

The coordinate parent gate SHA is
`466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708`;
its worker SHA is
`9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811`.
The earlier all-direction section is a separate qualified parent. This
candidate binds both sources and their actual saved matrices; it does not
replace them by sampled directions or solve a new pivot-dependent section.

The proposed result is one explicitly constructed E(v,zeta), of shape
58-by-43, such that C E=I43 for every real v!=0 and complex zeta!=0.
A right inverse of a rectangular matrix need not be unique. The protocol
fixes one candidate, rather than claiming uniqueness of all right inverses.

## Denominators and exact rational coordinates

Use the original case12 h, chi=18/25 and all coordinate orderings. Set

    r=v^T v,       g=v^T h^-1 v,
    sigma=chi*r*g^2,       Delta=r*sigma=chi*r^2*g^2,
    d=rD,         s=sigma*S,
    t(zeta)=r*T(zeta),     F=rR=[rTC]_-1.

F in THIS document is just the parent's negative-first coefficient; it is
not the entire Laurent family rTC. The already accepted identities imply

    d s=Delta I43,
    t C=d+zeta^-1 F.

These parent identities and the T/Ti inverse certificate must be bound to
the same actual matrix bytes, domain and sources. A successful unrelated
parent gate or a Boolean detached from the input identities is insufficient.
This batch reuses those accepted proofs; it does not claim to recompute all
of the older section and coordinate-bridge products.

The exact domain proof supplies g>=(5/6)r and r>0 for real v!=0. Therefore

    Delta = (18/25)*r^2*g^2 >= r^4/2,
    Delta^2 >= r^8/4 > 0.

Clearing Delta^2 is reversible everywhere on the registered real direction
domain, including coordinate axes and opposite/scaled directions. No
individual direction component, chosen matrix minor or sampled pivot is
introduced as a denominator. The inequality is not asserted for arbitrary
complex v, nor does it create an inverse at v=0.

## A finite correction and its proof

Define the 43-by-43 matrices

    H=F s,       N=R S=H/Delta.

H here is a coordinate-correction numerator, NOT the energy matrix of an
earlier energy certificate. The source's longitudinal auxiliary structure
motivates a nilpotence candidate; that motivation is not an accepted identity.
This batch must actually construct and save H and the complete product H^2,
and require every coefficient of H^2 to vanish.

If that gate passes, N^2=0. There is then an exact finite inverse

    (I+zeta^-1 N)^-1 = I-zeta^-1 N,

with no infinite series, small-frequency expansion or convergence assumption.
Fix the only registered physical section candidate as

    E = S (I-zeta^-1 N) T,
    e = s (Delta I43-zeta^-1 H) t,
    E = e/Delta^2.

The last denominator follows from sigma*r=Delta; there is no additional
factor of r or sigma. All products retain their displayed order. From the
accepted parent relation and D S=I,

    (T C) S = I+zeta^-1 N,
    C E = Ti (I+zeta^-1 N)(I-zeta^-1 N) T
        = I-zeta^-2 Ti N^2 T = I.

This proves sufficiency of the nilpotence gate, given the bound parents.
The implementation must ALSO construct and save the complete direct
residual C e-Delta^2 I43 and independently verify every coefficient.
The explanatory derivation cannot replace that registered product check.

Conversely, direct verification of C E=I establishes full row rank 43 of
C at each registered nonzero frequency, hence a 15-dimensional kernel in
the complexified 58-state space. This does not identify a physical boundary
condition or prove that constraint evolution closes.

## Full supports and degree bounds

Keep every parent's C power 0,1,2 and t power -1,0,1,2, including the complete
zero t2 matrix. The correction Delta I-zeta^-1 H has powers -1 and 0.
Ordinary Laurent convolution therefore fixes e at powers -2,-1,0,1,2 and
C e at powers -2,-1,0,1,2,3,4. No extreme coefficient is removed because
it is expected or observed to vanish.

| New main object | Complete shape/support | Direction-degree ceiling |
|---|---|---:|
| H | 43 by 43 | 8 |
| H_squared | 43 by 43 | 16 |
| e | five 58-by-43 matrices, powers -2..2 | 19 |
| C e-Delta^2 I | seven 43-by-43 matrices, powers -2..4 | 21 |

The ceilings follow from degree(F)<=2, degree(s)<=6, degree(Delta)=8,
degree(t_p)<=5 and degree(C_p)<=2. They are conservative bounds, not a claim
that all complete matrices are homogeneous or attain the largest degree.
The identity target Delta^2 I occurs only at Laurent power zero.

There are 14 main matrices with 29,111 slots. H_squared and the seven
direct right-inverse residuals account for 14,792 required-zero slots.
These counts describe the certificate to execute, not a current result.
Every slot is stored canonically, including zero polynomials.

## Genuine deletion-of-correction negative

The single registered negative removes the whole -zeta^-1 H correction:

    e_bad = s Delta t,       E_bad=S T.

Construct this expression from the same accepted s,Delta,t, rather than
changing a saved residual. Retain all five powers -2..2, including the
explicit zero at -2, and then construct all seven actual coefficients of

    C e_bad-Delta^2 I43.

Require an exactly nonzero coefficient in this complete negative residual
and independent agreement on its location and value. A zero result would
fail the registered negative gate; no alternate mutation is searched.

In particular, C E_bad-I is NOT generally zeta^-1 N. The correct expression
is zeta^-1 Ti N T, whose frequency-dependent conjugation cannot be dropped.
The implemented negative is the direct product above and does not need to
assume any particular support or rank for the resulting nonzero residual.

The 12 complete negative matrices have the same e/residual degree ceilings
19/21 and contain 25,413 slots. Together with the main candidate, the batch
registers 26 matrices and 54,524 slots. Negative nonzero counts are measured
during the future run, never preset here.

## Source binding and independent replay

The mathematical inputs are accepted s,d,C,F,t and domain scalars. Bind
their exact archived bytes to the original section and coordinate gates,
workers, source manifests and independent-replay evidence. Any inherited
T inverse or d s identity must be traceable through that same provenance.
The new producer only composes the fixed formulas above; there is no new
symbolic solve, rank fit, eigenvector calculation or formula search.

Reuse of frozen coordinate polynomial/Laurent helpers is explicit and
source-bound. The independent replay reconstructs H, H^2, the complete
corrected and uncorrected e families, and both full residual families with
standard-library exact arithmetic from the saved parent inputs. It verifies
all direction coefficients, Laurent powers, slots, degree bounds and
zero/nonzero decisions. The runner uses the accepted integer-convolution
helper at SHA
`5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f`.
It clears each input polynomial's rational denominators/content, performs
the complete exact integer convolution, and returns the same QQ coefficients.
This is an arithmetic representation choice, not a reduced check.
The independent association s*((Delta I-zeta^-1 H)*t) is separately checked
against the producer's distributed coefficient construction.

The two arithmetic implementations are not external human or solver
validation. All new exact calculations and controls run inside the sole
owned resource budget; writing this derivation performs none of them.
Preserve complete nonzero candidates before mathematical rejection, or an
explicit prefix when a resource/data exception prevents completion.

## Zero frequency and later dependencies

The section formula contains negative Laurent powers. It is defined only
for zeta!=0, with physical Fourier substitution zeta=i*rho/sqrt(r) for
rho!=0. At rho=0 the accepted physical map C0 has rank39, so no right inverse
onto all43 coordinates can exist. No removable limit, full43 zero inverse,
uniform bound as rho approaches zero or unweighted-L2 equivalence follows
from the nonzero-frequency identity.

Once this section is accepted, one may separately register B=C(J+zeta K)E.
If B C=C(J+zeta K) holds, that B is unique because C has a right inverse.
Existence of E alone does not prove this intertwining identity: it also
requires invariance of ker(C) under the main generator. This batch computes
neither B nor its residual, and gives no lower-order energy or damping bound.

The fixed-case12 source scope remains explicit. Actual nonlinear-RHS source
bridging, geometric=True equivalence, changing backgrounds, legal IBVP,
discretization/convergence, black holes and physical/live/payload admission
are unchanged. The prior coordinate and energy results are not regraded.
