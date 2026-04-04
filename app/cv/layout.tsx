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
    <AppShell title="職務経歴書作成">
      <div className="space-y-5 py-4">
        <WizardNav
          currentStep={currentStep}
          totalSteps={3}
          basePath="/cv"
          labels={steps}
        />
        <div className="wa-surface p-4">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
