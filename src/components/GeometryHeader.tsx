
import React from 'react';

const GeometryHeader: React.FC = () => {
  return (
    <div className="flex flex-col space-y-1 mb-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">Geometry Visualizer</h1>
      <p className="text-sm text-muted-foreground">
        Create, manipulate, and understand geometric shapes interactively
      </p>
    </div>
  );
};

export default GeometryHeader;
