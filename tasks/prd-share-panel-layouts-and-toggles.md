## PRD — Share Panel: Layouts and UI Toggles

### 1) Overview
Add a Share panel opened from the existing Share button. The panel lets users configure a shareable view by selecting a layout and toggling visibility of specific UI controls. The panel generates a URL with query parameters that preset the app on load. Non‑interactive layout provides a grid‑only view for passive display. The URL updates live when the user changes options.

### 2) Goals
- Provide layout presets selectable in a Share panel and encode them in URL params
- Allow hiding/showing specific UI controls via URL
- Ensure links are deterministic and human‑readable (simple query params)
- Support embed code snippet generation (iframe) using the same parameters
- Update URL live when toggles change in the running app

### 3) User stories
- As a user, I can open a Share panel, choose a layout and toggles, and copy a link that opens the app with those presets.
- As a presenter, I can share a non‑interactive, grid‑only view for display without any interactions.
- As a teacher, I can share a “function plotting only” link that hides geometry tools and preselects the function tool.
- As a user, I can hide UI like canvas tools, zoom controls, or unit selector from the shared view.
- As an integrator, I can embed the configured view via an iframe snippet.

### 4) Functional requirements
1. Share panel UI
   1.1. Accessible modal opened from the current Share button.
   1.2. Contains: Layout picker, Toggles section, Language dropdown, live URL preview (read‑only), actions: Copy Link, Reset to defaults, Copy Embed Code.
2. Layouts (encoded via URL `layout`)
   2.1. `layout=default`: current app behavior.
   2.2. `layout=noninteractive`: grid‑only display; all canvas elements and UI are hidden; canvas interaction disabled; elements locked. Assumption: only grid/axes remain visible (no shapes or function curves).
3. Toggles (simple on/off unless specified)
   3.1. Function plotting only (`funcOnly=1|0`): hide geometry toolbar; preselect function tool by default; keep formula editor/plotting controls visible. If `layout=noninteractive`, hide these entirely.
   3.2. Fullscreen control (`fullscreen=1|0`): when 1, show a fullscreen toggle button in UI; do not auto‑enter fullscreen on load.
   3.3. Canvas tools UI (`tools=1|0`): show/hide creation/manipulation toolbar UI only; interactions otherwise unchanged in interactive layouts.
   3.4. Zoom UI (`zoom=1|0`): show/hide zoom UI only; wheel/pinch/keyboard zoom remain available unless `layout=noninteractive`.
   3.5. Unit selector (`unitCtl=1|0`): when 0, hide the unit selector and lock current unit for the session.
   3.6. Language (`lang=<code>`): preselect language by BCP‑47/language code (e.g., `en`, `de`, `fr`, `es`). If unsupported, fallback to default language.
4. URL behavior
   4.1. Use simple query params (see schema below). If a param is missing, fallback to defaults (backward compatible).
   4.2. When user changes options in the Share panel, the displayed URL preview and the browser URL update immediately.
   4.3. Deep link on load parses params and applies UI state before first render where possible.
5. Embed
   5.1. The Share panel provides an iframe snippet reflecting current options.
   5.2. Width/height inputs with sensible defaults (e.g., 800×600); values only affect the snippet, not the app.
6. Accessibility and i18n
   6.1. Share panel is keyboard navigable with correct ARIA roles.
   6.2. All new user‑visible strings are translatable.

### 5) Non‑goals
- No URL shortener integration.
- No local persistence beyond URL (no localStorage for these options) for now.
- No auto‑entering fullscreen on page load.

### 6) URL parameter schema (simple params)
- `layout`: `default | noninteractive`
- `funcOnly`: `0 | 1`
- `fullscreen`: `0 | 1`  // controls visibility of fullscreen toggle button
- `tools`: `0 | 1`       // canvas tools UI
- `zoom`: `0 | 1`        // zoom UI
- `unitCtl`: `0 | 1`     // unit selector control visibility (0 hides and locks unit)
- `lang`: `[a-z-]+`      // language code; fallback to default on unsupported

Defaults (when absent): `layout=default&funcOnly=0&fullscreen=0&tools=1&zoom=1&unitCtl=1` with `lang` defaulting to current app default.

Example URLs
```
?layout=default&funcOnly=1&tools=0&zoom=1&unitCtl=1&fullscreen=1&lang=de
?layout=noninteractive&lang=en
```

