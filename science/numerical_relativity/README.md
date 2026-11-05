# Numerical-relativity kernel boundary

This directory is the research-only shadow backend for the solar-sim project.
It is intentionally outside `app/` and does not change the live EIH 1PN
runtime.

## Current status: NR-K1d / NR-K2c / NR-K3e shadow reference

### Full43 derivative-aware reduction and leading state map qualified (2026-10-12)

All52 new controls and93 previous order regressions pass. An explicit invertible
map combines the physical/formal bridge, longitudinal/transverse auxiliary
scaling and determinant-to-auxiliary-trace compensation. It retains all43
constraints and transverse curl information. The27 fixed cases at five nonzero
frequencies have rank43 leading/finite state maps at all three original cutoffs.
Maximum leading A*D0-D0*L1 normalized residual is7.098e-16 against the independent
full58 Taylor principal reference. All243 arrays reproduce exactly.

The prior rA Jordan forcing is retained at lower order, not deleted. Its old
rejected prescriptions remain rejected and regress unchanged. This accepts a
fixed-profile analysis interface, NOT uniform strong hyperbolicity, a complete
characteristic basis, an energy estimate, CPBC or physical convergence. Next:
test ODE/PDE constraint splitting and full43 spectral/projector bounds, including
shift tangencies and speed collisions. Zero frequency remains separate.

All501 sources and780 indexed artifacts revalidate. Batch30.859sec; snapshot
4,393,749 bytes under8MiB; original64MiB/600sec and C/E reserves remain. No
evolution, N9/N13, native/GPU call, art/live modification or scientific writeback.
See [derivative-aware reduction results](RESULTS-20261012-longitudinal-constraints.md).

### Mixed-order accounting verified; two characteristic prescriptions rejected (2026-10-12)

All93 new controls and131 symbol-bridge regressions pass. Exact polynomial
grading retains every one of the43 constraint rows and all lower-order terms.
The54 fixed cases cover both candidate norms, three backgrounds, nine directions
and five nonzero frequencies; all702 saved arrays reproduce exactly. The496
source identities and1261 indexed artifacts pass final integrity checks.

This is NOT a strong-hyperbolicity pass. Prespecified analytic left Jordan
chains reject hm-only at Minkowski and both prescriptions when a nonzero shift
is perpendicular to the wave direction. Weighting algebraic errors removes
the first principal forcing but does not cure the tangent-shift obstruction.
The result concerns these constraint norms, not an ill-posedness proof for
the original58-state FO system. Do not design CPBC from these defective symbols.

Next: longitudinal/transverse derivative-aware reduction, curl compatibility
and the relation to the full state, without dividing by beta.n or projecting
away errors. Physical boundary, uniform strong hyperbolicity, energy,
stability/convergence, live and writeback remain unqualified. No N9/N13,
native/GPU program or time evolution ran. Batch53.656sec; source snapshot
4,359,556 bytes under8MiB; all original disk and64MiB/600sec caps retained.
See [mixed-order results and analytic obstructions](RESULTS-20261012-constraint-order.md).

### Physical/formal constraint-symbol bridge and authorized read-only replay passed (2026-10-12)

The2026-10-11 batch passed131 new controls and231 constraint-jet regressions,
including exact in-batch replay of21 fixed background/wave cases. An explicit
triangular conversion relates actual-derivative physical H/Z to the previous
formal D/P definitions. The independently derived subsidiary symbol satisfies
B*C=C*L with maximum normalized residual3.870e-16 under unchanged2e-12.
Nonzero-frequency rows have rank43; zero-frequency rows have rank39, so full
matrices are compared only on the realizable subspace at zero frequency.

After session recovery, the old additional replay handle and process were
absent; its terminal and elapsed time remain unconfirmed. There was no automatic
retry. The user then separately authorized a new64MiB/600sec read-only replay
with persistent receipts. This completed in22.532sec: all21 cases/273 arrays
reproduced exactly, all489 original sources and770 indexed parent artifacts
revalidated, and the original gate remained unchanged. No pytest, native/GPU
program or time evolution ran. The old unknown outcome is preserved, not
retroactively reclassified. This is reproducibility, not an external oracle.

The new491-source snapshot includes only two additive audit-provenance files
and uses4,328,272 bytes of the authorized8MiB. Its516 indexed artifacts plus
terminal occupy4,546,947 bytes, all post-verified against the persistent receipt.
Physical boundary, uniform characteristic/energy estimates and scientific
convergence remain open. N13 stays unresolved; N9 requires separate approval;
live/writeback stay closed. No subsequent experiment started under this approval.
See [symbol bridge and completed read-only replay](RESULTS-20261012-constraint-symbol.md).

### Independent constraint-jet operator qualified on fixed controls (2026-10-11)

All231 new controls and186 preceding Theta/Z regressions pass. The new43-rate
operator accepts21 third-order background fields, first-order H/M and39 other
second-order constraint jets. It does not call the full state RHS or re-extract
constraints from the background. All132 previous inputs match the reference;
maximum rate discrepancy is7.772e-16 under unchanged2e-12. Nine exact-zero,
21 analytic derivative, nine derivative-deletion and43 channel probes pass.
All484 sources and1320 saved arrays pass a separate read-only audit.

This qualifies a candidate mixed-spatial-order differential operator on fixed
inputs, not a first-order CPBC system or global closure/stability proof. Old
profile H/Z rows use formal D/P; compare symbols only after explicit conversion
to actual-derivative physical constraints. That bridge, physical boundary,
nonlinear stability and scientific convergence remain open. No evolution or
native call ran; N13 stays unresolved, N9 requires separate approval, and live/
writeback stay closed. Snapshots use4,276,909 bytes under the authorized8MiB cap.
Batch plus read-only audit took453.156sec within the original600sec budget.
See [independent constraint-jet results](RESULTS-20261011-constraint-jet.md).

### Explicit Theta/Z feedback and instantaneous43 assembly qualified (2026-10-11)

All186 new controls and160 prior offsurface regressions pass. Explicit reduction/
trace forcing now covers Theta and physical Z, with covariant connection
variation checked against raw coordinate differentiation. The132 fixed cases
include six added anisotropic, nonunit-determinant, traceful backgrounds. Three
pure-trace analytic controls fix the5/3 Z-feedback coefficient;33 omission
controls detect each of11 feedback groups. Maximum Theta/Z discrepancy is
1.111e-16 and assembled43-rate discrepancy is6.662e-16 under unchanged2e-12.
All479 source identities and1320 saved arrays pass a separate read-only audit.

The43-rate assembly reuses qualified H/M and reduction/algebraic references;
it is not a new independent derivation of every row or a closed variable-
coefficient subsidiary PDE. That closure, spatial derivative/curl accounting,
physical CPBC, nonlinear stability and scientific convergence remain open.
No evolution/native call ran. N13 stays unresolved, N9 needs separate approval,
and physical/live/writeback gates stay closed. Snapshots use4,235,204 bytes
under the authorized8MiB cap; all other original resource limits remain.
See [Theta/Z feedback results](RESULTS-20261011-theta-z-feedback.md).

### Offsurface physical H/M feedback qualified; full closure remains open (2026-10-11)

All160 new controls and67 curved Python regressions pass. An additive reference
retains independent A/B/D/P and algebraic defects, then compares raw H/M time
derivatives with physical subsidiary rates plus a separate covariant variation.
The126 fixed cases cover33 individual auxiliary slots, six metric perturbations,
trace and mixed defects, and clean controls at three curved-background points.
Maximum identity discrepancy is2.082e-17; independent rate-derivative probes
reach1.575e-13, both under the unchanged2e-12 threshold. All475 sources and1134
saved arrays pass a separate read-only audit. No evolution/native call ran.

Only the source-snapshot cap was explicitly raised by the user to8MiB; the old
4MiB saver and historical receipts are unchanged. New snapshots use4,203,797
bytes. Controls remain64MiB/600sec with original C/E reserves and physics gates.
This is instantaneous H/M feedback, not full offsurface Theta/Z and43-constraint
propagation closure, CPBC, nonlinear stability or convergence. N13 remains
unresolved; N9 still requires separate approval; live/writeback stay closed.
See [offsurface feedback results](RESULTS-20261011-offsurface-feedback.md).

### Curved physical H/M subsidiary identities on the definition surface (2026-10-11)

All67 new controls and53 fixed-profile Python regressions pass. An additive
third-order tensor Taylor reference independently differentiates the physical
H/M definitions and compares with nonlinear ADM/Z4 subsidiary equations in22
fixed cases:1 Minkowski,3 static Schwarzschild points,18 curved manufactured
jets with nonzero H/M/Theta/Z. Maximum identity discrepancy is1.909e-17 under
the unchanged2e-12 limit; the full58 pointwise reference difference is2.776e-16.
All471 sources and198 persisted arrays are bound to the control receipt. No
new evolution or native solver call ran; original science conclusions remain.

This represents only the auxiliary-definition/algebraic constraint surface,
not independently violated FO constraints. Off-definition variable-background
closure, incoming-constraint SAT/CPBC, nonlinear stability and convergence
remain unqualified. Physical/live/writeback gates stay closed and the N9 full
matrix still needs separate approval. The4MiB source-snapshot cap has26,649
bytes remaining; do not enlarge it implicitly or remove historical evidence.
See [curved physical constraint results](RESULTS-20261011-curved-constraints.md).

### Fixed-profile physical constraint kernel and initial target compatibility (2026-10-11)

All53 new controls and66 previous spectral Python regressions pass. The fixed
43 physical constraint rows close under the full generator J+i*k.A in all21
registered constant-flat-background cases, including the current gauge and
damping parameters. No invariant-envelope rows were added or physical modes
projected away. Maximum normalized closure residual is1.783e-14 under2e-12.
All866 unique N13 boundary nodes pass analytic static/T=0 target compatibility;
the original pulse remains nontrivial inside the cube. All465 sources and593
indexed artifacts revalidate; no evolution or native call ran.

These are finite fixed-background checks, not variable-background subsidiary
equations or CPBC. Analytic initial compatibility is not evolved boundary
compatibility or zero SBP truncation error. Full nonlinear propagation and
constraint-incoming boundary design remain required; physical/live/writeback
gates stay closed, N13 stays unresolved, and N9 still needs separate approval.
See [current-profile constraint results](RESULTS-20261011-profile-constraints.md).

### Independent SAT action and fixed saved-stage probes qualified (2026-10-11)

An additive reference probes the full58 principal matrix from the qualified
Taylor equations and applies a Decimal spectral polynomial without production
SVD/eigenvectors. All66 new controls and65 prior trajectory Python regressions
pass. Fixed first-k1/last-k4 samples in each original N13 v2 case cover6 stages,
156 boundary points and324 face contributions; independent volume plus SAT
reproduces the saved full58 RHS with maximum error6.055e-16 under2e-12. The11
ODE slots receive zero penalty. All460 sources and563 indexed artifacts revalidate.

This covers6 of196 saved stages and26 of866 unique boundary nodes per selected
stage, not the full boundary trajectory. Decimal50/70 is diagnostic arithmetic;
the original solver remains FP64. No new evolution/native call ran and no
physical CPBC, common symmetrizer, nonlinear stability or live/writeback gate
opened. Current-profile constraint propagation and boundary-data compatibility
remain necessary. N13 stays unresolved; N9 still needs separate approval. See
[independent SAT results and limits](RESULTS-20261011-spectral-sat.md).

### Saved N13 all33 trajectory budget audit qualified (2026-10-11)

All65 new controls and79 selected discrete Python regressions pass, followed by
an audit of every49 saved step and196 RK stage in the original N13 v2 interval
T=1/16..1/8. No new evolution or native call ran. Continuum, finite-difference
chain and saved boundary-residual contributions reproduce the33 auxiliary
definition changes; the maximum cumulative-prefix discrepancy is6.248e-15 under
the unchanged2e-12 bound. All454 sources and683 indexed artifacts revalidate,
including persisted arrays, full XML records and the original trajectory identity.

This is a linear-map budget identity, not small physical/constraint error or
stability. The boundary term is a saved-total-minus-independent-volume residual,
not an independent SAT formula reconstruction. A/P whole-domain changes are
largest in that boundary residual; B/D involve multiple contributions. The other
14 geometric RHS channels are not validated by this audit. N13 remains unresolved,
the N9 full batch still requires separate human confirmation, and physical/live/
writeback gates remain closed. See [saved-trajectory results and limits](RESULTS-20261011-trajectory-reduction.md).

### All33 semidiscrete reduction balances qualified (2026-10-11)

An additive dense SBP diagnostic now separates continuum reduction forcing from
the actual nonlinear finite-difference chain defect for A/B/D/P. All82 new
controls and68 selected formal-profile Python regressions pass; the6 previous
native cases are explicitly excluded. All12 new single-thread native calls on
N9/N13/N17 succeed. The largest33-rate balance residual is6.724e-15 under2e-12;
this is an identity residual, not the magnitude of physical or constraint error.
All449 current/saved sources and548 indexed artifacts revalidate.

The fixed two-sign nonpolynomial fields onN9/17/33 exhibit approximately second-
order decay of the chain defect in whole-grid maximum norm and fourth-order at
the fixed center point, within preregistered windows. These are static local
truncation controls, not Einstein-solution convergence or long-time stability.
No time step, SAT, new native build or N9 full scientific batch ran. Physical/
live/writeback gates stay closed. Next is scope-matched saved-trajectory/SAT
diagnosis and the still-required scientific convergence/boundary gates. See
[semidiscrete results and limitations](RESULTS-20261011-discrete-reduction.md).

### Full58 off-constraint formal-profile controls qualified (2026-10-11)

An additive Taylor-jet geometry reference covers the remaining14 Einstein/
geometry components, combined with the preceding44 reduction rates. It uses
generic metric-jet calculus and the published fixed profile, not production
geometry imports. The full58 instantaneous comparisons pass in74 new tests and
66 selected reduction Python regressions; the6 old native tests are explicitly
excluded. All42 new native calls succeed. The maximum native rate difference is
7.494e-16 under2e-12; thread payloads and repeated1-thread stdout are byte-identical.
All444 current/saved sources and729 indexed artifacts rehash successfully.

The reference distinguishes formal off-constraint curvature from derivatives of
the true sampled metric and recovers the independent physical Z4 reference on
the consistent surface. This closes the14-channel formula-control gap described
in the historical sections below, not general discrete accuracy, constraint
stability, trajectory/convergence or physical boundaries. No time step or N9
scientific matrix ran, and no live/writeback gate opened. The pending N9 full
batch still requires separate human confirmation. See
[full58 results and limitations](RESULTS-20261011-formal-fo-profile.md).

### Off-constraint reduction balances qualified (2026-10-11)

An independent continuum product-rule oracle now permits nonzero algebraic,
definition and curl defects. It checks11 metric/gauge rates,33 auxiliary rates
and logdet/trace contractions against the frozen Python and native components.
All72 new controls and60 selected Python Z4 regressions pass; the latter excludes
the4 prior native cases explicitly. All42 new native calls succeed and thread/
fresh-process byte checks pass. The largest native44-channel rate error is
7.495e-16 under2e-12; all439 current/saved sources and742 indexed artifacts rehash.

The tests confirm that initially exact auxiliary definitions can develop defects
when algebraic constraints are violated: finite-rate metric relaxation is not
automatic damping of every auxiliary constraint. This is an instantaneous
manufactured-field mechanism, not a diagnosis of the old N13 trajectory or a
nonlinear stability result. The other14 off-constraint Einstein channels,
general discrete product rules, convergence and physical boundaries remain open.
No time step or N9 scientific batch ran; all physical/live/writeback gates remain
closed. See [reduction-balance results](RESULTS-20261011-reduction-balance.md).

### Nonzero Z4 and direct native physical controls qualified (2026-10-11)

An additive independent physical Z4 oracle now includes nonzero Theta/Z_i,
their spatial derivatives, covector Lie transport and original alpha*kappa1
damping. Twenty-four nonlinear fields check all58 frozen Python channels and
reconstructed physical gamma/K/Z rates on the consistent auxiliary surface.
Four polynomial-compatible states also compare the qualified C++ SBP volume
component directly with independent physical predictions, including all surface
nodes. These are instantaneous controls, not time trajectories or vacuum data.

All64 new tests and54 prior ADM regressions pass with zero skips. All28 native
calls succeed; the largest native RHS difference is9.368e-17 under2e-12.
The1/2/4-thread numeric payloads and repeated1-thread process stdout are byte
identical. All434 current/saved sources and623 indexed artifacts revalidate.
Independent auxiliary/algebraic violations, discrete convergence, physical
boundaries, long-time stability and full physics/live admission remain open.
N13 unresolved results are unchanged; the N9 full batch remains unexecuted and
awaits separate confirmation. See [nonzero Z4 results](RESULTS-20261011-nonzero-z4.md).

### Independent nonlinear physical ADM/Z4 controls qualified (2026-10-11)

The additive second-order physical-metric oracle now checks nonzero K/A,
off-diagonal 3D geometry, shift/driver gradients and H/M feedback on the
Theta=Z=0, auxiliary-definition surface. It derives conformal rates from the
physical ADM equations and definitions, not the expanded FO implementation.
Six manufactured fields directly exercise all58 frozen volume-RHS channels;
these deliberately constraint-violating fixtures are not vacuum initial data.

All54 new tests and78 initial-ADM regressions pass with zero skips. The largest
58-slot discrepancy is6.870e-16 under2e-12. The reference itself also passes
constant-curvature and instantaneous Kasner checks, with no Kasner evolution
claim. All429 current/saved sources agree; the preceding424 are unchanged.
No native call or time step ran. Nonzero Z4/independent auxiliary violations,
discrete/boundary accuracy, convergence and full physics admission remain open.
See [nonlinear continuum results and remaining gates](RESULTS-20261011-continuum-adm.md).

### Independent initial ADM tensor controls qualified (2026-10-11)

An additive continuum oracle derives the full physical K_ij rate of the existing
Schwarzschild log-lapse pulse at T=0 without importing solver initialization,
curvature, derivative or evolution helpers. Direct ADM and static-cancellation
forms agree; exact analytic jets are supplied locally to the frozen volume RHS.
All58 initial rates and reconstructed physical K_ij are checked for N9/N13/N17
and zero/positive/negative pulses. No time integration or native invocation ran.

All78 new tests and70 spatial-preflight regressions pass with zero skips. The
physical-rate maximum discrepancy is7.720e-17, below the preregistered2e-12 cap.
Decimal scalar derivative checks and wrong-sign/normalization negative controls
pass. All424 current/saved sources agree; the previous419 remain unchanged.
This isolates initial continuum algebra, not discrete truncation, general
Einstein RHS, boundary correctness, convergence or live admission. The N9 full
scientific batch still awaits human confirmation; N13 unresolved evidence is
unchanged. See [initial ADM results and scope](RESULTS-20261011-initial-adm.md).

### Fixed N9 scientific entry controls qualified (2026-10-11)

The additive entry fixes N9 at14/28/56 steps, dt1/112,1/224,1/448 andT=1/8,
with unchanged equations, native binaries, thresholds and832MiB/2400-second cap.
It requires a current source-bound test gate and separate human confirmation.
The full98-step scientific matrix has not been executed or authorized by controls.

All61 new entry tests and70 preflight regressions pass with zero skips in111.046
seconds. A real3-step pulse crosses the2+1 native segment chain with12 audited
RK stages. A deliberate2-step diagnostic failure retains2 native points but only
1 accepted control point. All8 native calls exit0;904 indexed artifacts and419
current/saved sources revalidate. These are short controls, not convergence proof.
The saved-data auditor also checks invocation terminals, commands, ordered stage
faces and persisted journals. Original N13 unresolved findings and all promotion
flags remain unchanged. See [entry results and pending scientific command](RESULTS-20261011-native-n9-entry.md).

### Spatial preflight controls qualified; eight-batch proposal rejected (2026-10-11)

The original common-dt proposal fails a necessary initial condition: N17 with
dt=1/112 has CFL0.3238202964, above the unchanged0.25 cap. The additive preflight
retains this rejected plan and explicitly withdraws its execution recommendation.
An independent analytic initial-state oracle confirms the driver's calculation.

