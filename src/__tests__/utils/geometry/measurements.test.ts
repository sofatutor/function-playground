import { 
  convertToPixels, 
  convertFromPixels, 
  getShapeMeasurements 
} from '@/utils/geometry/measurements';
import { 
  createTestCircle, 
  createTestRectangle, 
  createTestTriangle, 
  createTestLine 
} from '../testUtils';
import { MeasurementUnit } from '@/types/shapes';

describe('Measurement Utilities', () => {
  // Constants for testing
  const PIXELS_PER_CM = 60;
  const PIXELS_PER_INCH = 152.4; // 1 inch = 2.54 cm, so 60 * 2.54 = 152.4

  describe('convertToPixels', () => {
    it('should convert cm to pixels correctly', () => {
      expect(convertToPixels(2, 'cm', PIXELS_PER_CM, PIXELS_PER_INCH)).toBe(120); // 2cm * 60px/cm = 120px
      expect(convertToPixels(0.5, 'cm', PIXELS_PER_CM, PIXELS_PER_INCH)).toBe(30); // 0.5cm * 60px/cm = 30px
    });

    it('should convert inches to pixels correctly', () => {
      expect(convertToPixels(1, 'in', PIXELS_PER_CM, PIXELS_PER_INCH)).toBe(152.4); // 1in * 152.4px/in = 152.4px
      expect(convertToPixels(0.5, 'in', PIXELS_PER_CM, PIXELS_PER_INCH)).toBe(76.2); // 0.5in * 152.4px/in = 76.2px
    });
  });

  describe('convertFromPixels', () => {
    it('should convert pixels to cm correctly', () => {
      expect(convertFromPixels(120, 'cm', PIXELS_PER_CM, PIXELS_PER_INCH)).toBe(2); // 120px / 60px/cm = 2cm
      expect(convertFromPixels(30, 'cm', PIXELS_PER_CM, PIXELS_PER_INCH)).toBe(0.5); // 30px / 60px/cm = 0.5cm
    });

    it('should convert pixels to inches correctly', () => {
      expect(convertFromPixels(152.4, 'in', PIXELS_PER_CM, PIXELS_PER_INCH)).toBe(1); // 152.4px / 152.4px/in = 1in
      expect(convertFromPixels(76.2, 'in', PIXELS_PER_CM, PIXELS_PER_INCH)).toBe(0.5); // 76.2px / 152.4px/in = 0.5in
    });
  });

  describe('getShapeMeasurements', () => {
    // Create a mock conversion function for testing
    const mockConvertFromPixels = (pixels: number): number => pixels / PIXELS_PER_CM;

    describe('Circle measurements', () => {
      it('should calculate circle measurements correctly', () => {
        const circle = createTestCircle({ radius: 60 }); // 60px radius = 1cm radius
        const measurements = getShapeMeasurements(circle, mockConvertFromPixels);

        // Expected values:
        // radius: 60px / 60px/cm = 1cm
        // diameter: 2 * radius = 2cm
        // circumference: π * diameter = π * 2cm ≈ 6.28cm
        // area: π * radius² = π * 1² = π cm² ≈ 3.14cm²
        
        expect(measurements.radius).toBeCloseTo(1, 2);
        expect(measurements.diameter).toBeCloseTo(2, 2);
        expect(measurements.circumference).toBeCloseTo(6.28, 2);
        expect(measurements.area).toBeCloseTo(3.14, 2);
      });
    });

    describe('Rectangle measurements', () => {
      it('should calculate rectangle measurements correctly', () => {
        const rectangle = createTestRectangle({ width: 120, height: 60 }); // 120px width = 2cm, 60px height = 1cm
        const measurements = getShapeMeasurements(rectangle, mockConvertFromPixels);

        // Expected values:
        // width: 120px / 60px/cm = 2cm
        // height: 60px / 60px/cm = 1cm
        // perimeter: 2 * (width + height) = 2 * (2cm + 1cm) = 2 * 3cm = 6cm
        // area: width * height = 2cm * 1cm = 2cm²
        
        expect(measurements.width).toBeCloseTo(2, 2);
        expect(measurements.height).toBeCloseTo(1, 2);
        expect(measurements.perimeter).toBeCloseTo(6, 2);
        expect(measurements.area).toBeCloseTo(2, 2);
      });
    });

    describe('Triangle measurements', () => {
      it('should calculate triangle measurements correctly', () => {
        // Create a 3-4-5 right triangle (scaled by 30px = 0.5cm)
        const triangle = createTestTriangle({
          points: [
            { x: 0, y: 0 },    // First point at origin
            { x: 120, y: 0 },  // Second point 120px (2cm) to the right
            { x: 0, y: 90 }    // Third point 90px (1.5cm) down
          ],
          position: { x: 0, y: 0 } // Position at origin for simplicity
        });
        
        const measurements = getShapeMeasurements(triangle, mockConvertFromPixels);

        // Expected values for a 3-4-5 triangle (scaled to 2cm-1.5cm-2.5cm):
        // side1 (between points 0 and 1): 120px / 60px/cm = 2cm
        // side2 (between points 1 and 2): sqrt(120² + 90²) = sqrt(22500) = 150px / 60px/cm = 2.5cm
        // side3 (between points 2 and 0): 90px / 60px/cm = 1.5cm
        // perimeter: side1 + side2 + side3 = 2cm + 2.5cm + 1.5cm = 6cm
        // area: 0.5 * base * height = 0.5 * 2cm * 1.5cm = 1.5cm²
        
        expect(measurements.side1).toBeCloseTo(2, 2);
        expect(measurements.side2).toBeCloseTo(2.5, 2);
        expect(measurements.side3).toBeCloseTo(1.5, 2);
        expect(measurements.perimeter).toBeCloseTo(6, 2);
        expect(measurements.area).toBeCloseTo(1.5, 2);
        
        // The angles should match the implementation's calculation
        // For a triangle with sides 2, 2.5, and 1.5, the angles are approximately:
        expect(measurements.angle1).toBeCloseTo(53, 0); // Angle opposite to side1 (2cm)
        expect(measurements.angle2).toBeCloseTo(90, 0); // Angle opposite to side2 (2.5cm) - this is the right angle
        expect(measurements.angle3).toBeCloseTo(37, 0); // Angle opposite to side3 (1.5cm)
      });
    });

    describe('Line measurements', () => {
      it('should calculate line measurements correctly', () => {
        const line = createTestLine({
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 60, y: 60 },
          length: 84.85 // sqrt(60² + 60²) = 84.85px
        });
        
        const measurements = getShapeMeasurements(line, mockConvertFromPixels);

        // Expected values:
        // length: 84.85px / 60px/cm = 1.41cm
        // angle: atan2(60, 60) * (180/π) = 45°
        
        expect(measurements.length).toBeCloseTo(1.41, 2);
        expect(measurements.angle).toBeCloseTo(45, 0);
      });

      it('should calculate horizontal line angle correctly', () => {
        const line = createTestLine({
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 60, y: 0 },
          length: 60
        });
        
        const measurements = getShapeMeasurements(line, mockConvertFromPixels);
        expect(measurements.angle).toBeCloseTo(0, 0);
      });

      it('should calculate vertical line angle correctly', () => {
        const line = createTestLine({
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 0, y: 60 },
          length: 60
        });
        
        const measurements = getShapeMeasurements(line, mockConvertFromPixels);
        expect(measurements.angle).toBeCloseTo(90, 0);
      });

      it('should normalize angles to 0-360 degrees', () => {
        const line = createTestLine({
          startPoint: { x: 60, y: 0 },
          endPoint: { x: 0, y: 60 },
          length: 84.85
        });
        
        const measurements = getShapeMeasurements(line, mockConvertFromPixels);
        // This line goes from top-right to bottom-left, so angle should be 135°
        expect(measurements.angle).toBeCloseTo(135, 0);
      });
    });
  });
}); 