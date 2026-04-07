// components/pdf/PDFTrigger.tsx
'use client';

import React from 'react';

type PDFTriggerProps = {
  data: any;
  disabled?: boolean;
};

export const PDFTrigger = ({ data, disabled = false }: PDFTriggerProps) => {
  const resumeId = data?.resume?.resume_id || data?.resume_id;
  const profilePhotoUrl = data?.resume?.profilePhotoUrl ?? null;

  if (!resumeId || disabled) {
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-md bg-nezumi/45 px-6 py-3 text-sm font-medium !text-white opacity-70 cursor-not-allowed"
        >
          {resumeId ? '📥 JIS履歴書をダウンロード' : '履歴書ID未設定'}
        </button>
        {disabled ? <p className="text-xs text-akane">先に保存してください</p> : null}
      </div>
    );
  }

  const href = `/api/pdf/jis-resume?resumeId=${encodeURIComponent(resumeId)}${
    profilePhotoUrl ? '&showProfilePhoto=true' : ''
  }`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-md bg-ai px-6 py-3 text-sm font-medium !text-white hover:bg-ai/90 shadow-sm transition-colors wa-motion-ui"
    >
      📥 JIS履歴書をダウンロード
    </a>
  );
};