All70 new controls and148 comparison regressions pass with zero skips in10.25
seconds. All412 current/saved source hashes agree; the prior407 qualified sources
and396 scientific sources are unchanged. No native solver or evolution RHS ran.
Smaller-dt15/20-batch alternatives remain prospective only, without execution
authority or a qualified new continuation chain. A bounded N9-only next stage has
been proposed for user choice. Original N13 unresolved findings and all physical,
live and writeback gates remain unchanged. See the
[preflight results and corrected scope](RESULTS-20261011-native-spatial-preflight.md).

### Diagnostic cross-grid alignment controls qualified (2026-10-11)

The additive nonperiodic nodal adapter aligns native-grid H/M fields on one fixed
N9 grid, with exact coincident-node copies and local degree-five interpolation.
All 71 new controls and 77 rerun same-grid tests pass without skips. All 407
current/snapshot source hashes agree; the prior 396/402 source sets are unchanged.
No new trajectory, historical spatial matrix or native RHS was executed.

The controls explicitly demonstrate aliasing at common coarse nodes and the
failure of uniform-ratio log2 order estimates on N9/N13/N17. Native-grid constraint
norms remain visible; interpolation error, spatial convergence and AMR evolution
are not certified. See [alignment results and next physical gates](RESULTS-20261011-constraint-grid-alignment.md).

### Complete constraint-field comparison controls qualified (2026-10-11)

An additive adapter now compares actual H/M arrays at identical physical time,
grid, units, diagnostic method and component-RMS normalization. All 77 new controls
pass with zero skips. The first control failure is preserved; only the new
comparison reduction was repaired with accurate summation, without relaxing tests.
All 396 frozen scientific sources remain unchanged; the 402-source control snapshot
and 409 indexed artifacts were checked. No native evolution or RHS replay ran.

Saved T=1/8 medium/fine endpoints show a whole-domain Hessian-H field difference
of 1.319e-11 versus a norm gap of 5.392e-13 (24.46 times smaller). This establishes
why scalar norm gaps cannot stand in for full field differences, not constraint
convergence. The original temporal screen remains unresolved. Cross-grid comparison,
spatial convergence and physical promotion remain pending. See the
[control results and full-field analysis](RESULTS-20261011-constraint-field-comparison.md).

### N13 continuation v2 completed and audited; edges still unresolved (2026-10-11)

After explicit renewed approval, all49 new endpoints and196 RK stages reached
T=1/8 from the verified T=1/16 parent checkpoints. All74 native calls exited0;
independent saved-data audit checked878 indexed child artifacts,857 parent
artifacts and396 frozen current/saved sources. Runtime was1519.531 seconds under
the original2400-second contract;879 files occupy611824507 bytes under832MiB.

Whole/central/face/corner temporal orders are about4.001/4.001/4.019/4.083.
Edges remain unresolved: the fine difference1.627345429e-13 is below the unchanged
2e-13 floor. Faces now pass with only21.5% margin; the old T=1/16 face failure to
resolve is retained. No cross-time stitching, new Python parity, independent RHS,
spatial/constraint convergence, full scientific replay or promotion is claimed.

A post-hoc read-only analysis of42 saved checkpoints shows nonmonotone edge
signals across all14 common times. Its one narrow intermediate pass does not
replace either preregistered endpoint. Next work is independently controlled
constraint-field and spatial convergence, not another automatic time extension.
See [full continuation result](RESULTS-20261011-native-gauge-continuation-v2.md)
and [signal analysis and next gates](ANALYSIS-20261011-native-continuation-signal.md).

### N13 continuation v1 stopped without receipt; v2 explicitly authorized (2026-10-11)

The approved v1 run stopped with two published coarse checkpoints, but no stage
trace, accepted-point journals or final receipt. The cause and driver exit code
are unknown. Read-only inspection revalidated all396 current/saved sources, the
parent/control evidence and both binary manifests; this is not scientific
acceptance. Newly accepted steps remain0/49 and T=1/8 remains uncomputed.
All422 partial artifacts (30832927 bytes) are preserved with an external inventory.
After fresh explicit approval, v2 started from the original verified T=1/16
parent endpoints under the unchanged832MiB/2400-second contract; it does not use
the unaccepted v1 checkpoints. Its completed outcome is recorded above. See the
[interruption observation](RESULTS-20261011-native-gauge-continuation-interrupted.md).

### Full N13 continuation entry controls qualified (2026-10-10)

The fixed three-case entry and whole-receipt audit now preserve absolute parent
time, original common initial data, external parent dependencies, separate old/new
step counts and the original832MiB/2400-second experiment contract. The396-source
closure and actual13.08MB parent snapshot fit the registered storage allowances.

All60 new entry controls pass with zero skips in48.766 seconds; evidence is21.60MiB
under the64MiB/600-second test budget. They exercise a clearly marked zero-evolution
registration fixture, coherent metadata tampering, synthetic time-order algebra,
test qualification and failure-stop behavior. No new native trajectory was executed.
The scientific runner and independent auditor both accept the fresh test gate.

At this control checkpoint the scientific run was not yet executed; the later
interruption and new authorization are recorded above. No convergence,
independent RHS, cross-backend, GPU or live admission follows from these controls. See
[full-entry control results and exact proposed command](RESULTS-20261010-native-continuation-entry-controls.md).

### Nonzero-time continuation component controls passed (2026-10-10)

The additive continuation component preserves parent absolute time and starts a
new qualified local plan from the verified persisted state. The N9 even-start
2-to-5 and odd-start3-to-5 controls match all saved reference RK blocks and
absolute stage reports byte-for-byte. A deliberate diagnostic failure retains
two newly published native points but only one newly accepted scientific point.

All52 new tests pass with zero skips in112.453 seconds under the unchanged
64MiB/600-second control budget. Evidence totals31.04MiB; all470 indexed artifacts
and389 current/saved sources rehash. The383 inherited sources, native binaries,
parent evidence and physical/live/writeback gates remain unchanged.

This qualified the component, not a full N13 continuation campaign. The full
global runner, whole-receipt audit, final-time analysis and their negative controls
have since been qualified above; the subsequent scientific outcome is recorded
above. These component controls alone establish no T=1/8 result, new physical
convergence, Python interval parity or promotion. See
[continuation-control results](RESULTS-20261010-native-continuation-controls.md).

### Full native gauge-pulse matrix and saved-state audit completed (2026-10-10)

After explicit user approval, a fresh v2 campaign completed all N13 7/14/28-step
cases under the unchanged832MiB/2400-second contract. All49 endpoints,196 RK
stages,857 indexed artifacts and383 frozen sources passed saved-state audit.
All74 native calls exited0. Runtime was1470.078 seconds; the evidence directory
contains592536636 bytes. No equations, thresholds or qualified binaries changed.

All49 endpoints agree with the original Python campaign within2.23e-16 normalized
regional/per-slot error, not bit-for-bit. Whole/central/edge/corner temporal orders
are about3.964/3.964/4.097/4.091. Faces remain unresolved: the fine difference
1.6249e-13 is below the unchanged2e-13 floor; overall temporal admission is false.
This is full-matrix port consistency, not spatial/constraint convergence, an
independent Einstein RHS validation, old Python replay completion, or live/GPU
admission. Earlier failures and all false admission flags remain unchanged.
See [full native v2 results and remaining gates](RESULTS-20261010-native-gauge-pulse-v2.md).

Read-only follow-up found that the current coarse initial CFL is0.24286522;
reducing to six steps at the same endpoint would violate the unchanged0.25 cap.
A fresh from-zero T=1/8 matrix also exceeds the original evidence budget.
An [absolute-time checkpoint continuation proposal](EXPERIMENT-20261010-native-gauge-continuation-proposal.md)
preserves the common T=0 ancestry and proposes7/14/28 additional steps under a
prospective unchanged per-batch budget. Component and full-entry controls now pass
as recorded above; v1 stopped before scientific acceptance and the explicitly
authorized v2 subsequently completed its saved-data audit, still unresolved. The
[readiness analysis](ANALYSIS-20261010-native-refinement-readiness.md) also separates
initial-only constraint consistency from evolved convergence and records the
mixed boundary-stencil coverage of the existing central-box diagnostic.

### Raw-state audit controls and runner test-input gate qualified (2026-10-10)

After the user confirmed v6 recovery, it reran the unchanged v4/v5 source under
the original64MiB/600-second control budget:85 runner/auditor controls plus123
reference tests passed, zero skips. Independent raw-state geometry/CFL and
endpoint residual checks now reject the retained negative-report counterexample.
The full audit entry was exercised only with an explicit zero-evolution N13
registration fixture, not a new physical matrix.

The scientific runner now accepts the fresh v6 XML and source-bound receipt.
An explicit local config, rootdir and confcutdir fix the v5 module-name prefix;
collection was checked before executing the same208 tests. All851 indexed
artifacts rehash, and17 raw control artifacts match v5 byte-for-byte. The v5
rejected report, v3 fixture failure and v4 disk abort (no final receipt) remain.
No scientific gate or full N13 matrix follows from this test-input qualification.
See [current audit-control results and exact evidence boundaries](RESULTS-20261010-native-campaign-audit-controls.md).

### Source-bound multisegment scientific runner controls qualified (2026-10-10)

The new orchestrator links immutable two-step native plans under one global
scientific plan, restores all58 slots from persisted predecessor checkpoints,
and retains full lossless RK traces for independent saved-state arithmetic and
constraint checks. Native publication and scientifically accepted endpoints
have separate counts. The actual five-step N9 control spans three plans;
an injected diagnostic failure preserves two native points but accepts only one.

Fresh v2 qualification passes49 new controls plus123 reference tests, zero skips.
The first full N13 7/14/28 campaign stopped before any numerical call because
two historical Windows source-path aliases collided during exclusive snapshot
creation. The failed receipt and partial source snapshot remain. Canonical source
merging now rejects conflicting hashes; the complete383-file source union has
an actual snapshot regression test. No qualified C++ equations/binaries changed.

At this historical control-only stage, the full matrix had not been completed
or automatically retried. The user later explicitly approved the fresh v2 run
documented above, with the original reserves and832MiB/40-minute budget.
No temporal/spatial/constraint convergence, speedup, GPU or live admission
follows from the bounded controls themselves.
See [runner results and retained startup failure](RESULTS-20261010-native-gauge-pulse.md).

### Method-bound checkpoint and true process restart qualified (2026-10-10)

The native SBP/SAT/RK4 branch now saves all58 slots, the original1..4-step plan
and future half-step face targets, with method/source/executable/runtime binding
and SHA-256 integrity. Only accepted endpoints are published; existing files
are never replaced. The shared manifest envelope has a distinct SBP kernel id,
with an independent Python reader; legacy periodic/halo validators are unchanged.

The fresh v2 qualification passes60 tests with zero skips; a separate four-module
reference/legacy-manifest regression passes123. Six short reference cases cover
13 steps; maximum endpoint normalized discrepancy is2.23e-16. Every checkpoint
endpoint is byte-exact against the previously qualified RK4 binary. Cross-process
2-to-4-thread restart matches continuous1-thread files; two nontrivial trajectories
also match full1/2/4-thread runs. Three deliberate owned-process interruptions
preserve valid prefixes, and a true later RHS failure does not erase the first step.

The first batch exposed a missing Windows rename-name terminator. Its failure,
source snapshot, binary and partial are retained. An isolated API probe identified
the cause; v2 adds termination and published-handle path verification. All448
indexed artifacts and380 combined source keys rehash without mismatch
(378 physical files after Windows path-alias normalization).
These are bounded restart controls, not universal power-loss durability,
authentication, full-campaign replay, physical convergence, or speedup evidence.
Next: source-bound segmented scientific runner and prospective resource budget,
then common-endpoint temporal/spatial/independent-constraint validation. All
physical/live/writeback gates remain false. See
[checkpoint results and retained first failure](RESULTS-20261010-native-checkpoint-component.md).

### Native RK4 stages and bounded trajectories qualified (2026-10-10)

The new native driver evolves the actual58-slot SBP/SAT equations through all
four RK stages, with fresh current-state coefficients/CFL and exact integer
half-step boundary labels. No projection, auxiliary reconstruction, hidden
timestep change or fallback. Every stage input/RHS and raw endpoint is saved.

The51-test suite passes with zero skips; the two-module Python reference
regression separately passes55. Eight reference trajectories contain14 steps
and56 full RHS stages, including N13 gauge-pulse data and a saved endpoint.
Maximum regional/per-slot normalized discrepancy is6.67e-16 for RHS and
2.23e-16 for endpoints. Independent raw RK arithmetic is byte-exact.
Two nontrivial trajectories match across OpenMP1/2/4; split-process raw-state
continuation matches uninterrupted evolution exactly, including stage reports.

There are65 native calls (23 successful,42 expected rejections). True dynamic
det/profile/CFL failures are rejected at the same stages as Python. All292
indexed artifacts and369 inherited source keys rehash without mismatch.
These are bounded implementation controls, not convergence or speedup results.
No method-bound checkpoint yet: raw-state continuation is not qualified restart.
Next: atomic, integrity-checked, method/source-bound checkpoint and rejected-prefix
handling before full scientific campaigns. Physical/live admission remains false.
See [RK4 results, failure controls and remaining gates](RESULTS-20261010-native-rk4-component.md).

### Native six-face stage-local SAT coupling qualified (2026-10-10)

The native component now couples the full58 SBP volume RHS to six current-state
characteristic SAT faces. Left/right signs, per-axis endpoint weights, edge/corner
accumulation, exact-byte call-local caches, global stage CFL and fail-closed batch
handling are checked against the actual Python nonlinear driver. No Python-supplied
principal/penalty matrix, frozen boundary coefficients, projection or reconstruction.

Fresh qualification passes72 tests with zero skips; the five-file Python reference
regression separately passes160. Maximum normalized coupled-RHS difference is
1.77e-15, with per-slot/per-region checks; six-face penalties differ by at most
1.55e-15. Four complete states have byte-exact OpenMP1/2/4 numeric payloads.
There are107 native calls,26 successful independent-process repeat pairs and46
expected rejections. All475 indexed artifacts and364 inherited source keys rehash
without mismatch. These are implementation controls, not physical error bounds.

The first batch stopped at a mistaken signed-zero test fixture expectation (both
backends returned5 keys, not6). Only that fixture was corrected; the failure,
old test snapshot and receipts remain. The native binary and thresholds did not
change. No new extended Python replay, RK4 trajectory, checkpoint or physical
admission was performed. Next: native RK4 stage/short-trajectory and restart parity.
See [SAT results and retained failure](RESULTS-20261010-native-sat-component.md).

### Native full58 SBP volume and OpenMP parity qualified (2026-10-10)

The new native volume component couples ghost-free SBP(4,2) derivatives to
the full nonlinear FO-CCZ4 RHS, including sources and every surface node.
It supports rectangular9..17-per-axis grids with anisotropic spacing.
The original C++ equation file is untouched: authenticated build-time
extraction retains the equations, changing only allocation/iteration to
cell counts and removing the old prescribed-halo skip. Four generated
fragments are checked byte-for-byte against that explicit contract.

The first qualification stopped before any numerical call because Windows
generation used CRLF instead of contracted LF. Only generation was fixed;
the failed build/receipt/XML stay. Fresh qualification passes68 tests with
zero skips; the related five-file Python reference regression passes160.
Full58 regional/per-slot RHS differences are at most6.70e-16 normalized;
all directional derivative samples match Python exactly. Ten full-RHS
states have byte-exact numeric payloads at OpenMP1/2/4 threads. These are
implementation controls, not physical solution errors or speedup claims.

All514 artifacts,7 source/dependency files,4 generated fragments and358
inherited reference keys are accounted for, with source/runtime identity
unchanged across the qualified run. No SAT, RK time evolution, checkpoint,
physical boundary, black-hole, AMR, waveform, GPU or live admission yet.
Next: six-face stage-local characteristic SAT, then RK/restart parity.
See [results, retained failure and evidence](RESULTS-20261010-native-sbp-volume-component.md).

### Native FO principal assembly and spectral component qualified (2026-10-09)

The user selected native parity work after the fresh Python replay hit its
unchanged 2400-second cap. No new extended Python replay has been started.
The Windows x64 C++17 component now generates the58 principal matrix and47
PDE speed families from local geometry, then performs the spectral split.
It no longer receives the matrix/roots from Python. The earlier ILP64/split
component passed46 tests; the new assembly and actual-C++-RHS probe suite
passes134 tests, both with zero skips. These are software component controls.

Maximum normalized matrix difference is1.85e-17; positive/negative split
differences are below2.17e-15. A separate executable probing the unchanged
actual C++ RHS agrees within1.02e-16 across FD2/FD4 and two amplitudes.
The new suite records262 calls,108 byte-exact successful repeat pairs and
46 expected rejections. All1157 artifacts and10 source/dependency files
were rehashed;345 reference keys plus6 prior component keys remain unchanged.

This does NOT implement the new native SBP volume/SAT/RK method or its
checkpoint. Python/native still share one OpenBLAS binary; it is not an
independent linear-algebra algorithm. No performance, physical boundary,
full-black-hole, AMR, waveform, GPU or live admission. Next: native SBP
volume/source parity, six-face stage-local SAT, then RK/restart parity.
See [ABI/split results](RESULTS-20261009-native-characteristic-component.md)
and [principal results and remaining native gates](RESULTS-20261009-native-fo-principal-component.md).

### Constraint-compatible gauge pulse: primary audited, replay resource-aborted (2026-10-09)

A new initializer changes only log-lapse and its three analytic gradient
slots. Physical Schwarzschild metric/extrinsic-curvature data, the other
54 slots, and all six boundary faces remain unchanged. This is a separate
gauge benchmark, not a repair or regrading of the older perturbed problem.

The primary N13, no-projection run completes 7/14/28 steps at common
T=1/16M and passes independent saved-state arithmetic/diagnostic auditing.
Whole/central/edge/corner temporal orders are 3.964/3.964/4.097/4.091.
Faces remain below the unchanged 2e-13 floor; aggregate UNRESOLVED.
The edge margin is only 1.16 times the floor. No spatial convergence was
measured, and no old/new regional results may be stitched into a pass.
The 72-file regression passes 2126 tests, not independent physics cases.

The first separate-process replay stopped at the disk guard after10 accepted
steps. After user-confirmed recovery,84/2126/33 tests were rerun successfully
(84 and33 are subsets), then a fresh replay reached41 accepted steps before
the original2400-second cap. Coarse7/7 and middle14/14 completed; fine20/28
completed. Its931 saved artifacts match the primary prefix and pass an
independent partial-state audit. Full replay remains INCOMPLETE; this is a
resource timeout, not a numerical failure. Both interrupted directories stay.
Disk recovery is verified; retain C>=3GiB and E>=4GiB+32MiB plus batch budget.
The user chose C++ parity next, not a longer Python replay. No cleanup or
threshold change, and no stitching regional results into a global pass.

No old RHS, native backend, art, default/live or payload changes. All
physical, boundary, AMR, black-hole, waveform and GPU admissions stay false.
See [results and resource interruption](RESULTS-20261009-schwarzschild-gauge-pulse.md)
and [maturity assessment and roadmap](ANALYSIS-20261009-kernel-maturity-roadmap.md).

### Historical checkpoint: N13 time refinement reproduced, aggregate unresolved (2026-10-09)

With fixed common initial data and no continuous projection, 7/14/28 RK4
steps reach the same T=1/16M. Whole/face/edge/corner temporal orders are
4.078/4.066/4.074/4.135. The central fine difference is 8.51e-14, below the
unchanged 2e-13 floor; its order is null and the aggregate stays UNRESOLVED.
Whole-domain resolution margin is only about 3.99 times that floor.

Two fresh processes each complete 49 accepted steps / 196 RHS stages.
Scientific JSON agrees exactly except root elapsed time; all 2052 artifacts
and 338 source keys (336 distinct files) match. Independent H/M diagnostics
agree within 3.64e-14, raw RK combinations byte-for-byte, and independently
summed temporal norms within 2.89e-16 relative difference. The inherited
69-file regression passes 2042 tests, not 2042 independent physics cases.

