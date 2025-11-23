'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { WizardNav } from '@/components/ui/WizardNav';

export default function CVLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = parseInt(pathname?.split('/').pop() || '1');
  
  const steps = [
    '詳細入力',
    '自己PR',
    '職務要約'
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto max-w-3xl px-4">
        <WizardNav 
          currentStep={currentStep} 
          totalSteps={3} 
          basePath="/cv"
          labels={steps}
        />
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
