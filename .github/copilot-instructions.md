# Repository custom instructions for GitHub Copilot

These instructions give Copilot repo-specific context so suggestions align with this project. Keep responses consistent with the guidance below before proposing changes.

## Project overview
- TypeScript + React + Vite app for interactive geometry and function plotting (grid, shapes, measurements, and formula graphs).
- UI built with Shadcn components; tests with Jest (unit) and Playwright (E2E).

## Environment and commands
- Node: use the version in `.nvmrc` (currently 24.1.0).
- IMPORTANT: ALWAYS install dependencies with `npm ci` before running any command (do not use `npm install`).
- Dev server: `npm run dev` (Vite, served at `http://localhost:8080`)
- Build (prod): `npm run build`
- Build (dev mode): `npm run build:dev`
- Lint: `npm run lint`
- Unit tests: `npm run test` (CI: `npm run test:ci`, coverage: `npm run test:coverage` → `coverage/unit`)
- E2E tests: `npm run e2e` (CI: `npm run e2e:ci`)
- E2E coverage: `npm run e2e:coverage` → `coverage/e2e`

Notes for E2E:
- Do not start a second server; Playwright starts the dev server via `playwright.config.ts` `webServer` using `npm run dev` and `baseURL: http://localhost:8080`.
- Prefer waiting on selectors/state over arbitrary timeouts. Keep global timeouts as configured.

Reminder: Before executing any of the commands above, run `npm ci` to ensure a clean, reproducible dependency tree.

## Repository structure (high level)
- App entry: `src/main.tsx` mounts `src/App.tsx`.
- Pages: `src/pages` with `Index.tsx`, `NotFound.tsx`.
- Components: `src/components` (Shadcn UI primitives in `src/components/ui`).
- Canvas/geometry: `src/components/GeometryCanvas/*`, `src/utils/geometry/*`.
- Context/state: `src/contexts/*`, `src/context/*`.
- Services: `src/services` (implementations under `src/services/implementations`).
- Utils: `src/utils/*` (math/geometry), shared types in `src/types/*`.
- Unit tests: `src/__tests__/**` and colocated component tests.
- E2E tests: `e2e/**` (global setup at `e2e/global-setup.ts`).
- Tooling: `jest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `vite.config.ts`.

## Coding conventions and quality gates
- TypeScript-first: explicit types for exported APIs and complex objects; avoid `any`; prefer discriminated unions/generics where appropriate.
- Keep code simple (KISS), DRY, and single-responsibility. Extract reusable logic into hooks/utils/services.
- UI & accessibility: use Shadcn primitives from `src/components/ui`; ensure roles/labels, keyboard navigation, and focus management.
- i18n: any user-facing text must be translatable. When changing copy, update dictionaries in `src/locales/*` and helpers in `src/i18n/*`.
- Performance: memoize expensive computations; avoid excessive event handlers; debounce where appropriate.
- Testing: add/update unit tests for non-trivial logic (services/utils/components). For E2E, keep tests independent and use stable selectors.
- E2E artifacts: Playwright stores traces/screenshots in `test-results/`; retries enabled on CI.

## What “done” looks like (before proposing changes)
- `npm run lint` is clean (no warnings due to `--max-warnings 0`).
- Unit tests pass locally: `npm run test` (use coverage when touching core logic).
- For flows affected by UI/state changes, E2E pass: `npm run e2e` (or `npm run e2e:ci`).
- Changes are small, focused, and avoid unrelated formatting churn.
- No WIP/TODO/FIXME comments are introduced.

## Tips for Copilot when generating changes
- Reuse existing hooks/utilities and follow existing patterns in `src/utils/geometry/*`, `src/components/GeometryCanvas/*`, and `src/contexts/*`.
- When adding UI, prefer Shadcn components and keep a11y in mind; update translations for any new user-facing copy.
- For E2E, do not increase global timeouts and don’t start another server—wait for selectors/state and use the configured `baseURL`.
- Prefer minimal, explicit edits that maintain current public APIs and typings; update or add tests alongside changes.


