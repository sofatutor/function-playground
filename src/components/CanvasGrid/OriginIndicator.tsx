import React from 'react';

interface OriginIndicatorProps {
  origin: { x: number, y: number };
  canvasSize: { width: number, height: number };
}

const OriginIndicator: React.FC<OriginIndicatorProps> = ({ origin, canvasSize }) => {
  // Define the text style to prevent selection
  const textStyle: React.CSSProperties = {
    userSelect: 'none' as const,
    pointerEvents: 'none'
  };

  // Check if the origin is visible on the canvas
  const isVisible = 
    origin.x >= 0 && 
    origin.x <= canvasSize.width && 
    origin.y >= 0 && 
    origin.y <= canvasSize.height;

  if (!isVisible) return null;

  // Calculate the size of the indicator based on the canvas size
  // This ensures it's visible but not too large
  const indicatorSize = Math.min(Math.max(canvasSize.width, canvasSize.height) * 0.007, 4);
  const lineLength = indicatorSize * 2.5;

  return (
    <>
      {/* Origin indicator */}
      <g className="origin-indicator">
        {/* Circle at origin */}
        <circle
          cx={origin.x}
          cy={origin.y}
          r={indicatorSize}
          fill="#000000"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* Horizontal line */}
        <line
          x1={origin.x - lineLength}
          y1={origin.y}
          x2={origin.x + lineLength}
          y2={origin.y}
          stroke="#000000"
          strokeWidth="1.5"
        />
        {/* Vertical line */}
        <line
          x1={origin.x}
          y1={origin.y - lineLength}
          x2={origin.x}
          y2={origin.y + lineLength}
          stroke="#000000"
          strokeWidth="1.5"
        />
        {/* Origin label */}
        <text
          x={origin.x + lineLength + 2}
          y={origin.y - 5}
          fontSize="10"
          fontWeight="bold"
          fill="#000000"
          style={textStyle}
        >
          (0,0)
        </text>
      </g>
    </>
  );
};

export default OriginIndicator; 