### 7) Conflict rules and precedence
1. Priority: `noninteractive` > `funcOnly` > individual toggles (`fullscreen`, `tools`, `zoom`, `unitCtl`).
2. If `layout=noninteractive`:
   - Hide all toolbars and controls regardless of individual toggles.
   - Lock canvas; ignore interaction inputs and keyboard shortcuts.
   - Do not render shapes or function curves (grid/axes only).
3. If `funcOnly=1` (and not noninteractive):
   - Hide geometry toolbar; function tool preselected.

### 8) Design considerations
- Share panel as a tab/section within the existing configuration modal or as a new modal matching current Shadcn UI style.
- Controls: radio group for layout, switch/toggles for UI flags, select for language, text copy areas with “Copy” buttons.
- Live preview of constructed URL with an inline copy button; also a second textarea for iframe snippet.

### 9) Technical considerations
- Param parsing: extend existing URL utilities (`src/utils/urlEncoding.ts` / router init) or add a new helper for parsing/serializing view params.
- Feature flags can live in a `ShareViewOptions` type and React context so both initial route parsing and Share panel can mutate a single source of truth.
- Ensure options apply before first paint where feasible (read params in app bootstrap, e.g., `src/main.tsx` / `src/pages/Index.tsx`).
- Non‑interactive rendering path should short‑circuit toolbars and canvas interactions; verify no event handlers leak through.
- i18n: add new strings in `src/locales/*` and wire dropdown to existing i18n hooks.

### 10) Affected areas (initial)
- New: `src/components/SharePanel.tsx` (or tab inside `ConfigModal.tsx`).
- Routing/bootstrap: apply URL params in `src/pages/Index.tsx` / `src/App.tsx`.
- UI composition: conditionally render/hide existing toolbars/components:
  - Geometry toolbar (`src/components/GeometryControls.tsx` / `Toolbar.tsx`).
  - Function plotting UI (`src/components/FormulaEditor.tsx`, `FormulaGraph.tsx`).
  - Zoom UI (`src/components/FormulaZoomControl.tsx` and/or grid zoom controls).
  - Unit selector (`src/components/UnitSelector.tsx`).
  - Fullscreen button (new small component or within header).
- Utilities: `src/utils/urlEncoding.ts`, `src/utils/translate.ts`.

### 11) Acceptance criteria
- AC1: Opening the Share panel shows layout and toggle controls; defaults match current app.
- AC2: Copy Link copies a URL that, when opened, applies the selected layout/toggles before first render.
- AC3: `layout=noninteractive` renders grid only, hides all UI, and ignores interactions.
- AC4: `funcOnly=1` hides geometry toolbar and preselects function plotting tool; if `layout=noninteractive`, plotting UI is hidden.
- AC5: `fullscreen=1` shows a fullscreen toggle button; the app does not auto‑enter fullscreen.
- AC6: `tools=0`, `zoom=0`, `unitCtl=0` each hide their respective controls; `unitCtl=0` also locks the current unit.
- AC7: `lang` preselects language; unsupported codes fallback to default.
- AC8: Browser URL updates live as options change in the Share panel.
- AC9: Embed snippet matches the current options.

### 12) Test plan (Chrome only)
End‑to‑end tests (Playwright) to be added under `e2e/share-panel/*.test.ts`:
- should apply default layout when no params are present
- should render noninteractive grid‑only when `layout=noninteractive`
- should hide geometry toolbar and preselect function tool when `funcOnly=1`
- should ignore `funcOnly=1` UI if `layout=noninteractive`
- should show fullscreen toggle when `fullscreen=1` and not auto‑enter fullscreen
- should hide canvas tools when `tools=0`
- should hide zoom UI when `zoom=0` while wheel zoom still works (except noninteractive)
- should hide and lock unit selector when `unitCtl=0`
- should set language to provided `lang` and fallback on unsupported code
- should update the URL query string live when toggles change in the Share panel
- embed snippet should reflect the current options

### 13) Open questions
- Should axes/labels remain visible in `noninteractive`, or grid lines only? (Assumption here: grid/axes only, no curves/shapes.)
- Exact set of supported units and language codes to list in the dropdown.

### 14) Examples
Link example:
```
https://app.example/visualizer?layout=default&funcOnly=1&tools=0&zoom=1&unitCtl=1&fullscreen=1&lang=de
```

Embed example:
```html
<iframe
  src="https://app.example/visualizer?layout=noninteractive&lang=en"
  width="800"
  height="600"
  style="border:0;"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
```


