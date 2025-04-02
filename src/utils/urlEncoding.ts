import { AnyShape, Circle, Rectangle, Triangle, Line, Point } from '@/types/shapes';
import { Formula, FormulaType } from '@/types/formula';
import { generateFormulaId } from '@/utils/formulaUtils';

/**
 * Encodes an array of shapes into a URL-friendly string
 * Format: shape1|shape2|shape3
 * Where each shape is encoded as: type,id,x,y,rotation,fill,stroke,strokeWidth,{type-specific-properties}
 */
export function encodeShapesToString(shapes: AnyShape[]): string {
  if (!shapes.length) return '';
  
  // Limit the number of shapes to encode to prevent URL from getting too long
  const MAX_SHAPES = 50;
  const shapesToEncode = shapes.length > MAX_SHAPES ? shapes.slice(0, MAX_SHAPES) : shapes;
  
  if (shapes.length > MAX_SHAPES) {
    console.warn(`Too many shapes to encode in URL (${shapes.length}). Limiting to ${MAX_SHAPES}.`);
  }
  
  return shapesToEncode.map(shape => {
    // Common properties for all shapes
    const commonProps = [
      shape.type,
      shape.id,
      shape.position.x.toFixed(1), // Reduce precision to save space
      shape.position.y.toFixed(1),
      shape.rotation.toFixed(1),
      encodeURIComponent(shape.fillColor),
      encodeURIComponent(shape.strokeColor),
      shape.opacity.toFixed(1)
    ];
    
    // Add type-specific properties
    let typeSpecificProps: string[] = [];
    
    // Declare variables outside of switch cases to avoid linter errors
    let circle: Circle;
    let rect: Rectangle;
    let triangle: Triangle;
    let line: Line;
    
    switch (shape.type) {
      case 'circle':
        circle = shape as Circle;
        typeSpecificProps = [circle.radius.toFixed(1)];
        break;
        
      case 'rectangle':
        rect = shape as Rectangle;
        typeSpecificProps = [
          rect.width.toFixed(1),
          rect.height.toFixed(1)
        ];
        break;
        
      case 'triangle':
        triangle = shape as Triangle;
        // Encode all three points
        typeSpecificProps = [
          ...triangle.points.flatMap(p => [
            p.x.toFixed(1),
            p.y.toFixed(1)
          ])
        ];
        break;
        
      case 'line':
        line = shape as Line;
        typeSpecificProps = [
          line.startPoint.x.toFixed(1),
          line.startPoint.y.toFixed(1),
          line.endPoint.x.toFixed(1),
          line.endPoint.y.toFixed(1),
          line.length.toFixed(1)
        ];
        break;
    }
    
    // Join all properties with commas
    return [...commonProps, ...typeSpecificProps].join(',');
  }).join('|');
}

/**
 * Decodes a URL-friendly string into an array of shapes
 */
export function decodeStringToShapes(encodedString: string): AnyShape[] {
  if (!encodedString) return [];
  
  try {
    const shapeStrings = encodedString.split('|');
    
    return shapeStrings.map(shapeStr => {
      const parts = shapeStr.split(',');
      
      // Extract common properties
      const type = parts[0] as AnyShape['type'];
      const id = parts[1];
      const x = parseFloat(parts[2]);
      const y = parseFloat(parts[3]);
      const rotation = parseFloat(parts[4]);
      const fillColor = decodeURIComponent(parts[5]);
      const strokeColor = decodeURIComponent(parts[6]);
      const opacity = parseFloat(parts[7]);
      
      // Common shape properties
      const commonProps = {
        id,
        type,
        position: { x, y },
        rotation,
        fillColor,
        strokeColor,
        opacity
      };
      
      // Create the specific shape type
      switch (type) {
        case 'circle':
          return {
            ...commonProps,
            type: 'circle',
            radius: parseFloat(parts[8])
          } as Circle;
          
        case 'rectangle':
          return {
            ...commonProps,
            type: 'rectangle',
            width: parseFloat(parts[8]),
            height: parseFloat(parts[9])
          } as Rectangle;
          
        case 'triangle':
          return {
            ...commonProps,
            type: 'triangle',
            points: [
              { x: parseFloat(parts[8]), y: parseFloat(parts[9]) },
              { x: parseFloat(parts[10]), y: parseFloat(parts[11]) },
              { x: parseFloat(parts[12]), y: parseFloat(parts[13]) }
            ] as [{ x: number, y: number }, { x: number, y: number }, { x: number, y: number }]
          } as Triangle;
          
        case 'line':
          return {
            ...commonProps,
            type: 'line',
            startPoint: { x: parseFloat(parts[8]), y: parseFloat(parts[9]) },
            endPoint: { x: parseFloat(parts[10]), y: parseFloat(parts[11]) },
            length: parseFloat(parts[12])
          } as Line;
          
        default:
          throw new Error(`Unknown shape type: ${type}`);
      }
    });
  } catch (error) {
    console.error('Error decoding shapes from URL:', error);
    return [];
  }
}

