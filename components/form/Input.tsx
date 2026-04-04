import React, { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const baseClass = 'w-full rounded-md border bg-white px-3 py-2 shadow-sm transition-colors focus-visible:wa-focus';
    const stateClass = error ? 'border-akane' : 'border-[var(--border)]';
    const finalClass = `${baseClass} ${stateClass} ${className}`;

    return (
      <div className="mb-4 w-full">
        <label className="mb-1 block text-sm font-medium text-nezumi">
          {label}
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
