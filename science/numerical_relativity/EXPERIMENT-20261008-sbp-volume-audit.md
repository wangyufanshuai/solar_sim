# Nonlinear SBP volume: independent saved-state closure

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: deterministic replay and independently derived saved-state audit
- Origin Date: 2026-10-08
- Verification Status: PROSPECTIVE AUDIT; EXISTING CAMPAIGN THRESHOLDS UNCHANGED
- Version Label: nr-sbp-volume-audit-v1

The preceding turn was a requested status assessment, not new kernel progress.
This closes the outstanding volume gate before nonlinear boundary integration.
The original v1 failure, v2 protocol, all268 frozen source files and all prior
receipts remain unchanged. The v2 receipt SHA256 is
`4bf230893494e98eeea5f60d6405ee90c1d4dd90e579b3ad0676d6c2c32039b5`.
The separately launched replay writes only the fresh directory
`tmp/nr-shadow-evidence/nr-k3-sbp-volume-replay-v2-20261008` and uses the
unchanged runner, thresholds and approved C/E reserve policy.

## Independent oracle and its exact scope

Only the three saved static Schwarzschild states are reconstructed by this
new oracle. It imports neither the production nonlinear RHS, its geometry,
the production SBP operator, nor the campaign runner. It reuses the separately
transcribed dense SBP table from `scripts/audit-nr-k3-full58-sbp.py`, recording
that helper's identity. The helper has domain length2, matching [1,3]^3.

For h=I and a=K=Theta=GammaHat=b=beta=D=B=0, keep the independently supplied
A_i=partial_i ln(alpha) and P_i=partial_i ln(phi); do not replace them with
discrete gradients of alpha or phi. With D the dense SBP derivative:

R_ij = D_(i P_j) + delta_ij D_k P_k + P_i P_j - delta_ij P_k P_k.

T_ij = D_(i A_j) + A_i A_j + P_i A_j + P_j A_i - delta_ij P_k A_k.

The lapse Hessian is alpha*T. With chi=phi^2, the only possibly nonzero
packed RHS slots are

- a_ij,t = alpha*chi*(R_ij-T_ij - delta_ij*tr(R-T)/3);
- K_t = alpha*chi*tr(R-T);
- Theta_t = alpha*chi*tr(R)/2;
- B_k^i,t = alpha^2*(.2*chi)*(D_k P_i-D_i P_k).

All other slots are zero on this static input. These are closed conformally
flat identities, not a second call into the general nonlinear equation body.
Check every saved state independently against M=1 analytic radial fields.
Compare Ricci against M/(r^3*psi^2)*(I-3*n*n), psi=1+M/(2*r), which is
nonzero. This does not independently validate the general perturbed58 case.

## Frozen audit requirements

1. Receipt/replay scientific JSON must match exactly, excluding only seconds.
   Verify all268 current sources and each run's279 artifacts, expected names,
   the two explicit inherited source transitions, native binary, parent receipt,
   original protocol and retained failed attempt. No empty manifest acceptance.
2. All physical/live flags remain false. The operator is volume-only, no SAT,
   no fixed halo, no evolution. Check the exact experiment parameters.
3. Analytic static input agreement <=2e-14. Reconstructed full58 RHS and Ricci
   agree with stored arrays at <=2e-11 (the original arithmetic ceiling).
4. Independently recompute fixed125-node core, tensor-SBP whole-domain and
   six-face component RMS; absolute disagreement <=2e-14. Independently
   recalculate all12 refinement decisions with the original2e-12 floor and
   core order>=3; measured-order disagreement <=2e-8. No threshold changes.
5. Recalculate central-amplitude orders from retained remainder norms and
   verify all original legacy/principal decision fields; generic nonlinear
   perturbation arrays are hash/shape/finite checked, not claimed to have
   independent full nonlinear physics reconstruction.
6. Add negative tests for wrong/missing scope, incomplete matrices, invalid
   state shapes, nonstatic fields, nonfinite values, path escape, promoted
   flags, changed numeric replay and overwrites. Run the prior1093-test set,
   both new volume test files and the new audit tests together on current code.

Entry: `D:/python/python.exe -B scripts/audit-nr-k3-sbp-volume.py
--receipt tmp/nr-shadow-evidence/nr-k3-sbp-volume-v2-20261008/receipt.json
--replay tmp/nr-shadow-evidence/nr-k3-sbp-volume-replay-v2-20261008/receipt.json
--output tmp/nr-shadow-evidence/nr-k3-sbp-volume-audit-v1-20261008.json`.

New audit cap120s/1MiB; same C>=3GiB and E>=4GiB+32MiB reserve. No overwrites,
installs, cleanup, art changes or scientific writeback. A pass closes only
this volume component, authorizing the next explicit nonlinear SAT experiment.
Old T=1M failures, black-hole, AMR, waveform, GPU and live gates remain open.
