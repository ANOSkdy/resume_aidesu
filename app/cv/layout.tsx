'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { WizardNav } from '@/components/ui/WizardNav';
import { AppShell } from '@/components/layout/AppShell';

export default function CVLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = parseInt(pathname?.split('/').pop() || '1');

  const steps = [
    '詳細入力',
    '自己PR',
    '職務要約'
  ];

  return (
    <AppShell
      title="職務経歴書作成"
      footer={(
        <WizardNav
          currentStep={currentStep}
          totalSteps={3}
          basePath="/cv"
          labels={steps}
          variant="compact"
        />
      )}
    >
      <div className="space-y-4">
        <WizardNav
          currentStep={currentStep}
          totalSteps={3}
          basePath="/cv"
          labels={steps}
        />
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
