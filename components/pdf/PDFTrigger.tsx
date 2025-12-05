// components/pdf/PDFTrigger.tsx
'use client';

import React from 'react';

type PDFTriggerProps = {
  data: any;
};

export const PDFTrigger = ({ data }: PDFTriggerProps) => {
  const resumeId = data?.resume?.resume_id || data?.resume_id;
  const profilePhotoUrl = data?.resume?.profilePhotoUrl ?? null;

  if (!resumeId) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center rounded-md bg-gray-300 px-6 py-3 text-sm font-medium text-white"
      >
        履歴書ID未設定
      </button>
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
      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
    >
      📥 JIS履歴書をダウンロード
    </a>
  );
};