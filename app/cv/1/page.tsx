'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';

// 新しい4つの質問に対応するデータ型
type AiInputData = {
  pr_summary: string; // 1. 強み・PR
  episode: string;    // 2. 具体的なエピソード
  policy: string;     // 3. 大切にしていること(価値観)
  occupation: string; // 4. 希望職種
};

export default function CVStep1() {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm<AiInputData>();

  useEffect(() => {
    // 以前の入力があればロード
    const saved = localStorage.getItem('carrimy_ai_inputs');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 旧データ形式との互換性チェック（念のため）
      if (parsed.pr_summary) {
        setValue('pr_summary', parsed.pr_summary);
        setValue('episode', parsed.episode);
        setValue('policy', parsed.policy);
        setValue('occupation', parsed.occupation);
      }
    }
  }, [setValue]);

  const onSubmit = (data: AiInputData) => {
    localStorage.setItem('carrimy_ai_inputs', JSON.stringify(data));
    router.push('/cv/2');
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">自己PR作成のためのヒアリング</h2>
      <p className="text-sm text-gray-500 mb-6">
        以下の質問にお答えください。<br/>
        AIが回答内容を分析し、あなたの魅力が伝わる自己PRを作成します。
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Q1 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            1. 自己の強みやPRしたいことを教えてください
          </label>
          <textarea 
            {...register('pr_summary', { required: true })} 
            className="w-full px-3 py-2 border rounded h-24" 
            placeholder="例: 私の強みは「粘り強さ」と「チームワーク」です。困難な課題でも諦めず..."
          />
        </div>

        {/* Q2 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            2. 強みが生かされた具体的なエピソードを教えてください
          </label>
          <textarea 
            {...register('episode', { required: true })} 
            className="w-full px-3 py-2 border rounded h-32" 
            placeholder="例: 前職のプロジェクトでトラブルが発生した際、関係各所と調整を行い..."
          />
        </div>

        {/* Q3 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            3. 仕事をする上で大切にしていることを、理由を含めて教えてください
          </label>
          <textarea 
            {...register('policy')} 
            className="w-full px-3 py-2 border rounded h-24" 
            placeholder="例: 「相手の期待を少し超えること」を大切にしています。なぜなら..."
          />
        </div>

        {/* Q4 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            4. 希望している職種を教えてください
          </label>
          <input 
            {...register('occupation')} 
            className="w-full px-3 py-2 border rounded" 
            placeholder="例: 法人営業、Webエンジニア"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit">次へ進みAI生成する</Button>
        </div>
      </form>
    </div>
  );
}
