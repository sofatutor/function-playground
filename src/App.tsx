import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "./context/ConfigContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import React, { useState, useEffect } from 'react';
import UnitSelector from './components/UnitSelector';
import GeometryCanvas from './components/GeometryCanvas';
import { MeasurementUnit, AnyShape, OperationMode, Point } from '@/types/shapes';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('cm');
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<OperationMode>('select');

  // Log when measurement unit changes
  useEffect(() => {
    console.log('App: Measurement unit changed to:', measurementUnit);
  }, [measurementUnit]);

  const handleUnitChange = (unit: MeasurementUnit) => {
    console.log('Unit changed to:', unit, typeof unit); // Log the type as well
    setMeasurementUnit(unit);
    // Log the state after update (this will be one render behind due to React's state updates)
    setTimeout(() => {
      console.log('After state update, measurementUnit is:', measurementUnit);
    }, 0);
  };

  const handleShapeSelect = (id: string | null) => {
    setSelectedShapeId(id);
  };

  const handleShapeCreate = (start: Point, end: Point): string => {
    // Generate a unique ID for the new shape
    const newId = `shape-${Date.now()}`;
    
    // Create a new shape based on start and end points
    // This is a simplified implementation - you'll need to adapt it based on your shape types
    const newShape: AnyShape = {
      id: newId,
      type: 'rectangle',
      position: start,
      width: end.x - start.x,
      height: end.y - start.y,
      rotation: 0,
      selected: false,
      fill: '#e0e0e0',
      stroke: '#000000',
      strokeWidth: 1
    };
    
    setShapes([...shapes, newShape]);
    return newId;
  };

  const handleShapeMove = (id: string, newPosition: Point) => {
    setShapes(shapes.map(shape => 
      shape.id === id ? { ...shape, position: newPosition } : shape
    ));
  };

  const handleShapeResize = (id: string, factor: number) => {
    setShapes(shapes.map(shape => {
      if (shape.id === id) {
        if ('width' in shape && 'height' in shape) {
          return {
            ...shape,
            width: shape.width * factor,
            height: shape.height * factor
          };
        } else if ('radius' in shape) {
          return {
            ...shape,
            radius: shape.radius * factor
          };
        }
      }
      return shape;
    }));
  };

  const handleShapeRotate = (id: string, angle: number) => {
    setShapes(shapes.map(shape => 
      shape.id === id ? { ...shape, rotation: angle } : shape
    ));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConfigProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ConfigProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
