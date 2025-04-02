import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import FunctionSidebar from '@/components/Formula/FunctionSidebar';
import { Formula } from '@/types/formula';
import { MeasurementUnit } from '@/types/shapes';
import { ConfigProvider } from '@/context/ConfigContext';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Mock ConfigContext
jest.mock('@/context/ConfigContext', () => ({
  ...jest.requireActual('@/context/ConfigContext'),
  useConfig: () => ({
    language: 'en',
    openaiApiKey: '',
    loggingEnabled: false,
    isGlobalConfigModalOpen: false,
    isToolbarVisible: true,
    pixelsPerUnit: 60,
    measurementUnit: 'cm',
    isComponentConfigModalOpen: false,
    setLanguage: jest.fn(),
    setOpenaiApiKey: jest.fn(),
    setLoggingEnabled: jest.fn(),
    setGlobalConfigModalOpen: jest.fn(),
    setToolbarVisible: jest.fn(),
    setPixelsPerUnit: jest.fn(),
    setMeasurementUnit: jest.fn(),
    setComponentConfigModalOpen: jest.fn(),
    isConfigModalOpen: false,
    setConfigModalOpen: jest.fn(),
  }),
}));

describe('FunctionSidebar', () => {
  const mockFormula: Formula = {
    id: 'test-formula',
    type: 'function',
    expression: 'x^2',
    color: '#000000',
    strokeWidth: 2,
    xRange: [-10, 10],
    samples: 100,
    scaleFactor: 1,
  };

  const mockProps = {
    formulas: [mockFormula],
    selectedFormula: null,
    onAddFormula: jest.fn(),
    onDeleteFormula: jest.fn(),
    onSelectFormula: jest.fn(),
    onUpdateFormula: jest.fn(),
    measurementUnit: 'cm' as MeasurementUnit,
  };

  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders without crashing', () => {
    render(<FunctionSidebar {...mockProps} />);
    expect(screen.getByText('formula.title')).toBeInTheDocument();
  });

  it('renders formula list', () => {
    render(<FunctionSidebar {...mockProps} />);
    expect(screen.getByText('x^2')).toBeInTheDocument();
  });

  it('calls onAddFormula when add button is clicked', () => {
    render(<FunctionSidebar {...mockProps} />);
    const addButton = screen.getByTitle('formula.add');
    fireEvent.click(addButton);
    expect(mockProps.onAddFormula).toHaveBeenCalled();
  });

  it('calls onDeleteFormula when delete button is clicked', () => {
    render(<FunctionSidebar {...mockProps} />);
    const deleteButton = screen.getByTitle('formula.delete');
    fireEvent.click(deleteButton);
    expect(mockProps.onDeleteFormula).toHaveBeenCalledWith(mockFormula.id);
  });

  it('calls onSelectFormula when formula is clicked', () => {
    render(<FunctionSidebar {...mockProps} />);
    const formulaButton = screen.getByText('x^2');
    fireEvent.click(formulaButton);
    expect(mockProps.onSelectFormula).toHaveBeenCalledWith(mockFormula);
  });

  it('shows selected formula with different styling', () => {
    render(
      <FunctionSidebar
        {...mockProps}
        selectedFormula={mockFormula}
      />
    );
    const formulaContainer = screen.getByText('x^2').closest('div').parentElement;
    expect(formulaContainer).toHaveClass('bg-accent');
    expect(formulaContainer).toHaveClass('border-accent-foreground');
  });
}); 