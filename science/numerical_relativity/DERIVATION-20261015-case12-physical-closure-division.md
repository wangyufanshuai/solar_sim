# Fixed-case12 physical closure: exact division and local polynomial symbol

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: source-bound mathematical derivation. Date: 2026-10-15, Asia/Shanghai.
Version Label: case12_physical_closure_division_v1.
Verification Status: UNVERIFIED candidate before its owned execution.
Only sources and accepted parent records were read to write this document.
No scientific imports, polynomial calculations or tests were executed.
AI-assisted derivation; external mathematical review remains separate.

## Accepted closure and the missing polynomial representation

The parent is
`tmp/nr-shadow-evidence/nr-k3-case12-physical-closure-controls-v1-20261015`.
Its gate SHA is
`87d715e82cf705c97fcb2f61d78fc92fc152b20e87367264cee19f16f264fff0`,
worker SHA
`4cbb925320f895be745bd31b78078f783cc4600bd36d6edaa4d15f15a4cb41aa`,
and independent-replay SHA
`9d081ac1d2a7df6214826a88a6cbaecd6fb63041487e495d6f5d25ed07b22228`.

For the fixed case12 source and real v=(x,y,z)!=0, that parent established

    C(zeta)=C0+zeta C1(v)+zeta^2 C2(v),
    L(zeta)=J+zeta K(v),
    Bbar(zeta)=Bbar0+zeta Bbar1+zeta^2 Bbar2,
    Bbar C=Delta^2 C L.

K includes the original shift and is the qualified geometric=False
principal matrix. J keeps tau_inverse=1, kappa1=1/10, kappa2=0, eta=0,
c=e=s=1 and f_profile=3 alpha chi. The notation f below denotes a polynomial
divisor and is distinct from this profile parameter. No original source,
background, coordinate ordering or parameter is changed by this candidate.

The parent B=Bbar/Delta^2 is a polynomial in frequency zeta, but its
coefficients have only been qualified as rational functions of direction.
Observed numerator degrees 16,17,18 do not establish divisibility by a
degree16 denominator. The single new candidate is exact cancellation of
that entire denominator, followed by explicit directional homogeneity and
direct closure checks. No smaller denominator or alternative factor is
searched if this candidate fails.

## Fixed divisor, domain and exact division

Retain r=v^T v, g=v^T h^-1 v, chi=18/25 and

    Delta=chi*r^2*g^2,
    f=Delta^2=chi^2*r^4*g^4.

The accepted fixed positive metric gives g>=(5/6)r, hence f>=r^8/4>0 on
real v!=0. This identifies the rational parent there. The polynomial
division itself takes place in QQ[x,y,z] and uses no direction evaluation,
coordinate-component denominator or pivot-dependent inverse.

Use the fixed lexicographic monomial order x>y>z. The divisor is homogeneous
of total degree 16 and has leading exponent (16,0,0). Its leading coefficient
is chi^2*(h^-1[0,0])^4, a positive rational number. It is not assumed to be
one. The actual complete divisor and actual leading coefficient must be
used, rather than treating f as the monomial x^16 or reusing a monic-factor
shortcut from an older compression experiment.

For each of the three complete 43x43 matrices A_j=Bbar_j, j=0,1,2, compute
entrywise quotient Q_j and normal remainder R_j with

    A_j=f Q_j+R_j.

Also save the complete multiplication-back residual

    M_j=A_j-f Q_j.

The independently checked division identity is A_j-f Q_j-R_j=0, and thus
M_j=R_j. M_j deliberately does not subtract R_j: doing so would produce a
zero even for a correctly computed nondivisible candidate. Acceptance
requires both R_j and M_j to be zero in every slot.

Normal form means no remainder monomial is divisible by the leading
monomial x^16, equivalently every remainder term has x exponent below 16.
A small total degree alone is not this test. With one divisor, normal form
plus the exact identity uniquely determines the remainder and quotient.
Independent lex long division must reconstruct them from A_j and f rather
than accepting the producer's quotient or Boolean as an oracle.

## Preserve degree failures before testing homogeneity

Retain the parent's registered input cap 22 for all three A_j. Since f is
homogeneous of degree 16, each long-division reduction replaces a monomial
only by monomials of the same total degree. Thus the complete quotient has
degree at most 6 and remainder and multiplication-back have degree at most 22.
These conservative caps also preserve a failed homogeneity candidate.

Save Q0,Q1,Q2 with cap 6 first. Then require every nonzero monomial of Q_j
to have total degree exactly j. Record the actual degree distribution and
independently reproduce this decision. Zero polynomials satisfy each
specified homogeneity condition; their actual degree is the zero sentinel,
not a fabricated monomial of degree j. An early decoder cap of j would
discard a legitimate, informative wrong-degree result before saving it.

The nine division outputs Q0,R0,M0,Q1,R1,M1,Q2,R2,M2 contain 16,641
explicit slots. The six remainder/multiplyback matrices contain 11,094
required-zero slots. The 5,547 division identities and normal-form checks
are independently verified in metadata; they do not add another family
of saved matrix files.

## Full direct closure after removing the denominator