/**
 * Encodes a grid position into a URL-friendly string
 */
export function encodeGridPosition(position: Point): string {
  return `${position.x.toFixed(1)},${position.y.toFixed(1)}`;
}

/**
 * Decodes a URL-friendly string into a grid position
 */
export function decodeGridPosition(encodedPosition: string): Point | null {
  if (!encodedPosition) return null;
  
  try {
    const [x, y] = encodedPosition.split(',').map(parseFloat);
    return { x, y };
  } catch (error) {
    console.error('Error decoding grid position from URL:', error);
    return null;
  }
}

/**
 * Encodes an array of formulas into a URL-friendly string
 * Format: formula1|formula2|formula3
 * Where each formula is encoded as: type,id,expression,color,strokeWidth,xRangeMin,xRangeMax,samples,scaleFactor
 */
export function encodeFormulasToString(formulas: Formula[]): string {
  if (!formulas.length) return '';
  
  // Limit the number of formulas to encode to prevent URL from getting too long
  const MAX_FORMULAS = 10;
  const formulasToEncode = formulas.length > MAX_FORMULAS ? formulas.slice(0, MAX_FORMULAS) : formulas;
  
  if (formulas.length > MAX_FORMULAS) {
    console.warn(`Too many formulas to encode in URL (${formulas.length}). Limiting to ${MAX_FORMULAS}.`);
  }
  
  return formulasToEncode.map(formula => {
    // Common properties for all formulas
    const props = [
      formula.type,
      formula.id,
      encodeURIComponent(formula.expression),
      encodeURIComponent(formula.color),
      formula.strokeWidth.toFixed(1),
      formula.xRange[0].toFixed(0),
      formula.xRange[1].toFixed(0),
      formula.samples.toString(),
      formula.scaleFactor.toFixed(2)
    ];
    
    // Add type-specific properties
    if (formula.type === 'parametric' || formula.type === 'polar') {
      if (formula.tRange) {
        props.push(formula.tRange[0].toFixed(0), formula.tRange[1].toFixed(0));
      }
    }
    
    // Join all properties with commas
    return props.join(',');
  }).join('|');
}

/**
 * Decodes a URL-friendly string into an array of formulas
 */
export function decodeStringToFormulas(encodedString: string): Formula[] {
  if (!encodedString) return [];
  
  try {
    const formulaStrings = encodedString.split('|');
    
    return formulaStrings.map(formulaStr => {
      const parts = formulaStr.split(',');
      
      // Extract common properties
      const type = parts[0] as FormulaType;
      const id = parts[1] || generateFormulaId(); // Generate a new ID if none exists
      const expression = decodeURIComponent(parts[2]);
      const color = decodeURIComponent(parts[3]);
      const strokeWidth = parseFloat(parts[4]);
      const xRangeMin = parseFloat(parts[5]);
      const xRangeMax = parseFloat(parts[6]);
      const samples = parseInt(parts[7], 10);
      const scaleFactor = parseFloat(parts[8]);
      
      // Common formula properties
      const commonProps: Formula = {
        id,
        type,
        expression,
        color,
        strokeWidth,
        xRange: [xRangeMin, xRangeMax],
        samples,
        scaleFactor
      };
      
      // Add type-specific properties
      if (type === 'parametric' || type === 'polar') {
        if (parts.length >= 11) {
          commonProps.tRange = [parseFloat(parts[9]), parseFloat(parts[10])];
        }
      }
      
      return commonProps;
    });
  } catch (error) {
    console.error('Error decoding formulas from URL:', error);
    return [];
  }
}

/**
 * Updates the URL with encoded shapes, formulas, grid position, and tool selection without reloading the page
 */
