# Orbit Atlas v585 rollback plan

Generated: 2026-08-04T00:00:00Z

## Safety state

- Production alias is unchanged. The current deployment remains available and is classified as a public candidate preview.
- Formal product pointer remains `v263`; the default scientific kernel remains `legacy-eih-1pn`.
- No historical evidence or historical manifest is rewritten by v585.

## Preview rollback

1. Do not promote the v585 Preview alias.
2. If a Preview deployment must be removed, first verify the production deployment ID and alias are different, then remove only the exact Preview deployment ID.
3. Re-run `node scripts/audit-public-assets-v585.mjs` against the surviving URL; never infer rollback success from an alias name alone.

## Source rollback

- Revert the exact v585 commit after it exists; do not use `git reset --hard` and do not stage unrelated workspace files.
- If only candidate assets must be disabled, keep `GalaxyEnvironmentSphere` bound to `ORBIT_ATLAS_SKY` and remove the explicit `/local-shadow-v562` candidate route in a new commit.
- Do not delete the recovered V9 files unless the replacement commit restores the exact same frozen SHA set.

## Recovery verification

Run:

`node scripts/build-visual-candidate-v562.mjs`

`npx vitest run app/lib/atlasVisualFreezeV585.test.ts app/lib/atlasVisualCandidateV562.test.ts --exclude "tmp/**"`

A rollback is incomplete unless all five V9 SHA values and the three historical v263 evidence SHA values still match `legacy-v9-asset-recovery-v585.json`.
