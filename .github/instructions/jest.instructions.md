---
applyTo: "src/**/__tests__/**/*.{ts,tsx}"
---

# Copilot Jest (unit tests) instructions

IMPORTANT: ALWAYS run `npm ci` before running any Jest-related commands to ensure a clean, reproducible dependency tree.

## Commands
- Run all tests: `npm run test`
- Watch mode (local): `npm run test:watch`
- CI mode: `npm run test:ci`
- Coverage: `npm run test:coverage` (sets `COLLECT_COVERAGE=true`, reports to `coverage/unit`)

## Config highlights
- Environment: `jsdom`
- Transformer: `ts-jest` with `tsconfig.test.json`
- Setup: `jest.setup.ts` via `setupFilesAfterEnv`
- Test pattern: `**/__tests__/**/*.test.ts?(x)`
- Coverage includes `src/**/*.{ts,tsx}` excluding d.ts, `src/main.tsx`, `src/vite-env.d.ts`, and `src/components/ui/**/*`
- CSS modules mapped to `src/__mocks__/styleMock.js` via `moduleNameMapper`

See `jest.config.ts` for exact settings.

## Testing guidelines
- Use React Testing Library; prefer user-centric patterns and `userEvent` where relevant.
- Follow the spec pattern: "should [expected behavior] when [condition]".
- Keep tests independent and deterministic; avoid relying on execution order.
- Prefer explicit assertions and queries; avoid arbitrary timeouts.
- Mock only what’s necessary; isolate unit boundaries (services/utils/components).

Reminder: run `npm ci` before any of the above commands.


