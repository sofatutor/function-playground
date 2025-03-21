import React from 'react';
import { Button } from './ui/button';

interface FormulaButtonProps {
  id: string;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

const FormulaButton: React.FC<FormulaButtonProps> = ({ id, className, onClick, disabled, children }) => {
  return (
    <Button
      id={id}
      data-testid={id}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

export default FormulaButton; 