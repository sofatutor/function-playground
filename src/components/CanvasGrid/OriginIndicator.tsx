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

  return (
    <>
      {/* Origin indicator */}
      <g className="origin-indicator">
        {/* Horizontal line */}
        <line
          x1={origin.x - 10}
          y1={origin.y}
          x2={origin.x + 10}
          y2={origin.y}
          stroke="#FF5D8F"
          strokeWidth="1"
        />
        {/* Vertical line */}
        <line
          x1={origin.x}
          y1={origin.y - 10}
          x2={origin.x}
          y2={origin.y + 10}
          stroke="#FF5D8F"
          strokeWidth="1"
        />
        {/* Origin coordinates */}
        <text
          x={origin.x + 12}
          y={origin.y - 5}
          fontSize="10"
          fill="#FF5D8F"
          style={textStyle}
        >
          (0,0)
        </text>
      </g>
    </>
  );
};

export default OriginIndicator; 