"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AppShell } from '@/components/layout/AppShell';

export default function Home() {
  const router = useRouter();

  return (
    <AppShell title="ホーム">
      <section className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold leading-tight text-blue-700">Carrimy</h1>
          <p className="text-sm text-gray-700">
            AIでつくる、あなたのキャリア。スマホ専用レイアウトで、いつでもどこでも履歴書・職務経歴書を作成できます。
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">ご利用開始の前に</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              当サービスでは、履歴書作成のために氏名や経歴などの個人情報を入力していただきます。入力された情報は、
              <span className="font-semibold text-gray-800">個人情報保護法</span>に基づき厳重に管理されます。
            </p>
            <Link
              href="/privacy"
              className="flex min-h-[44px] items-center justify-start gap-2 text-sm font-medium text-blue-600 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <span role="img" aria-label="document">📄</span>
              個人情報保護方針の詳細を確認する
            </Link>
            <Button
              size="lg"
              className="font-bold shadow-sm"
              onClick={() => router.push('/resume/1')}
            >
              同意して作成を開始する
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">© Carrimy Development Team</p>
      </section>
    </AppShell>
  );
}
