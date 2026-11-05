# Fixed-case12 projector/action compression: exact divisibility candidate

## Material Passport

Origin Skill: academic-research-suite / experiment-agent (continuation of the
existing source-bound workflow). Artifact: mathematical derivation.
Date: 2026-10-14, Asia/Shanghai. Version: case12_polynomial_compression_v1.
Verification Status: UNEXECUTED candidate at creation; read-only source
review and algebraic derivation only. No scientific import, matrix
calculation, experiment, or test was executed to prepare this document.
AI-assisted work; not external mathematical review or proof-assistant
certification. Execution results belong to a separate bounded-run terminal.

## 1. Accepted parent and the single new question

The immutable parent is
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-projectors-controls-v1-20261014/`.
Its qualification-gate SHA-256 is
`a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1`;
its worker-result SHA-256 is
`7fb37e236fd4754b6378ea779c7da49fba4751557935babf57173342cf3695d9`.
Reuse the exact fourteen saved N/M numerators, scalars and domain records.
Do not rebuild K, the right section, closure, spectral chain, projectors,
actions, or an energy matrix.

Keep fixed case12, the original 43 coordinates and branch order. For real
v=(x,y,z)!=0, put r=v^T v and g=v^T h^-1 v. The accepted fixed positive
metric gives g>=(5/6)r>0. The parent supplies

    D=r^6 g^3, eta=r^5 g^2,
    (O,E0,E1,...,E6)=(NO,N0,N1,...,N6)/D,
    L Ej=Mj/eta, j=1,...,6,
    L=X/r, P=Pt/r.

The eight component ranks are inherited as 11,12,8,4,8,0,0,0; they are not
newly measured in this unit. The last three N/M branches remain explicit
zero matrices. Preserve ODE O and PDE zero-speed E0 as separate components.

The only new candidate is

    Ni = r^5 Nbar_i, i=O,0,1,...,6,
    Mj = r^4 Mbar_j, j=1,...,6,

as identities in QQ[x,y,z], checked entry by entry on the complete matrices.
Do not search for factors or try a smaller power after failure. A rational
formula with denominator r, low total degree, pointwise diagonalizability,
or a square-free annihilator does not itself establish polynomial
divisibility. Possible longitudinal/transverse structure motivates this
candidate but does not replace its exact certificate. No auxiliary claim
that r^(k-1) divides X^k is required or proved here.

## 2. Single-divisor normal form and complete failure evidence

Use the polynomial ring QQ[x,y,z] with lexicographic monomial order x>y>z.
The two prescribed divisors are fN=r^5 and fM=r^4. They are homogeneous,
monic, and have leading exponents (10,0,0) and (8,0,0), respectively.
For each original matrix entry a, retain exact quotient q and normal
remainder rho such that

    a = f q + rho.

Check every coefficient of the division identity a-fq-rho. Normal form
requires that no remainder monomial is divisible by the leading monomial
of f. Here this means x exponent less than 10 for fN, or less than 8 for
fM. A remainder can have high y/z degree; total-degree-smallness is not
the normal-form condition. For a single divisor this identity and normal
form identify the same unique remainder as exact lex division.

Separately save the multiplication-back residual

    multiplyback = a-fq.

This equals rho when the division identity passes. It is intentionally
not a-fq-rho: subtracting the remainder would make this field zero even
when the proposed cancellation fails. Candidate acceptance requires both
the complete remainder and complete multiplyback to vanish. A correct
division identity with a nonzero remainder is a correctly computed
rejection, not a successful compression.

For each of the fourteen matrices, save three complete 43-by-43 matrices
named `<name>_quotient`, `<name>_remainder`, `<name>_multiplyback`, in the
registered order NO,N0,N1,...,N6,M1,...,M6. The 25886 input slots produce
42 saved main matrices / 77658 slots. Of these, 51772 remainder and
multiplyback slots must be zero for a pass. The quotient slots are not
required to be zero. The 25886 division identities are also checked in
the division records; they do not add another family of matrix files.

Each completed quotient, remainder and multiplyback is saved before
moving on. A nonzero remainder does not abort the remaining fourteen
divisions: retain the complete available candidate and independent replay
before rejecting it. A resource interruption remains partial evidence.

## 3. Independent arithmetic and source binding

The producer binds the original `scripts/nr_case12_polynomial_blocks.py`
single-divisor routine `_divide_scalar` and the `divide_matrix` contract
without changing their formulas. Its matrix orchestration may invoke the
original scalar routine for each slot and persist the registered three
outputs. The frozen whole matrix helper is not rerun as a separate batch.
Bind the producer's imported dependencies and source identities to the
accepted projector parent; binding a routine's AST does not by itself
prove its semantics.

An independent standard-library Fraction route must decode the same bound
input bytes, perform sparse lex long division with no SymPy arithmetic,
reconstruct quotient, remainder and multiplyback, check full identities
and normal form, and compare every saved coefficient. It must not accept
the producer's `accepted` boolean as evidence. The long-division loop
eliminates a divisible leading monomial or moves an indivisible leading
monomial to the remainder, terminating under the registered monomial order.

All matrices retain explicit row-major zero slots and canonical reduced
rational coefficients. Record the leading exponent/coefficient, factors,
degree/term statistics, row acceptance and complete overall acceptance.
Validate the specified required fields and canonical coefficient format;
this is not a general-purpose JSON-schema or CAS formal verification.

The two arithmetic paths share the mathematical inputs, so their scope is
independent exact reconstruction of this local certificate. They are not
an independent external-team solver or proof of all Python/SymPy behavior.

## 4. Actual constant-offset negative control

Make a real copy of the bound parent N1 and add the constant polynomial 1
to its [0,0] entry, leaving every other entry fixed. Divide that complete
mutant by the same fN=r^5. Save all 1849 slots of

    mutation_N1_quotient,
    mutation_N1_remainder,
    mutation_N1_multiplyback.

These three extra matrices add 5547 slots; they are not included in the
77658 main count. The independent route reconstructs the altered input
from the original parent and verifies the full division and rejection.
If the main candidate is divisible, this mutation leaves its quotient
unchanged and has remainder and multiplyback equal to the matrix with 1
in [0,0] and zero elsewhere: a nonconstant r^5 cannot divide 1.

If the main candidate fails, keep both its actual residuals and the actual
mutant result. Do not synthesize a unit residual or discard the main
failure. Distinguish a malformed algorithm/record from a legitimate
nondivisible candidate. The negative control is a numerator perturbation,
not a new physical evolution or change to the accepted parent.

## 5. Consequences conditional on complete divisibility

Only after all fourteen divisions and independent replay pass may the
quotients be interpreted as Nbar_i and Mbar_j. Then, for real v!=0,

    Dbar = D/r^5 = r g^3,
    etabar = eta/r^4 = r g^2,
    Ei=Nbar_i/Dbar, LEj=Mbar_j/etabar.

These rational functions are exactly the accepted parent functions. Their
projector, action, completeness and rank interpretations transfer through
the identities; there is no new eigensystem fit or direction sample.

The parent full coefficient records bound every N degree by 19 and every
M degree by 16 (the old conservative construction caps were 24 and 20).
The new unit must verify these sharper input bounds before using them.
Since r^5 and r^4 are homogeneous of degrees 10 and 8, successful exact
division yields quotient degree bounds

    deg Nbar_i <= 9, deg Mbar_j <= 8.

For zero matrices the canonical degree is -1. A degree bound is a cost
bound, not an independent divisibility proof. Off the unit sphere, Dbar,
etabar are positive with

    Dbar >= (5/6)^3 r^4,
    etabar >= (5/6)^2 r^3.

No rational expression here is extended to v=0.

## 6. Original H after cancellation: future algebra, not this batch

Retain the original `nr_constraint_laurent_energy.py:paired_energy` formula,
file SHA-256
`4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b`.
Write G=Gt/r, where Gt is diagonal with entries 1 on the original
SCALED_ROWS=(0,1,2,3,41), and r on the other coordinates. Thus G is positive
for r>0 and equals I43 on r=1. The component weights remain

    (wO,w0,w1,...,w6)=(1,1,1/2,...,1/2),
    sum_i 1/wi=14, sj=cj g.

The six positive constants cj and their original order are unchanged.
The original energy is

    H = sum_i wi Ei^T G Ei
        + sum(j=1..6) (LEj)^T G (LEj)/(2 cj g).

Assuming the proposed divisions pass, let

    taubar = r Dbar^2 = r^3 g^6.

Direct substitution gives

    H = Hbar/taubar,
    Hbar = sum_i wi Nbar_i^T Gt Nbar_i
           + sum(j=1..6) [g/(2 cj)] Mbar_j^T Gt Mbar_j.

The action coefficient follows from
taubar/(2 cj g r etabar^2)=g/(2 cj). It is not the earlier uncompressed
coefficient r^2 g/(2 cj). The last three action terms vanish by the accepted
explicit zero matrices; keep the original six-branch representation.

For the unchanged Gram coercivity identity, define all eight differences

    Fbar_i = Nbar_i-Dbar I43/(14 wi).

The future coefficient identity to construct is

    Hbar-Dbar^2 Gt/14
      = sum_i wi Fbar_i^T Gt Fbar_i
        + sum(j=1..6) [g/(2 cj)] Mbar_j^T Gt Mbar_j.

Dividing by taubar recovers H-G/14 as the original sum of nonnegative
Gram terms. Each absent paired projector still contributes G/98 through
its difference factor; dropping those three factors changes the identity.
Preserve every weight and all eight differences. This derivation specifies
the later computation and does not register the Gram identity as verified.

The conditional degree ceilings for that later unit are

    Hbar:20,
    Hbar X-X^T Hbar:24,
    Hbar Pt-Pt^T Hbar:22.

They follow from deg Gt<=2, deg g=2, deg X<=4, deg Pt<=2, and the quotient
bounds above. The symmetry residual Hbar-Hbar^T and Gram residual have
degree at most 20. taubar>=(5/6)^6 r^9>0. Neither degree ceilings nor a
positive denominator establish an H norm bound or a completed energy gate.

## 7. Claim and resource boundary

This batch computes no Hbar, Gram product, HL/HP residual, coercivity
identity, numerical eigenbasis or explicit uniform upper constant. It
uses no new large matrix multiplication. Full exact division still has
nontrivial time/output cost; prior runtimes are not guarantees.

All tests, producer divisions, scalar checks, mutations and independent
Fraction reconstruction run inside the owned worker. Finalization reads
saved JSON, byte hashes, pure source/AST and parent manifests, inventories
and cleanup status. No mathematical verification is repeated after the
resource envelope. Any failure is retained with no automatic retry,
weaker factor or budget increase.

A pass establishes only this source-bound polynomial representation
compression on fixed case12, and the stated conditional algebra for later
work. Direction-uniform energy/strong hyperbolicity, the complete 58-state
main system, low-order and zero-frequency estimates, boundary conditions,
convergence, black holes, AMR, waveform validation, live admission and
scientific payload writeback retain separate, unpassed gates.
