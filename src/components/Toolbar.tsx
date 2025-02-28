
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Square, Circle, Triangle, MousePointer, Move, RotateCw, Trash } from 'lucide-react';
import type { ShapeType, OperationMode } from '@/types/shapes';

interface ToolbarProps {
  activeMode: OperationMode;
  activeShapeType: ShapeType;
  onModeChange: (mode: OperationMode) => void;
  onShapeTypeChange: (type: ShapeType) => void;
  onClear: () => void;
  onDelete: () => void;
  hasSelectedShape: boolean;
  canDelete: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeMode,
  activeShapeType,
  onModeChange,
  onShapeTypeChange,
  onClear,
  onDelete,
  hasSelectedShape,
  canDelete
}) => {
  return (
    <div className="flex items-center space-x-1 p-1 bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in">
      <ToolButton 
        active={activeMode === 'select'}
        onClick={() => onModeChange('select')}
        tooltip="Select Shape"
      >
        <MousePointer size={18} />
      </ToolButton>
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      <ToolButton 
        active={activeMode === 'create' && activeShapeType === 'rectangle'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('rectangle');
        }}
        tooltip="Rectangle"
      >
        <Square size={18} />
      </ToolButton>
      
      <ToolButton 
        active={activeMode === 'create' && activeShapeType === 'circle'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('circle');
        }}
        tooltip="Circle"
      >
        <Circle size={18} />
      </ToolButton>
      
      <ToolButton 
        active={activeMode === 'create' && activeShapeType === 'triangle'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('triangle');
        }}
        tooltip="Triangle"
      >
        <Triangle size={18} />
      </ToolButton>
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      <ToolButton 
        active={activeMode === 'move'}
        onClick={() => onModeChange('move')}
        disabled={!hasSelectedShape}
        tooltip="Move Shape"
      >
        <Move size={18} />
      </ToolButton>
      
      <ToolButton 
        active={activeMode === 'rotate'}
        onClick={() => onModeChange('rotate')}
        disabled={!hasSelectedShape}
        tooltip="Rotate Shape"
      >
        <RotateCw size={18} />
      </ToolButton>
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      <ToolButton 
        onClick={onDelete}
        disabled={!canDelete}
        tooltip="Delete Selected"
        variant="destructive"
      >
        <Trash size={18} />
      </ToolButton>
    </div>
  );
};

interface ToolButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip: string;
  variant?: 'default' | 'destructive';
}

const ToolButton: React.FC<ToolButtonProps> = ({
  children,
  onClick,
  active = false,
  disabled = false,
  tooltip,
  variant = 'default'
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant === 'destructive' ? 'destructive' : active ? 'default' : 'outline'}
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={`h-9 w-9 transition-all ${active ? 'bg-geometry-primary text-white' : ''} 
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Toolbar;