This closes reproducibility for one short, single-grid temporal screen, not
universal fourth-order accuracy, spatial convergence or a black-hole gate.
The mapped initial data still changes physical K_ij and does not solve the
Einstein initial constraints. The old failed trajectory remains failed.
No equation, native backend, art, default/live or payload changes; temporal
order validation and all physical/AMR/waveform/GPU admissions remain false.
Next: resolved central time error and separate spatial/constraint convergence,
under a new prospective budget; no threshold relaxation or automatic retry.
See [results, audit and retained limits](RESULTS-20261009-common-time-refinement.md)
and [maturity assessment and roadmap](ANALYSIS-20261009-kernel-maturity-roadmap.md).

### Historical checkpoint: N13 common-initial-data window completed, replayed and independently audited (2026-10-09)

All three policies complete 16 steps to T=1/16M at dt=1/256. Two fresh
processes each execute 48 accepted steps / 192 RHS stages; scientific JSON
agrees exactly except root elapsed time. All 2014 artifacts and 333 source
keys (331 distinct files) match. Independent saved-state H/M diagnostics
agree within 4.25e-14, raw RK combinations byte-for-byte, and cofactor maps
within 4.45e-16. The inherited 67-file regression passes 2002 tests.

This is a NEW initial-value problem: time-zero algebraic mapping changes
physical K_ij (whole RMS 4.03e-5), not an Einstein initial-constraint solve
or a restart of the rejected old trajectory. Even none, with no continuous
projection, crosses the old failure time. Policy superiority is unestablished.

Whole H/M norms grow by about 1.68% / 18.89%; final policy states differ by
at most 5.22e-14 per slot. One grid/step size does not measure temporal order
or establish long-time stability. The old failure remains failed. Next is
resolved common-endpoint temporal/spatial convergence, then a matching native
method. No solver RHS, art, default/live or payload changes in this round.
Physical boundary, full black-hole, AMR, waveform and GPU gates stay false.
See [results and retained limits](RESULTS-20261009-common-initial-window.md)
and [project maturity and dependency-ordered roadmap](ANALYSIS-20261009-kernel-maturity-roadmap.md).

### Historical checkpoint: default-off projected RK adapter and common-initial-data pilot reproduced (2026-10-09)

A separate adapter now compares none, endpoint-only, and all-stage/endpoint
projection. None delegates to the unchanged original step. Two fresh processes
each complete the fixed N9 twelve-case matrix (24 steps / 96 RHS stages plus
one old-driver step). Both scientific JSON records agree exactly except root
elapsed time; all 1330 artifact hashes and 326 source keys match.

Independent saved-array auditing reconstructs every raw RK combination exactly
and checks the algebraic map within 4.45e-16. Independent H/M diagnostics agree
within 7.41e-15. The final 65-file regression passes 1971 tests. These are method
and reproducibility checks, not physical admission or cross-backend validation.

Two tangent analytic controls resolve fourth order. A deliberately non-tangent
circle control resolves FIRST order for stage projection despite roundoff-sized
constraint residuals. This counterexample is not a measured FO-CCZ4 order loss.
All real FO temporal self-comparisons in T=1/256M are below the fixed resolution
floor: actual temporal order and policy superiority remain UNRESOLVED.

The mapped perturbed initial data changes physical K_ij and is a new initial
value problem, not recovery of the old failed trajectory. Next is a separately
frozen longer common-initial-data window and resolved temporal convergence.
No old source/failed verdict, native solver, art, default/live or payload changes.
See [results, counterexample, evidence and next gates](RESULTS-20261009-projected-rk.md).

### Historical checkpoint: standalone algebraic map and correction budget reproduced (2026-10-09)

A standalone canonical58 map was implemented to enforce det(h)=1, tr_h(a)=0
and all three tr_h(D_k)=0 constraints. The remaining 28 slots stay byte-identical.
At that checkpoint no RHS, SAT, RK policy, native solver or live path called it.
The new adapter above is separately identified; the frozen map's original
component metadata describes its standalone contract. It changes physical
g_ij/K_ij and is explicitly NOT a lossless conformal reparameterization.

All 29 retained initial/accepted states plus the rejected RK state were
processed twice. Scientific results agree exactly except root elapsed time;
all 758 artifact hashes and 321 source keys (319 files) match. Independent
cofactor maps differ by at most 4.44e-16; dense H/M diagnostics by 4.34e-14.
The 62-file regression passes 1898 tests, including 91 new focused controls.

Important counterexample: the rejected state's whole-domain momentum norm
INCREASES by 22.85% after mapping, even though determinant error falls to
roundoff. Nine of 13 correlated perturbed samples increase that norm. This
passes a component/correction-budget check, NOT an evolution or physics gate.
The previous failed probe stays failed and no mapped state is restartable.

Next: common algebraically compatible initial data and an explicitly gated
RK integration policy, with temporal-order/physical-correction checks. No
physical, native, AMR, waveform, GPU or live admission. See
[component results, counterexample and next method gates](RESULTS-20261009-algebraic-projection.md).

### Historical checkpoint: longer-window probe failed at the retained determinant speed contract (2026-10-09)

The unchanged N13, dt=1/256 method reaches T=1/16M for static initial data.
The original disturbed case accepts 11 steps to T=0.04296875M, then the
second RK stage of step 12 (candidate time 0.044921875M) is rejected by
the existing characteristic-speed det(h)=1 contract. The recorded error is
1.0899525726e-10, above the unchanged 1e-10 cap. No retry or repair occurred.

Independent cofactor arithmetic confirms the boundary crossing; all 29
accepted states have independently reconstructed regional diagnostics, with
maximum difference 3.82e-14. All 18 parent-prefix arrays and 16 step records
match exactly. All 342 artifacts and 313 source keys (312 files) match.
The final 60-file regression passes 1807 tests; the scientific probe still
FAILS. No complete RHS/report exists for the rejected stage.

Next is an explicit, default-off algebraic-constraint candidate and its
correction/error budget, not a relaxed gate or an automatic retry. The
published projected ADER-DG scheme is not identical to this unprojected
SBP/SAT+RK4 branch. No physical, native, AMR, waveform, GPU or live admission.
See [failure evidence and next development](RESULTS-20261009-longer-window-probe.md)
and [source-grounded constraint-policy comparison](ANALYSIS-20261009-algebraic-constraint-policy.md).

### Historical checkpoint: retained trajectory determinant budget reproduced (2026-10-09)

All 58 saved states now have a four-term log-determinant balance: transport,
reduction-constraint forcing, discrete chain-rule defect and existing damping.
The actual volume RHS and independent dense-operator contractions agree;
maximum instantaneous residual is 3.16e-19 (analysis identity, not physical
accuracy). In the perturbed N13 trajectory the forcing projection is about
1.0315 and damping about -0.0316; these are signed projections, not causal
percentages. Static changes and temporal budget orders remain UNRESOLVED.

Two processes agree exactly except root elapsed time; all 746 artifacts and
310 source keys (309 distinct files) match. The 58-file regression passes
1749 tests. No evolution, equation, SAT, parameter, threshold or old verdict
changed. Next is a separately frozen longer-window evolution probe with the
same stage limits, not another reinterpretation of the short-window result.
See [budget results and limits](RESULTS-20261009-determinant-balance.md).

### Historical checkpoint: nonlinear dual-diagnostic screen and independent endpoint audit completed (2026-10-09)

A fresh six-case run completed 52 RK4 steps / 208 stages to T=1/32M.
All 58 initial/accepted states were saved and independently reconstructed
using dense operators and a lower-index Riemann contraction. Maximum
diagnostic difference is 3.82e-14. All 12 historical initial/final array
records and all original stage records match exactly; no dynamics changed.

The separate Hessian-H screen passes with spatial orders 2.41191/2.47704;
state orders are about 2.58, M about 1.57--1.60, and time order 4.08784.
The old H screen remains FAILED (1.40250/1.44607). This is not global
fourth-order accuracy, long-time stability or a physical black-hole gate.
All 358 campaign artifacts and 301 source keys (300 distinct files) match.
The 56-file regression passes 1708 tests, including eight new post-hoc
instantaneous determinant-balance controls; these do not regrade any run.

Next: constraint-growth balance and time-error budget before a separately
frozen longer window. No new native, CPBC, horizon, AMR, waveform, GPU or
live admission. See [results, limits and remaining roadmap](RESULTS-20261009-nonlinear-dual-diagnostics.md)
and [determinant-balance mechanism and next checks](ANALYSIS-20261009-determinant-balance.md).

### Historical checkpoint: general metric-Hessian Ricci/ADM diagnostic reproduced (2026-10-09)

The separate `sbp_metric_geometry.py` handles general non-diagonal physical
metrics, pure D2 and mixed D1 derivatives, inverse-metric chain rules, and
the full physical extrinsic trace. Three analytic families include flat
nonlinear coordinates and intrinsically non-conformally-flat warped geometry.
All 24 static refinement checks pass: whole orders 2.47--2.53, interior about 4.

Parallel reconstruction of 12 retained nonlinear states gives positive-time
Hessian-H orders 2.41191 and 2.47704, while old H remains 1.40250 and 1.44607.
No state was evolved again or improved by postprocessing; the old failure
stays failed. Maximum new/old M difference is 1.57e-18, with no projection.
Two processes match exactly except time; all 636 artifacts and 298 source
keys (297 distinct files) match. The 53-file regression passes 1623 tests.

Next: a fresh nonlinear space/time campaign with simultaneous old/new
diagnostics, before extending the propagation window. No volume/SAT, native,
physical-boundary, black-hole, AMR, waveform, GPU or live gate changes.
See [general geometry results and evidence limits](RESULTS-20261009-metric-geometry.md).

### Historical checkpoint: static derivative mechanism reproduced; separate D2 candidate passes (2026-10-09)

Exact rational cubic controls identify an h^(3/2) whole-norm error mechanism
when the current boundary D1 is composed with itself. A conformally-flat
scalar reduction reproduces saved initial tensor-H fields within 1e-13.
The differentiated first-derivative error dominates the refined static H;
this is not a claim that every nonlinear evolution error has been explained.

The new, separate `SBP42Second` reference shares the D1 norm but uses a
different boundary S. Seven grids and two analytic curvature families yield
N33-to-N65 whole orders 2.55--2.67 and fixed-interior orders 4.01--4.03.
It remains a static conformal diagnostic candidate, not an evolution change.
Two processes agree exactly except time; all 612 artifacts and 293 source
keys (292 distinct files) match. The 51-file regression passes 1599 tests.

Next: general nonconformal/non-diagonal three-dimensional Ricci diagnostics,
parallel old/new saved-state checks, then a new nonlinear convergence study.
No old failure is regraded and no physical/live gate changes.
See [static evidence, attribution and next development](RESULTS-20261009-static-derivative-study.md).

### Historical checkpoint: nonlinear refinement completed; Hamiltonian convergence FAIL (2026-10-09)

The frozen six-case nonlinear 58-field SBP/SAT study completed 52 RK4 steps,
208 curved stages and the common endpoint T=1/32M. State orders are about 2.58,
momentum orders 1.57--1.60 and temporal self-convergence 4.09. Hamiltonian orders
1.40250 and 1.44607 FAIL the unchanged 1.5 gate: completed=true does not mean
refinement_screen_passed=true. The smaller temporal difference is only 2.10
times the measurement floor; do not generalize this one-case time result.

Independent reconstruction agrees for 12 saved arrays and all decisions;
maximum diagnostic discrepancy is 2.75e-14. All 297 artifacts and 285 source keys
(284 distinct files) match. An explicitly post-hoc signed decomposition finds
H already has nearly the same low orders initially; its subsequent field
change is only 0.0582%--0.0929% of the initial RMS. This directs a static
derivative/boundary-stencil investigation, not a unique-cause or stability claim.

The exact three-file deadline transition is now recorded; the final 49-file
regression passes 1515 tests. Historical failed reports remain unchanged.
No full campaign evolution replay, physical boundary, black-hole, AMR,
waveform, GPU or live admission follows. Old T=1M failures remain failures.
See [results, retained failure and next scientific work](RESULTS-20261009-nonlinear-refinement.md).

### Historical checkpoint: nonlinear SAT short window reproduced and independently audited (2026-10-09)

The unchanged nonlinear58-field volume, six stage-local characteristic SATs
and RK4 now pass the first bounded9^3, T=1/256M analytic-incoming experiment.
Separate-process replay is exact except elapsed seconds. All seven retained
states have independently transcribed metric/reduction diagnostics; maximum
RMS discrepancy is6.45e-16. All566 artifacts and277 source identity keys
(276 distinct files) match. The current three-file focused regression has
166 passed. The larger retained regression remains1298 passed /1 failed at
the old900s clock-boundary check; it was not regraded or silently excluded.

This is NOT constraint convergence, a nonlinear stability/CPBC proof, a
physical radiative boundary, or full black-hole/AMR/waveform/GPU admission.
Intermediate RK states and the flat final state were not saved, so their
records are checked/replayed but not independently reconstructed. Old T=1M
Schwarzschild failures and all physical/live flags remain unchanged.
See [results, actual constraint values and remaining gates](RESULTS-20261009-nonlinear-sat.md).

### Historical checkpoint: nonlinear campaign still pending (2026-10-08)

At this historical checkpoint, `fo_ccz4_sbp_nonlinear.py` coupled the actual nonlinear volume to six
stage-local characteristic SAT faces and RK4. Its retained27 module tests
passed, but there is no completed nonlinear campaign or replay receipt.
The new runner now retains partial failed cases and rejects invalid/duplicate
stage records. Only syntax and static checks cover those latest runner edits;
their new tests have NOT run. The user will restore C-drive space above the
approved3GiB floor before new numerical tests or experiments start.
No physical/live gate changed. See [exact changes and pending verification](RESULTS-20261008-nonlinear-runner-hardening.md).

### Actual nonlinear SBP volume closed by independent algebra and replay (2026-10-08)

The actual nonlinear58-field RHS now accepts the SBP(4,2) volume derivative.
Curved static core errors converge at about4.00 order; whole/face errors have
lower explicitly reported orders. Four legacy RHS/two-step RK paths remain
byte-exact. An independent conformally-flat tensor reconstruction reproduces
all three saved static RHS/Ricci arrays (maximum Ricci difference2.75e-15).
Separate-process replay is exact except time, all558 artifacts and268 source
identities match, and the current merged focused regression has1183 passed.

This volume module has no SAT or time driver. Its completed gate does not
repair old T=1M Schwarzschild failures or grant any physical/live admission.
The next implementation is stage-local curved nonlinear boundary coupling.
See [results and exact limits](RESULTS-20261008-sbp-volume.md).

### Full three-dimensional frozen SBP/SAT cube and exact replay pass (2026-10-08)

All58 fields now evolve with simultaneous x/y/z derivatives, one source term
and six additive characteristic SAT faces, including edges/corners. Three
nonparallel waves per family on9^3/17^3/33^3 give state orders2.81--3.10 and
time orders4.02. All15 saved states have been independently reconstructed;
maximum diagnostic difference1.73e-18. The merged focused regression has
1093 passed. A separate-process campaign agrees exactly except elapsed time;
all560 artifacts across both runs and262 source identities match.

Energy accounting retains nonzero skew-principal volume terms: this is NOT
a common3-D symmetrizer or a stability/CPBC proof. Metric-H error is only about
1.50--1.70 order. Curved/nonlinear coefficients and native integration remain
mandatory next work; old Schwarzschild failures and all physical/live flags
stay unchanged. See [results and evidence scope](RESULTS-20261008-sbp-cube.md).

### Full58 linear SBP/SAT coupled and independently recomputed (2026-10-08)

The actual58-variable flat linearization now includes its full source matrix
and incoming SATs. The frozen24-case spatial campaign passes: state orders
are about3.01--3.06 (general data) and2.87--2.92 (TT), with temporal orders
about4.03--4.05. Metric-H error decreases at only1.34--1.56 order in the
general off-constraint family; this is not universally high-order constraints.
All34 final states, all590 artifacts across two processes and the decisions
were independently recomputed or rehashed. Maximum diagnostic discrepancy is
3.99e-17. The combined focused regression has1033 passed; the separate new
auditor subset has9 passed. See [result and exact scope](RESULTS-20261008-full58-sbp.md).

This is still a plane reduction of a linearization, NOT a three-dimensional
nonlinear or physical boundary. Direction-dependent energy norms must not be
silently treated as one common3-D norm. Native0.5.0 and the Schwarzschild T=1M
failures remain unchanged; all physical and live admission gates stay false.

### Fixed-layer compatibility isolated; SBP/SAT boundary track started (2026-10-08)

An independent analytic-input lapse-Laplacian oracle predicts all nine retained
initial Qdot fields and all six first-k2 lapse-auxiliary domain differences.
Separate-process replay agrees in all fields except elapsed time. This closes
the bounded initial-source investigation, NOT the old T=1M convergence failures.

The selected next track is an explicitly coupled SBP/SAT boundary candidate.
`sbp_boundary_operator.py` now provides a ghost-free SBP(4,2) reference derivative
and scalar incoming-SAT energy control: fourth-order interior, second-order
boundary rows. Its exact rational identity, array/58-slot layout and scalar
energy tests pass; the final combined focused regression is **910 passed**.
It is not yet coupled to the full FO characteristic/constraint system or the
production solver. All physical, black-hole, AMR, waveform, GPU and live gates
remain false. See [results and retained failures](RESULTS-20261008-boundary-compatibility-and-route.md)
and the [route decision](DECISION-20261008-boundary-gauge-route.md).

### Schwarzschild T=1 matrix COMPLETE; full window gate FAIL (2026-10-08)

The unchanged native 0.5.0 solver completed all three frozen batches under the
user-approved E-storage policy (C >=3GiB; E >=4GiB+32MiB). All 62 distinct
diagnostic samples are bounded: 43 newly produced and 19 retained. Continuous
serial versus staged four-thread checkpoint AND manifest replay is byte-exact.
All 39 signed timestep checks pass, including six bounded-null checks.

**Only 28 of 30 refinement groups pass.** At T=1M, FD4/N25-to-N33 orders are
2.63714 for H and 2.81285 for Ricci, below the frozen >=3 criterion. The final
receipt therefore has completed=true but window_passed=false. Independent
recomputation reproduces all samples, controls and failed decisions; 281 focused
Python tests pass. No physical equation or scientific threshold was changed.

Moved-domain differences are substantial but are not reflection coefficients.
A separately labeled read-only, post-hoc decomposition shows partial error
cancellation on N25 versus reinforcement on N33; it does not establish the
physical cause or regrade the failed gate. Historical timeout/storage failures
remain intact. Physical boundary, full black-hole, AMR, waveform, GPU and live
admission all remain false. See [results, identities and next scientific gates](RESULTS-20261008-schwarzschild-window-completion.md).

### Historical FD2 checkpoint PASS; full window was INCOMPLETE (2026-10-07)

The unchanged native0.5.0 solver now passes all15 FD2 refinement groups at
T=.25,.5,1M on N17/25/33. The original full-window attempt stopped on a180s
per-command timeout. A separately frozen six-segment completion retained that
failed receipt and filled ONLY the FD2 submatrix:12 primary samples (10 reused,
two new) plus four new execution splits. All16 diagnostics, raw fixed-halo
bytes,188 source identities and207 new artifact hashes were rechecked.
229 focused Python regression tests pass.

The final Weyl-invariant orders are about1.77, above the frozen1.5 threshold
but not evidence of universally exact second-order behavior. FD4, moved-domain,
step-halving and long-window serial replay remain pending. **The full-window
gate stays false**, as do physical boundary, full black-hole, AMR, waveform,
GPU and live admission. See [results, retained failure and remaining gates](RESULTS-20261007-schwarzschild-window.md)
and the [boundary design gap](ANALYSIS-20261007-boundary-admission-gap.md).

### Native Schwarzschild exterior-domain benchmark PASS (2026-10-07)

