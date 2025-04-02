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
}

export function ParameterSlider({
  parameterName,
  value,
  onChange,
  min = -3,
  max = 3,
  step = 0.1,
  className,
}: ParameterSliderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={parameterName} className="text-sm font-medium">
          {parameterName}
        </Label>
        <span className="text-sm text-muted-foreground">{value.toFixed(1)}</span>
      </div>
      <Slider
        id={parameterName}
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
} 