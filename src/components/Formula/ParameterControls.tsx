import { useTranslation } from 'react-i18next';
import { Formula } from '@/types/formula';
import { ParameterSlider } from '@/components/Formula/ParameterSlider';
import { detectParameters } from '@/utils/parameterDetection';

interface ParameterControlsProps {
  selectedFormula: Formula | null;
  onUpdateFormula: (id: string, updates: Partial<Formula>) => void;
}

export default function ParameterControls({
  selectedFormula,
  onUpdateFormula,
}: ParameterControlsProps) {
  const { t } = useTranslation();

  const handleParameterChange = (parameterName: string, value: number) => {
    if (!selectedFormula) return;

    const updatedParameters = {
      ...selectedFormula.parameters,
      [parameterName]: value,
    };

    onUpdateFormula(selectedFormula.id, {
      parameters: updatedParameters,
    });
  };

  if (!selectedFormula) return null;

  const parameters = detectParameters(selectedFormula.expression);
  if (parameters.length === 0) return null;

  return (
    <div className="w-full bg-background border-t p-4">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-sm font-medium mb-4">{t('formula.parameters')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parameters.map((param) => (
            <ParameterSlider
              key={param.name}
              parameterName={param.name}
              displayName={String(selectedFormula.parameters?.[`${param.name}_displayName`] ?? param.displayName)}
              value={selectedFormula.parameters?.[param.name] ?? param.defaultValue}
              onChange={(value) => handleParameterChange(param.name, value)}
              parameters={selectedFormula.parameters}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 