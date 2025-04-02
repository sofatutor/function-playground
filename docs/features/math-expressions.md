# Math-Like Expressions

## Overview

This feature enhances the user experience by displaying mathematical expressions in a more familiar and readable format. Instead of using JavaScript notation (e.g., `3*x+9`), expressions will be shown in a traditional mathematical notation (e.g., `3x + 9`). This makes the application more intuitive for users with mathematical backgrounds and reduces confusion between programming and mathematical notations.

## User Stories

1. As a user, I want to see mathematical expressions in a familiar format that matches textbooks and mathematical literature.
2. As a user, I want to input expressions using either JavaScript or mathematical notation for flexibility.
3. As a user, I want to see proper mathematical formatting for exponents, fractions, and special functions.
4. As a user, I want consistent mathematical notation across the entire application (formula editor, tooltips, measurements).

## Implementation Checklist

<details>
<summary>[✓] Expression Parser Updates</summary>

- [✓] Create a bidirectional converter between JS and math notation
- [✓] Handle basic operations (multiplication, division, exponents)
- [✓] Support special functions (sqrt, sin, cos, tan, etc.)
- [✓] Implement fraction notation conversion
- [✓] Add validation for both notation formats
</details>

<details>
<summary>[ ] Formula Editor Updates</summary>

- [ ] Add real-time preview of mathematical notation
- [ ] Implement syntax highlighting for math expressions
- [ ] Add autocomplete suggestions in mathematical format
- [ ] Create toggle between JS and math notation input modes
- [ ] Update error messages to reference math notation
</details>

<details>
<summary>[ ] UI Component Updates</summary>

- [ ] Update FormulaDisplay component to use math notation
- [ ] Add MathRenderer component for consistent rendering
- [ ] Implement LaTeX-style rendering for complex expressions
- [ ] Update tooltips to show expressions in math notation
- [ ] Add copy buttons for both notation formats
</details>

<details>
<summary>[ ] Documentation Updates</summary>

- [ ] Update user documentation with new notation examples
- [ ] Add notation guide and cheat sheet
- [ ] Document supported mathematical symbols
- [ ] Create migration guide for existing formulas
</details>

<details>
<summary>[-] Testing</summary>

- [✓] Unit tests for notation conversion
- [✓] Tests for special cases and edge cases
- [ ] Component tests for FormulaDisplay
- [ ] Integration tests for FormulaEditor
- [ ] E2E tests for formula input and display
</details>

## Technical Details

### Expression Conversion

```typescript
interface ExpressionConverter {
  // Convert from JS notation to math notation
  toMathNotation(jsExpr: string): string;
  
  // Convert from math notation to JS notation
  toJSNotation(mathExpr: string): string;
  
  // Validate expression in either notation
  validate(expr: string, format: 'js' | 'math'): boolean;
}

// Example conversions:
// JS -> Math
// 2*x -> 2x
// x**2 -> x²
// Math.sqrt(x) -> √x
// Math.sin(x) -> sin(x)
```

### UI Components

```typescript
interface MathRendererProps {
  expression: string;
  format: 'js' | 'math';
  inline?: boolean;
  className?: string;
}

interface FormulaDisplayProps extends MathRendererProps {
  editable?: boolean;
  onExpressionChange?: (expr: string, format: 'js' | 'math') => void;
}
```

### Expression Format Examples

| Operation    | JS Notation    | Math Notation |
|-------------|----------------|---------------|
| Multiply    | `3*x`         | `3x`         |
| Power       | `x**2`        | `x²`         |
| Square Root | `Math.sqrt(x)` | `√x`         |
| Fraction    | `(x+1)/(x-1)` | `(x+1)/(x-1)`|
| Functions   | `Math.sin(x)`  | `sin(x)`     |

### Key UX Considerations

1. Maintain backward compatibility with JS notation
2. Provide clear visual feedback for notation conversion
3. Handle copy/paste operations intelligently
4. Support keyboard shortcuts for common mathematical symbols
5. Ensure consistent rendering across different screen sizes

## Dependencies

- MathJax or KaTeX for mathematical rendering
- CodeMirror or Monaco Editor for syntax highlighting
- Custom parser for notation conversion
- FormulaEditor component updates
- MathRenderer component (new)

## Implementation Examples

Example implementation files will be created at:
- `docs/implementation-example-MathRenderer.md`
- `docs/implementation-example-ExpressionConverter.md`
- `docs/implementation-example-FormulaEditor.md`

### Example Expression Parsing

```typescript
// Example of how the parser will handle different notations
const examples = {
  multiplication: {
    js: '2*x*y',
    math: '2xy'
  },
  exponents: {
    js: 'x**2 + y**3',
    math: 'x² + y³'
  },
  functions: {
    js: 'Math.sin(x)*Math.sqrt(y)',
    math: 'sin(x)√y'
  },
  fractions: {
    js: '(x+1)/(y-1)',
    math: '(x+1)/(y-1)'
  }
};
``` 