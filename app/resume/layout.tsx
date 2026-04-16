'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { WizardNav } from '@/components/ui/WizardNav';
import { AppShell } from '@/components/layout/AppShell';

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routeStep = parseInt(pathname?.split('/').pop() || '1', 10);
  const stepOrderMap: Record<number, number> = {
    1: 1,
    2: 1, // 旧ステップ2は遷移用。進捗表示では非表示にする
    3: 2,
    4: 3,
    5: 4,
  };
  const currentStep = stepOrderMap[routeStep] ?? 1;

  const steps = [
    '基本情報',
    '学歴',
    '職歴',
    '希望条件'
  ];

  return (
    <AppShell title="履歴書作成">
      <div className="space-y-5 py-4">
        <WizardNav
          currentStep={currentStep}
          totalSteps={4}
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
