import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { GridZoomProvider } from '@/contexts/GridZoomContext/index';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import GridZoomControl from '../GridZoomControl';

// Mock translations
jest.mock('@/hooks/useTranslate', () => ({
  useTranslate: () => (key: string) => key,
}));

// Mock tooltips
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ asChild, children }: { asChild: boolean, children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock fullscreen API
const mockRequestFullscreen = jest.fn().mockImplementation(() => Promise.resolve());
const mockExitFullscreen = jest.fn().mockImplementation(() => Promise.resolve());

beforeAll(() => {
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    value: mockRequestFullscreen,
    writable: true,
  });
  Object.defineProperty(document, 'exitFullscreen', {
    value: mockExitFullscreen,
    writable: true,
  });
});

beforeEach(() => {
  mockRequestFullscreen.mockClear();
  mockExitFullscreen.mockClear();
  // Clear localStorage before each test
  localStorage.clear();
  // Set initial zoom to 1 (100%)
  localStorage.setItem('gridZoomFactor', '1');
});

describe('GridZoomControl', () => {
  // Helper function to render the component with a reset zoom level
  const renderComponent = () => {
    return render(
      <ViewModeProvider>
        <GridZoomProvider>
          <GridZoomControl />
        </GridZoomProvider>
      </ViewModeProvider>
    );
  };

  it('should render zoom controls', () => {
    renderComponent();
    
    // Check for zoom buttons - using indices since buttons have icons, not text
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4); // Zoom out, percentage, zoom in, fullscreen
    
    // Check for zoom factor display
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle zoom in button click', () => {
    renderComponent();
    
    // Find the zoom in button (third button)
    const buttons = screen.getAllByRole('button');
    const zoomInButton = buttons[2]; // Third button is zoom in
    const percentageButton = buttons[1]; // Middle button has percentage
    
    // Initial zoom should be 100%
    expect(percentageButton).toHaveTextContent('100');
    expect(percentageButton).toHaveTextContent('%');
    
    // Click zoom in button
    fireEvent.click(zoomInButton);
    
    // With our implementation, zoom increases by a step (5%)
    expect(percentageButton).toHaveTextContent('105%');
  });

  it('should handle zoom out button click', () => {
    renderComponent();
    
    // Find the zoom out button (first button)
    const buttons = screen.getAllByRole('button');
    const zoomOutButton = buttons[0]; // First button is zoom out
    const percentageButton = buttons[1]; // Middle button has percentage
    
    // Initial zoom should be 100%
    expect(percentageButton).toHaveTextContent('100');
    expect(percentageButton).toHaveTextContent('%');
    
    // Click zoom out button
    fireEvent.click(zoomOutButton);
    
    // With our implementation, zoom decreases by a step (5%)
    expect(percentageButton).toHaveTextContent('95%');
  });

  it('should handle reset button click', () => {
    renderComponent();
    
    // First zoom in to change from default
    const buttons = screen.getAllByRole('button');
    const zoomInButton = buttons[2];
    fireEvent.click(zoomInButton);
    
    // Verify it's not 100%
    const percentageButton = buttons[1];
    expect(percentageButton).toHaveTextContent('105%');
    
    // Then reset - click the middle button which shows the percentage
    const resetButton = buttons[1];
    fireEvent.click(resetButton);
    
    // Should reset to 100%
    expect(percentageButton).toHaveTextContent('100%');
  });

  it('should handle keyboard shortcuts', () => {
    renderComponent();
    
    // Initial state check
    const buttons = screen.getAllByRole('button');
    const percentageButton = buttons[1];
    expect(percentageButton).toHaveTextContent('100%');
    
    // Test zoom in with Ctrl + Plus
    fireEvent.keyDown(document, { key: '+', ctrlKey: true });
    
    // Check if zoom changed - we'll test for any change from 100%
    expect(percentageButton).not.toHaveTextContent('100%');
    
    // Save current zoom level
    const currentZoom = percentageButton.textContent || '';
    
    // Test zoom in with Meta + Plus (Mac)
    fireEvent.keyDown(document, { key: '+', metaKey: true });
    
    // Should have zoomed in further
    expect(percentageButton).not.toHaveTextContent(currentZoom);
    
    // Test reset with Ctrl + 0
    fireEvent.keyDown(document, { key: '0', ctrlKey: true });
    
    // Should be back to 100%
    expect(percentageButton).toHaveTextContent('100%');
    
    // Test zoom out with Meta + Minus (Mac)
    fireEvent.keyDown(document, { key: '-', metaKey: true });
    
    // Should have zoomed out
    expect(percentageButton).not.toHaveTextContent('100%');
  });

  it('should handle zoom limits', () => {
    renderComponent();
    
    const buttons = screen.getAllByRole('button');
    const zoomOutButton = buttons[0];
    const zoomInButton = buttons[2];
    const percentageButton = buttons[1];
    
    // Try to zoom out beyond minimum (0.3)
    for (let i = 0; i < 20; i++) {
      fireEvent.click(zoomOutButton);
    }
    
    // Minimum zoom is 30%
    expect(percentageButton).toHaveTextContent('30%');
    
    // Try to zoom in beyond maximum (3)
    for (let i = 0; i < 60; i++) {
      fireEvent.click(zoomInButton);
    }
    
    // Maximum zoom is 300%
    expect(percentageButton).toHaveTextContent('300%');
  });

  it('should handle fullscreen toggle', () => {
    renderComponent();
    
    const buttons = screen.getAllByRole('button');
    const fullscreenButton = buttons[3]; // Fourth button is fullscreen
    
    // Click fullscreen button
    fireEvent.click(fullscreenButton);
    
    // The button should now show the minimize icon
    // We can't test the actual fullscreen state as it's not supported in jsdom
  });
}); 
