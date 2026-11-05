# Orbit Atlas v240 rollback runbook

1. Keep the current/previous standalone and Lite build slots intact.
2. Before any future deployment, record the Vercel deployment ID and DNS values.
3. If health/CSP/SRI/Browser QA fails, restore the previous deployment alias and previous DNS values.
4. Verify /api/health, root Canvas readiness and immutable download hashes.
5. Desktop rollback remains manual while updater is disabled; distribute only checksummed signed artifacts after external install QA.
6. Git baseline/tag creation remains a separately authorized action.
