'use client';

import React from 'react';

export const JobHistoryTrigger = ({ data }: { data: any }) => {
  const resumeId = data?.resume?.resume_id || data?.resume_id;

  if (!resumeId) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center rounded-md bg-gray-300 px-6 py-3 text-sm font-medium text-white"
      >
        準備中
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => alert('職務経歴書のPDFは準備中です。')}
      className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 shadow-sm transition-colors"
    >
      📄 職務経歴書（準備中）
    </button>
  );
};
