import React from 'react';

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export const ToggleGroup = ({ children, className }: Props) => {
  return (
    <div className={className}>
      {/* TODO: ToggleGroup Implementation */}
      {children || "ToggleGroup Component"}
    </div>
  );
};
