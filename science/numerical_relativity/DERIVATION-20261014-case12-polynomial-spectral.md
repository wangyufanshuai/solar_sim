# Fixed-case12 seventh-degree spectral annihilator: certificate design

Date: 2026-10-14, Asia/Shanghai.
Status at creation: UNEXECUTED spectral candidate and source-only derivation.
No scientific import, symbolic construction, experiment, or test was run to
write this document. A separate bounded-run terminal must establish any
execution result. AI-assisted derivation; no external mathematical review or
proof-assistant certification is claimed.

## 1. Accepted inputs and fixed real domain

The dependency is the completed ODE-block and exact-cancellation certificate
in `tmp/nr-shadow-evidence/nr-k3-case12-polynomial-blocks-controls-v1-20261014/`.
Its terminal SHA-256 is
`426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7`;
its worker-result SHA-256 is
`6c6ee2e00809d64111c900a4eb61a0eb864e9ba8686988fdef4c944f3f003c1e`.
Reuse its saved exact quotient Ab, polynomial complementary projector Pt,
and fixed-domain scalar data. Do not reconstruct the original 58-state K,
the right section S, or the prior closure numerator A.

Keep the original case12 background, coordinate ordering, and rational-ray
convention. For v=(x,y,z), let

    r=v^T v, g=v^T h^-1 v, b=beta.v,
    P=Pt/r, O=I43-P,
    Khat=Ab/r, L=Khat-bP,
    X=Ab-bPt, so L=X/r.

The parent establishes P^2=P, O^2=O, rank(O)=11, rank(P)=32, and
LO=OL=0. Its domain certificate gives g>=(5/6)r>0 for every real v!=0.
All divisions in this document take place on that fixed nonzero-direction
domain. Substituting v=0 into a polynomial numerator does not extend the
underlying rational operator there.

The proposed result concerns this 43-dimensional constraint quotient.
It does not cover the full 58-dimensional principal system or its
15-dimensional constraint kernel, general backgrounds, or evolving metrics.

## 2. Preserve all six original squared-speed branches

The frozen `Q.Background.squared_speeds` gives unit-normal squared speeds
proportional to g/r. Multiplication by r gives the unnormalised ray speeds

    s_j=c_j g,
    c=(2601/100000,2601/50000,2601/5000,153/125,459/250,306/125).

Their original order and names are

    ordering-T, ordering-L, light, lapse, shift-T, shift-L.

All six c_j are strictly positive and pairwise distinct. They come from the
fixed source and alpha=17/20, chi=18/25, not a fit to the parent matrix.
The source file is `scripts/nr_profile_exact_coefficients.py`, SHA-256
`1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb`.
The implementation may clone the original squared-speed method unchanged
to obtain these exact rational coefficients. Bind the complete source hash,
selected AST, fixed scalar environment, original branch order, and empty
formula-edit manifest. Do not execute Decimal, square-root, or eigensolver
paths to determine the constants.

The source of the paired interpolation formula is
`scripts/nr_constraint_laurent_energy.py:paired_energy`, with file SHA-256
`4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b`.
Bind its complete AST as the algebraic source, without executing its
43-dimensional projector products, Gram energy, or coercivity calculation
in this batch. The intrinsic relation remains the hash-bound formula from
`nr_constraint_exact_coefficients.py`, not an independently chosen shift
subtraction.

Using only the first three branches in the proposed annihilator is a new
candidate, not a conclusion inherited from older finite-ray multiplicities.
All six branches remain present in the interpolation certificate below.

## 3. Four products for a complete seventh-degree identity

Define

    Q=X^2,
    Z0=X,
    Zj=Z(j-1) Q-c_j g r^2 Z(j-1), j=1,2,3.

Each Zj includes the scalar factor times every diagonal identity action;
there is no selective restriction to a sampled eigenspace. The exact
relation is

    Zj = r^(2j+1) L product(k=1..j)(L^2-s_k I43).

