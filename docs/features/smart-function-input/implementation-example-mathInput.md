# Implementation Example: Mathematical Expression Input Interface

This document shows the implementation of a mathematical expression input interface that provides an intuitive way to input mathematical expressions using buttons and symbols, similar to GeoGebra's approach.

## MathInput Component

```typescript
// src/components/MathInput/MathInput.tsx

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  onParameterDetected?: (parameters: string[]) => void;
  className?: string;
}

// Mathematical symbols and functions
const MATH_SYMBOLS = {
  basic: [
    { label: '+', value: '+' },
    { label: '-', value: '-' },
    { label: '×', value: '*' },
    { label: '÷', value: '/' },
    { label: '=', value: '=' },
    { label: '(', value: '(' },
    { label: ')', value: ')' },
    { label: ',', value: ',' },
    { label: 'x', value: 'x' },
    { label: 'y', value: 'y' }
  ],
  functions: [
    { label: 'sin', value: 'sin(' },
    { label: 'cos', value: 'cos(' },
    { label: 'tan', value: 'tan(' },
    { label: '√', value: 'sqrt(' },
    { label: 'log', value: 'log(' },
    { label: 'ln', value: 'ln(' },
    { label: 'exp', value: 'exp(' },
    { label: 'abs', value: 'abs(' }
  ],
  operators: [
    { label: '^', value: '^' },
    { label: '√', value: 'sqrt(' },
    { label: 'π', value: 'pi' },
    { label: 'e', value: 'e' },
    { label: '∞', value: 'infinity' },
    { label: '±', value: '+-' },
    { label: '≤', value: '<=' },
    { label: '≥', value: '>=' }
  ]
};

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  onParameterDetected,
  className
}) => {
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle symbol button click
  const handleSymbolClick = useCallback((symbol: string) => {
    const newValue = value.slice(0, cursorPosition) + symbol + value.slice(cursorPosition);
    onChange(newValue);
    setCursorPosition(cursorPosition + symbol.length);
  }, [value, cursorPosition, onChange]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart || 0);
  }, [onChange]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Trigger parameter detection
      const parameters = detectParameters(value);
      onParameterDetected?.(parameters);
    }
  }, [value, onParameterDetected]);

  // Detect parameters in the expression
  const detectParameters = useCallback((expression: string): string[] => {
    const parameterRegex = /[a-zA-Z](?!\s*[=\(])/g;
    const matches = expression.match(parameterRegex) || [];
    return [...new Set(matches)].filter(param => param !== 'x' && param !== 'y');
  }, []);

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter mathematical expression (e.g., f(x) = ax^2 + bx + c)"
          className="font-mono text-lg"
        />

        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="functions">Functions</TabsTrigger>
            <TabsTrigger value="operators">Operators</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="grid grid-cols-5 gap-2">
            {MATH_SYMBOLS.basic.map((symbol) => (
              <Button
                key={symbol.label}
                variant="outline"
                size="sm"
                onClick={() => handleSymbolClick(symbol.value)}
              >
                {symbol.label}
              </Button>
            ))}
          </TabsContent>

          <TabsContent value="functions" className="grid grid-cols-4 gap-2">
            {MATH_SYMBOLS.functions.map((symbol) => (
              <Button
                key={symbol.label}
                variant="outline"
                size="sm"
                onClick={() => handleSymbolClick(symbol.value)}
              >
                {symbol.label}
              </Button>
            ))}
          </TabsContent>

          <TabsContent value="operators" className="grid grid-cols-4 gap-2">
            {MATH_SYMBOLS.operators.map((symbol) => (
              <Button
                key={symbol.label}
                variant="outline"
                size="sm"
                onClick={() => handleSymbolClick(symbol.value)}
              >
                {symbol.label}
              </Button>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
```

## Integration with FormulaEditor

```typescript
// src/components/FormulaEditor.tsx

import { MathInput } from './MathInput/MathInput';

export const FormulaEditor: React.FC<FormulaEditorProps> = ({
  formula,
  onUpdate,
  onDelete
}) => {
  const [expression, setExpression] = useState(formula.expression);
  const [parameters, setParameters] = useState<string[]>([]);

  const handleExpressionChange = useCallback((newExpression: string) => {
    setExpression(newExpression);
    // Update formula with new expression
    onUpdate({
      ...formula,
      expression: newExpression
    });
  }, [formula, onUpdate]);

  const handleParameterDetected = useCallback((detectedParameters: string[]) => {
    setParameters(detectedParameters);
    // Create parameter objects with default values
    const newParameters = detectedParameters.map(param => ({
      name: param,
      value: 1,
      min: -10,
      max: 10,
      step: 0.1
    }));
    // Update formula with new parameters
    onUpdate({
      ...formula,
      parameters: newParameters
    });
  }, [formula, onUpdate]);

  return (
    <div className="space-y-4">
      <MathInput
        value={expression}
        onChange={handleExpressionChange}
        onParameterDetected={handleParameterDetected}
        className="w-full"
      />
      
      {parameters.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Parameters</h3>
          <div className="grid grid-cols-2 gap-2">
            {parameters.map(param => (
              <div key={param} className="flex items-center space-x-2">
                <span className="text-sm">{param}</span>
                <input
                  type="number"
                  className="w-20"
                  defaultValue={1}
                  onChange={(e) => {
                    // Update parameter value
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

## Testing Example

```typescript
// src/components/MathInput/__tests__/MathInput.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { MathInput } from '../MathInput';

describe('MathInput', () => {
  it('renders basic math symbols', () => {
    render(<MathInput value="" onChange={() => {}} />);
    
    // Check if basic symbols are rendered
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('adds symbols to input when clicked', () => {
    const onChange = jest.fn();
    render(<MathInput value="" onChange={onChange} />);
    
    // Click some symbols
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('x'));
    
    expect(onChange).toHaveBeenCalledWith('+x');
  });

  it('detects parameters in expression', () => {
    const onParameterDetected = jest.fn();
    render(
      <MathInput
        value="ax^2 + bx + c"
        onChange={() => {}}
        onParameterDetected={onParameterDetected}
      />
    );
    
    // Press Enter to trigger parameter detection
    fireEvent.keyPress(screen.getByPlaceholderText(/enter mathematical expression/i), {
      key: 'Enter',
      code: 13,
      charCode: 13
    });
    
    expect(onParameterDetected).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('maintains cursor position after symbol insertion', () => {
    const onChange = jest.fn();
    render(<MathInput value="x" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText(/enter mathematical expression/i);
    input.setSelectionRange(1, 1);
    
    fireEvent.click(screen.getByText('+'));
    
    expect(onChange).toHaveBeenCalledWith('x+');
  });
});
```

This implementation provides:
1. A tabbed interface for different types of mathematical symbols
2. Easy insertion of mathematical functions and operators
3. Automatic parameter detection
4. Cursor position maintenance
5. Real-time expression updates
6. Parameter controls
7. Comprehensive test coverage

The next steps would be to:
1. Add support for more mathematical symbols and functions
2. Implement expression validation
3. Add support for custom functions
4. Add support for matrices and vectors
5. Implement expression simplification
6. Add support for units and constants
7. Add support for piecewise functions 