import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { GridZoomProvider } from '@/contexts/GridZoomContext';
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

// Wrapper component to provide the GridZoomContext
const GridZoomControlWrapper = () => {
  return (
    <GridZoomProvider>
      <GridZoomControl />
    </GridZoomProvider>
  );
};

// Mock localStorage for testing
beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear();
  // Set initial zoom to 1 (100%)
  localStorage.setItem('gridZoomFactor', '1');
});

describe('GridZoomControl', () => {
  // Helper function to render the component with a reset zoom level
  const renderComponent = () => {
    return render(<GridZoomControlWrapper />);
  };

  it('should render zoom controls', () => {
    renderComponent();
    
    // Check for zoom buttons - using indices since buttons have icons, not text
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3); // Zoom out, percentage, zoom in
    
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
    
    // With our new implementation, zoom increases by 0.05 (5%)
    // Get the middle button which contains the percentage
    expect(percentageButton).toHaveTextContent(/\d+%/);
    // Verify it's not still 100%
    expect(percentageButton).not.toHaveTextContent('100');
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
    
    // With our new implementation, zoom decreases by 0.05 (5%)
    // Get the middle button which contains the percentage
    expect(percentageButton).toHaveTextContent(/\d+%/);
    // Verify it's not still 100%
    expect(percentageButton).not.toHaveTextContent('100');
  });

  it('should handle reset button click', () => {
    renderComponent();
    
    // First zoom in to change from default
    const buttons = screen.getAllByRole('button');
    const zoomInButton = buttons[2];
    fireEvent.click(zoomInButton);
    
    // Verify it's not 100%
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    
    // Then reset - get the middle button which shows the percentage
    const resetButton = buttons[1];
    fireEvent.click(resetButton);
    
    // Should reset to 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts', () => {
    renderComponent();
    
    // Test zoom in with Ctrl + Plus
    fireEvent.keyDown(window, { key: '+', ctrlKey: true });
    
    // Verify it's not 100%
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    
    // Test zoom out with Ctrl + Minus
    fireEvent.keyDown(window, { key: '-', ctrlKey: true });
    
    // Should be back to 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle zoom limits', () => {
    renderComponent();
    
    const buttons = screen.getAllByRole('button');
    const zoomOutButton = buttons[0];
    const zoomInButton = buttons[2];
    
    // Try to zoom out beyond minimum (0.3)
    for (let i = 0; i < 20; i++) {
      fireEvent.click(zoomOutButton);
    }
    
    // Minimum zoom is 30%
    expect(screen.getByText('30%')).toBeInTheDocument();
    
    // Try to zoom in beyond maximum (3)
    for (let i = 0; i < 60; i++) {
      fireEvent.click(zoomInButton);
    }
    
    // Maximum zoom is 300%
    expect(screen.getByText('300%')).toBeInTheDocument();
  });
}); 