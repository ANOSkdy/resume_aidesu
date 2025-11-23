'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { JobHistoryDocument } from './JobHistoryDocument';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { 
    ssr: false,
    loading: () => <button disabled className="px-4 py-2 bg-gray-300 rounded text-white text-sm">準備中...</button>
  }
);

export const JobHistoryTrigger = ({ data }: { data: any }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient || !data) return null;

  return (
    <PDFDownloadLink
      document={<JobHistoryDocument data={data} />}
      fileName="職務経歴書.pdf"
      className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 shadow-sm transition-colors"
    >
      {/* @ts-ignore */}
      {({ loading, error }) => {
        if (error) return 'エラー';
        return loading ? '生成中...' : '📥 職務経歴書をダウンロード';
      }}
    </PDFDownloadLink>
  );
};
