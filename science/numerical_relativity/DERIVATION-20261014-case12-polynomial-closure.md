# Fixed-case12 all-real principal closure: polynomial certificate design

Date: 2026-10-14, Asia/Shanghai.
Status at creation: UNEXECUTED closure certificate design and source-only
mathematical review. Writing this document involved no symbolic construction,
scientific import, numerical experiment, or test. A separate bounded-run
terminal must establish whether the proposed closure certificate passes.
AI-assisted derivation; external mathematical review remains separate.

This is an additive continuation of
`DERIVATION-20261014-case12-polynomial-section.md`. Its prerequisite is the
source-bound section certificate retained in
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-section-controls-v1-20261014/`.
That predecessor's section result does not itself establish closure; its
`all_direction_closure_validated` flag remains false. Neither its frozen
sources nor its terminal records may be modified or regraded by this batch.

## 1. Fixed domain, operators, and the proposed conclusion

Fix the original exact case12 constants:

    alpha = 17/20, chi = 18/25,
    L = [[1, 0, 0], [3/25, 1, 0], [-2/25, 3/50, 1]],
    h = L L^T, u = h^-1,
    beta = (3/100, -1/25, 1/20).

For real v=(x,y,z) != 0, write r=v^T v and g=v^T u v. Let D=Dhat(v) be
the 43-by-58 compensated leading constraint map from the frozen
`nr_constraint_exact_coefficients.leading`. Let S(v), of shape 58-by-43,
be the fixed source-bound rational right section from
`nr_constraint_direction_section.section`. The prerequisite states

    D(v) S(v) = I43.

Let K(v), of shape 58-by-58, be the rational-function extension of the
original `nr_profile_exact_coefficients.matrix(background, geometric=False)`.
It uses the unnormalised ray v, includes the original beta.v transport term,
and retains all 58 state coordinates in their original order. The fixed
profile and sign convention are those of the original source; no alternative
geometric branch or intrinsic shift-subtracted symbol is substituted.

The proposed new conclusion is

    D(v) K(v) (I58 - S(v) D(v)) = 0

for every nonzero real v. Together with the prerequisite, this establishes
invariance of ker D under the fixed-background principal operator K and the
unique 43-dimensional principal quotient

    Khat(v) = D(v) K(v) S(v),
    Khat(v) D(v) = D(v) K(v).

The quantifier concerns all nonzero real directions for these fixed
background constants. It does not concern arbitrary metrics, gauge
parameters, evolving backgrounds, or the original Python API accepting
arbitrary real inputs.

## 2. Coordinate compatibility and the minimal new source bridge

The original map is Dhat = C43 D0 B58, where C43 multiplies the H, M, and
compensated-determinant rows by sqrt(r), and B58 multiplies the eleven base
state coordinates by sqrt(r). The original K has its first eleven rows and
columns identically zero. Consequently B58^-1 K B58=K for r>0. This is why
the unchanged unnormalised 58-state operator is compatible with Dhat.
Here C43 denotes the row scaling, distinct from the right section S.

Preserve the original first-eleven-zero-block property as an explicit
coefficient check. Do not mix K with a normalised, physical-speed,
intrinsic, or geometric-branch matrix while retaining the same D and S.
Such substitutions would require a separate coordinate derivation.

The new bridge needs no AST edits to `Q.principal_rates` or `Q.matrix`:

| Source component | Required treatment |
| --- | --- |
| `Q.principal_rates` | Compile the complete selected AST unchanged, including nested helper definitions, contractions, index expressions, assignments, branch, and input guard |
| Fraction input guard | Keep it: `Q.matrix` still supplies 58 canonical vectors containing only original `Fraction` values |
| `geometric` branch | Retain the branch and invoke with the explicit Python Boolean `False`; reject a different or implicit caller-selected branch at the certificate entry point |
| `Q.matrix` | Preserve all 58 columns, each resource callback, `np.array(columns, dtype=object)`, and the final transpose |
| `Q.inverse` and its dependencies | Use private unchanged functions from the hash-bound source; the inverse sees only the fixed rational h |
| `PAIRS` and `PAIR_INDEX` | Bind the exact original six symmetric pairs and their index map; preserve full tensor sums over both off-diagonal occurrences |
| Symbolic background | Bind the fixed alpha, chi, h, beta, ray=(x,y,z), and `shift_ray=sum(beta[i]*v[i])` exactly |

The preceding section wrapper did not need `shift_ray`; the principal-rate
source does. Omitting it is a runtime error, while replacing it by zero
would silently change the operator. Every arithmetic scalar must remain an
integer, an exact Fraction, or an element of the registered exact field.

The original profile source SHA-256 at this review is
`1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb`.
Require this complete file identity, the selected original AST digests,
an empty edit manifest for these two new functions, and the private helper
and global-binding manifest. Function AST identity alone cannot bind the
callable reached by `principal_rates`, the inverse helper, Fraction, the
pair map, array creation, or a caller-supplied symbolic context.

Construct the context internally from registered source bytes. Do not
accept an external context, replacement callable, arbitrary matrix, or
mutable imported module attribute as an interchangeable proof source.
The principal matrix must be constructed from these frozen basis-column
calls; a previous candidate matrix or fitted coefficients are not its source.

For D and S, preserve the predecessor's exactly enumerated AST adaptations
and helper-binding obligations. Its accepted artifacts may be reused only
with a byte-identity link to its accepted terminal and complete source
identity. This dependency is explicit: the new construction is independent
of production subsidiary matrices, but shares the original 58-state formula
source and the previously certified section.

## 3. Polynomial construction and the scale factor

Use the exact coefficient field QQ(x,y,z), with polynomial ring QQ[x,y,z].
The predecessor supplies the polynomial matrices and denominators

    sigma = chi r g^2,
    d = r D,
    s = sigma S,
    Delta = r sigma = chi r^2 g^2,
    d s = Delta I43.

The lowercase s in this document denotes the polynomial matrix sigma S,
not sqrt(r). The new principal matrix K is polynomial: h and its inverse
are fixed rational constants and every original principal-rate term is
linear in v, including beta.v. Every entry must nevertheless pass the
registered denominator and degree checks, rather than relying only on this
inspection argument.

Construct and retain

    T = d K,
    A = T s,
    N = Delta T - A d.

The exact scaling relation is

    T = r D K,
    A = r sigma D K S = Delta D K S,
    A d = r Delta D K S D,
    N = r Delta D K (I58 - S D).

Thus the factor linking N to the rational closure residual is r Delta,
not Delta alone. This matters both for the theorem's domain and any
recorded relation between the saved numerator and the original operator.
The quotient, if closure passes, is Khat=A/Delta; A itself is its polynomial
numerator, not the unscaled quotient.

Conservative total-degree ceilings and complete shapes are:

| Object | Shape | Maximum total degree |
| --- | --- | --- |
| d | 43 by 58 | 3 |
| s | 58 by 43 | 6 |
| K | 58 by 58 | 1 |
| T=dK | 43 by 58 | 4 |
| A=Ts | 43 by 43 | 10 |
| Delta | scalar | 8 |
| Delta T | 43 by 58 | 12 |
| A d | 43 by 58 | 13 |
| N | 43 by 58 | 13 |
| r Delta | scalar | 10 |

These are upper bounds, not a claim of homogeneous matrices or mandatory
maximum degree. The degree-13 part must be checked even though the other
term has degree at most 12. Check every coefficient of every one of the
43*58=2494 residual entries. Exact zero means the empty canonical
coefficient map after exact rational cancellation; no tolerance or finite
ray test is used.

Save K, T, A, and N in the predecessor's strict complete row-major polynomial
format, with all zero slots present. Independent replay must reconstruct
T=dK, A=Ts, and N=Delta T-Ad from the bound input polynomials and compare
each complete saved object. A zero-filled N supplied by a producer summary
is not evidence that either product was evaluated correctly.

## 4. Nonvanishing domain and algebraic consequences

The prerequisite verifies h=LL^T, hu=I, and ||h||_infinity=6/5 exactly.
Since L is invertible and h is symmetric positive definite, for v!=0,

    r > 0,
    g >= (5/6) r,
    sigma >= r^3/2,
    Delta >= r^4/2,
    r Delta >= r^5/2 > 0.

On the Euclidean unit sphere all three displayed denominator envelopes are
at least 1/2. This is a denominator margin; it is not an energy estimate.
After all coefficients of N have been checked to vanish, the polynomial
identity holds over the reals. Division by r Delta on this domain gives
the claimed rational closure identity.

For completeness, the quotient argument is finite-dimensional and exact:

1. DS=I makes D surjective with rank 43 and a 15-dimensional kernel.
2. P=I58-SD obeys P^2=P, DP=0, and Pq=q for every q in ker D. Thus its
   image is exactly ker D; it need not be an orthogonal projector.
3. DKP=0 therefore states that K maps ker D into itself.
4. DK=DKSD=Khat D proves existence of the induced quotient.
5. If B D=DK, then B=BDS=DKS=Khat, proving uniqueness.
6. For any other right section J with DJ=I, DKJ=Khat, so the quotient is
   independent of that choice of right section.

The right section and Khat are smooth rational matrix functions on the
punctured real direction space because their denominators do not vanish
there. Kernel invariance does not imply invariance of the chosen
complement: it gives KP=PKP, not in general PK=KP, and it does not give
KS=SKhat. No commutation or invariant-complement claim belongs to this gate.

Although cleared polynomial identities can be evaluated at v=0, division
there is invalid. In particular, this certificate does not establish rank
43, a right inverse, or closure of the differently defined physical
zero-frequency constraint map.

## 5. Acceptance controls and trusted implementation base

Require strict canonical polynomial decoding: exact variables x,y,z;
complete row-major coordinates; sorted unique exponent triples; nonnegative
integer exponents within the registered degree cap; reduced rational
coefficient strings with positive denominator; and explicit zero slots.
Reject missing or repeated slots, malformed fractions, floats, booleans in
integer fields, unsupported schemas, and residual nonpolynomial denominators.

Controls should distinguish at least these possible failures:

- A source factor, index, helper, or branch change must fail source binding.
- A transposed principal matrix or missing shift term must not be accepted
  as the same source construction, even if a particular residual vanishes.
- A nonzero residual monomial such as xy must be rejected even when it
  vanishes on every coordinate axis; finite samples are not the gate.
- A saved T or A changed while N remains zero must fail replay of the
  defining products. Saving N alone is insufficient.
- An actual registered mutation of the retained K construction must yield
  its own nonzero closure-residual coefficient witness. A mathematically
  closure-preserving perturbation cannot be counted as a detected negative.

Not every wrong coefficient necessarily destroys closure. Multiplying K
by a scalar, for example, preserves DK(I-SD)=0 whenever it already holds.
Consequently source binding and negative residual controls are separate
requirements; neither replaces the other.

The exact field builder and independently implemented Fraction-polynomial
replay provide different arithmetic routes. Hashes bind their actual parsed
input bytes to the saved records. Full coefficient replay belongs inside
the owned resource-bounded worker; finalization should use retained reports,
file hashes, pure AST checks, and history checks without a second unbounded
matrix multiplication in the supervisor.

The remaining trusted implementation base includes the frozen formula
selection and coordinate interpretation, Python and its AST compiler,
Fraction arithmetic, exact-field coercion and polynomial operations,
object-array storage semantics, the serialization/decoder implementations,
source and artifact hashing, and the bounded-run controller. Independent
replay reduces shared arithmetic failure modes; it does not formally prove
Python, NumPy, SymPy, the theory source, or the file system. Loaded dependency
source identities are useful provenance, not a proof of full OS/runtime
closure or external expert acceptance.

## 6. Exact scope of a successful terminal

A passing terminal plus the bound predecessor supports fixed-case12,
all-nonzero-real-direction kernel invariance of the compensated leading
constraint map and its unique smooth principal quotient. The original
fixed profile, variable ordering, and ray convention remain part of the
claim. It is a new principal closure result, not a reclassification of old
finite-ray or failed experiments.

It does not establish the quotient spectrum, diagonalizability, direction-
uniform spectral projectors, a positive symmetrizer, energy coercivity,
strong or symmetric hyperbolicity, lower-order estimates, damping,
nonlinear subsidiary closure, boundary well-posedness, convergence,
black-hole evolution, AMR, GPU execution, physical/live admission, or
scientific-payload writeback. Those gates remain distinct and unchanged.
