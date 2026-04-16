'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { WizardNav } from '@/components/ui/WizardNav';
import { AppShell } from '@/components/layout/AppShell';

export default function CVLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = parseInt(pathname?.split('/').pop() || '1');

  const steps = [
    '自己PRの材料入力',
    '自己PRを生成・編集',
    '要約を保存してPDF出力'
  ];

  return (
    <AppShell title="職務経歴書の仕上げ">
      <div className="space-y-5 py-4">
        <WizardNav
          currentStep={currentStep}
          totalSteps={3}
          basePath="/cv"
          labels={steps}
        />
        <p className="wa-muted text-xs">
          履歴書入力の続きとして、ここで職務経歴書の仕上げを行います。
        </p>
        <div className="wa-surface wa-form p-4">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
