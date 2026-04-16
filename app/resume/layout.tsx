'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { WizardNav } from '@/components/ui/WizardNav';
import { AppShell } from '@/components/layout/AppShell';

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = parseInt(pathname?.split('/').pop() || '1');

  const steps = [
    '基本情報',
    '状況確認',
    '学歴',
    '職歴',
    '希望条件'
  ];

  return (
    <AppShell title="履歴書作成">
      <div className="space-y-5 py-4">
        <WizardNav
          currentStep={currentStep}
          totalSteps={5}
          basePath="/resume"
          labels={steps}
        />
        <div className="wa-surface wa-form p-4">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