export function updateUrlWithData(
  shapes: AnyShape[], 
  formulas: Formula[], 
  gridPosition?: Point | null,
  tool?: string | null
): void {
  const encodedShapes = encodeShapesToString(shapes);
  const encodedFormulas = encodeFormulasToString(formulas);
  
  console.log('Updating URL with shapes:', shapes.length, 'shapes');
  console.log('Updating URL with formulas:', formulas.length, 'formulas');
  
  // Create a new URL object based on the current URL
  const url = new URL(window.location.href);
  
  // Set or update the 'shapes' query parameter
  if (encodedShapes) {
    // Check if the URL would be too long
    const estimatedUrlLength = url.toString().length + encodedShapes.length + encodedFormulas.length + 20;
    if (estimatedUrlLength > 2000) {
      console.warn(`URL would be too long (${estimatedUrlLength} chars). Limiting shapes in URL.`);
      // Try with fewer shapes
      const reducedShapes = shapes.slice(0, Math.max(1, Math.floor(shapes.length / 2)));
      const reducedEncodedShapes = encodeShapesToString(reducedShapes);
      url.searchParams.set('shapes', reducedEncodedShapes);
    } else {
      url.searchParams.set('shapes', encodedShapes);
    }
  } else {
    url.searchParams.delete('shapes');
  }
  
  // Set or update the 'formulas' query parameter
  if (encodedFormulas) {
    url.searchParams.set('formulas', encodedFormulas);
  } else {
    url.searchParams.delete('formulas');
  }
  
  // Set or update the 'grid' query parameter if provided
  if (gridPosition) {
    const encodedGrid = encodeGridPosition(gridPosition);
    console.log('Updating grid position in URL:', gridPosition, 'encoded as:', encodedGrid);
    url.searchParams.set('grid', encodedGrid);
  } else {
    // Remove the grid parameter if gridPosition is null
    url.searchParams.delete('grid');
    console.log('Removing grid position from URL');
  }

  // Set or update the 'tool' query parameter if provided
  if (tool) {
    url.searchParams.set('tool', tool);
    console.log('Updating tool in URL:', tool);
  } else {
    url.searchParams.delete('tool');
    console.log('Removing tool from URL');
  }
  
  // Update the URL without reloading the page
  window.history.pushState({}, '', url.toString());
  console.log('Updated URL:', url.toString());
}

/**
 * Gets shapes from the URL if they exist
 */
export function getShapesFromUrl(): AnyShape[] | null {
  const url = new URL(window.location.href);
  const encodedShapes = url.searchParams.get('shapes');
  
  console.log('Getting shapes from URL, encoded shapes present:', !!encodedShapes);
  if (encodedShapes) {
    console.log('Encoded shapes length:', encodedShapes.length);
  }
  
  if (!encodedShapes) return null;
  
  const shapes = decodeStringToShapes(encodedShapes);
  console.log('Decoded shapes from URL:', shapes.length, 'shapes');
  return shapes;
}

/**
 * Gets formulas from the URL if they exist
 */
export function getFormulasFromUrl(): Formula[] | null {
  const url = new URL(window.location.href);
  const encodedFormulas = url.searchParams.get('formulas');
  
  console.log('Getting formulas from URL, encoded formulas present:', !!encodedFormulas);
  
  if (!encodedFormulas) return null;
  
  const formulas = decodeStringToFormulas(encodedFormulas);
  console.log('Decoded formulas from URL:', formulas.length, 'formulas');
  return formulas;
}

/**
 * Gets grid position from the URL if it exists
 */
export function getGridPositionFromUrl(): Point | null {
  const url = new URL(window.location.href);
  const encodedPosition = url.searchParams.get('grid');
  
  console.log('Getting grid position from URL, encoded position present:', !!encodedPosition);
  
  if (!encodedPosition) return null;
  
  const position = decodeGridPosition(encodedPosition);
  console.log('Decoded grid position from URL:', position);
  return position;
}

/**
 * Gets the selected tool from the URL if it exists
 */
export function getToolFromUrl(): string | null {
  const url = new URL(window.location.href);
  const tool = url.searchParams.get('tool');
  
  console.log('Getting tool from URL, tool present:', !!tool);
  if (tool) {
    console.log('Tool from URL:', tool);
  }
  
  return tool;
} 