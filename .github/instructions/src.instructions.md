---
applyTo: "src/**/*.{ts,tsx}"
---

# Copilot source code instructions

- Follow TypeScript best practices: explicit types for exported APIs and complex objects; avoid `any`; prefer discriminated unions/generics where appropriate.
- Keep code simple (KISS), DRY, and single-responsibility. Extract reusable logic into hooks/utils/services.
- UI and accessibility:
  - Use Shadcn primitives from `src/components/ui`.
  - Ensure a11y: roles/labels, keyboard nav, focus management.
- i18n:
  - Any user-facing text must be translatable.
  - Update `src/locales/*` and `src/i18n/*` when changing copy.
- Testing:
  - Add/update unit tests for non-trivial logic (services/utils/components).
  - Commands: `npm run test` (CI `npm run test:ci`, coverage `npm run test:coverage`).
- Performance: memoize expensive computations; avoid excessive event handlers; debounce where appropriate.


