import React from 'react';

type Props = {
  currentStep: number;
  totalSteps: number;
  basePath: string;
  labels?: string[];
  className?: string;
  variant?: 'default' | 'compact';
};

export const WizardNav = ({ currentStep, totalSteps, labels, className = '', variant = 'default' }: Props) => {
  const padding = variant === 'compact' ? 'py-3' : 'py-4';

  return (
    <div className={`w-full ${padding} ${className}`}>
      <div className="relative flex items-start justify-between gap-2">
        <div className="absolute left-0 right-0 top-4 -z-10 h-px bg-[color:var(--border)]"></div>

        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep;

          let circleClass = 'flex h-10 min-h-[44px] w-10 items-center justify-center rounded-full border text-sm font-bold transition-[transform,background-color,border-color,color] wa-motion-ui';
          circleClass += isActive
            ? ' border-ai bg-ai text-kinari'
            : ' border-[var(--border)] bg-white/85 text-nezumi';

          const labelClass = `mt-2 break-words text-center text-[0.75rem] leading-4 font-medium ${
            isCurrent ? 'text-ai' : 'text-nezumi'
          }`;

          return (
            <div key={stepNum} className="flex min-w-0 flex-1 flex-col items-center">
              <div className={circleClass}>{stepNum}</div>
              {labels && labels[i] && (
                <span className={labelClass}>{labels[i]}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
