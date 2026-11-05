# Fixed-case12 direction projectors and actions: polynomial certificate design

## Material Passport

Origin workflow: continuation of the existing academic-research-suite /
experiment-agent protocol. Artifact: source-bound mathematical derivation.
Date: 2026-10-14, Asia/Shanghai. Version: case12_polynomial_projectors_v1.
Verification status at creation: UNEXECUTED candidate, source-only review.
No mathematical import, matrix construction, experiment, or test was run to
write this document. AI-assisted work; no external expert review or
proof-assistant certification. A separate bounded-run terminal supplies any
execution result.

## 1. Accepted spectral parent and domain

The dependency is the accepted certificate in
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-spectral-controls-v1-20261014/`.
Its terminal SHA-256 is
`67e2eda4ab922a09390ff8207a709ede327ac1619caca5a1322c16fd3825b0e6`;
its worker-result SHA-256 is
`6b320f7812c754dd8a8ebfdf06168af9d90719e851e5391e047203641c1f7e9e`.
Reuse its saved polynomial matrices and scalar interpolation certificate.
Do not rerun its seventh-degree chain or reconstruct the original main
operator, right section, closure, or exact cancellation.

Keep the fixed case12 constants, state order and rational coordinates. For
real v=(x,y,z)!=0, define r=v^T v, g=v^T h^-1 v, and b=beta.v. The accepted
domain gives g>=(5/6)r>0. Let

    L=X/r, Q=X^2, P=Pt/r, O=I43-P.

The accepted ancestors give P^2=P, O^2=O, rank(O)=11, rank(P)=32,
LP=PL=L, and LO=OL=0. The spectral parent gives

    L(L^2-c1 g I)(L^2-c2 g I)(L^2-c3 g I)=0,

with all six original constants retained in order:

    c=(2601/100000,2601/50000,2601/5000,153/125,459/250,306/125).

These correspond to ordering-T, ordering-L, light, lapse, shift-T, shift-L.
The last three paired projectors have zero scalar remainder in the accepted
parent certificate; they remain explicit outputs in this batch.

This work constructs exact numerators for the direction-dependent
43-dimensional quotient projectors and their L-actions. It constructs no
energy H, Gram remainder, uniform upper bound, or nonlinear evolution.

## 2. Reuse powers instead of rerunning the spectral chain

Put d=r^2 g, so the saved spectral stages satisfy

    Z1=X^3-c1 d X,
    Z2=X^5-(c1+c2)d X^3+c1 c2 d^2 X.

Recover the two odd powers by scalar-polynomial matrix combinations:

    X3=Z1+c1 d X,
    X5=Z2+(c1+c2)d X3-c1 c2 d^2 X.

No new full matrix product is required for either recovery. Compute only

    Q2=Q Q,
    Q3=Q2 Q

as the two additional large matrix products in the primary construction.
The independent Fraction replay performs the corresponding two products
in its own route; the claim of two products is per route, not a claim that
replay is free. The already accepted parent identities justify X3=X^3,
X5=X^5, Q2=X^4, and Q3=X^6 on the same source-bound inputs.

Degree ceilings are X3:12, X5:20, Q2:16, and Q3:24. These are conservative
total-degree bounds in x,y,z; do not substitute an assumed homogeneous
degree for individual mixed-degree coordinate entries.

## 3. Eight projector numerators with a common positive denominator

Set Y=L^2/g=Q/d and D=d^3=r^6 g^3. The accepted scalar remainders for the
three retained nonzero pairs have the form

    e_j(y)=a1_j y+a2_j y^2+a3_j y^3, j=1,2,3.

Their constant term is zero. For j=4,5,6, all coefficients are zero. The
original paired-energy formula is Ej=e_j(Y)P. Because YP=PY=Y and every
nonzero-branch remainder has zero constant term, Ej=e_j(Y) for j>=1. This
is the precise reason the explicit P factor can be omitted in those six
numerators; it is not a general replacement of P by I43.

Define, for all six branches,

    Nj=a1_j d^2 Q+a2_j d Q2+a3_j Q3,
    Ej=Nj/D.

Use the same zero coefficients to produce complete explicit zero matrices
N4,N5,N6. Do not shorten the array of six original branch identities.

Recover Ot=rI43-Pt. Since D/r=r^5 g^3 is itself polynomial, define

    NO=Ot*(D/r),
    N0=Pt*(D/r)-sum(j=1..6)Nj.

Then NO/D=O and N0/D=E0=P-sum Ej. In contrast, e_0(Y) by itself includes
the ODE component, because e_0(0)=1. Replacing N0 by the numerator of
e_0(Y) would merge two distinct components and invalidate the intended
eight-component construction.

The components in their registered order are

    O,E0,E1,E2,E3,E4,E5,E6,

represented by NO,N0,N1,...,N6 over D. NO has degree at most 18; N0 and
each Nj have degree at most 24. The direction denominator satisfies

    D=r^6 g^3 >= (5/6)^3 r^9 > 0.

On the Euclidean unit sphere D is at least 125/216. This is a denominator
bound for the saved rational formulas, not an energy or projector-norm
estimate.

The parent's 49 ordered PDE projector identities cover E0,...,E6. With the
accepted ODE idempotence and O/P/L relations, they give all ODE cross-products
and completeness of the eight components. This derivation does not turn
49 scalar identities into 64 new full matrix multiplications in this batch.
Report the actual constructions and the inherited algebraic transfer.

## 4. Six action numerators from exact odd-polynomial reduction

Let

    p7(t)=t(t^2-c1)(t^2-c2)(t^2-c3).

For each of the six original nonzero branches, let ell_j(y) be the original
degree-six Lagrange polynomial in the accepted parent record. Form the exact
polynomial t ell_j(t^2), of degree at most 13. Divide by p7 over QQ and retain
the original input, full quotient, remainder and reconstruction identity:

    t ell_j(t^2)=q_j(t)p7(t)+u_j(t),
    u_j(t)=u1_j t+u3_j t^3+u5_j t^5.

Verify that the remainder has degree less than seven and only the registered
odd powers 1,3,5. Do not silently discard an even coefficient, a degree-seven
term, or a nonzero reconstruction residual. For branches 4,5,6 only the
remainder and resulting action vanish; the original input and quotient need
not vanish.

This reduction agrees with using the reduced cubic e_j: writing
m4(y)=y(y-c1)(y-c2)(y-c3), the parent gives ell_j=e_j+m4 qbar_j. Thus

    t(ell_j(t^2)-e_j(t^2))=t^2 p7(t) qbar_j(t^2).

Their remainders modulo p7 agree even though their quotients differ. Keeping
the original input binds the action certificate to all six original branches.

Using T=L/sqrt(g), the parent gives p7(T)=0. Since LP=L,

    L Ej=sqrt(g) T e_j(T^2)
        =u1_j L+u3_j L^3/g+u5_j L^5/g^2.

No square root is numerically evaluated in either coefficient algorithm;
the displayed substitution explains the exact powers of g. With the common
action denominator J=r^5 g^2 (named `eta` in the implementation and saved
scalar record), define

    Mj=u1_j r^4 g^2 X+u3_j r^2 g X3+u5_j X5,
    L Ej=Mj/J.

All Mj have total degree at most 20. Preserve the full explicit zero arrays
M4,M5,M6. The denominator satisfies

    J=r^5 g^2 >= (5/6)^2 r^7 > 0,

and is at least 25/36 on the Euclidean unit sphere. Confusing D and J, or
omitting the leading sqrt(g) in the derivation, gives an incorrect action
formula even when all unit-scale toy examples happen to pass.

The original ODE and zero-speed actions LO=0 and LE0=0 remain inherited
from the accepted block and odd-zero-action certificates. They do not need
new M_O or M0 output files. These action formulas do not construct signed
positive/negative-speed projectors or split paired multiplicities.

## 5. Complete saved coverage, two residuals, and trace candidates

Save complete 43-by-43 matrices for four auxiliary powers, eight projection
numerators, and six action numerators:

    Q2,Q3,X3,X5,
    NO,N0,N1,N2,N3,N4,N5,N6,
    M1,M2,M3,M4,M5,M6.

There are 18 matrices and 18*1849=33282 explicit slots. The 14 projector/
action outputs account for 25886 slots; the other 7396 are the four power
matrices. Also save and independently reconstruct the complete residuals

    projector_completeness = NO+N0+sum(j=1..6)Nj-D I43,
    action_completeness = sum(j=1..6)Mj-r^4 g^2 X.

Their degree caps are 24 and 20. The second uses LO=LE0=0, so summing the
six nonzero-branch actions gives L, not L times an unidentified subspace
projection. Both residuals must be coefficientwise zero. These two linear
combinations add no large matrix product. The 20 main matrices therefore
contain 36980 explicit slots, including 3698 completeness-residual slots.
Coverage counts must not be presented as all-zero counts or energy checks.

For each of the eight projector numerators save its exact polynomial trace.
Let alpha be the lexicographically greatest exponent present in D, whose
coefficient is nonzero. Extract a proposed constant

    k_i = coefficient(trace(N_i),alpha)/coefficient(D,alpha),

with a missing numerator coefficient interpreted as exact zero. Then save
and verify every coefficient of trace(N_i)-k_i D. This is candidate
extraction followed by a full polynomial identity, not a point evaluation.
The proposed values must be integers in [0,43], sum to 43, give k_O=11,
and give k_4=k_5=k_6=0. Do not prescribe the values for E0,E1,E2,E3 from
older finite-ray results.

Only when these exact residuals and constraints pass, together with the
accepted projector interpretation, do the resulting candidates establish
the constant component ranks. Preserve nonzero trace residuals or invalid
candidates as failures. Even a verified paired rank does not by itself
split positive and negative characteristic multiplicities.

## 6. Source and artifact bridge

The governing source remains
`scripts/nr_constraint_laurent_energy.py:paired_energy`, file SHA-256
`4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b`.
Its AST binds the six original paired projectors, their actions and their
order. This batch evaluates the explicitly derived, denominator-cleared
polynomial forms; it does not execute or rewrite that routine's energy,
Gram or coercivity code. Preserve the original squared-speed and intrinsic
source identities through the parent and new pure source manifests.

The spectral module SHA-256 at this review is
`4e9dfc5058af58cbf94526d0846e314e3d7c054b1726e2184e9a8eba50ac13e8`.
Bind every reused matrix, scalar and univariate record to the exact bytes
covered by the successful parent terminal. A hash does not establish the
mathematics by itself; the parent result and the new complete constructions
provide the substantive dependencies.

The independent Fraction algorithm must reproduce both new power products,
the two recovered odd powers, all eight N numerators, all six M numerators,
their degree/statistics records, denominators, and exact trace records from
the bound parent data. It must independently divide the six scalar action
polynomials by p7 and compare all saved quotient/remainder coefficients.
Comparing only zero last-branch outputs would not qualify the first three
branches or the ODE/zero-mode separation.

Use the existing complete row-major multivariate polynomial format with
explicit zero slots and canonical rational strings. Scalar records retain
all six original branches and the registered field identities. The parser
and replay validate the specified coefficient formats and required fields;
no general-purpose strict-JSON-schema certification is claimed.

## 7. Controls, failure handling, and scientific boundary

Small controls should include nonunit r and g, opposite signs of a companion
matrix with equal paired projectors but opposite L-actions, correct recovery
of X3/X5, separation of NO from N0, and preservation of every zero branch.
Such examples expose missing denominator powers or P factors that unit-scale
checks alone can miss. Reject an altered action quotient/remainder or an
unexpected even remainder coefficient rather than projecting it away.

The full-size constructed-output negative control adds

    delta_N1[0,0]=x D

to the retained N1 numerator, leaving the other components fixed. Save the
complete 43-by-43 delta_N1 and mutant_projector_completeness, each with
degree cap 25. The latter must be independently reconstructed and be a
nonzero polynomial matrix. These add 3698 negative-control slots beyond
the 36980 main slots. This is a projector-numerator error control, not an
original 58-state physical-model mutation. Nonzero polynomial evidence
does not assert nonzero evaluation on every individual direction.

Save each completed full matrix before continuing to later stages. On a
complete mathematical mismatch, retain all available exact nonzero
coefficients, provenance, statistics, candidate decisions and independent
replay. Do not alter the parent, repair matrices using sampled directions,
or rerun automatically. A time/output/disk interruption is partial evidence,
not completion of all main and negative-control slots.

All scientific construction and independent replay belong inside the owned
worker. Finalization uses byte hashes, saved JSON, pure AST/source manifests,
dependency and historical inventories, and process-cleanup records; it must
not repeat a matrix calculation outside the resource envelope.

A pass supplies concrete source-bound projector/action numerators on fixed
case12 and all real v!=0. It does not supply H, H=H^T, HL=L^T H, HP=P^T H,
the original G/14 Gram identity, an explicit uniform upper bound, or an
energy/strong-hyperbolicity gate. The original weights and all six branches
remain unchanged for that future unit, including the three zero branches
whose shifted Gram factors cannot simply be removed.

General backgrounds, the full main system, low-order estimates, physical
zero frequency, nonlinear evolution, boundaries, convergence, black-hole
and AMR simulations, GPU performance, live admission and scientific payload
writeback remain outside this certificate. Distinct local exact algorithms
are not external-team reproduction or a formal proof of Python/CAS semantics.
