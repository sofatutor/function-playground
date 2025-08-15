---
applyTo: "e2e/**/*.ts"
---

# Copilot E2E (Playwright) instructions

- Use the configured dev server: Playwright starts it via `webServer` in `playwright.config.ts` with `npm run dev` at `http://localhost:8080`. Do not spawn another server.
- Keep global timeouts as configured (`timeout`, `expect.timeout`, `actionTimeout`); avoid arbitrary sleeps/timeouts—wait for selectors/state instead.
- Use stable selectors over brittle text-only selectors. Capture failures with built-in trace/screenshots; artifacts are written under `test-results/`.
- Tests must be independent; do not rely on execution order. Prefer `test.step` for clarity when helpful.
- Commands:
  - Local: `npm run e2e`
  - CI/reporters: `npm run e2e:ci`
  - Coverage: `npm run e2e:coverage` (outputs to `coverage/e2e`)


