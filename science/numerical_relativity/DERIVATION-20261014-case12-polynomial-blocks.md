# Fixed-case12 ODE blocks and quotient compression: certificate design

Date: 2026-10-14, Asia/Shanghai.
Status at creation: UNEXECUTED block/compression candidate; source-only
mathematical derivation. No mathematical import, symbolic construction,
numerical experiment, or test was run to write this document. Execution and
acceptance belong to a separate bounded-run terminal. AI-assisted derivation;
not external mathematical review or proof-assistant certification.

The accepted dependency is the fixed-case12 all-real principal closure
certificate in
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-closure-controls-v1-20261014/`,
with terminal SHA-256
`3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1`
and worker-result SHA-256
`c063637c0ac86336611dc08303d7b027de2cc0ea3fa37f8050b71981a192fca2`.
Its saved numerator A and denominator Delta remain unchanged inputs. This
new batch must not rebuild the parent closure or regrade any parent result.

## 1. Coordinates and accepted prerequisites

Keep the exact background, coordinate orders, and rational-function
interpretation in `DERIVATION-20261014-case12-polynomial-closure.md`:

    alpha=17/20, chi=18/25,
    L=[[1,0,0],[3/25,1,0],[-2/25,3/50,1]], h=L L^T, u=h^-1,
    beta=(3/100,-1/25,1/20), v=(x,y,z), r=v^T v, g=v^T u v,
    b=beta.v, sigma=chi r g^2, Delta=r sigma.

For every real v!=0 the parent gives a unique principal constraint quotient

    Khat(v)=A(v)/Delta(v),
    Khat Dhat = Dhat K,

where the 43-by-43 polynomial A has total degree at most 10. This is the
shift-containing, unnormalised rational-ray quotient. It is not a matrix of
physical characteristic speeds and is not already the intrinsic operator.

The exact domain certificate gives

    g >= (5/6)r, sigma >= r^3/2, Delta >= r^4/2.

Thus r, sigma, and Delta are positive for all nonzero real v. Values of the
cleared polynomials at v=0 do not define the original rational operators.

## 2. The original ODE projector and source bridge

The unchanged source `scripts/nr_constraint_exact_coefficients.py` contains

    GROUPS=((8,1),(11,3),(20,6),(38,1)),
    SCALED_ROWS=(0,1,2,3,41).

For a group (start,width), its original `ode_projector` assigns

    O[start+width*k+j, start+width*ell+j] = v[k] v[ell]/r

for k,ell=0,1,2 and j=0,...,width-1. All other entries are zero. These are
coordinate longitudinal projectors, not metric-normal projectors: the
denominator is r, not g, and no inverse-metric contraction is inserted.

The groups cover the auxiliary rA, rB, rD, and rP slots, respectively:

| Group | Slots | Independent longitudinal fibres |
| --- | --- | --- |
| rA | 8 through 10 | 1 |
| rB | 11 through 19 | 3 |
| rD | 20 through 37 | 6 |
| rP | 38 through 40 | 1 |

The remaining ten constraint slots have zero O rows and columns. Each
fibre contributes one longitudinal coordinate, so the expected rank is
1+3+6+1=11. This rank must be justified by the source structure and an exact
trace identity, not inferred merely from an idempotence residual.

The original source hash is
`ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce`.
The implemented source bridge is:

- Extract `ode_projector` unchanged, with its exact GROUPS binding and its
  private original `zeros` helper. Preserve every nested loop and index.
- Bind the original `intrinsic` AST digest as the source of the shift
  formula, without compiling or executing that function. Derive its cleared
  numerator algebraically from the accepted A/Delta. Neither `exact_array`
  nor `eye` is executed or adapted for this route.
- Bind `zeros`, Fraction, array semantics, and dispatch to the original
  `ode_projector`; bind `ray_squared` and `shift_ray` to the original
  fixed-background getters under the exact symbolic ray extension.
- Record matching original/adapted AST hashes and an empty edit manifest
  for the two compiled functions, `zeros` and `ode_projector`. Record the
  distinct algebraic bridge from the hash-bound intrinsic expression;
  unchanged AST alone is not a complete environment binding.

The original intrinsic arithmetic is

    H = Khat - b (I43-O).

The implementation records its equivalent cleared identity
`Delta*L=A-b*sigma*(r*I-Ot)`, where that manifest's L denotes H in this
document. Complete independent reconstruction of B below checks this
algebraic bridge. This is not execution of a modified intrinsic API.

Removing b I43 instead would alter the ODE block. Swapping the sign of b,
transposing groups, or replacing r by g is not an allowed adaptation.
The context and helper bindings must be constructed internally from frozen
source bytes rather than accepted as caller-supplied proof inputs.

SCALED_ROWS belongs to the original normalisation contract. The diagonal
row scaling C43 equals sqrt(r) on those five rows and one elsewhere. None
of those rows lies in the four O groups, so C43 O=O C43=O. Consequently O is
compatible with the parent's rational-coordinate similarity. This does not
justify applying the principal-entry normalisation formula to every matrix
in the batch or assuming that the whole rational quotient is homogeneous.

## 3. Three complete polynomial block identities

Define polynomial matrices

    Ot = r O,
    Pt = r I43 - Ot,
    B = A - b sigma Pt.

Here Pt/r=I43-O is the complementary projector; Pt itself is not an
idempotent projector. Since Delta=r sigma,

    H = A/Delta - b Pt/r = B/Delta.

The proposed complete identities are

    Ot^2 - r Ot = 0,
    B Ot = 0,
    Ot B = 0.

Each is a full 43-by-43 identity with 1849 explicitly indexed residual
entries. All three together require 5547 residual slots, without omitted
rows or implicit zero padding. Check every rational polynomial coefficient
exactly; no finite collection of directions substitutes for these identities.

In addition, retain source-bound symmetry and trace checks

    Ot^T=Ot,
    trace(Ot)=11 r.

The implementation's independent replay checks every saved Ot entry against
the explicitly reconstructed symmetric formula v[k]v[ell] in each original
group. That complete comparison supplies the symmetry check; a separate
saved symmetry residual or acceptance flag is not required. The trace
residual is explicitly computed and saved.

The three matrix identities alone do not encode the numerical value 11.
The trace check supplies it and guards group widths and coverage. Derive or
check Pt^2=r Pt and Ot Pt=Pt Ot=0 from Pt=rI-Ot, without treating them as
independent evidence for any spectral statement.

Degree and shape limits are:

| Object | Shape | Maximum total degree |
| --- | --- | --- |
| r | scalar | 2 |
| b | scalar | 1 |
| sigma | scalar | 6 |
| Delta | scalar | 8 |
| A | 43 by 43 | 10 |
| Ot, Pt | 43 by 43 | 2 |
| B | 43 by 43 | 10 |
| Ot^2-rOt | 43 by 43 | 4 |
| B Ot, Ot B | each 43 by 43 | 12 |

These are ceilings, not assumptions that every nonzero matrix entry has
the same degree. Explicitly compare the saved B to A-b sigma Pt using
the bound parent A, rather than merely checking that a supplied B annihilates
Ot; the zero matrix would satisfy both annihilation tests.

## 4. What the ODE/PDE split proves

On real v!=0 division by r^2 and r Delta respectively gives

    O^2=O,
    H O=O H=0.

O is symmetric, and its trace is 11, so it is a coordinate-Euclidean
orthogonal projector of rank 11. P=I43-O has rank 32. Both ranges are
invariant under H; H is zero on range O and acts within range P. Since
Khat=H+bP, the same two subspaces are invariant under Khat, and Khat is
also zero on range O.

This identifies an 11-dimensional ODE block and a complementary
32-dimensional PDE block in these principal coordinates. It does not
construct a single global basis for those direction-dependent subspaces.
The projectors themselves are smooth on the punctured direction space.

In particular, O need not be the full spectral projector for eigenvalue
zero. The PDE block may contain additional zero eigenvalues or nontrivial
zero-eigenvalue Jordan blocks. For example, a nonzero nilpotent 2-by-2 block
embedded entirely in range P is compatible with H O=O H=0. Thus this gate
does not prove diagonalizability, identify characteristic multiplicities,
exclude a Jordan remainder, or establish strong hyperbolicity. No earlier
single-ray spectrum is promoted to an all-direction result by this split.

## 5. Candidate removal of the inherited sigma factor

The parent denominator Delta=r sigma is a sufficient envelope. Its success
does not prove that sigma divides every numerator entry A_ij. Test this new
candidate in QQ[x,y,z] using an explicitly fixed monomial order, preferably
the source ring's lex order with variables ordered x,y,z.

For every one of the 1849 entries perform exact polynomial quotient and
remainder division by the same nonzero sigma:

    A_ij = sigma Ab_ij + R_ij.

Save complete matrices Ab and R, the variable and monomial order, and the
complete canonical divisor sigma. Its leading exponent and rational
coefficient are recovered exactly as the lexicographically greatest
exponent and its coefficient in the retained sigma record; the builder also
returns them as metadata, but a separate metadata file is not required.
Verify multiplication
back coefficient by coefficient for all entries. Keep zero numerator slots
explicit. Floating division, a simplified expression with an unchecked
denominator, or successful pointwise ratios do not establish divisibility.

For the success gate require both

    R=0,
    A-sigma Ab=0

over all 1849 entries. Because sigma is a degree-six nonzero polynomial and
A has degree at most ten, a successful polynomial Ab has degree at most
four. The simplified rational formulas are then

    Khat = Ab/r,
    Bb = Ab-b Pt,
    H = Bb/r,
    B = sigma Bb.

The upper degree bound on Bb is also four. The denominator r is positive
on the stated domain and equals one on the Euclidean unit sphere. This is
an algebraic simplification of an already accepted operator, not a new
spectral or stability claim and not a license to change the parent A file.

A nonzero recorded remainder by itself is insufficient to conclude that
sigma does not divide A: an arbitrary choice Ab=0 gives remainder A even
when A is divisible. To certify nondivisibility, independently verify that
the remainder is reduced for the fixed single divisor: no monomial in R
is divisible by the leading monomial of sigma. In exponent notation,
if the latter is (a,b,c), every nonzero remainder term (i,j,k) must violate
at least one of i>=a, j>=b, k>=c. Together with the exact reconstruction
identity, this gives the genuine polynomial-division remainder. A single
nonzero reduced remainder is then a witness of nondivisibility in this ring.

For a single divisor over a field, its leading term reduces precisely the
leading multiples in its principal ideal, so this reduced-remainder check
is sufficient; an extra general-purpose Groebner-basis calculation is not
needed. Fixing the order also makes recorded candidate quotients and
remainders reproducible. The order is distinct from the canonical ascending
lexicographic sorting used to serialize polynomial terms.

## 6. Gates and preservation of a failed compression candidate

Keep the block and compression conclusions separate:

- `ode_blocks_validated` requires the three complete identities, exact
  source and parent bindings, trace/symmetry contract, and independent replay.
- `quotient_compression_validated` requires a complete exact division record,
  all-zero remainder, degree-valid Ab, and successful multiplication back.
- A nonzero reduced remainder may support a separately named
  `nondivisibility_witness_validated` result. If reduction was not checked,
  report only that the compression candidate did not pass.

If a fully executed division finds nonzero remainders, preserve every
candidate quotient/remainder, the first indexed nonzero witness, all
coefficient counts, the reconstruction checks, source/parent identities,
and the completed block results. Mark compression false. A protocol whose
overall `passed` means both proposed results passed must remain false in
this case, even if execution completed successfully; do not relabel a
nondivisible candidate as a compressed operator.

Do not raise an early generic exception that discards the available
mathematical evidence. The bounded runner should save a structured failure
or negative-candidate record before applying its final combined gate.
This is distinct from a timeout, malformed artifact, source mismatch, or
arithmetic exception, where completion of the mathematical decision has
not been established. A partial output is never a complete nondivisibility
certificate.

No outcome of this new compression candidate reverses the accepted
right-section or all-direction principal-closure theorem. The parent
operator A/Delta remains defined on the same nonzero real domain even
if the proposed smaller denominator cannot be certified.

## 7. Independent replay, controls, and resource boundary

Use the existing complete row-major rational-polynomial format and strict
parser. The independent Fraction route should reconstruct r, b, sigma,
Delta, and Ot from the fixed parent domain and original GROUPS contract;
load the hash-bound parent A; and then recompute Pt, B, all three residuals,
trace and symmetry, and the division multiplication-back identities.
For a nonzero remainder result it must also check reducedness in the fixed
order. No CAS import is necessary for this replay.

Bind SHA-256 to the exact bytes actually parsed. Save complete zero residual
matrices only after computing and checking them. Finalization verifies
the saved replay report, all recorded input-byte hashes, pure AST/source
manifests, and immutable parent/history identities. The CAS construction,
independent polynomial convolution, and any division arithmetic belong
inside the owned worker's resource envelope, not in finalization.

Useful separate controls challenge an altered group/index or r-to-g change,
loss of the PDE-only shift projection, one-sided-only annihilation, an
off-axis nonzero monomial, omitted residual slots, and a fabricated zero
remainder with an incorrect quotient. A scalar toy matrix containing a
nonzero reduced remainder distinguishes a completed negative division
decision from a source/parser failure. A candidate quotient with an
unreduced nonzero remainder must not pass the nondivisibility gate.

Source hashing, exact arithmetic and distinct replay reduce implementation
risk; they do not formally verify Python, the AST compiler, Fraction,
SymPy, NumPy object storage, file identity, or the physical source model.
The fixed case12 and coordinate interpretations remain part of the trusted
mathematical contract. External review and independent-team reproduction
are separate from this local certificate.

This batch does not validate spectra, full zero-mode structure, uniform
projector bounds, a positive symmetrizer, energy coercivity, strong or
symmetric hyperbolicity, lower-order terms, nonlinear evolution, physical
zero frequency, boundary conditions, convergence, black-hole evolution,
AMR, GPU execution, live admission, or scientific-payload writeback.