In particular,

    Z3/r^7 = L(L^2-s1 I43)(L^2-s2 I43)(L^2-s3 I43).

Compute the four complete matrix products X*X, Z0*Q, Z1*Q, Z2*Q.
Save every entry of X,Q,Z1,Z2,Z3, including explicit zeros. These are
5*43*43=9245 matrix slots. The conservative total-degree ceilings in x,y,z
are respectively 4,8,12,20,28. They are upper bounds, not uniform
homogeneity assumptions about the whole matrix.

Success requires every coefficient of all 1849 entries of Z3 to be exactly
zero. Independent Fraction replay must reconstruct X from the accepted Ab,
Pt,b, recompute Q and each successive Zj, and compare every saved entry at
each stage. Comparing a supplied terminal zero matrix alone is insufficient.
The complete chain also binds any nonzero final residual to the intended
candidate recurrence.

The name is a seventh-degree annihilating-polynomial candidate. Even a
successful identity does not establish that it is the minimal polynomial:
some of its roots might not occur in the spectrum. No branch rank or
characteristic multiplicity is inferred from this identity alone.

## 4. What the simple real roots imply

At a fixed nonzero real direction define

    p_v(t)=t(t^2-c1 g)(t^2-c2 g)(t^2-c3 g).

The seven possible roots are 0 and the three pairs +/-sqrt(c_j g).
Positivity of g and the distinct positive c_j make these roots real and
pairwise distinct. Hence p_v is square-free. If Z3=0, division by r^7>0
gives p_v(L)=0. The minimal polynomial of L divides this square-free
split polynomial, so L is diagonalizable over the reals at this direction.
Since the identity and positivity hold for every nonzero real direction,
the conclusion holds pointwise throughout the fixed domain.

This excludes nontrivial Jordan blocks at zero as well as at the candidate
nonzero roots. It states only that the spectrum is contained in those
seven values, not that every value occurs or has a prescribed multiplicity.
The accepted O/P split also makes Khat=L+bP block diagonal: zero on range O,
and L+bI on range P. Thus the same pointwise diagonalizability transfers to
Khat. An accidental equality between an ODE and a shifted PDE eigenvalue
does not create coupling between these already separated invariant blocks.

This batch does not register a direction-uniform energy or diagonalizer
bound. No measured condition number, bounded projector norm, explicit
coercivity certificate, or strong-hyperbolicity qualification is supplied
by declaring these pointwise conclusions. Those are later gates.

## 5. Exact scalar certificates for the retained interpolation formula

Put Y=L^2/g. Multiplying p_v(L)=0 by L and dividing by g^4 gives

    m4(Y)=0,
    m4(y)=y(y-c1)(y-c2)(y-c3).

This implication uses the stronger seventh-degree identity. Checking only
m4(L^2/g)=0 would not exclude a nonzero nilpotent zero-speed block.

For the seven original nodes a0=0 and a_j=c_j, define the exact scalar
Lagrange polynomials

    e_j(y)=product(k=0..6,k!=j)(y-a_k)/(a_j-a_k), j=0,...,6.

The original paired-energy construction starts each nonzero branch on P
and multiplies (L^2-s_k P)/(s_j-s_k). Using LP=PL=L and P^2=P gives

    E_j=e_j(Y)P for j=1,...,6,
    E0=P-sum(j=1..6)E_j=e_0(Y)P.

Keep this P factor and retain all six branch names. The scalar node-zero
projector is the PDE zero-speed piece, not the separate ODE projector O.

For every j=0,...,6 save exact quotient/remainder data

    e_j=q_j m4+rem_j.

For j=0,1,2,3 the expected remainder is the degree-at-most-three Lagrange
polynomial for the four nodes (0,c1,c2,c3). For j=4,5,6 the expected
remainder is zero. Verify each division identity, degree bound, and the
complete coefficient difference between actual and expected remainder.
Only then may the last three original pair projectors be concluded to
vanish at this fixed background for all nonzero real directions.

Additional exact scalar residuals certify the interpolation algebra:

