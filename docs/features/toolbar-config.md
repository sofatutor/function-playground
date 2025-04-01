# Toolbar Configuration

## Overview

This feature allows users to hide the toolbar and default to a specific shape tool or the function tool. Configuration is accessible via the global configuration panel.

## User Stories

1. As a user, I want to be able to hide the toolbar to maximize the canvas space for drawing.
2. As a user, I want to configure a default tool (shape or function) to be selected when the application loads.
3. As a user, I want these preferences to be persisted across sessions.
4. As a user, I want to be able to share a URL with a pre-selected tool.

## Implementation Checklist

- [x] **Configuration Context Updates**
  - [x] Add `isToolbarVisible` boolean setting (default: true)
  - [x] Add `defaultTool` string setting for tool selection
  - [x] Add setter functions for both settings
  - [x] Implement localStorage persistence
  - [x] Update type definitions

- [x] **ConfigModal UI Updates**
  - [x] Add "Display" tab to configuration modal
  - [x] Add toolbar visibility toggle switch
  - [ ] Add default tool dropdown selection
  - [x] Create appropriate labeling and help text

- [x] **Index Component Integration**
  - [x] Conditionally render toolbar based on visibility setting
  - [-] ~~Add toolbar toggle button when toolbar is hidden~~ (UI requires settings panel)
  - [ ] Initialize with default tool on application load
  - [ ] Support function tool default with auto-opening formula editor
  - [ ] Add keyboard shortcut for toggling toolbar (optional)

- [ ] **URL Integration**
  - [ ] Add tool selection parameter to URL encoding functions
  - [ ] Parse tool parameter from URL on application load
  - [ ] Apply tool selection from URL or fall back to user preference
  - [ ] Update URL when tool selection changes

- [x] **Translations**
  - [x] Add translation keys for new UI elements
  - [x] Update all supported language files

- [ ] **Testing**
  - [x] Unit tests for context functionality (Partially done)
  - [x] Component tests for ConfigModal UI
  - [x] Integration tests for toolbar visibility (Partially done)
  - [x] Test default tool selection behavior (Partially done)
  - [ ] Test URL tool parameter functionality
  - [ ] E2E tests for hidden toolbar workflow

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