# Orbit Atlas v240 external Windows install QA

Status: **pending**

Test each MSI and NSIS artifact on Windows 10/11:

- [ ] Verify SHA-256 and Authenticode status.
- [ ] First install and launch.
- [ ] Exit and confirm child process/port cleanup.
- [ ] Detect all six content packs; verify missing-pack degradation.
- [ ] Uninstall and verify temporary/user-data boundaries.
- [ ] Reinstall.
- [ ] Repeat under a Chinese path and a path containing spaces.
- [ ] Test WebView2 present and missing/bootstrapper paths.

Do not mark Desktop Beta qualified until the signed artifacts and this report both pass.
