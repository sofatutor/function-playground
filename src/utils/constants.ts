/**
 * Application-wide constants
 */

// Timing constants
export const GRID_POSITION_DEBOUNCE_MS = 100;
export const CANVAS_SIZE_DEBOUNCE_MS = 100;
export const ORIGIN_UPDATE_DEBOUNCE_MS = 50;

// Z-index constants for layering
export const Z_INDEX = {
  GRID_LINES: 1,
  SHAPES: 2,
  PREVIEW_SHAPE: 4,
  FORMULAS: 15,
  UI_CONTROLS: 40,
  ZOOM_CONTROLS: 10,
  MODALS: 1000,
} as const;

// Formula navigation constants
export const FORMULA_NAVIGATION_STEP_SIZE = 0.1;

// Measurement precision constants
export const POSITION_COMPARISON_THRESHOLD = 0.1;