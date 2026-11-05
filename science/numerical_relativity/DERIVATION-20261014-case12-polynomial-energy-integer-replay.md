# Fixed-case12 energy v2: exact integer convolution in independent replay

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, continuing the
existing source-bound workflow. Artifact: arithmetic-equivalence derivation.
Date: 2026-10-14, Asia/Shanghai. Version: case12_energy_integer_replay_v1.
Verification Status: UNEXECUTED new arithmetic candidate at creation.
Only source/receipt reading and algebraic derivation were performed to
write this document; no scientific imports, actual polynomial calculations
or tests were run. AI-assisted work; no external review or formal proof of
Python semantics. Any execution result belongs to the new owned-run terminal.

## 1. The failed v1 remains failed

The earlier energy batch is
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-energy-controls-v1-20261014/`.
Its terminal file SHA-256 is
`f86f9a4f8d38bdb46cbe2e5e86ee75ae4e58d94a4b6ea0649c9986eede9f742e`.
It records `passed=false`, `completed=false` and
`ResourceLimit: registered control deadline reached` under the original
600-second limit. Production saved the full candidate, but independent
Hbar/Cgram, residual, bound and negative-control acceptance did not finish.
No completed comparison supplied a mathematical counterexample, but this
does not promote the incomplete certificate.

The separate read-only receipt
`RECEIPT-20261014-case12-polynomial-energy-post-stop-audit.json`, SHA-256
`d200b35730e1a7d8e976ce45f81f2eeb4d29f25eed4f8b8b6b078ffbcc82e16d`,
binds 710 files / 48195623 bytes after cleanup. It explicitly has
`qualified=false` and `does_not_replace_failed_terminal=true`. The original
terminal has no successful artifact inventory; the outside receipt does
not fill that scientific acceptance gap. `worker-result.json`,
`independent-replay.json`, `dependencies.json` and `history-after.json`
remain absent from the failed directory.

Observed stage times locate substantial work in independent Gram
reconstruction. They do not isolate all cost to Fraction normalization,
cache behavior, disk scans, allocation or any single routine. The proposed
integer representation has not yet demonstrated a speedup or completion
within budget.

V2 is a new, explicitly registered arithmetic candidate under the active
development goal. It reruns the complete unchanged producer and the new
independent replay in one owned 600-second/64-MiB batch. It neither resumes
a hidden Gram checkpoint nor imports the failed v1 Hbar as accepted input.
No split timing, budget reset, regrading, weaker threshold or automatic
rerun of v1 is permitted.

## 2. Exact per-polynomial denominator clearing

The only changed mathematical representation is inside independent sparse
polynomial multiplication and product accumulation. Inputs and outputs
remain canonical polynomials in QQ[x,y,z], represented by complete mappings
from nonnegative integer exponent triples to nonzero `Fraction` values.
The zero polynomial is the empty mapping.

For a nonzero polynomial

    p=sum_alpha (n_alpha/d_alpha) v^alpha,

all d_alpha are positive because the coefficients are canonical Fractions.
Choose the positive integer Dp=lcm_alpha(d_alpha), and define integers

    A_alpha=n_alpha*(Dp/d_alpha).

The division Dp/d_alpha is exact integer division. Let cp be the positive
greatest common divisor of all nonzero |A_alpha| and set
ap_alpha=A_alpha/cp. Then

    p=(cp/Dp) sum_alpha ap_alpha v^alpha.

This content extraction is optional algebraically but is the registered
representation of the new kernel. Signs remain in the primitive integer
coefficients, including when the leading coefficient is negative. Handle
the zero polynomial separately, without attempting a gcd of no nonzero
coefficients or dividing by zero.

For q=(cq/Dq) sum_beta aq_beta v^beta, compute every convolution coefficient
with arbitrary-precision Python integers:

    C_gamma=sum_(alpha+beta=gamma) ap_alpha*aq_beta,
    (pq)_gamma=Fraction(C_gamma*cp*cq, Dp*Dq).

All ordered exponent pairs and all integer cancellations participate.
Only exact zero output coefficients are removed. Restoring each nonzero
coefficient with Fraction performs exact reduction once per output
monomial, not once per contributing monomial pair. No coefficient is
rounded, quantized, evaluated at a direction or fitted.

Dp,Dq are positive integer coefficient denominators, independent of v.
They are not the physical direction denominators r, g, Dbar or taubar;
this rewrite neither changes the real-direction domain nor makes v=0
admissible.

## 3. Matrix accumulation remains rational and complete

Clearing occurs per polynomial, not once for the whole matrix. After each
polynomial product is exactly restored, the existing matrix and scalar
accumulations continue to use Fraction values. Do not describe this as an
entire integer-only matrix algorithm or one Fraction conversion per matrix
entry. In particular, sums of products with different Dp*Dq are combined
through exact rational addition, which supplies their correct common
denominators automatically.

Consequently the new kernel preserves both

    (AB)_ij=sum_k A_ik B_kj,
    (A^T diag(w) A)_ij=sum_k A_ki w_k A_kj.

No Gram denominator is dropped: both occurrences of A and the diagonal
polynomial weight are multiplied through exact coefficient arithmetic.
The familiar global-denominator form would have denominator DA^2*Dw,
but the implementation does not assume a shared DA or use that as a
shortcut. Symmetric upper-triangle Gram construction and grouping equal
diagonal polynomials remain valid algebraic optimizations.

`multiply_polynomials` returns a new polynomial. `exact_add_product`
computes target + factor*left*right with a strictly typed Fraction factor.
It validates inputs and computes the complete prospective result before
committing the update; it rejects target aliasing either operand. A
callback exception before commit must leave the existing target unchanged.
This is an in-memory arithmetic contract, not a filesystem transaction.

Validate strict exponent triples and coefficient types, rejecting floats,
booleans used as exponents, stored zero coefficients and malformed shapes.
Do not add arbitrary degree, exponent or integer-bit limits that silently
restrict the original QQ polynomial domain. The surrounding certificate
still has its original explicit matrix degree caps. Arbitrary-precision
integers avoid arithmetic overflow, but their time and storage cost remain
subject to the owned deadline and existing resource controller.

The new arithmetic module has no hidden cache and imports no NumPy,
SymPy or old polynomial implementation. Its own validation follows the
frozen canonical contract. The outer replay's existing cache and rational
matrix sums remain visible in the new runner. All inner pair-loop work
checks the same deadline every 4096 products and at registered boundaries;
row and file-save boundaries retain the full resource guard.

## 4. Unchanged producer and explicitly changed replay wiring

The production module `scripts/nr_case12_polynomial_energy.py` remains
byte-identical at SHA-256
`41e703c4c9f3c0186c64c4d847272f68c2d029ffe3e87fb3ac84ed6936eada6e`.
The old runner, SHA-256
`e42e89b2e1920287f54b34237a180c51387bbb748dcd87791b8d726338c7cbeb`,
and all v1 sources stay frozen. The new runner explicitly calls
`scripts/nr_integer_polynomial_replay.py`; it must not monkeypatch the
frozen producer or shared V.add_product globally.

The selected call sites are cache-miss polynomial products and exact
product accumulation in combinations, matrix accumulation and diagonal
groups. The independent replay continues to reconstruct all eight Fi
Gram terms directly and evaluates both sides of HL/HP. No inner stage from
the failed run is a replay input. Record the new arithmetic module's path
and actual SHA in `arithmetic_source`, checked by source inventory and
finalizer hashes separately from the mathematical-input file set.

The replay arithmetic uses only Python's standard-library integers and
Fractions and does not call scientific-library matrix or polynomial
arithmetic. This is independence from the producer's SymPy arithmetic,
not separate Python semantics, an independently implemented whole GR
solver, an external team's reproduction, or a proof-assistant theorem.

## 5. Full energy question and acceptance remain unchanged

Use the accepted compression parent gate
`04e3db7e90ff93ce0c9ba24f81a0cc3d7f3490e80a21b5930b97b95d7edd2fda`,
its worker
`fd52af65137038fc8e3910c83a3312bfbb9014be67d9c58d5b412180d7fb50b6`,
and separately qualified projector ancestor X/Pt. For fixed case12,

    r=v^T v, g=v^T h^-1 v >= (5/6)r > 0,
    Dbar=r g^3, etabar=r g^2, taubar=r^3 g^6,
    Hbar=sum_i wi Nbar_i^T Gt Nbar_i
           +sum_j g/(2cj) Mbar_j^T Gt Mbar_j,
    Fi=Nbar_i-Dbar I43/(14wi),
    Cgram=sum_i wi Fi^T Gt Fi
           +sum_j g/(2cj) Mbar_j^T Gt Mbar_j.

Keep all eight weights (1,1,1/2,...,1/2), all six original branches and
all three nonzero difference factors belonging to absent branches. Each
of the latter still contributes G/98 to the original Gram identity.
The frozen producer's bilinear Cgram expansion is checked against the
independent direct Fi Gram construction.

Save and verify the fifteen complete matrices Gt, eight Fi, Hbar, Cgram,
Hsym, HL, HP and Gram. The four defining residuals are

    Hsym=Hbar-Hbar^T,
    HL=Hbar X-X^T Hbar,
    HP=Hbar Pt-Pt^T Hbar,
    Gram=Hbar-Dbar^2 Gt/14-Cgram.

These retain 27735 total main slots, 7396 residual slots required zero,
and caps 2 for Gt, 9 for Fi, 20 for Hbar/Cgram/Hsym/Gram, 24 for HL and
22 for HP. The original Hbar[0,1]+1 symmetry negative retains two complete
matrices / 3698 slots and caps 0/20. It must be reconstructed and rejected.

Recompute the actual coefficient upper bound B_H=sum_ij,sum_alpha
|h_ij,alpha| and C=B_H/(5/6)^6, all exactly. The full Gram identity gives
H>=I43/14 on r=1, and the coefficient calculation gives H<=C I43. Positive
r,g and the frozen rational formulas supply smoothness on real v!=0.
Only a complete new certificate can admit the fixed-case12 43-dimensional
principal quotient J=L+bP. The original production-only candidate C is
neither an expected answer nor an acceptance shortcut.

The prior energy derivation remains the mathematical design reference;
its v1 execution was incomplete. V2 must independently achieve all of its
matrix, lower/upper bound, source, domain and true-negative requirements.
The full58 system, low-order/zero-frequency/nonlinear estimates, boundaries,
convergence, black holes, AMR, waveforms, live admission and payload
writeback remain outside this unit, even if the new arithmetic succeeds.
