# Fixed-case12 all-real directional section: proposed polynomial certificate

Date: 2026-10-14, Asia/Shanghai.
Status: UNEXECUTED certificate design and source-only mathematical review.
No symbolic import, coefficient construction, test, or new numerical experiment
was performed to write this document. Successful execution must be recorded in
a separate result report; this document is not itself a passing receipt.

Proposed implementation: `scripts/nr_case12_polynomial_section.py`.
Frozen formula sources: `nr_constraint_direction_section.py`,
`nr_constraint_exact_coefficients.py`, and
`nr_profile_exact_coefficients.py` under `scripts/`.
This is an additive continuation of the 2026-10-13 direction-section derivation.

## 1. The precise proposed theorem

Fix the exact case12 background produced by the frozen `Q.case12`:

    alpha = 17/20, chi = 18/25,
    L = [[1, 0, 0], [3/25, 1, 0], [-2/25, 3/50, 1]],
    h = L L^T, u = h^-1,
    shift = (3/100, -1/25, 1/20).

For real v=(x,y,z), define r=v^T v and g=v^T u v. Interpret the
arithmetic and fixed index contractions in the original `R.leading` and
`S.lift` as rational functions of x,y,z with the above fixed coefficients.
Construct S columnwise on the same 43 canonical constraint basis vectors as
the original `S.section`.

The proposed conclusion is

    Dhat(v) S(v) = I43 for every real v != 0.

Consequently this leading, compensated, rational-coordinate constraint map
has rank43 and a15-dimensional kernel at every such direction, and S is a
smooth right section on the punctured real direction space.

The original Python API still accepts only its registered rational designs.
The theorem concerns the source-bound real rational-function extension of
those formulas; it does not claim that `Background` accepts arbitrary real or
symbolic objects. A source bridge and a separate nonvanishing-domain argument
are necessary to connect the certificate to this conclusion.

No claim is made here about the physical zero-frequency constraint map, whose
coordinate conventions and rank differ. Substituting v=0 into a cleared
polynomial identity cannot supply the inverse of a formula undefined there.

## 2. The restricted source bridge

Use exact arithmetic in QQ(x,y,z). Do not retype or refit the matrix formulas.
Extract the frozen function ASTs and preserve every arithmetic expression,
index, loop, contraction, basis-vector construction, and assignment except
the following explicitly enumerated adaptations:

| Original function | Allowed adaptation | Replacement obligation |
| --- | --- | --- |
| `S.lift` | Remove its `Background` instance guard | Supply an immutable symbolic wrapper with exactly the fixed case12 constants and the three named generators |
| `S.lift` | Remove the positivity guard on r, g, chi | Establish positivity independently on the stated real domain |
| `R.leading` | Remove its `Background` instance guard | Use the same fixed-background wrapper |
| `R.leading` | Replace final `exact_array(result)` with `result` | Independently validate the complete43-by58 matrix and exact field membership |
| `S.section` | No formula or control-flow adaptation | Preserve its58-by43 shape, all43 columns, and original calls to the adapted lift |

Retain the original Fraction constructor and43-dimensional Fraction basis
vectors. In particular, the constraint length/type guard in `S.lift` remains
valid and must stay in place. Fraction(0), Fraction(1), and Fraction(i==j)
remain exact constants; the final expression is not converted through float.

The integer loop condition `j % 8 == 0` and resource guard callbacks remain.
There is no permission to remove arbitrary conditionals merely because some
symbolic expressions lack a Boolean ordering.

Bind the complete source-file hashes, selected original AST digests, resulting
adapted AST digests, and an exact adaptation manifest. Require all other AST
nodes to remain unchanged. Reject unregistered formulas, calls, branches,
literal types, or changes in the declared adaptation locations.

Function AST identity alone does not bind its environment. The bridge also
needs to bind and validate:

- the original `Q.case12`, `Q.inverse`, `Q.PAIRS`, and `Q.PAIR_INDEX`;
- `zeros`, array allocation/assignment semantics, and the original 58-state
  and43-constraint orderings;
- `ray_squared = x*x + y*y + z*z` and the exact symbolic ray tuple;
- the original fixed h, chi, alpha, and shift; and
- the dispatch from the unchanged section wrapper to the adapted lift.

The exact inverse routine only sees the fixed rational h. Preserve its source
binding and verify hu=I separately. Keep the complete tensor sums over both
off-diagonal symmetric entries: six-entry storage is not a license to drop
one of the two occurrences in an i,j contraction.

These restrictions describe a transparent arithmetic extension of the
registered source. They do not constitute a proof-assistant verification of
Python, NumPy, SymPy, or the AST compiler. Those components remain in the
trusted implementation base; external mathematical review remains separate.

## 3. Clearing denominators without changing the formulas

For the fixed rational metric, u is a matrix of constant rational numbers.
The only direction-dependent denominator of Dhat is r. Inspecting the lift
gives powers of r and g, with scalar chi in the Hamiltonian reconstruction;
the momentum/trace construction reaches g^2. Factors2,3,4,6 are allowed in
the rational coefficient field.

A sufficient common denominator pair is therefore

    Dtilde = r Dhat,
    Sden = chi r g^2,
    Stilde = Sden S,
    Delta = r Sden = chi r^2 g^2.

