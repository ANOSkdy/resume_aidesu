// components/pdf/PDFTrigger.tsx
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { ResumeDocument } from './ResumeDocument'; // 上で作ったファイル

// ★重要: SSR回避のための動的インポート
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { 
    ssr: false,
    loading: () => <button disabled className="px-4 py-2 bg-gray-300 rounded text-white">PDF準備中...</button>
  }
);

export const PDFTrigger = ({ data }: { data: any }) => {
  const [isClient, setIsClient] = useState(false);
  
  // クライアントサイドでのみレンダリング許可
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !data) return null;

  return (
    <PDFDownloadLink
      document={<ResumeDocument data={data} />}
      fileName="履歴書.pdf"
      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
    >
      {/* @ts-ignore */}
      {({ loading, error }) => {
        if (error) return 'エラー発生';
        return loading ? 'PDF生成中...' : '📥 JIS履歴書をダウンロード';
      }}
    </PDFDownloadLink>
  );
};