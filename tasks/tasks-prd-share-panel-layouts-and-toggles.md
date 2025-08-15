## Relevant Files

- `src/components/ConfigModal.tsx` - Existing configuration modal; potential place to add a Share tab/section.
- `src/components/GeometryHeader.tsx` - Header area with actions; likely host for the Share button and fullscreen toggle.
- `src/components/GlobalControls.tsx` - App-level controls that may be conditionally hidden.
- `src/components/GeometryControls.tsx` - Geometry toolbar to hide when `funcOnly=1` or in `noninteractive`.
- `src/components/Toolbar.tsx` - Shared toolbar UI components potentially affected by toggles.
- `src/components/FormulaEditor.tsx` - Function plotting editor; remains visible for `funcOnly=1`.
- `src/components/FormulaGraph.tsx` - Graph rendering affected by layouts (e.g., hidden under `noninteractive`).
- `src/components/FormulaZoomControl.tsx` - Zoom UI to be conditionally shown/hidden.
- `src/components/UnitSelector.tsx` - Unit selector to hide/lock via parameter.
- `src/components/CanvasGrid/ResponsiveGrid.tsx` - Grid rendering; must remain when `noninteractive`.
- `src/pages/Index.tsx` - Entry page; apply URL options pre-render and update URL on changes.
- `src/App.tsx` - App composition; may host providers and initial application of parsed options.
- `src/utils/urlEncoding.ts` - Extend with helpers for parsing/serializing share view options.
- `src/utils/translate.ts` - Language utilities; integrate with `lang` preselect.
- `src/i18n/useTranslation.ts` - Hook for switching languages programmatically.
- `src/locales/*.json` - Add new strings for the Share panel UI.
- `src/components/SharePanel.tsx` - New component for the Share panel (if not integrating into `ConfigModal`).

- `e2e/share-panel.spec.ts` - Playwright e2e coverage for URL params, layouts, toggles, and embed snippet.
- `src/utils/__tests__/urlEncoding.shareView.test.ts` - Unit tests for parsing/serializing the new URL schema.

### Notes

- Unit tests should typically be colocated with the files they test where appropriate.
- Run unit tests with `npm run test`. Run E2E with `npm run e2e` or `npm run e2e:ci`.

## Tasks

- [ ] 1.0 Define Share View options and URL schema
  - [ ] 1.1 Create `ShareViewOptions` type with fields: `layout`, `funcOnly`, `fullscreen`, `tools`, `zoom`, `unitCtl`, `lang` and `defaultShareViewOptions` constant
  - [ ] 1.2 Implement `parseShareViewOptionsFromUrl(location.search)` with sane fallbacks and validation
  - [ ] 1.3 Implement `serializeShareViewOptionsToQuery(options)` returning stable, minimal query string
  - [ ] 1.4 Add utilities to merge options and compute precedence (noninteractive > funcOnly > others)
  - [ ] 1.5 Unit tests for parsing/serialization (missing params, invalid `lang`, precedence merge)
  - [ ] 1.6 Docs block in code for parameter meanings and defaults

- [ ] 2.0 Implement Share Panel UI (modal/tab) with layout picker, toggles, language select, copy link, embed code
  - [ ] 2.1 Create `src/components/SharePanel.tsx` (Shadcn Dialog or `ConfigModal` tab) with radio group for `layout`
  - [ ] 2.2 Add toggles: `funcOnly`, `fullscreen`, `tools`, `zoom`, `unitCtl` (switches)
  - [ ] 2.3 Add language dropdown bound to available locales; unsupported values disabled
  - [ ] 2.4 Live URL preview field (read‑only) with “Copy link” and “Reset to defaults” buttons
  - [ ] 2.5 Embed snippet generator: width/height inputs, textarea with iframe code, copy button
  - [ ] 2.6 Wire panel to app state/context; on change, update state and URL (push/replace state)
  - [ ] 2.7 Add new i18n strings to `src/locales/*`
  - [ ] 2.8 A11y: label elements, focus trap, keyboard navigation, ESC/Close behavior

- [ ] 3.0 Apply layouts/toggles across the app (conditional rendering and behavior, precedence rules, locking interactions)
  - [ ] 3.1 Bootstrap: read URL on load (`Index.tsx`/`App.tsx`) and provide `ShareViewOptions` via context/provider
  - [ ] 3.2 Implement `noninteractive` layout: hide all toolbars/UI, disable event handlers, render grid/axes only (no shapes/curves)
  - [ ] 3.3 Implement `funcOnly`: hide geometry toolbar and preselect function plotting tool; keep formula editor visible
  - [ ] 3.4 `fullscreen=1`: show fullscreen toggle button in header; do not auto‑enter fullscreen
  - [ ] 3.5 `tools=0`: hide canvas/geometry tools UI only
  - [ ] 3.6 `zoom=0`: hide zoom UI only; preserve wheel/pinch/keyboard zoom (unless `noninteractive`)
  - [ ] 3.7 `unitCtl=0`: hide unit selector and lock current unit for session
  - [ ] 3.8 `lang`: preselect language via i18n; fallback to default on unsupported code
  - [ ] 3.9 Ensure URL updates live when toggles change (history replace to avoid clutter)

- [ ] 4.0 Integrate i18n, accessibility, and language preselect behavior
  - [ ] 4.1 Add translations for Share panel labels, descriptions, buttons
  - [ ] 4.2 Verify existing i18n switching supports programmatic `lang` preselect; adjust if needed
  - [ ] 4.3 Pass ARIA labels to new controls; verify keyboard-only flow
  - [ ] 4.4 Visual regression sanity: ensure hidden elements do not occupy space

- [ ] 5.0 Add tests (Chrome E2E + unit) and documentation updates
  - [ ] 5.1 Unit tests for URL parsing/serialization and precedence rules
  - [ ] 5.2 E2E: default layout when no params
  - [ ] 5.3 E2E: `layout=noninteractive` renders grid only, hides UI, disables interactions
  - [ ] 5.4 E2E: `funcOnly=1` hides geometry toolbar, preselects function tool; ignored when `noninteractive`
  - [ ] 5.5 E2E: `fullscreen=1` shows fullscreen toggle, no auto‑enter
  - [ ] 5.6 E2E: `tools=0` hides tools UI; `zoom=0` hides zoom UI; `unitCtl=0` hides and locks unit
  - [ ] 5.7 E2E: `lang` is applied and unsupported values fallback to default
  - [ ] 5.8 E2E: URL updates live when options change in Share panel
  - [ ] 5.9 Docs: update `docs/user-guide.md` with examples (links + embed), and PRD link


I have generated the high-level tasks based on the PRD. Ready to generate the sub-tasks? Respond with "Go" to proceed.