Native 0.5.0 adds an opt-in nonperiodic isotropic Schwarzschild exterior
cube with two prescribed analytic layers and explicit v5 domain/mass identity.
The 58 interior fields evolve independently. The frozen N17/25/33 study
passes 20 positive-time and six initial refinement groups: roughly second
order for FD2 and fourth order for FD4, including independently reconstructed
NONZERO Ricci/Weyl curvature. Python/native disagreement is at most 5.00e-16;
old periodic rollback and serial/split, 1/4-thread checkpoint/manifest replay
pass. All 18 diagnostics, 182 sources and 503 artifact hashes were rechecked.
337 focused Python tests pass.

**Scope: T=0.125M, exterior cube only, analytic fixed halo.** No horizon,
physical boundary/CPBC, long black-hole evolution, AMR, waveform, GPU or live
admission. The original protocols and failed historical receipts remain
unchanged. See [results, identities and next gates](RESULTS-20261007-schwarzschild-domain.md).

### Finer-grid convergence PASS after explicit resource-stop completion (2026-10-07)

The unchanged Windows-native 0.4.0 solver now passes the separately frozen
N16/24/32 vacuum-slice study: 80 constraint-refinement groups, four all-state
refinement groups, eight state timestep controls and 160 signed constraint
timestep controls. State orders are 1.95096 (FD2) / 3.95658 (FD4); final
1/4-thread, direct/split checkpoint AND manifest replay is byte-identical.

The first finer-grid run hit its 1800-second total cap at 59/60 samples. An
explicitly frozen two-command completion supplied the last interval and replay;
combined execution took 2134.02 seconds. **The original budget was not met**,
and both that incomplete receipt and the earlier coarse-grid failure remain
unchanged. The extended study contains 60 samples, including 24 reused from
the coarse study; this is not 60 newly simulated samples.

All 60 diagnostics and the final decision were independently recomputed;
176 source identities and 184 new artifact hashes match. **491 focused Python
tests passed.** Physical, black-hole, AMR, waveform, GPU and live admission
remain false. See the [full result, limits and next scientific gates](RESULTS-20261007-fine-relaxation.md).

### Vacuum-slice refinement complete; coarse H gate fails (2026-10-07)

The unchanged 0.4.0 Windows-native solver completed 26 cases / 78 samples.
Spatial state orders are 1.87048 (FD2) and 3.86852 (FD4); temporal orders are
about 3.99. Python/native and direct/split, 1/4-thread replay controls pass.
However, six of 80 constraint-refinement groups fail on the coarse N8-to-N16
Hamiltonian residual. **The aggregate convergence gate remains false.** All
N16-to-N32 pairs pass, a hypothesis for a separately frozen finer-grid study,
not a reason to regrade this result. No physical or live admission is implied.

All 78 diagnostics, 170 source identities and 438 artifact hashes were
rechecked; **435 focused Python tests passed**. See the
[complete result, failed gates and next controlled experiment](RESULTS-20261007-relaxation-convergence.md).

### Opt-in finite-rate algebraic relaxation integrated (2026-10-07)

Native 0.4.0 now accepts explicit `--tau-inverse`; positive rates use checkpoint
v4 with order, gauge and relaxation identity. Python restored states and both
manifest/restore validators reject omitted or mismatched policies. Zero rate
keeps the old unprojected path and v1/v2/v3 bytes. No auxiliary reconstruction
or live writeback is introduced.

The frozen campaign passed six retained-binary rollback comparisons, twelve
finite-rate Python/native and 1/4-thread/restart controls, four T=1 trace/null
controls and sixteen fail-closed negatives. Evolution disagreement peaks at
`8.337e-16`; **401 focused tests passed**. A/B/D/P residuals can still grow:
this is a bounded integration gate, not convergence or physical admission.
See [results, identities and next validation gates](RESULTS-20261007-algebraic-relaxation.md).

### Nonlinear lapse/trace balance audited; null-control requirement clarified (2026-10-07)

An explicit seven-term semidiscrete identity now separates geometric-trace
forcing, auxiliary-reduction errors, transport, and finite-difference product /
inverse-chain defects. The actual Python and native RHS were checked on all
310 retained states plus 20 new instantaneous fixtures. Cross-backend error is
at most `1.388e-16`; both balance identities agree within `6.30e-17`.
An independent FFT-symbol derivative calculation confirms the compact identity.
The eight new trace-free initial states have exactly zero measured lapse/trace
rates. This is a conditional null response, NOT full constraint propagation.

The original audit stopped when its analytic negative fixture incorrectly kept
a dynamic-only profile. That failed receipt remains false. A separate frozen
completion corrected only fixture construction, rechecked all 330 retained rows,
and passed two fresh byte-identical positives plus six side-effect-free
rejections. No old source, solver binary, or numerical threshold changed.
Focused regression: **490 passed**. See [the complete evidence chain and next
constraint-control gate](RESULTS-20261007-lapse-balance.md).

The earlier amplitude-window aggregate remains false. A universal requirement
that every null control produce a measurable nonzero quadratic remainder is
not justified by the conditional continuum identity. Future protocols must
distinguish null-response bounds from nonzero-error order measurements, without
regrading the old experiment. No new time evolution or physical/live promotion
was performed in this audit.

### Prospective trace-source run COMPLETE; aggregate INCONCLUSIVE (2026-10-07)

The unchanged 0.3.2 Windows-native solver completed 62 cases, 310 samples and
288 successful runner commands in 459.65 s. Pure-trace responses match the
signed prediction with measured quadratic remainders; source-response spatial
orders are 1.958/1.979 (FD2) and 3.899/3.950 (FD4). Step-halving, 16 Python/C++
one-step continuations and four direct/split, 1/4-thread replay groups passed.
However, all eight trace-free amplitude groups fall below the predeclared
`1e-12` remainder-measurability floor. Their error order is **inconclusive**;
the frozen aggregate gate stays **false**, with no threshold change or rerun.

An additive metric diagnostic distinguishes the stored K from the actual trace
of reconstructed K_ij when tr_h(A) is nonzero. Existing diagnostics and the
solver were not changed. All 154 source/snapshot identities and 1438 artifact
hashes were checked, all 310 observations recomputed, and an independent FFT
stencil-symbol calculation agrees on prediction errors within `2.711e-20`.
Focused regression: **456 tests passed**, including the 48 new-test subset;
not a full-project test. No physical, constraint-decay, strong-hyperbolicity,
black-hole, AMR, CUDA or live promotion. See [results, uncertainty and next gate](RESULTS-20261007-trace-source-window.md).

### 0.3.2 metadata equivalence PASS; auxiliary-growth mechanism identified (2026-10-07)

The separately frozen v2 protocol completed all **123** commands in 56.08 s:
101 successful commands and 22 expected, side-effect-free rejections. Twelve
old/new cases have identical checkpoint bytes; current 1/4-thread and 3+5-step
runs also have identical manifests. Python/C++ error is at most `1.336e-15`.
Zero-step tests are explicitly function-level inspectors, not a newly supported
solver CLI feature. All 148 source identities and 608 artifact hashes were
rechecked. The old failed v1 receipt remains unchanged. Focused regression:
**443 tests passed**, not the full project suite. See [v2 evidence and limits](EXPERIMENT-20261007-auxiliary-manifest-v2.md).

A separate, read-only post-hoc analysis of all 88 retained T=10 samples finds
that the dominant auxiliary growth is in lapse-gradient reduction residuals.
The current flat linearization predicts `C_Ai(t)=C_Ai(0)-2t D_i tr(A)(0)`;
the maximum signed-field prediction error is `6.237e-16`. This is mechanism
evidence, not prospective causal validation or long-time stability. No damping,
projection or physics was changed. The next scientific gate is a frozen
trace-source/trace-free control, as specified in [the derivation and analysis](ANALYSIS-20261007-auxiliary-trace-source.md).

### 0.3.2 metadata candidate: native test stopped on zero-step CLI (2026-10-07)

The C++ writer now distinguishes independent 58-slot dynamic RK4 from analytic
field/auxiliary reconstruction, initialization, and checkpoint restoration.
The policy is explicitly not invocation history. Historical envelopes stay
read-only and ambiguous; unknown versions and contradictory new policies fail
closed. No numerical C++ code outside the manifest writer changed.

The fresh Windows-native build, real four-thread probe and native operator tests
passed, but the first integration command was rejected: the existing CLI does
not accept `--steps 0`. This was a **test-interface assumption error**, not a
numerical failure. The campaign stopped at command 8; no automatic retry and no
checkpoint/manifest output from that rejected command. Full old/new numerical
equivalence is **not yet validated**. Version 0.3.1 remains the bound evidence
baseline; 0.3.2 is an unadmitted metadata candidate.

The focused regression passed **414 tests in 40.37 s** and Ruff passed, not the
full project suite or native equivalence matrix. All 144 sources and 197
artifact hashes were rechecked; the stopped source snapshot and failure receipt
are preserved. The next separate protocol must test zero-step read/write at
function level and retain the real solver's CLI rejection and positive-step
controls. See [the frozen plan, actual stop and corrective design](EXPERIMENT-20261007-auxiliary-manifest.md).

### FD4 non-planar T=10: explicit continuation passes bounded screen (2026-10-07)

After disk capacity recovered, the unchanged 0.3.1 Windows-native kernel resumed
in a fresh C-drive evidence directory. The old resource-stop receipt remains
incomplete and immutable. All eight predeclared cases now have eleven samples:
two noise seeds on 8/12/16-cubed even grids, a halved-step control and exact
Minkowski. No physics, thresholds, seeds or preserved samples were changed.

The full signed-field timestep difference peaks at **0.226703%** (limit 1%).
N16 handoff replay and N8 direct/split, 1/4-thread checkpoints and manifests
match byte-for-byte. Python/C++ continuation differs by at most `2.681e-16`;
all eleven flat-state samples remain exactly zero. The entire original plus
continued campaign used 1433.32 s and 84.15 MB, within the original budgets.

All sampled screening gates pass, but monitored quantities still grow by as
much as **46.48 times** their initial norms. This is NOT constraint decay,
long-time stability, standard AwA validation, an analytic hyperbolicity proof,
physical boundaries, black-hole evolution, AMR, CUDA or live readiness.
That run's old auxiliary-reconstruction marker remains ambiguous; the later
0.3.2 contract above corrects new outputs without rewriting historical evidence.

141 sources and 145 new artifact hashes were checked alongside the retained
upstream evidence; all 88 raw-checkpoint diagnostics and the aggregate decision
were independently recomputed in a separate process. The focused regression
passed **318 tests in 29.48 s**, not the full project suite. See
[the continuation protocol, complete data and limits](EXPERIMENT-20261007-fd4-robust-continuation.md).

### FD4 non-planar T=10 campaign: resource stop, NOT an aggregate pass (2026-10-07)

The bound Windows-native 0.3.1 solver now has a frozen full-cube noise runner:
8/12/16-cubed **even** grids, two PCG64 seeds, independent perturbations of all
58 stored fields, and no new dissipation, reconstruction or projection.
Even grids retain checkerboard modes; this is an AwA-inspired bounded screen,
not a reproduction of the standard benchmark or a proof of well-posedness.

The run stopped after 637.59 seconds when E free space crossed the predeclared
1 GiB reserve. All 51 native commands had exited zero. Five noise cases reached
T=10; the sixth reached T=1 only. Completed cases have total-state growth
5.106--5.335 and maximum individual-slot growth 33.809--35.806 (log lapse).
The dt-halving, exact flat-state, replay and Python continuation controls were
**not executed**. The receipt is incomplete and the aggregate scientific gate
is false. No automatic retry, deletion or physical/live promotion occurred.

New evidence is retained under `C:/Users/86137/NRShadowEvidence/` (51.14 MB).
139 source identities, 217 artifact hashes and 57 raw checkpoints were checked;
the focused regression passed **293 tests in 23.73 s**, not the full suite.
The audit also identified the old manifest's unconditional
`auxiliary_ordering_reconstructed=true` as misleading for dynamic restarts;
it is not evidence of reconstruction during evolution and awaits a separately
versioned metadata correction. See [the frozen gates, exact stop, partial data,
hashes and continuation conditions](EXPERIMENT-20261007-fd4-robust-window.md).

### Native 0.3.1: constant-preserving FD4 and bounded nonlinear window PASS (2026-10-07)

The first 0.3.0 window attempt was rejected by the unchanged strict plane oracle:
unpaired FD4 arithmetic produced roundoff derivatives of constants and tiny
off-diagonal fields. That failed receipt and its 132-source snapshot are retained.
Version 0.3.1 uses symmetric pair differences before weighting in the Python
evolution/diagnostic and C++ first derivatives. It does not clip small numbers,
project states, change the mathematical stencil/RHS, or relax the oracle.

The fresh Windows-native campaign completed in 512.74 seconds. It passes
364,755 exact constant checks, 145,902 invariant-direction checks, retained
manufactured convergence, four bit-identical FD2 families, and four FD4
Python/C++ families. A prospective old/new operator control on identical clean
data reproduces the old off-diagonal contamination; the new value is exactly zero.

All seven FD4 cases have nine samples through T=1. The H_primary, independent
H_fourier, M_x and Theta **window-RMS and sampled-peak** adjacent-grid orders
range from **3.221 to 3.951**, passing the frozen >=3 gate without dropping
9/13/17/25-cubed grids. A-squared signed-field collapse and dt-halving controls
pass; N9 direct/split and 1/4-thread artifacts match exactly. The T=1 Python/C++
continuation differs by at most `2.874e-16`. Independent Fourier H window RMS
at 25 cubed is 16.68 times lower than the retained FD2 result.

**This does not prove uniform-in-time fourth-order spatial convergence:** the coarsest pair's
individual-time orders include 2.138 (primary H), 2.570 (Fourier H) and 2.632 (M_x).
All are reported. The experiment remains a small-amplitude plane family with
periodic boundaries, not a standard harmonic AwA trajectory or black-hole test.
Long-time non-planar robustness, physical boundaries, AMR, CUDA and promotion
remain open. Live EIH, art and scientific writeback are unchanged.

The focused regression passed **249 tests in 22.56 s** (not the full science suite).
All 135 current sources, 424 new artifacts, 132 archived sources and the original
failure artifacts were rechecked without drift. See
[the repair, complete orders, retained limitations and hashes](EXPERIMENT-20261007-fd4-constant-preserving.md)
and [the original rejected window](EXPERIMENT-20261007-fd4-window.md).

### Native 0.3.0: opt-in FD4 and explicit checkpoint order (2026-10-07)

The Windows-native C++17/OpenMP solver now supports `--spatial-order 4`.
FD2 remains the default and retains its old v1/v2 checkpoint bytes. New v3
checkpoints bind FD4 and the gauge-profile coefficients; both Python and C++
require an explicit matching order on restore. All 58 slots, RK stages and
initializers use the selected operator; auxiliary fields remain independent.
Manifest metadata records the order, format, centered periodic stencil and
absence of added dissipation. Equations, gauges and damping are unchanged.

A fresh 26.83-second native campaign passed eight families and 11 rejection
cases. The actual C++ stencil passes 145,902 far-neighbor checks and all-axis
polynomial moments; the oblique 3-D manufactured derivative has observed FD4
orders **3.899–3.988** on 16/24/32 cubed. Four FD2 families match archived 0.2.1
checkpoint bytes; four FD4 families have exact 1/4-thread and split-restart
artifacts. Full-state Python/C++ errors are at most `1.336e-15`; mixed-language
continuation errors are at most `3.653e-16`. The old reader rejects v3 explicitly.

All 128 source and 262 artifact identities were rechecked without drift.
The final focused Python regression passed **200 tests in 7.07 s**; this is
not a full-suite result. See [the frozen gates, raw errors and receipt hashes](EXPERIMENT-20261007-spatial-order.md).
These checks validate the stencil and integration, **not nonlinear Einstein
constraint convergence**. The retained FD2 spatial failures below, long-time
stability, physical boundaries, black holes, AMR and CUDA remain open. Art,
live EIH and scientific-payload writeback remain untouched.

### Native 0.2.1: output-preserving CPU optimization (2026-10-07)

Periodic neighbor indices are now cached once and shared immutably across RK
stages. The equation bodies, FD2 stencil and floating-point operation order are
unchanged; caches are rebuilt after checkpoint validation and never serialized.
The old 121-source snapshot and binary are archived before editing.

A fresh MSVC/OpenMP comparison passed six functional families, full-checkpoint
bit equality, 1/4-thread and split/old-new/new-old restart checks, 24 negative
restart executions, and 4,231,158 derivative-bit checks. The independent Python
one-step discrepancy is `2.627e-16` or less. Manifest differences are limited to
the explicit 0.2.0-to-0.2.1 kernel version; old v1/v2 checkpoint bytes are retained.

Six alternating paired measurements per grid give **6.398x / 6.560x** median
speedups at 13/25 cubed (16 steps, 4 threads), with all timed states bit-identical.
The last two large-grid pairs slowed in both versions; their samples are retained.
These are bounded local wall-clock measurements, not long-run or HPC guarantees.
The campaign completed in 332.94 seconds with all 124 source identities unchanged.
The two existing native legacy replay checks also pass; the focused Python suite
passed **91 tests in 12.86 s**. This is not a new full-suite result.

See [the frozen design, complete timings and artifact hashes](EXPERIMENT-20261007-topology-cache.md).
**The spatial-convergence failures below remain open.** No physics, art, live EIH
or payload promotion accompanied this performance change. The subsequent 0.3.0
change above implements [the explicit spatial-order checkpoint contract](NOTE-20261007-spatial-order-contract.md);
nonlinear constraint-window accuracy still requires a separate experiment.

### Seven-case remainder evidence complete; spatial aggregate FAILED (2026-10-07)

The Windows-native campaign reached its 1800-second limit after six complete
cases and the seventh initial checkpoint. That timeout receipt remains
`completed=false`. After confirmed process termination and full identity checks,
an explicit 267.96-second continuation completed only the missing time-step
case and one Python/C++ check. All seven cases now have all nine samples;
the original timeout is preserved, not relabeled as a successful run.

**The scientific aggregate still fails.** H_primary, independent H_fourier,
M_x and Theta each fail at least one predeclared spatial window/peak gate.
Although H_fourier window RMS orders are 2.043 / 1.859 / 1.988, its 13-to-17
sampled-peak order is only **1.309**. Primary-diagnostic attenuation therefore
does not explain away every failure; no grid or threshold was removed.

All four amplitude controls support quadratic scaling (maximum signed-field
collapse discrepancy **0.08085%**). Time-step halving changes sampled fields by
at most **0.02004%**; it does not establish RK4 temporal order. The separate
58-slot Python/C++ continuation differs by at most `1.831e-16`. These are
bounded implementation/control checks, not strong-field or independent physical
validation. All 121 source identities and both artifact sets were rechecked
without drift; C++ 0.2.0, live EIH, art and scientific payload are unchanged.

The focused remainder, modal, periodic and continuation regression passed
**78 tests in 7.81 s**, with focused Ruff checks; this is not a full-suite run.
See [the original protocol and retained timeout](EXPERIMENT-20261007-nonlinear-remainder.md),
[the continuation, complete results and hashes](EXPERIMENT-20261007-remainder-continuation.md),
and [the post-hoc diagnostic-symbol explanation](NOTE-20261007-diagnostic-dispersion.md).
The subsequent 0.2.1 output-preserving CPU experiment above changes execution
cost only. Spatial-accuracy changes still require a separate versioned experiment.

### Leading constraint-mode cause isolated; nonlinear remainder still open (2026-10-07)

A frozen no-fit 58-variable linear prediction reproduces all twelve prior
9/13/17-cubed checkpoints, including the T=.75 Hamiltonian mode-1 sign change.
Maximum relative errors are `4.276e-8` for the state and **0.004674%** for that
Hamiltonian mode. Five new runs of the unchanged Windows-native C++ 0.2.0
binary pass the prospective amplitude/initial-connection controls.

The analytic initial Gamma and finite-difference auxiliary D use different
wave numbers. Making only the three initial Gamma slots agree with D reduces
the final Hamiltonian mode 1 by approximately **80,456 / 22,007 / 74,255**;
the other 55 slots are unchanged. This supports a specific initial-constraint
and dispersive-phase mechanism, not a fitted explanation or an RHS change.

