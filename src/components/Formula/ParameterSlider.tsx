import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ParameterSliderProps {
  parameterName: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  parameters?: Record<string, number>;
}

export function ParameterSlider({
  parameterName,
  value,
  onChange,
  min = -3,
  max = 3,
  step = 0.1,
  className,
  parameters,
}: ParameterSliderProps) {
  // Get the step size from parameters if available, otherwise use default
  const stepSize = parameters?.[`${parameterName}_step`] ?? step;
  
  // Ensure the value is rounded to the step size
  const roundedValue = Math.round(value / stepSize) * stepSize;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={parameterName} className="text-sm font-medium">
          {parameterName}
        </Label>
        <span className="text-sm text-muted-foreground">{roundedValue.toFixed(1)}</span>
      </div>
      <Slider
        id={parameterName}
        value={[roundedValue]}
        onValueChange={([newValue]) => {
          // Round the new value to the step size
          const roundedNewValue = Math.round(newValue / stepSize) * stepSize;
          onChange(roundedNewValue);
        }}
        min={min}
        max={max}
        step={stepSize}
        className="w-full"
      />
    </div>
  );
} 