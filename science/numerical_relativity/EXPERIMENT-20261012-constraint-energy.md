# Full43 block, spectral-projector and directional-energy controls

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: fixed principal-symbol algebra and candidate energy verification
- Origin Date: 2026-10-12
- Verification Status: PLANNED BEFORE EXECUTION
- Version Label: nr-constraint-projector-energy-v1

## Fixed hypotheses and construction

Keep the qualified501-source longitudinal reduction unchanged. Let O be its
rank11 longitudinal-definition projector and P=I-O, rank32. Check AO=OA=0,
ODE/full-state correspondence, and A=A_intrinsic+(beta.n)*P. Construct the
intrinsic matrix by the same frozen equations with beta=0, not by fitting A.
All equations, lapse/gauge/damping parameters and original physical runs stay
unchanged. Synthetic shifts below are static control inputs only.

Prescribe the13 intrinsic nodes from the existing full-state profile, with
g=n^T*h^-1*n: 0 and +/- each of
alpha*sqrt(chi*g), sqrt(2*alpha*chi*g), sqrt(4*alpha*chi*g),
alpha*sqrt(.1*chi*g), sqrt(3*alpha*chi*g), alpha*sqrt(.05*chi*g).
Do not derive nodes from numerical eigendecomposition or trim small projectors.
Nodes absent from the constraint spectrum must remain explicit zero-multiplicity
candidates. A prescribed node is not automatically an actual constraint mode.

For distinct positive nodes a, let X=K^2 on the PDE complement. Construct the
paired projector J_a=X/a^2*product_{b!=a}(X-b^2 P)/(a^2-b^2), then
E_+a=(J_a+K*J_a/a)/2, E_-a=(J_a-K*J_a/a)/2, E_0=P-sum J_a.
Use Decimal50 arithmetic with exact conversion of the binary64 inputs; compute
matrix powers once, never eigenvectors or a least-squares closure. Verify three
registered Decimal70 controls. Decimal evaluation cannot repair wrong inputs.
Preserve all resulting binary64 values without clipping/rank completion.

Also construct the full-state projectors independently from the qualified58
Taylor principal matrix (its canonical47-PDE block). Compare E_j*D0=D0*F_j.
Check all projector identities, real-node action and full reconstruction against
the UNMODIFIED direct matrices, including nonzero shifts and repeated speeds.

Construct H=O^T*O+sum E_j^T*E_j. Check positive definiteness and HA=A^T H.
If O+sum E_j=I exactly, Cauchy-Schwarz gives H>=I/14; check the numerical
lower-bound deficit against the original2e-12. Record the upper eigenvalue and
condition number, not a fitted acceptance cap. Direction-dependent H is not a
common Friedrichs symmetrizer or a local boundary energy, and finite samples
do not prove uniform bounds or global strong hyperbolicity.

## Fixed coverage and thresholds

66 cases: the27 existing seed/direction cases, then39 synthetic shifts at the
mode2 tangent direction. For each13 prescribed intrinsic nodes r, set beta's
normal projection to -r+delta with delta=-1/64,0,+1/64, retaining the original
tangential shift. Thus the full-profile speed node crosses the ODE zero speed;
record any zero multiplicity in the reduced constraint system honestly.
The projectors and H are constructed from the shift-free coefficients, while
their identities are tested against independently evaluated shifted matrices.
No division by beta.n or shifted-speed separation. No time evolution.

Use unchanged2e-12 normalized infinity-norm residuals (divide by
max(1,reference infinity norm)) for projector completeness/idempotency/action,
matrix reconstruction, block/shift decomposition, symmetrization and state-map
relations. Zero-reference cross/leak checks therefore have absolute2e-12 bounds.
Projector ranks use the original1e-9,1e-10,1e-11 relative cuts; require stable
rank sums32 and47 without deleting any small matrix entries. H must be positive,
and its1/14 lower-bound deficit must be <=2e-12. Any failure stops the batch.

100 tests:66 full cases,3 Decimal50/70 controls,13 zero-speed-node crossing
controls,6 corruption controls,10 invalid-input controls,1 no-fitting dependency
check,1 coverage/scope check. Regress all52 previous longitudinal tests.
Persist14 arrays per case plus observations, XML/logs, source snapshot,
per-case exact replay and durable terminal. Replay66 cases exactly before
qualification; retain all old failures and no automatic retry.

## Resources and provenance

Entry: D:/python/python.exe -B scripts/run-nr-k3-constraint-energy-controls.py
--output-directory tmp/nr-shadow-evidence/nr-k3-constraint-energy-controls-v1-20261012

Fresh direct evidence child only. Original64MiB/600sec,2MiB finalization,
C>=3GiB and E>=4GiB+32MiB plus prospective64MiB,8MiB source snapshot.
Python -B, single BLAS/OpenMP/MKL thread, E TEMP/TMP; no installs or cleanup.
2026-10-13 runner-only revision, before any energy execution: an independent
stdlib supervisor monitors the entire worker tree, including exact replay and
integrity checks. A pipe barrier precedes Windows Job Object assignment/release;
all owned descendants are stopped on timeout, resource breach or interruption.
Two dense1MiB terminal slots are allocated before work starts. Finalization
overwrites only the existing canonical slot without new allocation or the
ordinary disk-floor guard; its prepared twin remains incomplete. Checksum or
run-identity failure falls back to incomplete. Power loss or underlying I/O
failure is NOT guaranteed to produce a finished terminal. Monitoring is bounded
polling, not an OS disk quota or a hard real-time deadline; cleanup may take
additional time. The authoritative gate requires both worker and supervisor
qualification. No automatic retry. Energy execution still needs separate approval
after the independent runner fault-control batch; this revision grants none.
Pin parent gateffb93ab382da9d28019586e0e3b674ca414c1a4b577c261bdf3ee74f3461438a.
501 unchanged sources plus six new sources=507. No original source/receipt
rewrites, N9/N13, native/GPU execution, art/live changes or scientific writeback.
Only fixed_projector_energy_validated may become true. Uniform hyperbolicity,
common symmetrizer, CPBC, nonlinear stability and convergence stay unqualified.

## Primary reference boundary

Exa fetched [Gundlach and Martin-Garcia, gr-qc/0402079](https://ar5iv.labs.arxiv.org/html/gr-qc/0402079),
section II: complete real characteristic structure, directional symmetrizers,
uniform bounds, and the stronger requirement for a common local boundary
energy. The projector-polynomial construction is explicit local mathematics;
the paper does not validate these equations or grant scientific admission.
