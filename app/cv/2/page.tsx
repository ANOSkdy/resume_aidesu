'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { BRAND_STORAGE_KEYS, getStorageItemWithLegacyFallback } from '@/lib/storage/branding';

type SelfPrInputs = {
  pr_summary?: string;
  episode?: string;
  policy?: string;
  occupation?: string;
};

export default function CVStep2() {
  const router = useRouter();
  const [generatedPR, setGeneratedPR] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState<SelfPrInputs | null>(null);
  const [statusMessage, setStatusMessage] = useState<'loaded' | 'generated' | 'unsaved' | 'saved' | null>(null);

  useEffect(() => {
    // localStorageから最新の入力を取得
    const saved = getStorageItemWithLegacyFallback(BRAND_STORAGE_KEYS.aiInputs.current, BRAND_STORAGE_KEYS.aiInputs.legacy);
    if (saved) {
      setInputs(JSON.parse(saved));
    } else {
      alert("入力データが見つかりません。Step 1に戻ります。");
      router.push('/cv/1');
    }

    // 既存の自己PRがあればロード
    const resumeId = getStorageItemWithLegacyFallback(BRAND_STORAGE_KEYS.resumeId.current, BRAND_STORAGE_KEYS.resumeId.legacy);
    if (resumeId) {
      fetch('/api/data/resume?id=' + resumeId)
        .then(res => res.json())
        .then(data => {
          if (data.resume && data.resume.self_pr) {
            setGeneratedPR(data.resume.self_pr);
            setStatusMessage('loaded');
          }
        });
    }
  }, [router]);

  const generateAI = async () => {
    if (!inputs) {
      alert("入力データが読み込めませんでした。ページをリロードしてください。");
      return;
    }
    setLoading(true);
    
    try {
      const payload = {
        pr_summary: inputs.pr_summary || '',
        episode: inputs.episode || '',
        policy: inputs.policy || '',
        occupation: inputs.occupation || '',
      };

      const res = await fetch('/api/ai/selfpr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.result) {
        setGeneratedPR(data.result);
        setStatusMessage('generated');
      } else {
        alert('AI生成に失敗しました');
      }

    } catch (error) {
      console.error(error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    const resumeId = getStorageItemWithLegacyFallback(BRAND_STORAGE_KEYS.resumeId.current, BRAND_STORAGE_KEYS.resumeId.legacy);
    if (!resumeId) return;

    try {
      const payload = {
        resume_id: resumeId,
        self_pr: generatedPR
      };

      const res = await fetch('/api/data/resume', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('保存失敗');
      setStatusMessage('saved');
      router.push('/cv/3');

    } catch {
      alert('保存に失敗しました');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">自己PRをAI生成して整える</h2>
      <p className="mb-4 text-xs text-gray-500">
        1) 生成 → 2) 編集 → 3) 保存して次へ、の順で進めます。
      </p>
      
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h3 className="font-bold text-sm mb-2 text-blue-800">1. AIで自己PRを生成</h3>
        <div className="text-xs mb-2 text-gray-500">
          認識されているエピソード文字数: {inputs?.episode?.length || 0}文字
        </div>
        <Button onClick={generateAI} isLoading={loading} size="sm" className="w-full sm:w-auto">
          ✨ AIで自己PRを生成する
        </Button>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-700">2. 生成結果を編集</p>
          <p className="text-xs text-gray-500">
            {statusMessage === 'loaded' && '保存済みの自己PRを読み込みました'}
            {statusMessage === 'generated' && '新しく生成しました。保存して反映してください'}
            {statusMessage === 'unsaved' && '未保存の変更があります'}
            {statusMessage === 'saved' && '保存済みです'}
            {!statusMessage && '未生成です。まずAI生成を実行してください'}
          </p>
        </div>
        <textarea 
          className="w-full p-4 border rounded-md h-64"
          value={generatedPR}
          onChange={(e) => {
            setGeneratedPR(e.target.value);
            setStatusMessage('unsaved');
          }}
          placeholder="AI生成結果がここに表示されます..."
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>戻る</Button>
        <Button onClick={onSave} disabled={!generatedPR}>3. 保存して次へ</Button>
      </div>
    </div>
  );
}
