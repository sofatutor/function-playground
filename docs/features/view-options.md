# View Options Feature

## Overview
This feature allows the function plotter to adapt its display based on how it's being viewed (standalone, embedded, or fullscreen).

## Requirements

### View Modes
1. Standalone (default)
   - Shows all UI elements
   - Full functionality available

2. Embedded (in iframe)
   - Hides toolbar
   - Hides function bar
   - Focused on core plotting functionality
   - Clean, minimal interface

3. Fullscreen
   - Shows function bar
   - Hides toolbar
   - Optimized for presentation/demonstration

### Implementation Tasks
- [x] Add view mode detection
- [x] Create view mode context
- [x] Add test HTML for embedding
- [ ] Update toolbar visibility based on view mode
- [ ] Update function bar visibility based on view mode
- [ ] Add tests for view-specific UI elements
- [ ] Add documentation for embedding options
- [ ] Consider adding configuration options for embedded view

### Technical Details
- View mode is detected using `window.self !== window.top` for iframe detection
- Fullscreen mode is detected using `document.fullscreenElement`
- View mode state is managed through React context
- UI components should check view mode before rendering

### Testing
- [x] Unit tests for view detection
- [ ] Integration tests for view-specific UI
- [ ] Manual testing in different view modes
- [ ] Cross-browser testing for fullscreen support

### Documentation
- [ ] Update embedding guide
- [ ] Add view mode configuration options
- [ ] Document view-specific features 