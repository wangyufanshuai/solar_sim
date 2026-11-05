# Windows desktop signing

Orbit Atlas desktop uses Tauri's custom Windows signing command with Azure Artifact Signing. Unsigned local builds remain the default; signing is opt-in and fails closed.

Prerequisites:

- `artifact-signing-cli` installed and available on `PATH`;
- an active Azure Artifact Signing account and certificate profile;
- the signing identity has the Certificate Profile Signer role;
- credentials are supplied only through the process environment.

Required environment variables:

- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID`
- `ATLAS_AZURE_ARTIFACT_SIGNING_ENDPOINT`
- `ATLAS_AZURE_ARTIFACT_SIGNING_ACCOUNT`
- `ATLAS_AZURE_ARTIFACT_SIGNING_PROFILE`

Run `npm run build:desktop:signed`. The wrapper does not print or persist credential values. After the build, verify every `.exe` and `.msi` with `Get-AuthenticodeSignature` before creating release evidence. Updater support remains disabled.
