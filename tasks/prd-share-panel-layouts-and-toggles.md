## PRD — Share Panel: Layouts and UI Toggles with Live Effects

### 1) Overview
Add a Share panel opened from the existing Share button. The panel lets users configure a shareable view by selecting a layout and toggling visibility of specific UI controls. The panel generates a URL with query parameters that preset the app on load. Non‑interactive layout provides a grid‑only view for passive display that shows actual canvas content. Most toggles provide live visual feedback while the SharePanel is open, with admin mode and layout changes applied only when the panel closes or URL loads.

### 2) Goals
- Provide layout presets selectable in a Share panel and encode them in URL params
- Allow hiding/showing specific UI controls via URL with live preview effects
- Ensure links are deterministic and human‑readable (simple query params)
- Support embed code snippet generation (iframe) using the same parameters
- Update URL live when live toggles change in the running app
- Provide seamless configuration experience with immediate visual feedback
- Maintain proper behavior for structural changes (admin/layout)

### 3) User stories
- As a user, I can open a Share panel, choose a layout and toggles, and copy a link that opens the app with those presets.
- As a presenter, I can share a non‑interactive, grid‑only view for display without any interactions that shows actual canvas content.
- As a teacher, I can share a link with only function controls visible while hiding geometry tools.
- As a user, I can hide UI like canvas tools, zoom controls, header, or unit selector from the shared view with immediate visual feedback.
- As an integrator, I can embed the configured view via an iframe snippet.
- As a user, I can see exactly how my shared view will appear while configuring it in the SharePanel.
- As a teacher, I can hide admin controls to provide a cleaner interface for students while keeping functionality.

### 4) Functional requirements

#### 4.1 Share panel UI
- Accessible modal opened from the current Share button
- Contains: Layout picker, Toggles section, Language dropdown, live URL preview (read‑only), actions: Copy Link, Reset to defaults, Copy Embed Code
- SharePanel remains open during all control toggles for seamless configuration
- Reset to defaults only occurs after applying pending changes

#### 4.2 Layouts (encoded via URL `layout`)
- `layout=default`: current app behavior with full interactivity
- `layout=noninteractive`: grid‑only display that shows canvas content (shapes, formulas) but disables all interactions; hides all UI controls regardless of individual toggles

#### 4.3 Live vs Non-Live Toggle Behavior
**Live toggles** (immediate visual feedback while SharePanel is open):
- `funcControls`: Show/hide function plotting controls and formula editor
- `tools`: Show/hide canvas geometry tools UI
- `zoom`: Show/hide zoom UI controls
- `unitCtl`: Show/hide unit selector control
- `header`: Show/hide header with app title
- `fullscreen`: Show/hide fullscreen toggle button

**Non-live toggles** (applied only when SharePanel closes or URL loads):
- `admin`: Enable/disable admin mode (shows/hides admin controls)
- `layout`: Switch between default and noninteractive modes

#### 4.4 Toggle Details
- **Function Controls** (`funcControls=1|0`): When 0, hide function plotting controls and formula editor while keeping geometry tools visible
- **Canvas Tools** (`tools=1|0`): When 0, hide geometry toolbar and tools; replaces old `funcOnly` functionality
- **Zoom Controls** (`zoom=1|0`): When 0, hide zoom UI only; wheel/pinch/keyboard zoom remain available unless noninteractive
- **Unit Selector** (`unitCtl=1|0`): When 0, hide unit selector and lock current unit for the session
- **Header** (`header=1|0`): When 0, hide header for canvas-only view
- **Fullscreen** (`fullscreen=1|0`): When 1, show fullscreen toggle button; do not auto‑enter fullscreen on load
- **Admin Mode** (`admin=1|0`): When 0, hide admin controls (Share button, Settings button)
- **Language** (`lang=<code>`): Preselect language by BCP‑47/language code (e.g., `en`, `de`, `fr`, `es`)

