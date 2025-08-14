import { detectViewMode, isInIframe, isFullscreen } from '@/utils/viewDetection';

describe('viewDetection', () => {
  let originalWindow: Partial<typeof window>;
  let originalDocument: Partial<typeof document>;

  beforeEach(() => {
    originalWindow = { ...window };
    originalDocument = { ...document };

    // Reset window and document to default state
    Object.defineProperty(window, 'self', {
      value: window,
      writable: true
    });
    Object.defineProperty(window, 'top', {
      value: window,
      writable: true
    });
    Object.defineProperty(window, 'parent', {
      value: window,
      writable: true
    });

    // Create a new mock document
    const mockDocument = {
      fullscreenElement: null,
      webkitFullscreenElement: null,
      mozFullScreenElement: null,
      msFullscreenElement: null
    };
    Object.defineProperties(document, {
      fullscreenElement: {
        get: () => mockDocument.fullscreenElement,
        configurable: true
      },
      webkitFullscreenElement: {
        get: () => mockDocument.webkitFullscreenElement,
        configurable: true
      },
      mozFullScreenElement: {
        get: () => mockDocument.mozFullScreenElement,
        configurable: true
      },
      msFullscreenElement: {
        get: () => mockDocument.msFullscreenElement,
        configurable: true
      }
    });
  });

  afterEach(() => {
    // Restore original properties instead of reassigning globals
    Object.defineProperty(window, 'self', {
      value: originalWindow.self,
      writable: true
    });
    Object.defineProperty(window, 'top', {
      value: originalWindow.top,
      writable: true
    });
    Object.defineProperty(window, 'parent', {
      value: originalWindow.parent,
      writable: true
    });

    // Restore document properties
    if (originalDocument.fullscreenElement !== undefined) {
      Object.defineProperty(document, 'fullscreenElement', {
        value: originalDocument.fullscreenElement,
        writable: true
      });
    }
  });

  describe('isInIframe', () => {
    it('should return false when not in an iframe', () => {
      expect(isInIframe()).toBe(false);
    });

    it('should return true when in an iframe', () => {
      Object.defineProperty(window, 'self', {
        value: window
      });
      Object.defineProperty(window, 'top', {
        value: {}
      });
      expect(isInIframe()).toBe(true);
    });
  });

  describe('isFullscreen', () => {
    it('should return false when not in fullscreen', () => {
      expect(isFullscreen()).toBe(false);
    });

    it('should return true when in fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => document.createElement('div'),
        configurable: true
      });
      expect(isFullscreen()).toBe(true);
    });
  });

  describe('detectViewMode', () => {
    it('should return standalone when not in iframe or fullscreen', () => {
      expect(detectViewMode()).toBe('standalone');
    });

    it('should return embedded when in iframe', () => {
      Object.defineProperty(window, 'self', {
        value: window
      });
      Object.defineProperty(window, 'top', {
        value: {}
      });
      expect(detectViewMode()).toBe('embedded');
    });

    it('should return fullscreen when in fullscreen mode', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => document.createElement('div'),
        configurable: true
      });
      expect(detectViewMode()).toBe('fullscreen');
    });

    it('should prioritize fullscreen over embedded', () => {
      Object.defineProperty(window, 'self', {
        value: window
      });
      Object.defineProperty(window, 'top', {
        value: {}
      });
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => document.createElement('div'),
        configurable: true
      });
      expect(detectViewMode()).toBe('fullscreen');
    });
  });
}); 