**Full nonlinear convergence is not established.** The remaining Hamiltonian
residual is not monotonic from 9 to 13 cubed, and mode 2 remains. The new helper
is opt-in and rejects evolved states; no default initializer, live dynamics,
art or scientific payload changed. See
[the protocol, complete residuals, source hashes and next gate](EXPERIMENT-20261007-modal-initialization.md).
The 22 new tests and 19 periodic-campaign regression tests pass together
(`41 passed in 12.15 s`), with focused Ruff checks. This is not a new full-suite
run or evidence of black-hole/physical-boundary/AMR/CUDA readiness.

### Native T=1 periodic screening and a retained intermediate-time anomaly (2026-10-07)

The unchanged, verified C++ 0.2.0 binary completed eight predeclared periodic
cases in 985.28 seconds: 9/13/17 cubed wave and all-58-slot three-dimensional
noise, a halved-time-step wave control, and exact Minkowski control. The bounded
screening passed with unchanged source/binary identity. At T=1 the Hamiltonian
orders are **1.711 / 1.912**; noise state growth peaks at **2.75**. Direct/split
and 1/4-thread artifacts match exactly; Python continuation differs by at most
`2.302e-16`. This turn's 19 new and 53 related tests passed (not a new full-suite run).

**Do not generalize that endpoint pass to the entire time window.** At T=.75,
the Hamiltonian residual is nonmonotonic from 13 to 17 cubed in both the primary
metric diagnostic and the independent plane-Fourier diagnostic. Halving dt
changes those residual fields by only 0.000181% / 0.000989%, respectively.
The signed leading Fourier mode changes across grids. Spatial dispersion/error
cancellation was the hypothesis from this campaign; the subsequent modal
controls above now isolate its leading initial-constraint mechanism while
retaining the nonlinear remainder. The predeclared endpoint gate is retained
without hiding this intermediate result.

See [the frozen protocol, results, hashes and open anomaly](EXPERIMENT-20261007-periodic-window.md).
This is one seed, odd grids and one nominal light-crossing time with 1+log,
not the standard harmonic long-time benchmark. Strong hyperbolicity, uniform
time-window convergence, physical boundaries/black holes, AMR, CUDA and live
promotion remain unverified. No RHS, EIH, art or system-toolchain changes were
made in this campaign.

### C++ state-dependent profile and ODE erratum (2026-10-07)

The opt-in profile now runs in the actual C++17/OpenMP RHS and all RK4 stages.
Checkpoint v2 records its id and both coefficients; the Python codec restores
all 58 independent fields and the mandatory profile tag. Missing/mismatched
profiles, malformed payloads and invalid field domains fail closed. Legacy
fixed coefficients remain the default; EIH/live/art are untouched.

A mandatory nontrivial 3-D test exposed an **existing C++ equation error**:
the `ln(alpha)` and `ln(phi)` ODE rows re-differentiated primary fields instead
of using `beta.A` / `beta.P` (FO-CCZ4 Eq. 12b/12d). Both constant/profile C++
modes are corrected; kernel version is now `0.2.0`. The old executable is a
retained failing control, not an oracle to preserve erroneous dynamics.

Six bounded profile cases agree with Python within `6.294e-16`; direct/split
restart and 1/4-thread artifacts match byte-for-byte, and 16 bad restarts fail
without output. Original all-byte compatibility remains false (versioned
manifest changed); the failed first campaign is retained. See
[the protocol, erratum and full results](EXPERIMENT-20261007-cpp-profile.md).
These checks do not establish long-time, strong-field, CPBC or CUDA readiness.
At that source snapshot, the Python regression completed **385 passed in 717.46 s**, with no
failures or skips; native C++ behavior is covered separately by the fresh-build
campaign above. Focused static checks passed.

### Refinement diagnosis and Windows-native replay (2026-10-07)

The frozen 14-case full-cube experiment has completed. At fixed `dt=.02/64`,
18/26/34-point Hamiltonian orders are **1.849 / 1.917**, while momentum,
Gamma and Theta also pass the predeclared 1.5 order floor. The original
9/13/17-point Hamiltonian failure is retained. Time-step changes contribute
less than 0.115% of the measured Hamiltonian residual; this supports a bounded
pre-asymptotic spatial-error diagnosis, **not** verified fourth-order temporal
accuracy. A strict plane-diagonal Fourier/closed-curvature oracle independently
checks the diagnostic; it is not a general 3-D oracle. See
[the frozen refinement protocol and results](EXPERIMENT-20261007-refinement-separation.md),
including the post-run test-only index rename and precise source-hash boundary.

Windows-native MSVC 19.44/OpenMP has now freshly rebuilt the three existing C++
shadow binaries. The reproducible `scripts/run-nr-k2-native-msvc.py` audit
measures a real four-worker team and passes legacy 58-slot contract/RHS,
thread-count and restart checks. The dynamic Python/C++ maximum difference is
`5.634e-16`; source and executable hashes are retained. This restores a current
CPU build path without modifying system PATH or installing tools. It **does
not** itself validate the new state-dependent gauge in C++, or provide CUDA;
the subsequent candidate/ODE-correction campaign is described above.
See [the native build record](EXPERIMENT-20261007-native-msvc.md).
Validation coverage: the already-running full suite finished **340 passed**;
the 10 subsequently added native-audit tests passed separately, and all 18
refinement/oracle tests were rerun after the cosmetic test-index rename.
That snapshot collected 350 tests; this was split-batch coverage, not a single
350-test full-suite run. Focused Ruff checks passed.

### Opt-in state-dependent gauge candidate (2026-10-07)

`FOCCZ4GaugeProfile` now connects `f=3*alpha*chi`, `mu=0.2*chi` to the actual
FO-CCZ4 RHS and every RK4 stage, including the product-rule source
`f*(A_k+2*P_k)*b^i`. It is **off by default**, restricted to `0<alpha<2`,
`chi>0` and advective 1+log with `c=e=s=1`. Tagged states reject silent
continuation under a missing/different profile. The subsequent C++/checkpoint
v2 port above now supplies bounded cross-language and restart evidence.

The bounded campaign has 200 complete sampled numerical bases, five preserved
legacy-degeneracy controls, and second-/fourth-order manufactured derivative
convergence. A 9/13/17-point periodic evolution replays exactly. However, its
Hamiltonian convergence orders are **1.493 / 1.705**: the first misses the
predeclared 1.5 threshold. The v2 receipt therefore fails its aggregate gate
despite the passing component checks. It is not a validation of uniform
hyperbolicity, long-time stability, or black-hole accuracy.
See [the candidate experiment](EXPERIMENT-20261007-state-dependent-gauge.md).
No live, art or scientific payload changed.

### Frozen-principal erratum and local spectrum gate (2026-10-07)

The old physical-frame/global-speed proxy is **rejected**, even at constant
coefficients. `fo_ccz4_frozen_symbol.py` now keeps `h`, `chi`, lapse and shift
separate, assembles the implemented principal equations directly, and checks
them against actual grid RHS probes. Eight coefficient cases pass with maximum
absolute error `8.89e-16`; this is equation-implementation consistency only.

The published speed families and SVD null spaces are now audited in
`fo_ccz4_frozen_characteristics.py`. Seven regular sample points have complete
numerical bases; three required counterexamples have ranks **56, 56, 54**,
not 58. In particular, `f=1` is not a universal repair for the legacy `f=0.75`
collision: local lapse/shift and light/ordering collisions remain. These local
failures block any claim of a uniformly strongly hyperbolic runtime domain.
No evolution defaults, live dynamics, art files or scientific payload changed.

See [the experiment record](EXPERIMENT-20261007-frozen-principal.md) for the
reproduction commands, exact scope of the rational-rank certificates, withdrawn
receipts, and the next acceptance gate. Historical flat-background receipts
below must not be read as validation of variable-coefficient boundaries.

### Formula erratum (2026-10-05)

The FO-CCZ4 `K` slot is the physical trace
`K = gamma^ij K_ij`.  The combination `K_hat + 2 Theta` belongs to the
separate Z4c variable `K_hat = K - 2 Theta`; it must not be inserted into an
FO-CCZ4 physical-`K` momentum row.  A pure `Theta` perturbation with fixed
physical `K` therefore has zero ADM momentum.  The earlier shadow receipts
that reported an explicit `-4/3 partial_i Theta` term in this FO-CCZ4 row are
superseded by the corrected source and tests below.  No live runtime or
scientific payload was changed.

