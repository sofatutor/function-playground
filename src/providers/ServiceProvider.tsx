import React, { createContext, useContext } from 'react';
import { ShapeServiceFactory } from '@/services/ShapeService';
import { DefaultShapeServiceFactory } from '@/services/ShapeServiceFactory';
import { CircleServiceImpl } from '@/services/implementations/CircleServiceImpl';
import { RectangleServiceImpl } from '@/services/implementations/RectangleServiceImpl';
import { TriangleServiceImpl } from '@/services/implementations/TriangleServiceImpl';
import { LineServiceImpl } from '@/services/implementations/LineServiceImpl';

// Create a context for the service factory
const ServiceFactoryContext = createContext<ShapeServiceFactory | null>(null);

// Create a hook to use the service factory
export const useServiceFactory = (): ShapeServiceFactory => {
  const factory = useContext(ServiceFactoryContext);
  if (!factory) {
    throw new Error('useServiceFactory must be used within a ServiceProvider');
  }
  return factory;
};

// Props for the ServiceProvider component
interface ServiceProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that makes the shape services available to all child components
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  // Create service instances
  const circleService = new CircleServiceImpl();
  const rectangleService = new RectangleServiceImpl();
  const triangleService = new TriangleServiceImpl();
  const lineService = new LineServiceImpl();
  
  // Create the factory with the service instances
  const factory = new DefaultShapeServiceFactory(
    circleService,
    rectangleService,
    triangleService,
    lineService
  );
  
  return (
    <ServiceFactoryContext.Provider value={factory}>
      {children}
    </ServiceFactoryContext.Provider>
  );
}; 