The successful division and accepted parent identity algebraically imply
the new closure after cancelling nonzero f. The protocol nevertheless
requires an actual fresh complete product using the saved quotient:

    Q(zeta)=Q0+zeta Q1+zeta^2 Q2,
    D(zeta)=Q(zeta)C(zeta)-C(zeta)(J+zeta K).

Save all five 43x58 coefficient matrices D_0,...,D_4. The second product
naturally has support 0..3, so its power 4 target is an explicit zero matrix.
Do not omit that highest power. Compute this direct residual even if a
division or homogeneity decision has already failed, unless a resource or
data exception prevents completion.

The quotient storage cap 6 plus C cap 2 yields residual cap 8. This remains
valid for an incorrect-degree quotient; the residual storage cap must not
assume the desired homogeneity has already passed. The direct residual
adds 12,470 required-zero slots. The 14 main matrices contain 29,111 slots;
the six division residuals and five direct closure residuals together have
23,564 required-zero slots.

## Actual constant-offset numerator negative

Make the genuine changed numerator

    bad_A=A_0+E_(0,0),

using a complete copy of the original bound A_0 and zero-based indices.
Perform a fresh full 43x43 division by the same f, retaining bad_Q,bad_R
and bad_M=bad_A-f bad_Q. Save bad_A as well, so the altered input is itself
reviewable. Caps are 22 for bad_A,bad_R,bad_M and 6 for bad_Q.

If the main A_0 is divisible by f, adding 1 leaves the quotient unchanged
and leaves the unit constant in its normal remainder. A positive-degree
homogeneous polynomial cannot divide 1. This is a reason to expect rejection,
not permission to fill a unit residual without calculation. The producer
and independent algorithm must divide the actual changed input and compare
all its saved coefficients, full division identity and normal-form decision.

If the main candidate fails, still preserve its actual division results,
the actual changed input and every finishable negative result. A nonzero
negative cannot turn a failed main division into a pass. If the prescribed
negative is not rejected, fail without searching a different perturbation.
Four complete negative matrices add 7,396 slots, for 18 complete matrices
and 36,507 slots overall. Nonzero statistics belong to the future run and
are not preset by this derivation.

## Source bridge and independent arithmetic

Only accepted Bbar0..2, original C0/C1/C2/J/K and their domain/scalar/source
records are mathematical inputs. Bind actual raw bytes to the accepted
parent gate, worker, independent replay and artifact manifest. Do not
reconstruct K, e, C, the physical right section or the preceding closure.

The producer may reuse the unchanged compression matrix wrapper and its
original scalar-division helper. The frozen sources are:

- `scripts/nr_case12_polynomial_compression.py`, SHA
  `b1f46b6cff721fc242cbca152380d6b940935206458e626c195d5f74df5a6054`;
- `scripts/nr_case12_polynomial_blocks.py`, SHA
  `5590d121ecb02a1ecb030f1cfeaa5897739d9fa1fba42c3660e3c2c59876f1d5`;
- independent compression runner, SHA
  `3e221e127f0ba6e22a251da0a322909d853cb076180897dc4e2390f03aa05cdf`.

The independent standard-library Fraction route performs sparse lex long
division and independently reconstructs multiplication-back and the direct
closure. Its polynomial products may use the qualified Python-integer
convolution source at SHA
`5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f`.
Denominator clearing is an exact arithmetic representation choice, not a
replacement for the registered full products. The two paths compare every
slot, coefficient, degree distribution, remainder and acceptance decision.
They are project-local computational redundancy, not an external solver
review or a proof of all Python/CAS semantics.

## Conditional local polynomial symbol and its limits

Only after exact division, each degree-j homogeneity check, direct closure
and independent replay pass may the quotient be identified with the parent
B_j on v!=0. Then

    zeta^j Q_j(v)=Q_j(zeta*v).

The same homogeneity identity holds for C1,C2 and K. Let xi be a formal
three-component derivative variable and define

    Q_local(xi)=Q0+Q1(xi)+Q2(xi),
    C_local(xi)=C0+C1(xi)+C2(xi),
    L_local(xi)=J+K(xi).

The new exact certificate establishes the fixed-background polynomial
identity Q_local C_local=C_local L_local. Because its coefficients are
constant for this background and the formal derivative operators commute,
this is a local constant-coefficient differential-symbol representation.
For a Fourier wavevector k the substitution is xi=i*k. No residual r or g
denominator or direction-dependent normalization remains in Q_local.

The polynomial identity extends to xi=0, and indeed complex xi, by its
coefficient identity. This is an extension of the new polynomial symbol,
not an evaluation of the old Laurent E or rational formulas at v=0.
At zero the inherited C0 still has rank39. Q0 acts consistently on that
physical image; its selected full43 extension is not determined uniquely
by zero-frequency image data alone. No full43 zero-frequency inverse is
created.

The permitted new claim is a local polynomial symbol for this fixed linear
background and fixed registered source. It does not complete the separate
actual nonlinear-RHS/source bridge, geometric=True correspondence, varying
background theorem, full-frequency energy/growth estimate, damping proof,
legal IBVP or numerical convergence. Therefore the broader local
differential constraint-PDE acceptance flag remains false. Physical/live/
scientific-payload admission and all earlier scope limits are unchanged.
