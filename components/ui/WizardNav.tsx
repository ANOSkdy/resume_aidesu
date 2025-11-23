import React from 'react';

type Props = {
  currentStep: number;
  totalSteps: number;
  basePath: string;
  labels?: string[];
};

export const WizardNav = ({ currentStep, totalSteps, labels }: Props) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative mb-8 px-2">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep;

          // クラス名を動的に組み立て
          let circleClass = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ";
          if (isActive) {
            circleClass += "bg-blue-600 border-blue-600 text-white";
          } else {
            circleClass += "bg-white border-gray-300 text-gray-400";
          }

          let labelClass = "absolute top-10 text-xs font-medium whitespace-nowrap ";
          labelClass += isCurrent ? "text-blue-600" : "text-gray-400";

          return (
            <div key={stepNum} className="flex flex-col items-center bg-white px-2">
              <div className={circleClass}>
                {stepNum}
              </div>
              {labels && labels[i] && (
                <span className={labelClass}>
                  {labels[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
