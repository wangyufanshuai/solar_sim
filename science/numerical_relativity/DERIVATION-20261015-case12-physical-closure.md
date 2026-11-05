# Fixed-case12 physical constraints: complete lower-order closure candidate

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: source-bound mathematical derivation. Date: 2026-10-15, Asia/Shanghai.
Version Label: case12_physical_closure_v1.
Verification Status: UNVERIFIED candidate before its owned execution.
This document uses source reading and accepted parent records. Its writing
does not execute scientific imports, polynomial calculations or tests.
AI-assisted derivation; external mathematical review remains separate.

## Qualified inputs and the only candidate

Fix the original case12 background, state/constraint ordering and source
profile. Let v=(x,y,z) be a real nonzero direction. The Laurent frequency
indeterminate zeta is separate from the third direction coordinate z.
The accepted physical-coordinate bridge supplies

    C(zeta)=C0+zeta C1+zeta^2 C2,       C: 43 by 58,
    L(zeta)=J+zeta K,                 L: 58 by 58.

J is the original algebraic source linearization from
`nr_constraint_full_symbol.source`. Its fixed profile has tau_inverse=1,
kappa1=1/10, kappa2=0, eta=0, c=e=s=1 and f=3 alpha chi. K is the complete
accepted principal matrix, including its original shift. Substitution of
the intrinsic, shift-removed K0 would define a different generator.
Neither the direction normalization 1/sqrt(r) nor the r^2 factor from an
earlier constraint-spectrum certificate is inserted into these formulas.
The physical Fourier substitution zeta=i*rho/sqrt(r) is an interpretation
of this polynomial identity after qualification.

The accepted physical-right-section parent supplies

    E(zeta)=e(zeta)/Delta^2,       C E=I43,

for every real v!=0 and complex zeta!=0. Its e family has all five powers
-2..2. In particular its negative powers cannot be discarded as a supposed
regularity convention. The present batch reuses the exact accepted e
matrices and their proof; it does not reconstruct a new right section.

If a 43-by-43 B satisfies B C=C L, then right multiplication by E forces

    B=C L E.

Thus the unique possible closed generator on this domain is fixed as

    Bbar=C L e,       B=Bbar/Delta^2.

This is a necessary candidate, not an automatic closure theorem. A right
inverse of C alone does not make ker(C) invariant under L. The direct
identity Bbar C=Delta^2 C L is a separate, indispensable acceptance gate.
If that gate passes, C maps every solution of the frozen 58-state linear
generator to a solution of the specified 43-coordinate generator. This
statement is about the exact fixed-background symbol, not a nonlinear PDE
or a boundary value problem.

## Denominator domain and dimensions

Use the accepted original metric h and chi=18/25. Set

    r=v^T v,       g=v^T h^-1 v,
    sigma=chi*r*g^2,       Delta=r*sigma=chi*r^2*g^2.

The fixed-domain parent proves r>0 and g>=(5/6)r. Consequently

    Delta >= r^4/2,       Delta^2 >= r^8/4 > 0.

Clearing Delta^2 therefore preserves equality for every registered real
direction, including coordinate axes, reversed directions and non-unit
directions. No individual direction component or pivot determinant is
used as a denominator. The statement excludes v=0 and does not assert this
positivity for arbitrary complex direction vectors.

C_i has direction degree i, J has degree zero and K has degree one. The
inherited conservative ceiling for each complete e coefficient is 19.
Therefore the complete Bbar has ceiling 2+1+19=22, and Bbar C has ceiling
22+2=24. The second residual term Delta^2 C L has ceiling 16+2+1=19,
which lies within the same ceiling 24. These are conservative total-degree
bounds; they are not observed degrees or assertions that every matrix is
homogeneous. Matrix dimensions follow the actual ordered products:
43x58 times 58x58 times 58x43 gives 43x43; the closure residual is 43x58.

## Complete Laurent supports and a decidable certificate

Production uses (C L)e; independent replay uses C(L e). Association changes
neither the order of the noncommuting factors nor the mathematical object.
The natural supports are C:0..2, L:0..1, e:-2..2. Register all of

    Bbar: powers -2..5,
    R=Bbar C-Delta^2 C L: powers -2..7.

CL naturally has powers 0..3 and is explicitly zero-padded to the complete
residual interval. Every endpoint remains present even if its coefficient
vanishes. Compute and save all ten residual coefficients irrespective of
whether the five forbidden Bbar coefficients vanish. In particular one
must not replace this residual support by 0..4 before proving the forbidden
powers are zero.

| Main family | Complete matrices | Direction-degree ceiling | Explicit slots |
|---|---|---:|---:|
| Bbar | eight 43x43, powers -2..5 | 22 | 14,792 |
| R | ten 43x58, powers -2..7 | 24 | 24,940 |

There are 18 main matrices and 39,732 slots. Require exact zero in Bbar
powers -2,-1,3,4,5, which cover 9,245 slots, and in all ten R coefficients,
which cover 24,940 slots. Thus 34,185 registered slots must be zero. The
remaining Bbar_0,Bbar_1,Bbar_2 are actual candidate coefficients and are not
required to vanish. Every sparse polynomial coefficient is rational and
every complete matrix slot is serialized, including zero polynomials.
Acceptance is full coefficient equality in QQ[x,y,z], not a direction
sample, floating tolerance, matrix rank estimate or eigenvalue comparison.

