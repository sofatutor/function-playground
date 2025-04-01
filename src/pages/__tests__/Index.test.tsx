import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from '@/context/ConfigContext';
import { ServiceProvider } from '@/providers/ServiceProvider';
import Index from '../Index';

// Mock the translate function
jest.mock('@/utils/translate', () => ({
  useTranslate: () => (key: string) => key
}));

const renderIndex = () => {
  return render(
    <BrowserRouter>
      <ConfigProvider>
        <ServiceProvider>
          <Index />
        </ServiceProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
};

describe('Index', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Default Tool Selection', () => {
    it('should select circle tool by default', () => {
      renderIndex();

      // Find the circle tool button
      const circleToolButton = screen.getByTestId('circle-tool');
      
      // Check that it has the active class
      expect(circleToolButton).toHaveClass('bg-primary');
      expect(circleToolButton).toHaveClass('text-primary-foreground');
    });

    it('should be in create mode with circle shape type', () => {
      renderIndex();

      // The select tool should not be active
      const selectToolButton = screen.getByTestId('select-tool');
      expect(selectToolButton).not.toHaveClass('bg-primary');

      // Other shape tools should not be active
      const rectangleToolButton = screen.getByTestId('rectangle-tool');
      const triangleToolButton = screen.getByTestId('triangle-tool');
      const lineToolButton = screen.getByTestId('line-tool');

      expect(rectangleToolButton).not.toHaveClass('bg-primary');
      expect(triangleToolButton).not.toHaveClass('bg-primary');
      expect(lineToolButton).not.toHaveClass('bg-primary');
    });
  });
}); 