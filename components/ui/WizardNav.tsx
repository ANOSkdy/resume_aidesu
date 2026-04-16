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
      <p className="mb-2 text-xs font-semibold tracking-wide text-nezumi" aria-live="polite">
        ステップ {currentStep} / {totalSteps}
      </p>
      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <div className="absolute left-0 right-0 top-4 -z-10 h-1 rounded-full bg-ai/12"></div>

        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep;

          let circleClass = 'flex h-10 min-h-[44px] w-10 items-center justify-center rounded-full border text-sm font-bold transition-[transform,background-color,border-color,color,box-shadow] wa-motion-ui';
          circleClass += isActive
            ? ' border-ai bg-ai text-white shadow-[0_8px_18px_rgba(6,199,85,0.32)]'
            : ' border-ai/20 bg-white text-nezumi';

          const labelClass = `mt-2 break-words text-center text-[0.7rem] leading-4 font-medium sm:text-[0.75rem] ${
            isCurrent ? 'text-sumi' : 'text-nezumi'
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