- one completeness remainder for sum(rem_j)-1 modulo m4;
- all 49 ordered orthogonality/idempotence remainders
  rem_i rem_j-delta_ij rem_i modulo m4;
- six squared-speed remainders (y-c_j)rem_j modulo m4;
- one zero-action remainder t*rem_0(t^2) modulo
  p7(t)=t(t^2-c1)(t^2-c2)(t^2-c3);
- a Bezout identity a(t)p7(t)+b(t)p7'(t)=1, together with the nonzero
  coefficient p7'(0)=-c1*c2*c3 for its single zero root.

The zero-action identity is separate from the squared-speed relations.
After applying it to L/sqrt(g), it gives the intended LE0=0 relation.
No square root needs to be evaluated by the coefficient algorithms.
The scalar quotient identities permit substitution into the accepted
matrix annihilator. They do not claim that this batch explicitly built and
multiplied seven complete 43-dimensional projector matrices or an energy.

Use exact QQ coefficients, never decimal approximations to the nodes.
The registered one-variable format is `nr-case12-spectral-univariate-v1`,
with each polynomial stored as ascending powers
`[power,numerator_string,denominator_string]`; explicit zero is an empty
term list. Preserve seven projector rows, source branch identities, all
49 ordered pairs, and every coefficient of every quotient and remainder.
The coefficient parser rejects duplicate powers, noncanonical fractions,
and noninteger exponent fields; replay checks complete row coverage and
the registered branch identities. This is validation of the specified
certificate fields, not certification of a general-purpose strict JSON
schema parser. Scientific identity also depends on the fixed source and
the exact saved input bytes.

## 6. Nilpotent control: why the odd polynomial is necessary

Use the separate two-dimensional logical counterexample

    N=[[0,1],[0,0]], r=g=1.

N is nonzero and N^2=0. Therefore the square-spectrum candidate obeys

    m4(N^2)=0,

but the registered odd polynomial gives

    p7(N)=-c1*c2*c3 N != 0.

Save N, N_squared, odd_result, and even_result as complete 2-by-2 exact
Fraction-string matrices and independently reconstruct both results.
This exposes an acceptance procedure that checks only squared spectral
data and silently permits a zero Jordan block. It is a logical algorithm
negative control, not a physical 58-state model mutation or a second
background experiment.

The cheap controls may also use 2-by-2 companion matrices for each of the
six positive branches, distinguish the three annihilated candidates from
the last three retained nonzero results, and vary nonunit r and g to catch
missing powers. These do not replace the complete parent-bound 43-by-43
coefficient identity.

## 7. Failure evidence, source bridge, and proof boundary

If Z3 is nonzero, save every computed chain matrix, all nonzero final
coefficients, source/parent binding, scalar certificates, statistics, and
the independent replay before rejecting the candidate. Do not append the
remaining three factors, fit different speeds, weaken exact-zero checks,
or retry under a larger budget. A timeout or output-limit interruption is
partial evidence, not a completed nonzero-polynomial counterexample.

All mathematical construction, scalar division/Bezout calculations,
negative-control calculations, and independent polynomial convolution must
run within the owned worker. The finalizer performs only JSON/hash/AST,
source, dependency, and history checks. Hash the exact bytes actually
parsed by replay. Preserve every accepted parent and earlier failed run.

The trusted base includes the source-to-rational-formula interpretation,
Python/AST execution, exact arithmetic libraries, object-array semantics,
canonical parsing and serialization, and the bounded controller. Distinct
CAS and standard-library Fraction routes reduce shared arithmetic error;
they are not a formal semantics proof or independent-team reproduction.

No successful result here qualifies uniform energy, the original I/14
coercivity bound, a common symmetrizer, lower-order estimates, nonlinear
subsidiary closure, physical zero frequency, boundaries, convergence,
black-hole evolutions, AMR, GPU execution, live admission, or scientific
payload writeback. The old energy convention and all six branches remain
unchanged for their separately registered future certificate.
