import React from 'react';
import CalibrationTool from '../CalibrationTool';
import { MeasurementUnit } from '@/types/shapes';

interface CalibrationButtonProps {
  showCalibration: boolean;
  toggleCalibration: () => void;
  measurementUnit: MeasurementUnit;
  pixelsPerUnit: number;
  onCalibrationComplete: (newPixelsPerUnit: number) => void;
}

const CalibrationButton: React.FC<CalibrationButtonProps> = ({
  showCalibration,
  toggleCalibration,
  measurementUnit,
  pixelsPerUnit,
  onCalibrationComplete
}) => {
  // Handler to stop event propagation
  const handleButtonInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Calibration button */}
      <div 
        className="absolute top-2 right-2 z-10"
        onMouseDown={handleButtonInteraction}
        onMouseUp={handleButtonInteraction}
        onMouseMove={handleButtonInteraction}
        onMouseEnter={handleButtonInteraction}
        onMouseLeave={handleButtonInteraction}
      >
        <button
          className="btn-tool"
          onClick={(e) => {
            e.stopPropagation();
            toggleCalibration();
          }}
          title="Calibrate Screen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
      
      {/* Calibration tool */}
      {showCalibration && (
        <div 
          className="absolute top-14 right-2 z-50 w-80"
          onMouseDown={handleButtonInteraction}
          onMouseUp={handleButtonInteraction}
          onMouseMove={handleButtonInteraction}
          onMouseEnter={handleButtonInteraction}
          onMouseLeave={handleButtonInteraction}
        >
          <CalibrationTool
            measurementUnit={measurementUnit}
            onCalibrationComplete={onCalibrationComplete}
            defaultPixelsPerUnit={pixelsPerUnit}
          />
        </div>
      )}
    </>
  );
};

export default CalibrationButton; 