# Toolbar Configuration

## Overview

This feature allows users to hide the toolbar and default to a specific shape tool or the function tool. Configuration is accessible via the global configuration panel.

## User Stories

1. As a user, I want to be able to hide the toolbar to maximize the canvas space for drawing.
2. As a user, I want to configure a default tool (shape or function) to be selected when the application loads.
3. As a user, I want these preferences to be persisted across sessions.
4. [x] As a user, I want to be able to share a URL with a pre-selected tool.

## Implementation Checklist

<details>
<summary>[x] Configuration Context Updates</summary>

- [x] Add `isToolbarVisible` boolean setting (default: true)
- [x] Add `defaultTool` string setting for tool selection
- [x] Add setter functions for both settings
- [x] Implement localStorage persistence
- [x] Update type definitions
</details>

<details>
<summary>[x] ConfigModal UI Updates</summary>

- [x] Add "Display" tab to configuration modal
- [x] Add toolbar visibility toggle switch
- [x] Add default tool dropdown selection in "Sharing" tab
- [x] Create appropriate labeling and help text
- [x] Add share URL button that copies a URL with the selected default tool
</details>

<details>
<summary>[-] Index Component Integration</summary>

- [x] Conditionally render toolbar based on visibility setting
- [-] ~~Add toolbar toggle button when toolbar is hidden~~ (UI requires settings panel)
- [x] Initialize with default tool on application load
- [x] Support function tool default with auto-opening formula editor
- [ ] Add keyboard shortcut for toggling toolbar (optional)
</details>

<details>
<summary>[x] URL Integration</summary>

- [x] Add tool selection parameter to URL encoding functions
- [x] Parse tool parameter from URL on application load
- [x] Apply tool selection from URL or fall back to user preference
- [x] Update URL when tool selection changes
- [x] Add UI for generating share URLs with specific tool parameter
- [x] Implement clipboard copy functionality for sharing URLs
</details>

<details>
<summary>[x] Translations</summary>

- [x] Add translation keys for new UI elements
- [x] Update all supported language files
</details>

<details>
<summary>[-] Testing</summary>

- [x] Unit tests for context functionality (Partially done)
- [x] Component tests for ConfigModal UI
- [x] Integration tests for toolbar visibility (Partially done)
- [x] Test default tool selection behavior (Partially done)
- [x] Test URL tool parameter functionality
- [ ] E2E tests for hidden toolbar workflow
</details>

## Technical Details

### Configuration Context

```typescript
// New settings for the GlobalConfigContextType
isToolbarVisible: boolean;
setToolbarVisible: (visible: boolean) => void;
defaultTool: string; // 'select', 'rectangle', 'circle', 'triangle', 'line', 'function'
setDefaultTool: (tool: string) => void;
```

### Display Tab UI Structure

```
Display Tab
├── Toolbar Section
│   ├── "Show Toolbar" toggle switch
│   └── Help text explaining the feature
└── Default Tool Section
    ├── "Default Tool" dropdown
    │   ├── Select Tool
    │   ├── Rectangle
    │   ├── Circle
    │   ├── Triangle
    │   ├── Line
    │   └── Function Plot
    └── Help text explaining the feature
```

### URL Parameter

```
https://example.com/?shapes=...&formulas=...&grid=...&tool=rectangle
```

The `tool` parameter can have the following values:
- `select`
- `rectangle`
- `circle`
- `triangle`
- `line`
- `function`

Special handling notes:
- The `select` tool value sets the application to selection mode
- The `function` tool value opens the formula editor automatically
- All shape tools (`rectangle`, `circle`, etc.) set the drawing mode with that shape type

### Key UX Considerations

When the toolbar is hidden:
1. Maintain access to tools via the settings panel only
2. Move the application header into the freed toolbar space
3. Ensure the canvas still displays the current tool cursor
4. The configuration menu will still be accessible from the global controls

## Dependencies

- ConfigContext for settings management
- Toolbar component for visibility toggle
- FormulaEditor for default function tool support
- URL encoding utilities for tool parameter handling

## Implementation Examples

Additional implementation examples are available in:
- `docs/implementation-example-ConfigContext.md`
- `docs/implementation-example-ConfigModal.md`
- `docs/implementation-example-Index.md`
- `docs/implementation-example-URLEncoding.md` 