If both gates pass, B has only powers 0,1,2 in zeta. Because Delta depends
only on v and never vanishes on the domain, the verified finite Laurent
identity becomes a polynomial identity in zeta. It therefore holds for
every complex zeta, including zero, without evaluating E at zero.

## A real source perturbation, with the original residual retained

Use exactly one prescribed negative: change the actual source generator to

    J_mut=J+delta_J,       delta_J=E_(18,22),
    L_mut=L+delta_J.

Indices are zero-based. This adds one b^0 contribution to the Theta source
equation. In the original source ordering the complete physical C has zero
column22 and reads state18 as its constraint row4. Thus a state supported
only at column22 lies in ker(C), while the perturbation sends it to a
constraint-visible state. This supplies the reason to expect a genuine
failure of kernel invariance when the original closure is valid. These
structural facts are bound through the original physical-map source, and
the actual resulting coefficients must be reconstructed from the qualified
matrices; motivation is not a passing negative receipt.

Recompute from actual saved C,e and the full delta_J matrix:

    delta_Bbar=C delta_J e,
    Bbar_mut=Bbar+delta_Bbar,
    R_mut=R+delta_Bbar C-Delta^2 C delta_J.

The last expression is identically

    (Bbar+delta_Bbar)C-Delta^2 C(L+delta_J).

It must retain the actual baseline R even when baseline closure fails.
Neither implementation may substitute zero for R or paste the predicted
negative residual. Independent replay associates the same perturbed
operator products separately and compares the complete result. Require
both R_mut and its change R_mut-R to contain an actual nonzero coefficient,
so an already nonzero baseline does not alone qualify the negative.

More explicitly, let q be the state unit vector at column22 and f4 the
constraint unit vector at row4. The source structure gives C q=0 and
C delta_J q=f4. Hence the predicted exact change obeys

    (R_mut-R)q=-Delta^2 f4 != 0.

This explains why the mutation has a causal witness independently of
baseline success. It does not justify skipping the registered products or
prefilling their saved coefficients. It also does not prescribe the full
matrix's nonzero count.

Save eight delta_Bbar coefficients on -2..5, including the explicit zero
endpoint5 of its natural support -2..4; ten R_mut coefficients on -2..7;
and the complete 58x58 delta_J with its sole prescribed unit entry. The
caps are 22,24,0 respectively. These 19 negative matrices contain 43,096
slots. Together with the main certificate there are 37 matrices and 82,828
slots. Bbar_mut is reproducibly reconstructed from Bbar+delta_Bbar, rather
than stored as another duplicate eight-matrix family. All nonzero counts
are measured in the future owned run; no expected count is preset here.

## Source and parent bridge

Three accepted mathematical parents are required, all under
`tmp/nr-shadow-evidence/`:

| Parent directory | Accepted gate SHA256 |
|---|---|
| nr-k3-case12-physical-right-section-controls-v1-20261015 | 3533a207230fe823eb9774b4ca46ae3dccc14287fe38cc7b0d70d9af30e0822a |
| nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015 | 466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708 |
| nr-k3-case12-polynomial-closure-controls-v1-20261014 | 3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1 |

The right-section parent supplies e,Delta^2 and its full accepted CE proof;
the coordinate parent supplies C0,C1,C2,J and its zero-frequency rank39
qualification; the principal-closure parent supplies the actual K, with
original shift included. Each parsed artifact must match its own accepted
manifest, worker and independent-replay identity. A generic successful gate
detached from these specific bytes is insufficient.

In particular coordinate J.json has SHA
`19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b`,
and principal-closure K.json has SHA
`e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283`.
The producer's registered parent map fixes the full list and original paths.
The new code composes the specified products; it makes no new AST formula
adaptation, symbolic solve, gauge choice or factor search. Frozen helper
dependencies and all inherited formula sources remain explicitly bound.

Independent standard-library replay uses the qualified integer polynomial
arithmetic at SHA
`5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f`.
Per-polynomial denominator/content clearing and full integer convolution
return the exact rational polynomial product. The independent matrix and
Laurent loops reconstruct all main and negative outputs from actual parent
bytes; they do not call the producer's closure construction as an oracle.
This is computational redundancy within the project, not an external
human or independent solver review.

## What a complete pass would and would not establish

A complete pass would prove the all-direction fixed-case12 closure
identity for the registered source, its unique nonzero-frequency B and
the polynomial-in-frequency extension of that identity to zero. At zero,
the physical C0 has rank39. B0 therefore gives consistent propagation on
that 39-dimensional image and one extension to all43 coordinates. It does
not make the extension unique outside the image or restore a full43 zero
right inverse. No Laurent inverse is evaluated at zeta=0.

The coefficients B_i(v)=Bbar_i(v)/Delta^2 remain rational functions of
direction in this batch. Exact polynomial division by Delta^2 is not
performed here. A degree-two frequency symbol with rational direction
coefficients cannot by itself be called a local differential constraint
PDE. Smoothness on real v!=0 does not give a uniform low-frequency norm,
damping estimate or a lower-order energy bound.

The current geometric=False principal-source extension and fixed background
remain the scope. No geometric=True/actual nonlinear-RHS equivalence,
variable-background theorem, full transformed low-order energy, legal
IBVP, numerical stability/convergence or black-hole result is established.
The earlier full58 principal energy is not enlarged by this closure check.
Physical/live/scientific-payload admission remains false.
