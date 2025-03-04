import { AnyShape, Circle, Rectangle, Triangle, Line, Point } from '@/types/shapes';

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
      encodeURIComponent(shape.fill),
      encodeURIComponent(shape.stroke),
      shape.strokeWidth.toFixed(1)
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
      const fill = decodeURIComponent(parts[5]);
      const stroke = decodeURIComponent(parts[6]);
      const strokeWidth = parseFloat(parts[7]);
      
      // Common shape properties
      const commonProps = {
        id,
        type,
        position: { x, y },
        rotation,
        selected: false, // Always start unselected
        fill,
        stroke,
        strokeWidth
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
 * Updates the URL with encoded shapes and grid position without reloading the page
 */
export function updateUrlWithShapes(shapes: AnyShape[], gridPosition?: Point | null): void {
  const encodedShapes = encodeShapesToString(shapes);
  
  console.log('Updating URL with shapes:', shapes.length, 'shapes');
  console.log('Encoded shapes string length:', encodedShapes.length);
  
  // Create a new URL object based on the current URL
  const url = new URL(window.location.href);
  
  // Set or update the 'shapes' query parameter
  if (encodedShapes) {
    // Check if the URL would be too long
    const estimatedUrlLength = url.toString().length + encodedShapes.length + 10;
    if (estimatedUrlLength > 2000) {
      console.warn(`URL would be too long (${estimatedUrlLength} chars). Limiting shapes in URL.`);
      // Try with fewer shapes
      const reducedShapes = shapes.slice(0, Math.max(1, Math.floor(shapes.length / 2)));
      const reducedEncodedShapes = encodeShapesToString(reducedShapes);
      url.searchParams.set('shapes', reducedEncodedShapes);
      console.log(`Reduced to ${reducedShapes.length} shapes, new URL length: ${url.toString().length + reducedEncodedShapes.length + 10}`);
    } else {
      url.searchParams.set('shapes', encodedShapes);
    }
  } else {
    url.searchParams.delete('shapes');
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