'use client';

import React from 'react';

type JobHistoryTriggerProps = {
  data: any;
};

export const JobHistoryTrigger: React.FC<JobHistoryTriggerProps> = ({ data }) => {
  // 履歴書データから resumeId を取得
  const resumeId = data?.resume?.resume_id || data?.resume_id;

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

  const href = `/api/pdf/job-history?resumeId=${encodeURIComponent(resumeId)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 shadow-sm transition-colors"
    >
      📄 職務経歴書をダウンロード
    </a>
  );
};