The implementation boundary was cross-checked against the public
[GRChombo repository](https://github.com/GRTLCollaboration/GRChombo) and its
CCZ4 RHS/constraint sources, and against the pinned
[Lattice architecture snapshot](https://github.com/SmellingARose/Lattice/blob/5c984077f370089179e11b66986e8c86a6dcd67c/docs/architecture.html).
These are engineering references for variable/equation/module organization,
not independent validation of this shadow solver.  Their AMR, horizon and
waveform components remain design targets until this repository earns the
corresponding continuum and convergence gates.

The current 58-slot principal-symbol replay is source-hashed at
`E:\\CodexData\\nr-k3-fo-ccz4-principal-symbol-v4-20261005.json`:
the map has 69 rows, rank 36, a full numerical eigenbasis of rank 58, and
published speed-census error below `2.5e-15`; hyperbolicity and physical
boundary gates remain unvalidated.

`schwarzschild_oracle.py` contains exact time-symmetric Schwarzschild initial
data in isotropic coordinates, an analytic vacuum Hamiltonian-constraint
oracle, and second-/fourth-order finite-difference checks.  The report keeps
the measured Hamiltonian residual, but uses the analytic first-/second-
derivative truncation error for the observed-order gate: for the exact
`1/r` conformal factor the centered spherical Laplacian cancels algebraically,
so its residual alone is a poor convergence observable and becomes round-off
dominated.  This refinement gate is numerical-method evidence, not evidence
that a dynamic Einstein-field-equation solver exists.

## NR-K1a equation contract

`ccz4_reference.py` now fixes the cross-language state layout used by the
Python reference and the future C++ backend: `chi`, conformal metric `h_ij`,
trace `K`, trace-free `A_ij`, CCZ4 `Theta`, conformal connection `Gamma^i`,
lapse, shift, and Gamma-driver auxiliary field `B^i`.  It implements the
advective 1+log lapse and Gamma-driver shift equations, plus vacuum
Hamiltonian, momentum, determinant, trace-free, and conformal-connection
constraint diagnostics on a Cartesian 1-D reduction.

The exact gauge-wave sweep is a roundoff-bounded consistency test, not an
observed-order claim: in this 1-D reduction the continuum constraints cancel
algebraically.  Its order tuple is therefore intentionally empty when the
residual is at machine precision.

The existing `constraint_report` / `constraint_report_3d` `momentum` field is
kept as the physical ADM momentum constraint for Python/C++ manifest parity.
The separate `ccz4_conformal_momentum_constraint` and
`ccz4_conformal_momentum_constraint_3d` diagnostics expose the FO-CCZ4
conformal row with `-2/3 partial_i K`.  If a Z4c state is supplied, it must
first explicitly reconstruct `K = K_hat + 2 Theta`; the conversion is not
hidden in this API.  Neither function claims nonlinear subsidiary closure or
permits live writeback.

## NR-K1b BSSN method-of-lines reference

`bssn_rhs.py` adds a vacuum BSSNOK geometric RHS and deterministic classical
RK4 stepping on the same 25-slot state contract.  The Ricci tensor uses the
evolved conformal connection functions, so Gamma-constraint violations are
not hidden by reconstructing them from the metric.  It remains deliberately
separate from the CCZ4 implementation below, rather than silently interpreting
CCZ4 `Theta` as a BSSN variable.  The conformal Ricci decomposition has a
separate second-order refinement test against a direct physical-metric
calculation.

This is still a **1-D BSSN reference**, not a production 3-D CCZ4 solver: no
AMR, puncture excision, apparent horizon, ADM surface integral, or waveform
extraction is present yet.  A gauge-wave consistency result and a local RHS
test do not constitute binary-black-hole or scientific-validity evidence.

## NR-K1c CCZ4 geometric RHS

`ccz4_rhs.py` now ports the vacuum CCZ4 terms needed for the same 1-D
method-of-lines contract: evolved conformal-connection Ricci, Z4 `Theta`,
`Z_i` reconstruction, `kappa1/kappa2/kappa3` damping, CCZ4 `K` and `A_ij`
updates, shift second-derivative terms, and the `K-2 Theta` 1+log coupling.
Minkowski, homogeneous-trace, and explicit Theta-damping tests pass, and the
CCZ4 Ricci decomposition converges against a direct physical-metric reference
for both a nontrivial conformal factor and a nontrivial conformal metric while
using the evolved `Gamma^i` variables.
This is the first point at which the Python layer contains a real CCZ4 RHS;
it remains a 1-D vacuum reference and has not earned live promotion.  The
`scripts/run-nr-k1-ccz4.py` driver writes the same `nr-run-manifest-v1` envelope
for a bounded Minkowski/RK4 campaign and records the roundoff-limited gauge-wave
consistency sweep plus a seeded small-noise robust-stability sweep.  These are
engineering gates only; they do not establish physical binary-black-hole
accuracy.

`scripts/run-nr-k1-schwarzschild-exterior.py` is the bounded 3-D Python slice.
It places a time-symmetric isotropic Schwarzschild solution on a fully valid
Cartesian exterior patch that does not contain the `r=M/2` throat, then
exercises the existing 3-D CCZ4 RK4 path with the explicitly labelled scalar
Sommerfeld outer proxy.  The refreshed 17/25/33, two-step receipt adds an
interior two-cell stationarity audit: the 1+log lapse and Gamma-driver shift
equations are exactly zero on the static slice, while the `K`, `Theta`, and
`A_ij` RHS norms converge at observed orders between `1.34` and `1.69`:
`E:\\CodexData\\nr-k1-schwarzschild-exterior-v2-stationarity-20261006.json`.
This is finite-difference stationarity evidence only.  The Hamiltonian and
momentum residuals are not a physical stationarity proof, and the scalar
Sommerfeld operator is not CPBC; exact static stationarity, physical excision,
horizon, ADM, and promotion therefore remain false.

The current contract is:

- units: geometric (`G = c = 1`);
- formulation: time-symmetric isotropic Schwarzschild slice;
- domain: exterior `r > M/2`;
- momentum constraint: exactly zero for the analytic data;
- promotion: blocked; Python reference only, no web/runtime writeback;
- consumer: no web/runtime writeback.

## NR-K2a/K2b C++ shadow envelope

`cpp/nr_k2_shadow.cpp` and its CMake project now provide a C++17/OpenMP
shadow runner with the same 25 variable names, geometric-unit manifest fields,
periodic 1-D boundary label, and blocked promotion state.  K2a established the
deterministic binary checkpoint contract; K2b now carries the audited vacuum
BSSNOK 1-D spatial RHS (conformal Ricci using evolved `Gamma^i`, physical Ricci,
`K`/`A_ij` evolution, and the advective gauge) into C++/OpenMP.  The
`bssn-wave` scenario is a small smooth nontrivial state, not a black-hole
solution.  `scripts/compare-nr-k1-k2-bssn-wave.py` compares all 25 slots after
RK4 evolution against the Python reference; the current four-step case has a
maximum absolute difference below `1e-11`.

A direct eight-step run and a four-step checkpoint followed by a four-step
restart produced byte-identical checkpoint SHA-256 output on the current
MinGW/OpenMP machine, including when the thread count changed from 1 to 4.
Restart now fails closed when the requested scenario or spatial domain differs
from the checkpoint, avoiding accidental cross-regime continuation.
The manifest comparison is location-independent and diagnostics are accumulated
in a fixed serial order.  K2c now emits a direct physical 1-D vacuum
constraint report (Hamiltonian, momentum, determinant, trace-free, Gamma, and
Theta norms) using the same metric-based Ricci construction as the Python
reference.  This is still a 1-D evaluator, not evidence for 3-D constraint
control.  The 3-D C++ addition below is kept as a separate K3 shadow line and
does not change the scope claim for the 1-D backend.

K2c adds the Python-audited 1-D CCZ4 branch (`Theta`, Z4 reconstruction,
`kappa1/kappa2/kappa3` damping, and CCZ4 `K/A_ij/Gamma^i` terms) behind the
`ccz4-wave` scenario.  The independent
`scripts/compare-nr-k1-k2-ccz4-wave.py` check compares all 25 slots after RK4;
the current eight-step run stayed below `3e-14` absolute difference and the
thread-count/checkpoint split was byte-identical.  During that cross-check a
reference bug was corrected: the 1-D CCZ4 `K` trace now inserts only the
`xx` lapse second derivative instead of broadcasting it to `yy` and `zz`.
This correction is covered by a regression test.  The independent
`scripts/compare-nr-constraint-manifest.py` check now verifies all eight
Hamiltonian/momentum/algebraic/Gamma/Theta norm fields against Python to
roundoff.  These gates do not change the scope claim: K2 remains a periodic
1-D shadow backend.

`cpp/nr_k2_3d_shadow.cpp` and the second CMake target now establish both the
3-D cross-language state/checkpoint contract and a CPU dynamic method-of-lines
shadow path.  In `--solver-mode analytic` it serializes the same 25 slots
on an 8^3 periodic Cartesian grid, rejects dimension/formulation/wave-parameter
mismatches on restart, and reproduces direct versus split checkpoint bytes
across OpenMP thread counts.  The analytic gauge-wave slice matches the Python
`BSSNState3D.gauge_wave(time=...)` slots exactly in the current contract
receipt, including geometry and time metadata.  In `--solver-mode dynamic` it
evaluates the periodic 3-D BSSNOK and CCZ4 vacuum RHS with second-order
centered spatial stencils, advective 1+log/Gamma-driver gauge, RK4 method of
lines, and the same 25-slot layout.  The dynamic gate compares eight steps
against the Python reference at binary64 roundoff (`<5e-22` in the current
receipts), checks direct/split restart bytes, and rejects formulation or
solver-mode mismatches.  This is a CPU shadow RHS gate only: it is not a
black-hole evolution, constraint-preserving boundary, AMR, horizon, or
production waveform claim.  Analytic replay is driven by
`scripts/verify-nr-k2-3d-contract.py`; dynamic replay is driven by
`scripts/verify-nr-k2-3d-dynamic.py`.  Dynamic promotion remains
`blocked-pending-k3-physical-validation`.

The bounded convergence campaign `scripts/run-nr-k3-cpp-dynamic-convergence.py`
reconstructs the C++ checkpoints with the independent metric-based constraint
evaluator.  On the periodic gauge wave, 8/16/32 grids produced approximately
second-order constraint decay for both formulations (CCZ4 Hamiltonian
L-infinity orders `1.96, 1.99`; BSSNOK `1.87, 1.90`; momentum orders were
`1.84, 1.96` and `1.84, 1.96`, respectively).  CCZ4 Hamiltonian values are
already near binary64 roundoff in this benign test.  These are discrete
convergence observations, not evidence of black-hole stability or waveform
accuracy.

`cpp/nr_k2_fo_ccz4_shadow.cpp` and the CMake target
`nr-k2-fo-ccz4-shadow` carry the canonical 58-slot FO-CCZ4 envelope into a
separate C++17/OpenMP shadow executable.  `analytic-contract` reconstructs the
same periodic gauge-wave base state and `A/B/D/P` auxiliaries as Python,
writes a versioned binary checkpoint, and emits the shared
`nr-run-manifest-v1` identity with the 11/47 split.  Its separate
`fo-rhs-shadow` mode now evaluates the full 58-slot first-order RHS and
deterministic classical RK4 using the fixed shadow gauge/CCZ4 parameter block
recorded in the manifest; it does not alter the legacy or live solver.

`scripts/verify-nr-k2-fo-ccz4-contract.py` compares every analytic-contract
slot against Python (current maximum absolute difference `3.68e-16`), proves
direct versus restart byte equality, proves 1 versus 4 OpenMP thread equality,
and rejects a mismatched restart scenario.  The independent
`validate_fo_ccz4_cpp_manifest` contract now also checks the fixed 58-slot
ordering, 11/47 split, gauge/configuration envelope, periodic grid metadata,
checkpoint flags, and checksum shape before the receipt can call manifest
identity valid.  The new
`scripts/verify-nr-k2-fo-ccz4-rhs.py` runs an 8-step gauge-wave replay and
compares the dynamic state against Python (current maximum absolute difference
`5.63e-16` at the tightened default tolerance `1e-12`), while repeating the
thread/restart gates.
An independent comparison against FO-CCZ4 Eq. (12k) fixes the `B_k^i`
ordering term in both languages to the RHS form
`alpha^2*mu*(curl_P-curl_D)`, after moving the paper's non-conservative
product from the left-hand side.  The targeted P-only regression and the
C++/Python replay cover this sign.  The correction is intentionally
shadow-only.
The machine-level parity result follows a targeted correction to the C++
GammaHat equation: the conformal-connection advection terms are explicit and
the `2 alpha Gamma-tilde A` contraction is no longer double-counted outside
the combined `2 alpha (Gamma-tilde A - 3 A P)` source.  Reproduce the current
receipt with `E:\\CodexData\\nr-k2-fo-ccz4-rhs-v9-ordering-fixture-20261003.json`.
The receipt also includes a deliberately off-constraint synthetic state with
non-zero `P` and `D` curls; its C++/Python maximum is `4.55e-17`, so the
ordering index/sign is exercised rather than inferred from a gauge-wave whose
curls vanish.
These are cross-language/discretization gates only: CPBC, strong-field
physical validation, long-run robustness and live writeback remain false.  The
dynamic receipt remains `blocked-pending-fo-ccz4-cpp-cross-backend-and-cpbc`.

The earlier PATH-only environment probe is separate from those historical executable
receipts: `scripts/run-nr-k2-toolchain-audit.py` now uses independent C++17
and OpenMP translation units, so a missing `omp.h` cannot contaminate the
language-standard result.  The refreshed
`E:\\CodexData\\nr-k2-toolchain-audit-v2-20261006.json` still finds the
MinGW `g++` 8.1 path unusable for a C++ translation unit on this machine;
`cl`, `clang++`, and `nvcc` were not found on ordinary PATH. This was not an
installed-software inventory: VS 2022 Build Tools was subsequently discovered
and its native generator now passes the fresh audit above. Older MinGW parity
receipts remain historical; the new MSVC receipt supplies current legacy CPU
evidence, but no K4 CUDA or new-gauge C++ claim.

The FO Python RHS now accepts `Grid3D(boundary="sommerfeld")` through the
explicit `boundary_mode="sommerfeld-proxy"` path.  It applies the same scalar
radial proxy to all 25 geometric/gauge fields and 33 auxiliary fields, so a
non-periodic short run can be checked for finiteness and positive lapse/chi.
This closes a missing engineering path but is deliberately not a
characteristic Einstein boundary; the CPBC flags and promotion state do not
change.

`run-nr-k1-fo-ccz4-schwarzschild-proxy.py` now exercises that path on a fully
valid isotropic-Schwarzschild exterior block.  A two-step RK4 replay remains
finite with positive lapse/chi and `min(det(h))` at roundoff unity; the result
is short-run boundary/metric handling evidence only, with
`physical_schwarzschild_evolution_validated=false`:
`E:\\CodexData\\nr-k1-fo-ccz4-schwarzschild-proxy-v1-20261003.json`.

The current Eq. (12k)-aligned RHS is paired with an independently corrected
Fourier extraction.  The plus/minus cosine probe already cancels its positive
mode `1/2` coefficient, while the constant probe's plus/minus difference is
`2C`; the principal matrix is therefore `wave_symbol - 0.5*zero_order_symbol`.
The replayed 8/10/12-point audit has pure-imaginary principal eigenvalues to
roundoff, the published light/1+log/Gamma-driver speed census, full rank
`58/58`, zero defect, and 16 incoming/16 outgoing/26 zero-speed modes.  This
removes an extraction/sign bookkeeping blocker, but it is still not a proof of
the published hyperbolicity theorem: only a finite-dimensional numerical
symmetrizer and incoming-map diagnostic now exist; no analytic energy estimate
or formulation-specific CPBC has been validated, so all promotion flags remain
false.

`scripts/run-nr-k2-fo-ccz4-constraints.py` reconstructs the evolved 25-slot
state from the C++ checkpoint and runs the independent metric-based constraint
evaluator.  The 8/16/24, two-step gauge-wave receipt is finite with positive
`det(h)`; the conformal-connection residual observes approximately second-order
decay (`1.97, 1.98`) and the momentum residual improves from roughly first to
second order (`1.04, 1.71`) over this short range.  Hamiltonian values are
already roundoff-dominated and therefore show no meaningful positive order.
This is a discretization observation, not a CPBC, black-hole or physical
stability result; the receipt remains shadow-only.

## NR-K3a 3-D state and benchmark contract

`nr3d.py` now defines the 3-D full-tensor state container and deterministic
Cartesian grid contract.  The Schwarzschild initializer masks cells at the
isotropic throat instead of evolving through the excision region.  It also
provides AMR hierarchy metadata, an analytic spherical apparent-horizon root,
the isotropic ADM surface-mass benchmark, and a Weyl-electric/magnetic null
tetrad projection for `Psi4`.  These are K3a contracts and benchmark oracles;
the C++/Python general 3-D CCZ4/BSSN RHS is currently a periodic CPU shadow
cross-check only; AMR regridding/refluxing, production characteristic
boundaries, and strong-field validation are still pending.

The K3a tests verify a Schwarzschild horizon at `r=M/2`, ADM mass `M`, and
zero radiative `Psi4` for a static Weyl tensor.  They do not constitute a
binary-black-hole evolution or waveform-accuracy result.

`BSSNState3D.schwarzschild_isotropic` now exposes an explicit inner guard
radius, a finite-difference buffer measured in grid cells, and a recorded
lapse seed.  The historical default remains the exact static lapse with the
`r=M/2` isotropic-throat mask.  A `psi-minus-two` seed is available for a
moving-puncture shadow with a guard inside the horizon; it is a positive gauge
seed, not a stationary Schwarzschild solution.  Asking for the exact static
lapse while masking inside `M/2` fails closed rather than evaluating the
negative interior lapse.

`scripts/run-nr-k3-schwarzschild-stationarity.py` exercises both profiles on
17/25/33 Cartesian grids.  Its static-exterior rows measure the shell RHS
decay of the exact Schwarzschild oracle; its moving-puncture rows measure
metric-based constraint norms separately from the RHS, run a short
nearest-valid ghost-fill plus oriented inner-penalty shadow evolution, and
record the physical/gauge/Z4 proxy speed census on
valid-to-masked faces before probing the coordinate-sphere horizon and
finite-radius ADM diagnostics.  The current CCZ4 and BSSNOK receipts observe approximately
second-order Hamiltonian L2 refinement for the moving seed and finite,
mask-preserving short runs.  The horizon probe is root-found but fails its
angular-uniformity gate, and the ADM estimate remains outside its tolerance.
These results are useful debugging evidence only: nearest-valid ghost fill,
the scalar Sommerfeld outer proxy, and the reported characteristic inflow
remain non-physical, so `physical_excision_validated`, stationarity,
physical horizon/ADM, waveform, and promotion stay false.

`adm_mass_from_isotropic_state` adds a state-backed surface estimate for the
time-symmetric, conformally flat Schwarzschild slice.  Its finite-difference
surface sampling converges under grid refinement, but it intentionally rejects
general `h_ij`/`A_ij` data; a production ADM diagnostic must integrate the full
physical metric and extrinsic-curvature surface terms on evolved outer shells.

`adm_mass_from_state` now evaluates the full physical-metric ADM integrand on
valid spherical extraction surfaces, while `adm_mass_extrapolated_from_state`
fits the finite-radius values in `1/r` and `1/r^2` before comparing with the
asymptotic mass.  This is still a uniform-grid finite-radius diagnostic; it is
not yet a multi-resolution or Cauchy-characteristic-extraction result.

`apparent_horizon_expansion_from_state` and
`find_apparent_horizon_from_state` add a deterministic coordinate-sphere
expansion diagnostic and bisection root finder.  They evaluate
`D_i s^i + K_ij s^i s^j - K` on valid non-periodic cells, report the angular
residual of the sampled surface, and fail closed when a sphere intersects
excision.  A flat constant-trace test recovers the known spherical root to
the expected second-order grid error.

`find_star_shaped_apparent_horizon_from_state` now adds a genuine sampled
star-shaped shadow solve.  It builds the level-set normal for
`F=r-R(theta,phi)`, differentiates `sqrt(gamma) s^i` in Cartesian directions,
forms a dense finite-difference angular Jacobian, and applies a damped Newton
line search.  A deliberately non-spherical initial radius perturbation
converges to the flat constant-trace test surface.  The implementation is
capped by a maximum number of angular unknowns and still rejects periodic or
invalid/excised stencils; AMR ghost filling, fast-flow preconditioning, and
binary-hole physical validation remain open gates.

`scripts/run-nr-k3-horizon-shadow.py` serializes this benchmark into the
shared `nr-run-manifest-v1` envelope.  The current 33^3, 4x8-angular receipt
passes with `expansion_l2` below `5e-7` and `angular_std` below `2e-7`; its
promotion and `physical_binary_black_hole_validated` fields remain blocked or
false by construction.

`BSSNState3D.brill_lindquist_two_puncture` adds time-symmetric two-puncture
Brill--Lindquist initial data with an explicit excision guard band and a
positive lapse seed.  It intentionally has zero orbital momentum, so it is an
initial-data and constraint/ADM gate rather than a binary inspiral.  The
33^3 shadow receipt recovers the expected total ADM mass `2.0` at radius `3`
to about `4.2e-3` with exactly zero momentum norm; binary evolution and
waveform claims remain disabled.  It is reproducible with
`scripts/run-nr-k3-binary-initial-shadow.py`.

`weyl_electric_magnetic_from_state` reconstructs the vacuum 3+1 electric and
magnetic Weyl tensors from the physical metric and extrinsic curvature.  The
finite-difference Ricci tensor is projected onto its continuum-symmetric part
before the trace-free electric tensor is formed; the discarded antisymmetric
stencil component is retained only as a convergence diagnostic, not silently
treated as physical curvature.  `extract_psi4_on_sphere` samples the resulting
tensor on a deterministic coordinate sphere and applies a local null dyad.
Static Schwarzschild tests now require nonzero trace-free electric curvature,
zero magnetic curvature, and a downward-refining finite-radius `Psi4` residual;
Minkowski remains roundoff zero.  This is a reference tetrad projection only:
by itself it is not an extrapolated waveform, tetrad-transport calculation,
or Cauchy-characteristic extraction (CCE).

`project_psi4_mode` and `extract_psi4_mode_on_sphere` now add an explicitly
audited spin-weight `-2`, `ell=2`, `m=-2..2` projection using the same
Goldberg phase convention and Gauss-Legendre/periodic-azimuth quadrature.
The projector has an orthonormal synthetic-basis regression.  The
`extract_psi4_mode_time_series` wrapper now applies the same fixed sphere and
projection to an ordered state sequence and records the geometric `t-r`
retarded-time offset.  It deliberately does not claim tetrad transport,
radial extrapolation, higher harmonics, or CCE; the receipt marks
`physical_waveform_validated=false`.

`bssn3d.py` adds the first periodic 3-D BSSNOK method-of-lines reference.  It
keeps evolved `Gamma^i`, computes the full-tensor Ricci decomposition, uses
the 1+log/Gamma-driver gauge, and advances with deterministic RK4.  Its
nontrivial conformal-Ricci test converges at second order against an
independent direct-Christoffel Ricci calculation.  The evolution implementation
now supports an explicitly selected fourth-order periodic finite-difference
stencil in addition to the default second-order stencil; a dedicated smooth
field test verifies the fourth-order derivative scaling.  The implementation
accepts fully valid `sommerfeld` grids through a scalar outer-face proxy, but
still rejects excision/masked cells.  CCZ4 Z4 damping, characteristic outer
boundaries, AMR integration/refluxing, and production-scale performance
remain K3c/K3d gates.

Both 3-D RK4 drivers expose an explicit algebraic-projection option that
restores `det(h)=1` and `h^{ij}A_ij=0` after each stage.  The K3 campaign uses
it and records the choice in the manifest; differential constraints are still
measured, never hidden by this projection.

`ccz4_3d.py` now adds the corresponding periodic 3-D CCZ4 reference branch,
including Θ/Z4 damping, covariant-Z4 κ parameters, CCZ4 `K/A_ij/Gamma^i`
terms, and the same moving-puncture gauge contract.  Its x-only slice is
cross-checked against the K1 1-D CCZ4 RHS, and the Minkowski/Θ-damping/
nontrivial RK4 tests pass.  This is still a reference backend: no 3-D AMR
evolution, excision, characteristic outer boundary, or production waveform
extraction is claimed.  The
`sommerfeld` path is retained as a tested boundary contract only; it is not a
replacement for a characteristic constraint-preserving boundary.

`nr3d.py` contains two explicit periodic AMR transfer contracts.  The generic
scalar helpers retain cell-centered trilinear prolongation and Cartesian
volume-average restriction.  The BSSN/CCZ4 state path uses the actual
`Grid3D` node coordinates: node-aligned trilinear prolongation and a
tensor-product `(1/4, 1/2, 1/4)` full-weighting restriction.  The latter is
constant-preserving and second-order for arbitrary integer refinement ratios,
and avoids the former half-cell offset that produced only first-order
cross-resolution state errors.  State-level transfer applies these operators
to all 25 slots and projects the algebraic BSSN constraints after transfer.
`amr3d.py` adds a deliberately narrow two-level shadow contract:
the fine level takes `refinement_ratio` RK4 substeps for each coarse step,
both levels reach the same physical time, and the fine state is node-centered
full-weighted with algebraic projection to synchronize the coarse state.  The
report records the pre-synchronization coarse/fine mismatch and a deterministic
state SHA-256.  This is not conservative refluxing, tagged regridding,
ghost-zone exchange, or a production AMR hierarchy; those remain independent
gates and `reflux_applied` is explicitly false.  The
`scripts/run-nr-k3-self-convergence.py` campaign evolves independent
periodic gauge-wave resolutions and compares node-aligned states after
restriction.  The current CCZ4 and BSSNOK three-level receipts both observe
approximately second-order L2/L-infinity self-convergence; this is a
discretization gate, not an exact-solution, binary, or waveform claim.

`amr_patch3d.py` adds the first bounded local-patch shadow contract.  A
half-open coarse-node box is refined, initialized by periodic node-aligned
trilinear sampling, and advanced with fine substeps.  At every substep the
patch shell is refreshed from a deterministic coarse predictor; the final
shell is synchronized to the coarse endpoint and the coarse-aligned interior
is compared with the global coarse state.  The current receipt records finite
state, exact ghost reproducibility, coarse/fine mismatch, and predictor
endpoint mismatch for both CCZ4 and BSSNOK.  The patch RHS still uses the
Sommerfeld scalar proxy at its numerical shell, and BSSN/CCZ4 is not written
in conservative flux form here, so `reflux_applied=false` and
`physical_amr_validated=false` remain hard gates.  Reproducible runs are
written by `scripts/run-nr-k3-local-patch-shadow.py`.

`constraints3d.py` now evaluates the same metric-based vacuum constraints on
the non-periodic Schwarzschild exterior as well as periodic test grids.  For
excision/outer-boundary data it reports norms only on valid cells with a full
second-order stencil; periodic grids use the selected second- or fourth-order
stencil.  The 3-D evolution RHS still rejects excision/masked cells.

`excision3d.py` adds a separate, explicitly non-physical masked-state shadow
path.  It fills invalid cells from deterministic nearest-valid sources,
advances the filled state through the existing Sommerfeld-proxy RHS, restores
the original mask after each step, and records the ghost-fill distance.  It
also audits the declared proxy speeds `beta^n +/- alpha*sqrt(gamma^nn)` on
every valid-to-masked face.  This is a sign- and convention-explicit
diagnostic, not the full CCZ4 characteristic system: the static
Schwarzschild slice has a positive-speed inflow risk on these faces, so its
pure-outflow gate is expected to fail.  The
`advance_excision_characteristic_shadow_3d` path now adds an oriented
incoming-speed SAT-like penalty with one-sided valid-side targets; its full
physical/gauge/Z4 proxy census is exposed in the receipt.  It is still not an
analytic formulation-specific eigenbasis or a constraint-preserving boundary.  The
`nr-k3-excision-shadow` receipt and the new Schwarzschild stationarity
receipt therefore prove only finite deterministic state handling, mask
preservation, and repeatable boundary accounting for short runs; they always
set `physical_excision_validated=false`.  Constraint-compatible inner
characteristics, causal excision, and long-time black-hole stability remain
promotion gates.

The 3-D RHS now also accepts fully valid `Grid3D(boundary="sommerfeld")`
states.  `apply_sommerfeld_boundary_rhs` replaces the six outer-face RHS
values with a radial scalar Sommerfeld proxy around Minkowski reference
values.  Minkowski and finite-perturbation tests pass, but the operator is
explicitly not a characteristic constraint-preserving Einstein boundary and
does not provide excision ghost filling.  The two-level AMR subcycling
contract is currently restricted to periodic fully valid states for this same
reason.

`boundary3d.py` now makes the missing characteristic layer measurable.  It
counts oriented outer-face samples and reports proxy physical-light,
1+log-lapse, Gamma-driver, and Z4/constraint speeds using the declared
`beta^n +/- speed` convention.  `boundary_mode="characteristic-proxy"`
applies a deterministic incoming-mode SAT-like penalty toward Minkowski data
and can be selected by both 3-D CCZ4 and BSSNOK RK4 drivers.  The comparison
driver `scripts/run-nr-k3-characteristic-boundary-shadow.py` records the
incoming fraction, constraint-mode fraction, scalar-vs-penalty difference,
replay hash, and final constraint norms for both formulations.  This is an
engineering boundary experiment only: it is not the formulation-specific
eigenbasis, a constraint-preserving boundary proof, or a physical outer
boundary validation, and both validation flags remain false.  The same module
now exposes `inner_characteristic_speed_report_3d` and
`apply_inner_characteristic_penalty_rhs_3d` for valid-to-masked faces; these
keep the incoming sign convention explicit but remain proxy operators.

`principal_symbol3d.py` adds a separate discrete principal-symbol audit.  It
linearizes the actual periodic 3-D CCZ4/BSSN RHS around Minkowski with a
Fourier perturbation, diagonalizes the resulting complex mode matrix, and
compares the measured phase-speed families with light, 1+log, and
Gamma-driver expectations.  The 10/14/18-grid receipts are deterministic and
show decreasing speed error and full numerical eigenvector rank, but the
eigenvector condition number is still very large.  They now also record a
linearized ten-component constraint map and per-mode constraint response;
this is a boundary-design aid, not a proof that the heuristic mode count is
formulation-independent.  They deliberately export no production
eigenvectors and do not prove strong hyperbolicity, a symmetrizer, CPBC, or
physical excision.  Reproduce them with
`scripts/run-nr-k3-principal-symbol.py`; promotion remains blocked.

## NR-K3e FO-CCZ4 first-order reduction contract

`fo_ccz4.py` records the 58-field ordering used by the strongly hyperbolic
FO-CCZ4 formulation: the existing 25 geometric/gauge fields plus the 33
auxiliary derivative fields
`A_i = partial_i ln(alpha)`, `B_k^i = partial_k beta^i`,
`D_kij = 1/2 partial_k h_ij`, and
`P_i = partial_i ln(phi) = +1/2 partial_i ln(chi)` under this repository's
`chi = phi^2` convention.  It computes the
first-order curl (ordering) constraints for all four families and the
determinant, trace-free, and metric-gradient-trace algebraic constraints.
The canonical ordering also records the FO split into 11 metric/lapse/shift
ODE variables and a 47-variable reduced PDE block; this prevents a future
RHS from silently reintroducing spatial derivatives into the ODE rows.
The `scripts/run-nr-k3-fo-ccz4-contract.py` receipt is deterministic and
resolution-aware; the current 9/17/33 gauge-wave run replays exactly and the
metric-gradient-trace residual decreases from `2.23e-5` to `1.89e-6`.

The FO paper shows that strong hyperbolicity requires using second-order
ordering constraints (including the trace constraint in the `D_kij` equation),
not a naive derivative-variable substitution.  The contract itself therefore
does not export an eigenbasis or characteristic boundary data; its
`strong_hyperbolicity_validated`, constraint-preserving, and physical flags
remain false.

The next shadow slice, `fo_ccz4_rhs.py`, now implements the published
non-conservative first-order-in-space RHS structure for the 58 fields: the
metric/lapse/shift ODE block, the `A/B/D/P` auxiliary PDEs, the symmetrized
ordering terms, the `D_kij` trace constraint contribution, and the independent
cleaning speed/configuration parameters.  It evolves logarithmic lapse and
conformal factor while converting back to this repository's positive `lapse`
and `chi=phi^2` storage.  `run-nr-k3-fo-ccz4-consistency.py` cross-checks the
base-field RHS against the existing second-order CCZ4 path on a periodic
gauge-wave family: the `A_ij`, `K`, and `Theta` differences refine with
observed orders about `1.75, 1.86, 1.93` across 7/9/13/17 grids, and replay is
exact.  This is a kinematic/discretization cross-check, not a proof of the
58-variable principal-symbol eigenstructure or CPBC; promotion remains
`blocked-pending-58-variable-principal-symbol-and-cpbc`.

`run-nr-k1-fo-ccz4-gauge-wave-evolution.py` adds a short periodic RK4
method-of-lines campaign rather than stopping at an instantaneous RHS
comparison.  The current v3 contract compares every resolution at the same
requested physical final time `t=0.01`, choosing the number of steps from the
CFL ceiling and recording the actual `dt`/CFL per row.  At 9/13/17 points the
second-order run keeps every final state finite with positive `chi`, lapse, and
`det(h)`; deterministic replay is exact, conformal-connection orders are
`1.9659, 1.9821`, and Theta orders are `1.8260, 1.9097`.  The fourth-order
periodic stencil at 9/13/17/21 points gives conformal-connection orders
`3.9178, 3.9569, 3.9735` and Theta orders `3.8804, 3.9412, 3.9648`.
Hamiltonian and momentum orders are recorded separately.  The earlier v2
receipts used a fixed step count and therefore different physical final times;
they remain historical engineering records and are not the preferred
convergence evidence.  This is a vacuum gauge-wave constraint/convergence gate
only: exact spacetime evolution, physical outer boundaries, black-hole
stability, and live promotion remain false.  Current receipts:
`E:\\CodexData\\nr-k1-fo-ccz4-gauge-wave-evolution-v3-same-time-order2-20261005.json`
and
`E:\\CodexData\\nr-k1-fo-ccz4-gauge-wave-evolution-v3-same-time-order4-20261005.json`.

`fo_ccz4_robust_stability_campaign_3d` and
`scripts/run-nr-k1-fo-ccz4-robust-stability.py` add a separate seeded
small-noise campaign around periodic Minkowski space.  Three fixed seeds at
9^3 points, CFL-independent `dt=1e-3`, checkpoints 1/3/6/10, and a growth
limit of 10 remain finite and positive, and every reported vacuum constraint
norm is explicitly finite; the largest observed perturbation growth is about
`1.87`, and replay of the first seed is byte-for-byte deterministic at the
auxiliary-field hash level.  The v2 receipt is
`E:\\CodexData\\nr-k1-fo-ccz4-robust-stability-v2-20261005.json`.  This is a
bounded engineering robustness gate only: it does not establish long-time
stability, strong hyperbolicity, a physical boundary, or black-hole accuracy,
and its promotion remains blocked.

`fo_ccz4_analytic_contract.py` and
`scripts/run-nr-k1-fo-ccz4-ode-block.py` now isolate the first analytic
sub-contract of the published reduction.  On the flat background with zero
shift, the principal part of the canonical eleven-variable ODE prefix
`(h_ij, ln_alpha, beta^i, ln_phi)` is zero, so its unit vectors form an
eleven-dimensional zero-speed basis.  The independent shadow-symbol check
passes for the x/y/z normals with rank `11/11` and deterministic replay; the
receipt is `E:\\CodexData\\nr-k1-fo-ccz4-ode-block-v1-20261005.json`.  This
does not validate the remaining 47 analytic eigenvectors, a continuum
symmetrizer, strong hyperbolicity, CPBC, or a physical boundary; the receipt
therefore keeps all broader promotion flags false.

`fo_ccz4_analytic_symbol.py` and
`scripts/run-nr-k1-fo-ccz4-analytic-symbol.py` add the next independent K1
cross-check.  The module assembles the 58-by-58 frozen-coefficient matrix by
direct tensor contraction of the linearized flat-background equations; it does
not call or reuse the finite-difference Fourier matrix builder.  The x/y/z
normal replay agrees with the extracted shadow symbol to about `1e-15`, and
the direct matrix is deterministic.  This locks the state ordering,
symmetrized metric/connection derivatives, Ricci/Z4 contractions, gauge
principal part, and `A/B/D/P` auxiliary signs against an independently named
construction.  The receipt is
`E:\\CodexData\\nr-k1-fo-ccz4-analytic-symbol-v1-20261005.json`.
It is still only a linearized implementation cross-check: it does not provide
the remaining analytic eigenvectors, a continuum symmetrizer or energy
estimate, strong hyperbolicity, CPBC, a physical boundary, or black-hole
evolution evidence.  Those flags remain false and promotion is blocked.

`fo_ccz4_characteristic_contract.py` adds an exact algebraic sub-gate at the
same non-degenerate flat point (`f=1`, `mu=1`, `e=c=1`).  The direct matrix's
monic characteristic polynomial factors as
`lambda**26*(lambda-1)**8*(lambda+1)**8*(2*lambda-1)**4*`
`(2*lambda+1)**4*(lambda**2-2)*(2*lambda**2-1)**2*`
`(3*lambda**2-4)/3072`, giving 26 zero modes and the expected signed
light/cleaning, 1+log, Gamma-driver, and ordering multiplicities.  The
three-normal replay in `run-nr-k1-fo-ccz4-characteristic-contract.py` matches
the exact rational coefficients within the numerical polynomial evaluation
error (`7.6e-12`) and the roots within `2.5e-15`; receipt:
`E:\\CodexData\\nr-k1-fo-ccz4-characteristic-contract-v1-20261005.json`.
This is an exact eigenvalue-factorization contract, not an analytic
eigenvector, symmetrizer, CPBC, or physical-evolution proof.

The optional `run-nr-k1-fo-ccz4-exact-eigenbasis.py` audit goes one step
further without adding SymPy to the runtime: it rationalizes the direct matrix
with a recorded reconstruction residual (`1.11e-16`) and computes every
eigenspace exactly at that single frozen parameter point.  For all three
Cartesian normals the algebraic and geometric multiplicities agree and the
assembled exact eigenbasis has rank `58/58`; receipt:
`E:\\CodexData\\nr-k1-fo-ccz4-exact-eigenbasis-v1-20261005.json`.
This validates one rationalized flat-point eigensystem only.  It does not
validate eigenvectors over the parameter domain, a continuum symmetrizer or
energy estimate, nonlinear CPBC, physical boundaries, or black-hole
evolution, so strong-hyperbolicity and promotion flags remain false.

`run-nr-k1-fo-ccz4-exact-eigenbasis-sweep.py` samples four non-degenerate
rational parameter points (`f=1,mu=1`; `f=1,mu=1/2`; `f=5/4,mu=1`; and
`g=5/4,f=1,mu=1`) plus three known degeneracy controls (`mu=2`, `f=3/2`,
and legacy `f=3/4`).  Across all x/y/z normals the exact characteristic
factorizations match; every positive sample has rank `58/58`, while every
negative control loses geometric multiplicity exactly as classified.  Receipt:
`E:\\CodexData\\nr-k1-fo-ccz4-exact-eigenbasis-sweep-v1-20261005.json`.
This is a finite parameter sample and a useful guard against silently using a
degenerate gauge, not a proof over the full admissible parameter domain.

`fo_ccz4_principal_symbol.py` now performs the next independent shadow audit.
It linearizes every one of the 58 slots with an independent Fourier
perturbation, subtracts the constant-mode matrix to isolate the spatial
principal part, appends the analytically known 11 ODE zero-speed vectors, and
stabilizes the repeated 15-dimensional PDE zero root with an SVD nullspace.
The split diagnostic remains deterministic and replayable: its reported
eigenvector rank is 58/58, the light/1+log/Gamma-driver speed errors are below
`1e-8`, and the 72-row definition/ordering/algebraic constraint map has rank
39.  With the shadow-only non-degenerate choice `f=1`, the finest-row split
condition number is about `1.32e2` on the finest row; the legacy `f=3/4` choice is retained as an
explicit negative control and rises above `1e8`.

The same receipt also audits the actual coupled 58x58 Fourier symbol rather
than treating that split basis as a proof of diagonalizability.  A previous
receipt exposed a defect of `3`; investigation showed that the finite
difference of the cosine probes and the finite difference of the constant
probes have different normalization factors.  The corrected extraction now
uses `wave_symbol - 0.5*zero_order_symbol`.  The resulting 8/10/12-point rows have
  26 algebraic zero eigenvalues, nullity `26`, full eigenvector rank `58/58`, and
  zero full-symbol defect to numerical tolerance.  The first 11 ODE rows and
  columns also have principal-symbol residual below `1e-10`, preserving the
  intended ODE/PDE block separation.  The full eigenbasis condition number is
  about `2.29e2` at the finest row and its inverse residual is below `1e-14`;
  the full census has 16 incoming, 16 outgoing, and 26 zero-speed modes.  A
  complete Appendix-A speed multiset check (all repeated light, 1+log,
  Gamma-driver, and ordering branches) is also recorded; its error is below
  `1e-12` on the replayed rows.  This
  removes an
implementation-level false blocker, but it is still not a proof of the
published FO-CCZ4 hyperbolicity theorem.  No symmetrizer or boundary penalty is
computed, so `strong_hyperbolicity_validated=false`,
`constraint_preserving_validated=false`, `physical_boundary_validated=false`,
and promotion remains `blocked-pending-cpbc-and-physical-validation`.
Reproduce it with
`scripts/run-nr-k3-fo-ccz4-principal-symbol.py`; the latest source-bound
receipts are `E:\\CodexData\\nr-k3-fo-ccz4-principal-symbol-v5-nonzero-defect-20261006.json`
for the `f=1` shadow and
`E:\\CodexData\\nr-k3-fo-ccz4-principal-symbol-v5-f075-defect-20261006.json`
for the legacy negative control.

The report now carries a named Appendix-A family contract rather than only a
flat sorted multiset.  It records the 11 kinematic ODE zero-speed modes, the
15 reduced-system advection modes, and the signed light-cleaning, 1+log,
Gamma-driver longitudinal/transverse, and ordering longitudinal/transverse
branches with their published multiplicities.  It also marks the
flat-background Gamma-driver non-degeneracy condition `f != 3/4`.  The full
symbol audit now also computes geometric multiplicity for every repeated
nonzero speed, not only the 26-dimensional zero-speed kernel.  The new
`f=0.75` receipt has a nonzero-speed defect of `2` and
`full_symbol_diagonalizable=false`, while the `f=1` receipt has defect `0`;
this confirms that the legacy problem is a Jordan/degenerate characteristic
obstruction in the current implementation, not merely a noisy symmetrizer
normalization.  This is a
source-grounded eigenvalue census; `analytic_eigenvectors_validated` and
`strong_hyperbolicity_validated` remain false.

`run-nr-k3-fo-ccz4-isotropy.py` repeats the same frozen-coefficient audit for
the x, y, and z Fourier normals.  All three directions reproduce the 58-rank
coupled basis, 16/16 incoming/outgoing counts, 26 zero-speed modes, and the
named speed-family census.  This supports the implementation's Cartesian
isotropy contract only; it does not replace the analytic all-normal
eigenvector derivation or a continuum boundary proof.  Receipt:
`E:\\CodexData\\nr-k3-fo-ccz4-isotropy-v1-20261003.json`.

`scripts/run-nr-k3-fo-ccz4-boundary-audit.py` now turns that result into an
explicit boundary-prerequisite receipt.  At 8/10/12 points the split
diagnostic and the full coupled-symbol gate now report 58/58 rank, 26/26
zero-speed nullity, the expected light/1+log/Gamma-driver speed census,
balanced incoming/outgoing constraint-mode counts, a bounded split-basis
condition number, and deterministic replay.  The finest row has 16 incoming
and 16 outgoing constraint-responsive modes.  The receipt still keeps
`cpbc_ready=false` and the script exits with status `2`, because no
formulation-specific analytic boundary eigenbasis, symmetrizer/energy estimate,
incoming-data map, or physical boundary proof is present.  The `f=3/4` run
remains a negative control and fails the condition-number gate (`~4.8e8`).
Reproduce the positive and negative receipts with
`E:\\CodexData\\nr-k3-fo-ccz4-boundary-audit-v15-isotropy-20261003.json` and
`E:\\CodexData\\nr-k3-fo-ccz4-principal-symbol-v8-f0p75-source-sign-20261003.json`.

`fo_ccz4_cpbc_shadow.py` now consumes the exact raw symbol used by the
principal-symbol report and performs a separate numerical characteristic
audit.  At 8/10/12 points it reconstructs a complete 58-vector basis, a
positive numerical symmetrizer, and both right/left incoming ordering-
constraint maps; the finest row has characteristic-basis condition number
about `2.29e2`, symmetrizer condition number about `5.24e4`, energy-identity
residual about `6.32e-15`, and rank `16/16` for the two maps.  The sign
convention is now explicit and shared with the v3 map: the stored principal
eigenvalue is `a` in `q_t=A^n partial_n q`, while physical coordinate speed is
`-a`.  This audit intentionally retains its 72-row ordering/definition/curl
and algebraic operator; it does not include the four H/M rows added by the v3
frozen map.  It remains an algebraic finite-dimensional shadow check only: it
does not prove the continuum symmetrizer, a nonlinear CPBC, or a physical
outer boundary.  The refreshed receipt therefore keeps
`analytic_symmetrizer_validated=false`, `incoming_constraint_map_validated=false`,
and `cpbc_ready=false`:
`E:\\CodexData\\nr-k3-fo-ccz4-cpbc-audit-v6-sign-convention-20261005.json`.

`run-nr-k3-fo-ccz4-cpbc-sweep.py` records the parameter-domain edge instead of
assuming that the tuned point generalizes.  At eight points, three expected
positive cases (`f=1, mu=0.5`; `f=1, mu=1`; `f=1.25, mu=1`) pass the numerical
prerequisite, while the ordering (`mu=2`), high-shift (`f=1.5`), and legacy
Gamma-driver (`f=0.75`) controls fail with characteristic-basis condition
numbers of roughly `3.6e8`, `3.9e8`, and `2.2e8`.  The classification contract
passes, but this is evidence for a bounded tuned domain, not a general
hyperbolicity result; the sweep remains blocked from CPBC:
`E:\\CodexData\\nr-k3-fo-ccz4-cpbc-sweep-v5-isotropy-20261003.json`.

`fo_ccz4_frozen_cpbc.py` and
`scripts/run-nr-k3-fo-ccz4-frozen-cpbc-map.py` now make the next boundary
precondition executable: for each Cartesian normal and both geometric faces,
they cross-check the independent 58-by-58 direct principal matrix, select the
incoming characteristic amplitudes using the explicit convention
`q_t = A^n partial_n q`, physical speed `-a`, and replay a pseudoinverse map
with residuals below `1e-8`.  The v3 receipt has six deterministic rows with
16 incoming, 16 outgoing, and 26 zero-speed modes per row; its largest direct
symbol discrepancy is about `1.0e-15`:
`E:\\CodexData\\nr-k3-fo-ccz4-frozen-cpbc-map-v3-20261005.json`.
The corrected map has 73 rows: the 69 ordering/definition/curl/algebraic rows
(with raw contracted-Gamma rows excluded) plus four independent linearized
Hamiltonian/momentum principal rows.  This is still an incoming-data algebra
contract only, not a nonlinear constraint
propagation system or CPBC closure; `analytic_symmetrizer_validated`,
`nonlinear_cpbc_validated`, `physical_boundary_validated`, `cpbc_ready`, and
runtime writeback remain false.

`fo_ccz4_constraint_propagation.py` is the required follow-up closure audit.
It solves the frozen row-space condition `C A^n = B^n C` for the corrected
73-row candidate operator instead of assuming that a pseudoinverse boundary
map is a constraint-propagating system.  The x/y/z replay is deterministic with
constraint rank `40`, propagation-matrix rank `23`, and normalized closure
residual `0.2333333333` on every axis; therefore the candidate rows are **not
closed** and the receipt records
`blocked-candidate-constraint-subsystem-not-closed`:
`E:\\CodexData\\nr-k3-fo-ccz4-constraint-propagation-v2-20261005.json`.
This is a useful negative gate: the next CPBC implementation must derive the
formulation-specific constraint evolution (or a reduced closed subset) before
any SAT penalty or live promotion is considered.

`fo_ccz4_subsidiary_shadow.py` now records that reduced derivation explicitly
without claiming it is the full FO-CCZ4 system.  It uses the flat-background
Z4c subsidiary equations for `(Theta, Z_n, H, M_n)` and introduces
`Q_A = partial_n Z_A` for the two transverse wave sectors.  The resulting
10-state normal block has four `+alpha`, four `-alpha`, and two zero-speed
branches in normal coordinates; the Fourier compatibility rows
`Q_A - partial_n Z_A` close to machine precision, including a constant normal
shift.  The x/y/z replay and shifted-lapse control are recorded in
`E:\\CodexData\\nr-k3-fo-ccz4-subsidiary-shadow-v1-20261005.json`.
This is a genuine closed *subsidiary derivation fixture*.  Its projection
from the repository's 58 FO-CCZ4 slots to `Z_i` is still a frozen linearized
contract; no continuum symmetrizer, nonlinear CPBC, physical boundary, or
runtime writeback is enabled.  The receipt therefore remains
`blocked-pending-fo-ccz4-subsidiary-projection-and-continuum-cpbc`.

`fo_ccz4_z4c_projection_audit.py` makes that missing equivalence test
explicit.  It uses the CCZ4 RHS reconstruction
`Z_i=(GammaHat_i-GammaTilde_i)/2`, the four linearized H/M rows, and the two
transverse derivative rows to form a 10-row candidate projection from the
58-slot state.  The Cartesian replay is deterministic and cross-checks the
independent principal symbol.  With the corrected physical-`K` momentum rows
the candidate has rank `8` and a normalized unconstrained closure residual of
about `1.03238866397` on all three normals.  This is not a floating-point
nuisance: the reduced Z4c equations do not close on the present 10-row map
without using the FO ordering constraints.  The new quotient check fits the
full FO generator modulo the rank-36 ordering row space with a maximum
residual below `1.4e-15`.  That is useful evidence for a consistent frozen
reduction, but it is not the full nonlinear subsidiary derivation, a
symmetrizer, a CPBC, or a promotion gate.  The projection audit therefore
remains
`blocked-candidate-z4c-projection-not-closed`; reproduce the current result
with `E:\\CodexData\\nr-k3-fo-ccz4-z4c-projection-audit-v4-20261006.json`.

`fo_ccz4_subsidiary_symmetrizer_shadow.py` adds the corresponding energy
check for the reduced 10-state block.  The diagonal weights
`(1,1,1,4,1,1,1,1,1,1)` make `H A^n` symmetric for all three normals; the
minimum symmetrizer eigenvalue is `1`, the condition number is `4`, and the
replayed principal symmetry residual is exactly zero in the current binary64
audit.  This proves only a positive symmetrizer for the frozen reduced block,
not for the 58-variable FO-CCZ4 system.  The receipt remains
`blocked-pending-58-variable-symmetrizer-and-cpbc`:
`E:\\CodexData\\nr-k3-fo-ccz4-subsidiary-symmetrizer-v1-20261006.json`.

`fo_ccz4_symmetrizer_shadow.py` now performs the analogous numerical
construction on the complete 58-variable frozen principal symbol using
`H=V^{-dagger}V^{-1}`.  At the default non-degenerate gamma-driver setting,
all three normals have eigenbasis rank `58`; the replayed eigenbasis residual
is below `8e-15` and the weighted-principal symmetry residual below `6e-15`.
The candidate now also carries an explicit condition-number guard
(`condition_number_limit=1e10`); this rejects numerically near-defective bases
instead of treating a tiny Hermitian residual as sufficient.  The legacy
`shift_coefficient=0.75` point has a frozen candidate condition number above
`1e17` in the current replay, while the tuned `f=1` point is about `7e3`.
This is a numerical conditioning result, not a claim that either gauge is an
analytic hyperbolicity theorem.  The distinction is intentional: the
[FO-CCZ4 reference proof](https://arxiv.org/abs/1707.09910) selects the `s=1`
Gamma-driver with `1+log` slicing, while independent
[gauge analysis](https://orca.cardiff.ac.uk/id/eprint/108227/1/hypcomp_gauge.pdf)
describes `lambda=3/4` as the standard choice whose gauge characteristic speed
coincides with light speed.  The repository must
therefore either derive the degenerate `f=0.75` eigenbasis or explicitly keep
`f=1` as the research-only proven shadow parameter; it must not silently
replace one with the other.  The parameter sweep is recorded in
`E:\\CodexData\\nr-k3-fo-ccz4-gauge-regime-v1-20261006.json`; it deliberately
keeps `uniform_parameter_family_validated=false` and promotion blocked until
the gauge choice, analytic uniform estimate, nonlinear source terms, and CPBC
are resolved.

`published_characteristic_speed_collisions` makes the spectral distinction
explicit: `f=0.75` has a unit-speed light/longitudinal Gamma-driver collision,
whereas the `f=1` shadow has the separate light/transverse collision expected
by the selected FO-CCZ4 contract.  A collision is only a spectral fact; neither
case is promoted without its corresponding uniformly bounded eigenbasis and
energy estimate.

`fo_ccz4_analytic_symbol.py` now accepts an arbitrary finite non-zero normal
vector and normalizes it before assembling the frozen 58-by-58 principal
matrix.  `scripts/run-nr-k3-fo-ccz4-oblique-symbol.py` replays the direct
analytic symbol at the three Cartesian axes and three oblique normals.  The
current `f=1` receipt reports spectral isotropy to `5.6e-15`, the published
speed census to roundoff, and zero zero-/nonzero-speed geometric defects at
all six samples:
`E:\\CodexData\\nr-k3-fo-ccz4-oblique-symbol-v2-20261006.json`.
The tensor-representation similarity residual is below `9e-16` on the same
sampled normals, so the result checks more than a sorted eigenvalue list.
The exact-axis floating eigensolver rank is retained as a diagnostic because
repeated roots make its basis numerically fragile; the pass uses independent
nullity/defect checks instead.  This closes only a sampled frozen-coefficient
oblique-direction consistency gap.  It is not a rotation-covariant analytic
eigenvector construction, a continuum uniform symmetrizer, nonlinear CPBC,
or physical black-hole evidence; promotion remains blocked.
Running the same six-normal campaign at the legacy `f=0.75` point exits
non-zero and records a nonzero-speed defect of `2` at every sample, with
spectral mismatch around `9.3e-9`; it is retained as a negative-control
receipt rather than silently reclassified:
`E:\\CodexData\\nr-k3-fo-ccz4-oblique-symbol-v2-f075-20261006.json`.

`fo_ccz4_rotated_symmetrizer_shadow.py` now transports the existing numerical
candidate symmetrizer from the x-normal finite-difference symbol through the
same 58-slot tensor representation and checks it against the direct analytic
symbol at the target normal.  The six-normal `f=1` campaign keeps the
symmetrizer positive with condition number below `8.9e3`, rotation residual
below `9e-16`, and weighted-principal symmetry residual below `6e-15`:
`E:\\CodexData\\nr-k3-fo-ccz4-oblique-symmetrizer-v1-20261006.json`.
The `f=0.75` negative control fails the source candidate and positivity gate
(`min(H) < 0`, condition number infinite):
`E:\\CodexData\\nr-k3-fo-ccz4-oblique-symmetrizer-v1-f075-20261006.json`.
This is a transported finite-dimensional candidate only; it is not an
analytic uniform symmetrizer, a variable-coefficient energy estimate, a full
subsidiary projection, or CPBC/live authorization.

`fo_ccz4_oblique_cpbc_energy_shadow.py` extends the same transport to the
complete 73-row frozen constraint operator (69 ordering/definition rows plus
linearized Hamiltonian/momentum rows) and both geometric faces.  The positive
six-normal receipt has 12 rows, 16 incoming/16 outgoing/26 zero-speed modes,
incoming constraint rank 16, maximum map residual `7.9e-15`, rotation residual
`8.9e-16`, weighted-principal residual `5.6e-15`, and maximum boundary flux
`-0.5`:
`E:\\CodexData\\nr-k3-fo-ccz4-oblique-cpbc-energy-v1-20261006.json`.
The `f=0.75` receipt fails the transported numerical energy gate and remains a
negative control:
`E:\\CodexData\\nr-k3-fo-ccz4-oblique-cpbc-energy-v1-f075-20261006.json`.
The constraint rows are transported as an explicitly labelled row-space
equivalence; no oblique finite-difference boundary closure or nonlinear
subsidiary proof is claimed, so `cpbc_ready` and runtime writeback remain
false.

`fo_ccz4_characteristic_sat_shadow.py`, driven by
`scripts/run-nr-k3-fo-ccz4-characteristic-sat.py`, now turns the frozen 58-slot
characteristic basis into an explicit incoming-mode SAT candidate.  For each
Cartesian face it projects the incoming amplitudes through the full
ordering/Einstein constraint map, leaves its nullspace untouched, and checks
that the canonical numerical energy sees a non-positive penalty.  The
three-axis/two-face `f=1` receipt has six rows, incoming rank `16`, zero free
incoming constrained amplitudes, maximum free-constraint residual about
`4.3e-14`, and maximum energy-penalty eigenvalue about `2.4e-13`:
`E:\\CodexData\\nr-k3-fo-ccz4-characteristic-sat-v1-20261006.json`.
The legacy `f=0.75` campaign is retained as a negative control and fails the
energy/projection gate:
`E:\\CodexData\\nr-k3-fo-ccz4-characteristic-sat-v1-f075-20261006.json`.
This is the first explicit frozen characteristic penalty operator, but it is
not yet a variable-coefficient finite-difference closure, a nonlinear
subsidiary-system CPBC, a physical outer boundary, or a runtime writeback.

`fo_ccz4_characteristic_boundary_shadow.py` connects that operator to the
actual 58-slot `FOCCZ4RHS3D` array layout on selected Cartesian outer faces:
it applies the frozen penalty with the local grid `1/h` scaling, preserves
the symmetric tensor slots, and records a correction hash for deterministic
replay.  On a perturbed `6^3` Sommerfeld shadow grid the two faces cover 72
boundary cells and replay exactly, with a real correction residual of about
`2.18e-4` and an imaginary roundoff residual below `4e-20`:
`E:\\CodexData\\nr-k3-fo-ccz4-characteristic-grid-boundary-v1-20261006.json`.
The `f=0.75` run remains a negative control:
`E:\\CodexData\\nr-k3-fo-ccz4-characteristic-grid-boundary-v1-f075-20261006.json`.
This validates only the finite-difference plumbing around the frozen operator;
`variable_coefficient_boundary_validated`, nonlinear CPBC, physical boundary,
and runtime writeback remain false by construction.

`fo_ccz4_variable_coefficient_boundary_shadow.py`, driven by
`scripts/run-nr-k3-fo-ccz4-variable-coefficient-boundary-audit.py`, is the
next fail-closed gate.  It evaluates `gamma_ij=chi^-1 h_ij`, checks positive
definiteness and condition numbers on every selected oriented outer face, and
records the local light, 1+log, and Gamma-driver speed coefficients together
with the deviation from the flat `alpha=1, gamma_ij=delta_ij` reference.  The
Schwarzschild-exterior perturbed-face replay is deterministic and is stored at
`E:\\CodexData\\nr-k3-fo-ccz4-variable-coefficient-boundary-audit-v1-20261006.json`.
The v1 characteristic-speed claim is withdrawn: it included an incorrect
`alpha*sqrt(chi)` scaling in the Gamma-driver branch. The retained v2 module
validates only metric positivity and proxy-value finiteness, with
`local_characteristic_speed_validated=false` and `candidate=false`:
`E:\\CodexData\\nr-k3-fo-ccz4-variable-coefficient-rejected-speed-proxy-v2-20261007.json`.
It does not construct a local eigenbasis or symmetrizer and leaves
`variable_coefficient_boundary_validated`, nonlinear CPBC, physical boundary,
and runtime writeback false.
The indefinite-metric negative control exits non-zero and records the rejected
state at
`E:\\CodexData\\nr-k3-fo-ccz4-variable-coefficient-boundary-audit-v1-indefinite-20261006.json`.

`fo_ccz4_local_frame_shadow.py`, driven by
`scripts/run-nr-k3-fo-ccz4-local-frame-audit.py`, now constructs a local
metric-orthonormal frame from the same boundary metric and oriented normal.
The positive-orientation Gram--Schmidt frame replay covers the same 486 faces;
the maximum metric-orthonormality residual is about `2.7e-12`, the maximum
normal-covector residual is `4.5e-16`, and the frame condition number remains
below `1.016`:
`E:\\CodexData\\nr-k3-fo-ccz4-local-frame-audit-v1-20261006.json`.
This is a coordinate-frame contract, not yet a transformed 58-variable
principal symbol or variable-coefficient energy estimate.  Its indefinite
metric negative control is retained at
`E:\\CodexData\\nr-k3-fo-ccz4-local-frame-audit-v1-indefinite-20261006.json`.

`fo_ccz4_local_principal_proxy_shadow.py` retains a **rejected** algebraic
local-symbol model. It uses the 58-slot covariant/contravariant frame map,
applies the local `alpha*sqrt(gamma**nn)` and `beta^n` scaling, and transforms
the flat analytic symbol back to coordinate slots.  Six face-center samples
close only the internal similarity identity below `4.5e-16`; the largest
eigenvalue imaginary residual is about `9.8e-9`.
The v2 comparison mistakenly substituted physical `gamma` for conformal `h`
and fixed `chi=1`; its `1.36e-1` mismatch is not a valid same-background result.
The corrected v3 freezes the original `h` and `chi` independently and finds
maximum mismatch `0.735428989131446` over six face-center samples:
`E:\\CodexData\\nr-k3-fo-ccz4-local-principal-proxy-v3-final-20261007.json`.
The proxy both mis-scales gauge blocks and adds spatial advection to the 11
ODE rows. Missing coefficient gradients cannot repair these constant-background
errors. Similarity residuals are internal algebra checks, not RHS validation.
The v1/v2 receipts remain historical, not promotion evidence. The
indefinite metric negative control is also retained at
`E:\\CodexData\\nr-k3-fo-ccz4-local-principal-proxy-v1-indefinite-20261006.json`.

`fo_ccz4_frozen_symbol.py` replaces that construction for principal-coefficient
work. Its eight-case affine/sine, half-amplitude and exact-replay campaign is
stored at
`E:\\CodexData\\nr-k3-fo-ccz4-frozen-symbol-v1-final-20261007.json`.
The published-family eigenspace campaign separately retains seven accepted
points and three mandatory rejected points at
`E:\\CodexData\\nr-k3-fo-ccz4-frozen-eigenspaces-v1-20261007.json`.
Success of this campaign means the controls were reproduced, not that all
points passed. Strong hyperbolicity, a uniform energy estimate, CPBC, physical
boundary validation and live/writeback gates are still false.

`fo_ccz4_source_energy_shadow.py` now reuses that candidate `H` to separate
the implemented frozen Fourier generator into `i*k*A + S` and measure the
source logarithmic norm.  All three Cartesian normals close the decomposition
to below `4.5e-16`; the default source-energy logarithmic norm ranges from
about `1.42` to `1.66`.  A finite-time matrix-exponential replay satisfies the
corresponding `H`-energy bound.  This is a code-level flat-background source
estimate, not a continuum/nonlinear proof; analytic uniform bounds, variable
coefficients, CPBC, and runtime writeback remain false.  Receipt:
`E:\\CodexData\\nr-k3-fo-ccz4-source-energy-v1-20261006.json`.

`fo_ccz4_full_cpbc_energy_shadow.py` extends the candidate energy audit to the
complete 58-slot frozen FO-CCZ4 system and both faces.  It stacks the existing
ordering rows with the linearized Hamiltonian/momentum rows, verifies a rank-16
incoming constraint map, and applies homogeneous maximally dissipative data in
the characteristic basis.  The x/y/z, left/right replay has 16 incoming, 16
outgoing, and 26 zero-speed modes on every row; the incoming-map residual is at
most `2.63e-14`, the weighted-principal residual is below `6e-15`, and the
maximum boundary-flux eigenvalue is `-0.5`.  This is still a numerical
symmetrizer candidate at one frozen parameter point: it is not an analytic
uniform estimate, a variable-coefficient/nonlinear CPBC, a physical radiative
boundary, or a runtime penalty.  The receipt therefore records
`cpbc_ready=false` and `runtime_writeback=false`:
`E:\\CodexData\\nr-k3-fo-ccz4-full-cpbc-energy-v1-20261006.json`.

`fo_ccz4_subsidiary_cpbc_shadow.py` now consumes the reduced 10-state
symmetrizer in an explicit characteristic energy audit.  In the homogeneous
case, the right and left faces each have four incoming and four outgoing
propagating modes at zero shift, with two zero-speed compatibility fields; the
boundary energy-rate operator is negative semidefinite (maximum eigenvalue
`-1` in the default campaign).  A reflected map is accepted only after the
same weighted flux test.  The lower-order source matrix is also reduced to an
`H`-energy logarithmic norm (`mu=0.5` in the default block), and a finite-time
matrix-exponential check verifies the bound `E(t) <= E(0) exp(2 mu t)` for the
frozen Fourier generator.  This is still a reduced, frozen-system boundary
shadow: the map is not projected to the 58-variable FO-CCZ4 system, and
nonlinear CPBC, physical boundary data, and runtime writeback remain false.
Receipt: `E:\\CodexData\\nr-k3-fo-ccz4-subsidiary-cpbc-v2-20261006.json`.

`fo_ccz4_constraint_closure_shadow.py` performs a principal-symbol algebraic
audit without changing the runtime: it repeatedly adjoins propagated rows
`C A^n` and keeps the first independent rows.  The ten-row candidate expands
to a deterministic rank-17 row-space envelope on every Cartesian normal.  The
seven added rows are derived combinations whose continuum meaning has not yet
been established; this is an invariant-envelope certificate, not a physical
subsidiary-equation derivation, symmetrizer, CPBC, or promotion gate.  Its
restricted propagation spectrum is a shadow diagnostic, not a validated
continuum characteristic census.

The corrected principal-envelope replay has maximum residual `3.02e-15`:
`E:\\CodexData\\nr-k3-fo-ccz4-constraint-closure-shadow-v2-20261005.json`.

The new `fo_ccz4_full_constraint_closure_shadow.py` retains the zero-order
source operator instead of silently using only the principal part.  After
removing the invalid raw-Gamma-as-zero rows, the measured map has 69 rows and
rank 36; its complete Fourier generator closes at rank 39 with a maximum
three-axis residual below `8.5e-11` in the current campaign.  This is the
strongest current Python consistency result, but it still does not derive the
continuum subsidiary equations or authorize CPBC/live use:
`E:\\CodexData\\nr-k3-fo-ccz4-full-constraint-closure-shadow-v1-20261005.json`.

`fo_ccz4_constraint_envelope_cpbc_shadow.py` consumes that rank-17 envelope
without imposing it on the runtime.  For both left and right faces in all
three Cartesian directions, the full 58-variable characteristic basis has 16
incoming, 16 outgoing, and 26 zero-speed modes; the envelope sees rank `7` of
the incoming map and leaves a nine-dimensional unconstrained amplitude
nullspace.  That nullity is not a count of physical gravitational-radiation
channels.  The map is deterministic and algebraically reproducible, but
continuum energy estimates, physical boundary data, and nonlinear CPBC remain
unvalidated.  The corrected v2 boundary shadow additionally fails closed when
the envelope itself has not converged:
`E:\\CodexData\\nr-k3-fo-ccz4-constraint-envelope-cpbc-shadow-v2-20261005.json`.

`fo_ccz4_subsidiary_wave.py` records the next, fully first-order reduction of
the published subsidiary wave system.  It evolves `(u,P_u,Q_u)` for each of
`Theta`, the three `Z_i`, `H`, and the three `M_i`, so the 24-state normal
symbol has eight `+alpha`, eight `-alpha`, and eight shift-transported branches.
The receipt now records the phase convention explicitly: for `q_t=A q_n`, the
physical coordinate speed is `-eig(A)`.  The right/left face census therefore
includes the transported `u` modes and changes correctly for sub-, sonic, and
super-normal shifts; the compatibility rows `Q_u-partial_n u` close to
`1.11e-16`.  This is the appropriate mathematical input for a future
maximally dissipative CPBC, but it still has no validated map back to the
58-slot FO-CCZ4 main system.  Its receipt remains
`blocked-pending-fo-ccz4-projection-and-main-system-cpbc`:
`E:\\CodexData\\nr-k3-fo-ccz4-subsidiary-wave-shadow-v2-20261006.json`.

`BSSNState3D.gauge_wave` supplies the exact periodic vacuum gauge-wave slice
`ds² = H(-dt² + dx²) + dy² + dz²`.  Its Hamiltonian and momentum constraints
are roundoff-level, while the evolved-connection constraint refines at the
selected stencil order.  `scripts/run-nr-k3-reference.py` runs this or a
smooth perturbation through deterministic RK4, checks finite state and
same-process replay hashes, runs a fixed three-seed short robust-stability
sweep, and writes a source-hashed shadow manifest.  The campaign can exercise
the tested periodic or Sommerfeld-proxy boundary path.  With `--amr-shadow`,
the same receipt also records a periodic two-level subcycling run, including
the coarse/fine pre-sync mismatch, sync operator, and AMR state digest.  With
`--psi4-shadow`, it also records one ell=2 spin-weight -2 mode at the initial
and final states, including the non-validated retarded-time series.  These are
bounded
engineering/consistency gates rather than long-run stability or physical
binary-black-hole evidence; the manifest remains blocked from runtime
consumption.

`manifest_from_3d_state` serializes this bounded 3-D evidence into the same
`nr-run-manifest-v1` envelope used by K1/K2, including geometry, boundary,
25-slot variable identity, stencil order, boundary-operator label, valid-cell
count, and constraint norms.  Its
promotion value is intentionally `blocked-pending-k3-dynamic-amr-boundaries`.

## Planned dependency-ordered milestones

1. **NR-K1 — method-of-lines reference:** a documented 1D spherical-symmetry
   formulation with explicit gauge, boundary, regularity, and constraint
   equations, independently checked against the K0 oracle.
2. **NR-K2 — C++ shadow solver:** the same state layout and diagnostics in a
   CMake/OpenMP backend, with deterministic checkpoint/restart and a versioned
   result manifest.  The browser remains a read-only consumer.
3. **NR-K3 — 3D CCZ4/BSSN backend:** finite differences or DG, constraint
   damping, AMR, outer boundaries, apparent-horizon finding, ADM diagnostics,
   and `Psi4` extraction.  Binary-black-hole tests come only after single-hole,
   gauge-wave, robust-stability, and convergence gates pass.
4. **NR-K4 — acceleration:** benchmark CPU/OpenMP first; add CUDA/AMReX only
   after an equivalent CPU oracle and reproducible cross-backend tolerances
   exist.  The current machine has an RTX 4060 but no verified CUDA compiler,
   so GPU claims are deliberately deferred.

The eventual adapter must carry the formulation, gauge, grid, time integrator,
source digest, constraint norms, convergence result, and promotion state.  A
visual frame, short browser run, or fixture is never sufficient to promote a
scientific payload.
tetrad projection for `Psi4`.  These are K3a contracts and benchmark oracles;
the general 3-D CCZ4/BSSN RHS, AMR regridding/refluxing, and characteristic
boundaries are still pending.
