/**
 * Type definition for different view modes
 */
export type ViewMode = 'standalone' | 'embedded' | 'fullscreen';

/**
 * Extended Document interface to include vendor-specific fullscreen properties
 */
interface ExtendedDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
}

/**
 * Checks if the application is running inside an iframe
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to same-origin policy, we're in an iframe
    return true;
  }
}

/**
 * Checks if the application is in fullscreen mode
 */
export function isFullscreen(): boolean {
  const doc = document as ExtendedDocument;
  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

/**
 * Detects the current view mode of the application
 */
export function detectViewMode(): ViewMode {
  // Check fullscreen first
  if (isFullscreen()) {
    return 'fullscreen';
  }

  // Then check if we're in an iframe
  if (isInIframe()) {
    return 'embedded';
  }

  // Default to standalone
  return 'standalone';
} 