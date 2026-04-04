'use client';

import React from 'react';

type JobHistoryTriggerProps = {
  data: any;
  disabled?: boolean;
};

export const JobHistoryTrigger: React.FC<JobHistoryTriggerProps> = ({ data, disabled = false }) => {
  // 履歴書データから resumeId を取得
  const resumeId = data?.resume?.resume_id || data?.resume_id;

  if (!resumeId || disabled) {
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-md bg-gray-300 px-6 py-3 text-sm font-medium text-white opacity-70 cursor-not-allowed"
        >
          {resumeId ? '📄 職務経歴書をダウンロード' : '履歴書ID未設定'}
        </button>
        {disabled ? <p className="text-xs text-amber-700">先に保存してください</p> : null}
      </div>
    );
  }

  const href = `/api/pdf/job-history?resumeId=${encodeURIComponent(resumeId)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 shadow-sm transition-colors wa-motion-ui"
    >
      📄 職務経歴書をダウンロード
    </a>
  );
};
