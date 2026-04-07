import React, { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  optional?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, optional = false, className = '', ...props }, ref) => {
    const baseClass = 'w-full rounded-md border bg-white px-3 py-2 shadow-sm transition-colors focus-visible:wa-focus';
    const stateClass = error ? 'border-akane' : 'border-[var(--border)]';
    const finalClass = `${baseClass} ${stateClass} ${className}`;

    return (
      <div className="mb-4 w-full">
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-nezumi">
          {label}
          {optional && <span className="text-xs font-normal text-nezumi/70">任意</span>}
        </label>
        <input
          ref={ref}
          className={finalClass}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-akane">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
