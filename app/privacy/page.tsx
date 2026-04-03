import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">個人情報保護方針</h1>
        
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">1. 個人情報の定義</h2>
            <p>
              本サービス（Carrime）において「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、
              生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により
              特定の個人を識別できる情報を指します。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">2. 個人情報の収集方法</h2>
            <p>
              当サービスは、ユーザーが利用登録をする際に氏名、生年月日、職務経歴等の個人情報をお尋ねすることがあります。
              これらの情報は、履歴書および職務経歴書の作成支援、およびAIによる自己PR生成の目的のみに使用されます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">3. 個人情報の利用目的</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">4. 個人情報の第三者提供</h2>
            <p>
              当サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
              ただし、個人情報保護法その他の法令で認められる場合を除きます。
            </p>
          </section>
          
          <div className="p-4 bg-gray-100 rounded text-xs text-gray-500">
            ※これは開発用のサンプル規定です。実際の運用の際は、法務確認を経た正式な文章に差し替えてください。
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">トップページに戻る</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