#### 4.5 URL behavior
- Use simple query params with backwards compatibility
- Live toggles update URL immediately when changed in SharePanel
- Admin/layout changes update URL only when SharePanel closes or URL loads
- Legacy `funcOnly` parameter automatically converted to `tools=false`
- generateShareUrl() includes shapes, formulas, grid position, and ShareViewOptions

#### 4.6 Environment Configuration
- Admin mode defaults controlled by `VITE_ADMIN_MODE` environment variable
- `VITE_ADMIN_MODE=true` (default): Admin controls visible by default
- URL parameter `admin=0` can override environment default

#### 4.7 Embed
- SharePanel provides iframe snippet reflecting current options
- Width/height inputs with sensible defaults (800×600)
- Values only affect the snippet, not the app

#### 4.8 Accessibility and i18n
- SharePanel is keyboard navigable with correct ARIA roles
- All new user‑visible strings are translatable
- Supports 4 languages: English, German, French, Spanish

### 5) Non‑goals
- No URL shortener integration
- No local persistence beyond URL (no localStorage for these options)
- No auto‑entering fullscreen on page load

### 6) URL parameter schema

Current parameters:
- `layout`: `default | noninteractive`
- `funcControls`: `0 | 1` (function plotting controls)
- `tools`: `0 | 1` (canvas geometry tools)
- `zoom`: `0 | 1` (zoom UI controls)
- `unitCtl`: `0 | 1` (unit selector visibility)
- `header`: `0 | 1` (header visibility)
- `fullscreen`: `0 | 1` (fullscreen toggle button)
- `admin`: `0 | 1` (admin controls visibility)
- `lang`: `[a-z-]+` (language code)

Legacy support:
- `funcOnly`: `0 | 1` (automatically converted to `tools=false`)

Defaults: `layout=default&funcControls=1&tools=1&zoom=1&unitCtl=1&header=1&fullscreen=0&admin=1&lang=en`

Example URLs:
```
?funcControls=0&tools=0&header=0                    // Function-only view, no tools, no header
?layout=noninteractive&lang=de                      // Non-interactive grid with content in German  
?admin=0&header=0                                   // Clean interface without admin controls or header
?tools=0&zoom=0&unitCtl=0                          // Minimal UI with only function controls
```

### 7) Conflict rules and precedence

1. **Highest precedence**: `layout=noninteractive` overrides all individual toggles
   - Hides all UI controls regardless of individual settings
   - Disables all canvas interactions
   - Shows grid/axes and canvas content (shapes, formulas)

2. **SharePanel state awareness**: When SharePanel is open, noninteractive mode is ignored for configuration purposes

3. **Legacy compatibility**: `funcOnly=1` automatically converts to `tools=0`

4. **Environment defaults**: `VITE_ADMIN_MODE` sets admin mode default, URL can override

### 8) Design considerations
- SharePanel as modal matching current Shadcn UI style
- Radio group for layout, switches for UI flags, select for language
- Live preview of constructed URL with copy button
- Textarea for iframe snippet with copy button
- Live visual feedback for all controls except admin/layout

### 9) Technical implementation details

#### 9.1 Context and State Management
- `ShareViewOptionsContext` provides centralized state management
- `updateShareViewOption()` for live updates
- `applyPendingChanges()` for non-live updates
- `isSharePanelOpen` state tracking for conditional behavior

#### 9.2 URL Management
- `parseShareViewOptionsFromUrl()` with validation and fallbacks
- `serializeShareViewOptionsToQuery()` for minimal URLs
- `applyShareViewOptionsWithPanelState()` for conditional precedence
- Integration with existing shape/formula URL system

#### 9.3 Live Updates
- Live toggles call `updateShareViewOption()` immediately
- Admin/layout changes stored locally until panel closes
- URL updates coordinated with existing URL management

### 10) Affected areas
- `src/components/SharePanel.tsx` - Main configuration UI
- `src/contexts/ShareViewOptionsContext/` - State management
- `src/utils/urlEncoding.ts` - URL parsing and serialization
- `src/pages/Index.tsx` - Initial URL parsing and application
- UI components: conditional rendering based on ShareViewOptions
- `src/locales/*` - Translations for all new strings

