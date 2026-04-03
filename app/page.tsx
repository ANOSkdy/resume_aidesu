"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AppShell } from '@/components/layout/AppShell';

export default function Home() {
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);

  const handleStart = () => {
    if (!isAgreed) return;
    router.push('/resume/1');
  };

  return (
    <AppShell title="ホーム">
      <section className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold leading-tight text-blue-700">Carrime</h1>
          <p className="text-sm text-gray-700">
            AIでつくる、あなたのキャリア。
            いつでもどこでもモバイル端末から履歴書・職務経歴書を作成できます。
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">ご利用開始の前に</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              当サービスをご利用いただく前に、以下の利用規約を必ずご確認ください。利用規約に同意いただけない場合、履歴書・職務経歴書の作成を開始できません。
            </p>
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <span role="img" aria-label="document">📄</span>
                利用規約
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-2 leading-relaxed">
                <p>
                  株式会社ROBINSON（以下「当社」といいます。）は、当社が提供するAI履歴書・職務経歴書作成サービス「Carrime」（以下「本機能」といいます。）の利用にあたり、以下の事項を定めます。利用者は、本機能を利用した時点で、本規約および以下の注意事項・個人情報の取り扱いに同意したものとみなされます。
                </p>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">【第1章　注意事項】</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>本機能は、職務内容の記述を補助する機能であり、職務内容を完全に再現した自動生成を保証するものではありません。</li>
                    <li>AIの特性上、不適切な表現・事実と異なる記載・利用者の経験に含まれない内容が生成される場合があります。</li>
                    <li>生成された内容について、AIが虚偽内容を生成した場合であっても、利用者自身が確認し、事実と異なる部分を修正する義務を負います。</li>
                    <li>アクセス集中、システム障害、通信状況などにより本機能を一時的に利用できない場合があります。その際は時間をおいて再度お試しください。</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">【第2章　利用上の注意】</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>
                      （機能概要）本機能は、利用者が入力したプロフィール情報をもとに、AIにより職務内容を自動生成する機能（以下「AI職務経歴書」といいます。）を提供するものです。
                    </li>
                    <li>
                      （著作権）AI職務経歴書によって生成された文章その他の成果物に関する著作権は、当社に帰属します。ただし、利用者は、求人企業への応募に必要な範囲に限り、当該生成物を自由に利用・複製・転載できるものとします。
                    </li>
                    <li>
                      （生成内容の保証）当社は、AI職務経歴書によって生成された内容について、正確性、完全性、信頼性、目的適合性その他一切の事項を保証しません。
                    </li>
                    <li>
                      （利用者の確認義務）AI生成物の内容に虚偽が含まれていた場合であっても、利用者自身が内容の確認および事実と異なる記載の修正を行う義務を負います。
                    </li>
                    <li>
                      （目的外利用の禁止および違反時の措置）利用者は、AI職務経歴書を、求人応募に提出する職務内容の作成以外の目的で利用してはなりません。利用者が本条項に違反した場合、当社は、利用停止、アカウント削除その他必要な措置を講じることができるものとします。
                    </li>
                    <li>
                      （国外AIベンダーへの情報提供）利用者は、当社が本機能の提供に必要な範囲で、国外AIベンダーへの情報提供（委託を含む）を行うことについて、あらかじめ明示的に同意するものとします。
                    </li>
                    <li>
                      （免責事項：一般）当社の故意または重過失による場合を除き、当社は、本機能の利用に関連して利用者が被った損害について一切責任を負いません。
                    </li>
                    <li>
                      （採否結果に関する免責）AI生成物の利用により発生した採否結果その他の不利益について、当社は一切責任を負いません。
                    </li>
                    <li>
                      （機能の変更・中断・停止・廃止）当社は、本機能の内容を予告なく変更、中断、停止、または廃止する場合があります。これらに伴い利用者に生じた損害について、当社は責任を負いません。
                    </li>
                  </ol>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">【第3章　個人情報の取り扱い（ROBINSON版・完全版）】</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>
                      取得方法ごとの利用目的
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        <li>
                          （1）利用者から直接取得する情報：氏名・住所・生年月日・電話番号・メール・学歴・職歴・スキル・希望条件・AI生成に使用するデータなどを、本サービスの会員登録・管理・本人確認、求人提示、推薦、求人提案の最適化、サービス改善、新サービス開発、イベント案内、広告配信、アンケート案内、メール配信、問い合わせ対応、保守のために利用します。
                        </li>
                        <li>
                          （2）利用に伴い当社が自動取得する情報（例：閲覧履歴、応募履歴、スカウト開封情報、メッセージ履歴、利用端末情報、AI生成履歴など）を、レコメンド表示、最適候補者表示、サービス改善・分析・新規機能開発、不正防止・セキュリティ対策のために利用します。
                        </li>
                        <li>
                          （3）第三者から取得する情報（例：選考状況、面接結果、内定情報、入社予定日、年収情報など）を、人材紹介事業の運営・管理のために利用します。
                        </li>
                      </ul>
                    </li>
                    <li>
                      個人情報の第三者提供：法令に基づく場合を除き、広告配信・マーケティング改善のための提携広告企業、求人企業・人材紹介事業者・提携企業（国内外）、応募・やり取りにおける氏名・生年月日の提供、本人同意がある場合の連絡先提供、匿名加工情報の大学・研究機関への提供、クレジットカード不正検知のためのカード会社への提供を行います。
                    </li>
                    <li>個人情報提供の任意性：提供は任意ですが、提供がない場合、本サービスの全部または一部をご利用いただけない場合があります。</li>
                    <li>
                      第三者提供の免責事項：利用者自身の提供、投稿等からの特定、外部サイトでの提供・利用、ID・パスワード管理不備、当社に故意・重過失がない場合について、当社は責任を負いません。
                    </li>
                    <li>個人情報の委託：当社は適切な管理体制を有する委託先に個人情報を委託する場合があります。</li>
                  </ol>
                </div>
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={isAgreed}
                onChange={(event) => setIsAgreed(event.target.checked)}
              />
              <span>
                利用規約に同意します。内容を確認のうえ、チェックを入れてください。
              </span>
            </label>
            <Button
              size="lg"
              className="font-bold shadow-sm"
              onClick={handleStart}
              disabled={!isAgreed}
            >
              利用規約に同意して作成を開始する
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">© Acoru inc.</p>
      </section>
    </AppShell>
  );
}