This is an envelope, not a claim that every entry requires every factor.
The certificate must actually check that each Dtilde and Stilde entry has
no nonconstant polynomial denominator. It is insufficient to multiply an
expression by the proposed envelope and assume that all denominators vanish.
If the field representation leaves a nonzero constant denominator, absorb
that constant into the rational coefficients canonically. Reject any
remaining positive-degree denominator.

Conservative total-degree ceilings in x,y,z are:

| Object | Shape | Maximum total degree |
| --- | --- | --- |
| Dtilde | 43 by58 | 3 |
| Stilde | 58 by43 | 6 |
| Delta | scalar | 8 |
| P = Dtilde Stilde - Delta I43 | 43 by43 | 9 |

Different state/constraint slots have different degrees; homogeneity of
every complete matrix must not be assumed. In particular, degree-nine
off-diagonal residual terms must be checked even though Delta has degree8.

For fixed constants, all entries belong to QQ[x,y,z]. Require every
coefficient of all1849 entries of P to be exactly zero. No eigenvalue fit,
tolerance, finite-direction substitution, probabilistic identity test, or
indeterminate symbolic simplification result substitutes for that check.

The polynomial identity then holds over the reals because it is an identity
of rational-coefficient polynomials, rather than an observed equality at a
set of sampled real or rational points.

## 4. Domain certificate and transfer to the rational identity

Check the fixed rational identities h=LL^T and hu=I. The displayed triangular
L has nonzero unit diagonal, so h is positive definite. Hence, for real
v!=0, r>0 and g>0; also chi=18/25>0.

For an explicit denominator margin, verify the row-sum bound

    ||h||_infinity = 6/5.

Since h is symmetric positive definite,

    g >= (5/6)r,
    Sden = chi r g^2 >= r^3/2,
    Delta = chi r^2 g^2 >= r^4/2 > 0.

Thus Sden and Delta are bounded below by1/2 on the Euclidean unit sphere.
This is a denominator margin, not a bound on a symmetrizer or on the complete
evolution system. The rational identity follows by dividing the proved
polynomial identity by the nonzero Delta on the declared domain.

The algebraic construction plausibly extends to other SPD metrics, but the
present certificate fixes h. If h becomes symbolic, Q.inverse introduces
det(h) denominators that require a new coefficient domain, denominator
analysis, and source/API scope. Do not infer a general-background result
from this fixed-background certificate.

## 5. Canonical certificate serialization

The agreed matrix format is `nr-case12-polynomial-matrix-v1` with ordered
variables `[x,y,z]`, an explicit matrix shape, and every row-major matrix
entry represented as `[i,j,terms]`. Include zero entries with `terms=[]`.
This makes complete coverage visible and prevents an omitted matrix row or
column from being silently interpreted as a certified zero.

Each polynomial term is `[ex,ey,ez,numerator,denominator]`:

- ex,ey,ez are nonnegative integers with total degree within the registered
  ceiling; Boolean exponents are not integer coordinates for this schema;
- numerator and denominator are canonical integer strings, denominator>0,
  numerator!=0, and their gcd is1;
- exponent triples are unique and strictly sorted in ascending lexicographic
  order, as in the candidate encoder's `sorted(poly.items())`;
- every matrix coordinate appears exactly once in the required row-major
  sequence; and
- floats, NaN, infinities, duplicate terms, unregistered fields, malformed
  rational strings, and extra/missing entries are rejected.

Record exact source/adaptation identities and hashes of the serialized
certificate bytes. The complete residual matrix has1849 explicitly indexed
empty term lists only after the coefficient check actually succeeds.
Do not synthesize that zero matrix merely because a worker summary says
`passed=true`.

Saved polynomial reconstruction and coefficient comparison can be performed
without rerunning the scientific field construction, provided the verifier
strictly checks this schema, the registered degree limits, source identities,
and the construction-to-artifact binding. A checksum alone proves neither
the zero identity nor equivalence to the original formulas.

## 6. Distinct controls and claims

Preregister negative controls that challenge different failure modes:

1. An unexpected factor, sign, index, call, or branch change must fail the
   source/adaptation gate; an allowed guard adaptation must not permit it.
2. A nonpolynomial scaled entry must fail the denominator-clearing gate.
3. A nonzero coefficient, including a term such as xy that vanishes on all
   coordinate axes, must fail the full polynomial-identity gate.
4. Duplicated/missing matrix coordinates or monomials, unreduced fractions,
   malformed denominators, and a degree above the ceiling must fail parsing.
5. The separately registered factor/sign mutations of the retained source
   construction must preserve and expose actual nonzero residual witnesses.

Rational-point comparisons against the original Fraction implementation are
useful bridge regression tests. They do not supply the all-real theorem and
must not be counted as a substitute for complete coefficient identities.

A passing bounded run may support the narrowly named fixed-case12
all-real leading-section certificate, rank43, and smooth right section on
v!=0. It does not establish

    Dhat K (I-S Dhat) = 0

at every direction; that separate kernel-invariance identity is required
before declaring the principal subsidiary quotient closed globally.
No conclusion follows here about its spectrum, projectors, direction-uniform
energy bounds, lower-order estimates, physical zero frequency, damping,
boundary conditions, discretization, nonlinear evolution, or convergence.
The physical/live/scientific-payload gates remain unchanged.
