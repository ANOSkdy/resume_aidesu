'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { WizardNav } from '@/components/ui/WizardNav';

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // URLの末尾 (1, 2, 3...) を取得して現在のステップとする
  const currentStep = parseInt(pathname?.split('/').pop() || '1');
  
  const steps = [
    '基本情報',
    '状況確認',
    '学歴',
    '職歴',
    '希望条件'
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto max-w-3xl px-4">
        <WizardNav 
          currentStep={currentStep} 
          totalSteps={5} 
          basePath="/resume"
          labels={steps}
        />
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