### 11) Acceptance criteria

#### AC1: SharePanel Live Behavior
- Opening SharePanel shows current layout and toggle states
- Live toggles (funcControls, tools, zoom, unitCtl, header, fullscreen) update UI immediately
- Admin and layout changes are previewed but not applied until panel closes
- URL updates immediately for live toggles

#### AC2: URL Loading and Application  
- URLs with parameters apply settings before first render
- `layout=noninteractive` shows grid and content, hides all UI, disables interactions
- Individual toggles work correctly in default layout
- Legacy `funcOnly=1` converts to `tools=0`

#### AC3: Non-Interactive Mode
- Shows actual canvas content (shapes, formulas) not just loading messages
- Disables all interactions while keeping content visible
- Hides all UI controls regardless of individual toggle settings

#### AC4: Admin Mode Integration
- `VITE_ADMIN_MODE=true` makes admin controls visible by default
- `admin=0` URL parameter hides Share and Settings buttons
- Admin toggle provides live preview but applies on panel close

#### AC5: Content and URL Management
- generateShareUrl() includes shapes, formulas, grid position, and all ShareViewOptions
- SharePanel stays open during all control toggles
- Reset to defaults occurs after applying pending changes

#### AC6: Accessibility and Localization
- All controls are keyboard accessible
- All text is translatable across 4 languages
- Proper ARIA labels and focus management

### 12) Test plan (Chrome E2E coverage)

End‑to‑end tests under `e2e/share-panel/*.test.ts`:

#### Layout and Basic Functionality
- should apply default layout when no params are present
- should render noninteractive grid with content when `layout=noninteractive`
- should show shapes and formulas in noninteractive mode without loading toasts

#### Live Toggle Behavior
- should update funcControls immediately when toggled in SharePanel
- should update tools visibility immediately when toggled in SharePanel  
- should update zoom controls immediately when toggled in SharePanel
- should update unit selector immediately when toggled in SharePanel
- should update header visibility immediately when toggled in SharePanel
- should update fullscreen button immediately when toggled in SharePanel

#### Non-Live Toggle Behavior
- should preview admin changes but apply only when SharePanel closes
- should preview layout changes but apply only when SharePanel closes
- should keep SharePanel open when toggling admin mode

#### URL Management and Persistence
- should update URL immediately for live toggles
- should update URL when SharePanel closes for admin/layout changes
- should include all parameters in generateShareUrl (shapes, formulas, grid, options)
- should handle legacy funcOnly parameter conversion

#### Parameter Combinations
- should hide function controls when `funcControls=0`
- should hide geometry tools when `tools=0` 
- should hide header when `header=0`
- should hide admin controls when `admin=0`
- should respect precedence: noninteractive overrides individual toggles

#### Environment and Defaults
- should show admin controls by default with `VITE_ADMIN_MODE=true`
- should allow URL override of environment defaults
- should reset to defaults after applying pending changes

### 13) Implementation status
✅ **Completed**: All core functionality implemented
- Live toggle effects for most controls
- Admin/layout exclusions from live updates  
- Combined funcOnly/tools controls with legacy support
- Enhanced SharePanel behavior with state persistence
- Non-interactive mode showing actual content
- Comprehensive URL parameter management
- Environment variable integration for admin mode
- Complete translation support across 4 languages
- Full test coverage for all functionality

### 14) Examples

**Live effects URL (immediate feedback):**
```
?funcControls=0&tools=0&header=0&zoom=0
```

**Non-interactive content display:**
```  
?layout=noninteractive&lang=de&grid=624.0,244.0&formulas=function,formula-123,x*x,%23163ca8,2.0,-10000,10000,500,1.00
```

**Clean teaching interface:**
```
?admin=0&header=0&tools=0&unitCtl=0
```

**Embed snippet:**
```html
<iframe
  src="https://app.example/visualizer?layout=noninteractive&funcControls=0&header=0"
  width="800"
  height="600"
  style="border:0;"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
```