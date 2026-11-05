# Fixed-case12 full58 principal symbol: six-branch odd annihilator

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, continuing the
existing source-bound workflow. Artifact: mathematical certificate design.
Date: 2026-10-14, Asia/Shanghai. Version: case12_full58_spectral_v1.
Verification Status: UNEXECUTED candidate at creation. Only source reading,
receipt/hash inspection and algebraic reasoning were used to write this
document; no scientific import, polynomial evaluation or test was run.
AI-assisted derivation; external review and formal verification remain
separate. Only the new complete bounded terminal can qualify this design.

## 1. The mathematical parent and the fixed operator

The mathematical input is the accepted closure certificate in
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-closure-controls-v1-20261014`,
not a reconstructed symbol or the failed first energy run. Its gate SHA is
`3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1`,
and worker SHA is
`c063637c0ac86336611dc08303d7b027de2cc0ea3fa37f8050b71981a192fca2`.
Its complete `K.json`, SHA
`e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283`,
is the unchanged 58-coordinate principal matrix from the fixed profile,
with unnormalised ray v=(x,y,z), `geometric=False`, and the original shift.
The parent also binds domain, denominators, source bridge, statistics and
independent replay. Their bytes and qualified artifact membership must be
verified, not merely their filenames or a producer's pass flag.

The originating source `scripts/nr_profile_exact_coefficients.py` has SHA
`1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb`.
Its `principal_rates` leaves rows 0 through 10 zero, never reads input
coordinates 0 through 10, and adds `shift_ray*q[i]` only for i=11,...,57.
The accepted parent compiled its `principal_rates` and `matrix` bodies
unchanged, with the explicit `geometric=False` choice and fixed original
ordering. The new batch consumes its saved K and rechecks every coefficient
of the first eleven rows and columns. It does not rebuild K, D or S.

Fix alpha=17/20, chi=18/25, beta=(3/100,-1/25,1/20), and h=L L^T with

    L = [[1, 0, 0], [3/25, 1, 0], [-2/25, 3/50, 1]].

Write u=h^-1, r=x^2+y^2+z^2, g=v^T u v and b=beta.v. The accepted exact
domain gives h positive definite and g>=(5/6)r>0 for real v!=0. Revalidate
the fixed rational domain and polynomial r,g against the qualified inputs.
The old API accepts rational rays; the real theorem is an algebraic
extension of its fixed source formulas, not a claim that this Python API
accepts arbitrary real objects.

## 2. Remove shift on the PDE coordinates only

Define Pi=diag(0_11,I47). The original `intrinsic` copies its matrix and
subtracts `background.shift_ray` only at diagonal indices 11,...,57, hence

    K0=K-b Pi.

It is incorrect to subtract b I58. That would assign spurious intrinsic
speeds to the eleven ODE coordinates. The new source bridge executes the
original `intrinsic` body unchanged. Bind the original Background getters,
inverse helpers, exact constants, array semantics and private namespace,
as well as the selected function AST; AST text alone does not bind a
replacement helper or externally supplied context.

The original `Background.metric_normal_squared` equals g/r, and the six
entries returned by its unchanged `squared_speeds` are c_j*g/r, where

    c = (2601/100000, 2601/50000, 2601/5000,
         153/125, 459/250, 306/125).

Their original ordered names are ordering-T, ordering-L, light, lapse,
shift-T, shift-L. Since K0 uses v rather than v/sqrt(r), its squared speed
parameters are r times the original returned values, namely c_j*g. Verify
this relation exactly. Do not substitute the quotient's X=rL convention,
its first-three-branch restriction, or its additional r^2 factor.

The new bridge retains a digest of the original `annihilator` AST as the
formula reference. It does not call that all-at-once helper to produce the
saved stages. The next section proves the staged recurrence is the same
matrix polynomial; the worker must verify every stage independently.

## 3. The complete polynomial identity

All certificate arithmetic takes place in QQ[x,y,z]. Define

    Q=K0^2, Z0=K0,
    Zj=Zj-1 Q-c_j g Zj-1, j=1,...,6.

Here Q names the saved squared matrix, not the originating Python module.
Since c_j*g is scalar, induction gives

    Zj=K0 product_(ell=1..j)(K0^2-c_ell g I58).

The sole final spectral question is the complete identity Z6=0. This is
an odd degree-thirteen annihilating polynomial candidate, not a claimed
minimal polynomial. Intermediate Zj need not vanish. All six factors are
retained in their registered order, without branch search after failure.

K and K0 are homogeneous of degree one. Q is homogeneous of degree two;
Zj is homogeneous of degree 2j+1. Verify the degree of every nonzero
monomial, not only a maximum or the numerical value on sampled directions.
The zero polynomial satisfies each registered homogeneity condition.

| Object | Complete shape | Degree cap / nonzero homogeneity |
| --- | --- | ---: |
| Pi | 58 by 58 | 0 |
| K0 | 58 by 58 | 1 |
| shift_residual=K-K0-b Pi | 58 by 58 | 1 |
| embedding_residual=K0-E B E^T | 58 by 58 | 1 |
| Q | 58 by 58 | 2 |
| Z1,Z2,Z3,Z4,Z5,Z6 | six 58 by 58 | 3,5,7,9,11,13 |

The eleven main matrices contain 37004 slots, including every explicit
zero entry. The three residual matrices Z6, shift_residual and
embedding_residual contribute 10092 slots required zero. Parent K is
an input, not a twelfth newly constructed main matrix.

## 4. Why the producer may multiply a 47-coordinate block

Let E be the fixed embedding of coordinates 11,...,57, so E^T E=I47 and
EE^T=Pi. Before block arithmetic, validate the full K/K0 first-eleven-zero
structure and the complete identity K0=E B E^T with B=E^T K0 E. This proves
Pi K0=K0 Pi=K0. Then

    Q=E B^2 E^T,
    Zj=E [zj-1 B^2-c_j g zj-1] E^T.

The full factor Q-c_j*g*I58 has a nonzero -c_j*g*I11 ODE block. It cannot
be represented by merely zero-padding its 47 block. The staged result
can be embedded because its left factor Zj-1 vanishes in every ODE row
and column. This distinction is required for the equivalence argument.

The producer may use this checked invariant block to compute one square
and six recurrence products. It must restore, validate and save a complete
58-by-58 matrix at every stage. The independent replayer directly computes
all corresponding full58 products from the saved parent K; it does not
reuse the producer's 47-block optimization or a producer intermediate as
the mathematical definition of its next stage.

Canonical encoding uses the existing row-major polynomial matrix schema,
with all slots, sorted unique exponent triples and exact reduced rational
coefficients. Checking every coefficient gives an identity over the reals;
testing a finite ray set cannot replace this step.

## 5. Two different negative controls

For a two-by-two matrix N=x E01, N^2=0. Run the same six-stage recurrence
with the original six c_j and the same g polynomial. It gives

    p13(N)=N product_j(N^2-c_j g I2)
           =(+ product_j c_j) g^6 N != 0.

The positive sign comes from six negative factors. The exact polynomial
is nonzero even though its evaluation can vanish on a special plane such
as x=0. Save the complete N,Q,Z1,...,Z6 and expected_Z6 in the nilpotent
record, plus the full nonzero coefficient witness. This demonstrates why
a squared-spectrum identity would miss a zero-root Jordan chain. It does
not mutate the physical full58 matrix or stand in for its actual replay.

Separately define delta_Z6=x^13 E_(11,11) and mutant_Z6=Z6+delta_Z6.
Save both complete58 matrices and reject a nonzero mutant using the same
exact residual validator. This is an explicit certificate-residual
mutation, not a rerun of a perturbed K through six stages. Its rejection
must be measured; if the main Z6 were -delta_Z6, the mutant would cancel
and this negative would fail. Do not assume a main-candidate pass before
saving the negative or replace its actual coefficients with an expected
one-entry answer.

## 6. Conditional real-direction conclusion and its limits

If the full coefficient identity and domain checks pass, then for every
real v!=0 the polynomial

    p_v(t)=t product_(j=1..6)(t^2-c_j g(v))

has thirteen distinct real roots: 0 and +/-sqrt(c_j*g). The six c_j are
strictly positive and pairwise distinct, and g>0. A matrix annihilated by
a square-free real polynomial with only real roots is diagonalizable
over the reals. Thus K0(v) is pointwise real diagonalizable, with spectrum
contained in these nodes; no branch presence or rank is assumed.

The validated block identity gives K=0_11 direct-sum (B+b I47). Therefore
K(v) is also pointwise real diagonalizable. A coincidence between an ODE
zero and a shifted PDE eigenvalue does not create Jordan coupling across
this proved direct sum. This conclusion uses the complete first-eleven
row-and-column check, not only eleven zero rows.

This batch does not construct H58, its spectral projectors/action, a Gram
identity, or concrete uniform energy bounds. It does not register a full58
uniform strong-hyperbolicity qualification. The accepted43 quotient energy
remains separate: D^T H43 D has rank at most43 and is not positive definite
on the full58 space. No extension is made to the geometric=True formula,
varying backgrounds, low-order/full-frequency estimates, zero-frequency
constraint rank, nonlinear evolution, boundaries, black holes, AMR,
waveforms, convergence, live admission or scientific payload writeback.

The trusted base includes the original GR formulas and coordinate choice,
Python AST/compiler, object-array behavior, exact producer algebra,
stdlib integer/Fraction replay, canonical parsers and serializers,
hashing and the bounded controller. Independent full-coefficient replay
reduces shared arithmetic failure modes; it is not an independent GR
solver, external replication or a formal proof of the runtime.
