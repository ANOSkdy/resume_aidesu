'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureResumeId, hasPendingResumeSave, retryPendingResumeSave } from '@/lib/storage/resume-save';

export default function ResumeStep2() {
  const router = useRouter();
  useEffect(() => {
    const resumeId = ensureResumeId();
    if (!resumeId) {
      router.replace('/resume/1');
      return;
    }

    if (!hasPendingResumeSave(resumeId)) {
      router.replace('/resume/3');
      return;
    }

    void retryPendingResumeSave(resumeId).finally(() => {
      router.replace('/resume/3');
    });
  }, [router]);

  return (
    <div className="py-8 text-center">
      <h2 className="text-xl font-bold mb-3">次のステップへ進みます</h2>
      <p className="wa-muted inline-flex items-center gap-2 text-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-nezumi/60 border-t-transparent" />
        次の入力へ移動しています...
      </p>
    </div>
  );
}
