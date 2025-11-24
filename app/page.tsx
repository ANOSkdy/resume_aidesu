"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <main className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
        {/* ロゴエリア */}
        <div className="mb-10">
          <h1 className="text-5xl font-extrabold text-blue-600 tracking-tighter mb-2">
            Carrimy
          </h1>
          <p className="text-gray-500 font-medium">
            AIでつくる、あなたのキャリア。
          </p>
        </div>

        {/* 同意エリア */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          <p className="text-sm text-gray-700 font-bold mb-3">
            ご利用開始の前に
          </p>
          <p className="text-xs text-gray-600 mb-4 leading-relaxed text-left">
            当サービスでは、履歴書作成のために氏名や経歴などの個人情報を入力していただきます。<br />
            入力された情報は、<span className="font-bold text-gray-800">個人情報保護法</span>に基づき厳重に管理されます。
          </p>

          <div className="mb-6">
            <Link
              href="/privacy"
              className="text-xs text-blue-600 underline hover:text-blue-800 flex items-center justify-center gap-1"
            >
              <span>📄</span>
              個人情報保護方針の詳細を確認する
            </Link>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full font-bold shadow-md h-12 text-base"
              onClick={() => router.push('/resume/1')}
            >
              同意して作成を開始する
            </Button>
          </div>
        </div>

        {/* フッター */}
        <p className="text-xs text-gray-400">© Carrimy Development Team</p>
      </main>
    </div>
  );
}
