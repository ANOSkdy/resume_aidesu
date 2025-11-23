import React from 'react';

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export const Modal = ({ children, className }: Props) => {
  return (
    <div className={className}>
      {/* TODO: Modal Implementation */}
      {children || "Modal Component"}
    </div>
  );
};
