'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { BRAND_STORAGE_KEYS, getStorageItemWithLegacyFallback } from '@/lib/storage/branding';

// 学歴データの型
type Education = {
  id?: string;
  school_name: string;
  department?: string;
  degree?: string;
  start_year: number;
  start_month: number;
  end_year?: number;
  end_month?: number;
};

export default function ResumeStep3() {
  const router = useRouter();
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSuccessMessage, setAddSuccessMessage] = useState('');

  // フォーム管理 (新規追加用)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Education>({
    defaultValues: { start_year: 2010, start_month: 4, end_year: 2014, end_month: 3 }
  });

  // 初期データ読み込み
  useEffect(() => {
    const resumeId = getStorageItemWithLegacyFallback(BRAND_STORAGE_KEYS.resumeId.current, BRAND_STORAGE_KEYS.resumeId.legacy);
    if (!resumeId) {
      router.push('/resume/1');
      return;
    }
    
    fetch('/api/data/education?resumeId=' + resumeId)
      .then(res => res.json())
      .then(data => {
        if (data.educations) {
          setEducations(data.educations);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  // 学歴追加処理
  const onAdd = async (data: Education) => {
    const resumeId = getStorageItemWithLegacyFallback(BRAND_STORAGE_KEYS.resumeId.current, BRAND_STORAGE_KEYS.resumeId.legacy);
    if(!resumeId) return;

    try {
      const payload = { ...data, resume_id: resumeId };
      const res = await fetch('/api/data/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('追加失敗');
      
      // リストを再取得するか、簡易的にstateに追加
      // ここでは簡易リロード
      const saved = await res.json();
      setEducations([...educations, { ...data, id: saved.id }]);
      reset(); // フォームクリア
      setAddSuccessMessage('学歴を追加しました。必要な分だけ入力したら次へ進めます。');

    } catch {
      alert('追加に失敗しました');
    }
  };

  // 削除処理
  const onDelete = async (id: string) => {
    if(!confirm('削除しますか？')) return;
    try {
      await fetch('/api/data/education?id=' + id, { method: 'DELETE' });
      setEducations(educations.filter(e => e.id !== id));
    } catch {
      alert('削除失敗');
    }
  };

  const onNext = () => {
    router.push('/resume/4');
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">学歴の入力</h2>
      <div className="wa-callout mb-4 space-y-1">
        <p>まずは最低1件の入力で次へ進めます。</p>
        <p>迷う場合は最新の学歴から入力してください。追加・削除はこの画面でいつでもできます。</p>
      </div>
      
      {/* 登録済みリスト */}
      <div className="mb-8 space-y-3">
        {loading && <p className="text-sm wa-muted">学歴を読み込み中...</p>}
        {!loading && educations.length === 0 && (
          <div className="rounded-md border border-dashed border-[var(--border)] bg-[color:color-mix(in_oklab,var(--surface-muted)_88%,white)] p-4 text-sm wa-muted">
            まだ学歴が登録されていません。下のフォームから最初の1件を追加しましょう。
          </div>
        )}
        
        {educations.map((edu) => (
          <div key={edu.id} className="p-4 border rounded bg-[color:color-mix(in_oklab,var(--surface-muted)_88%,white)] space-y-3">
            <div className="min-w-0 space-y-1">
              <div className="font-bold text-lg break-words">{edu.school_name}</div>
              <div className="text-sm wa-muted leading-tight break-words">
                {edu.department} {edu.degree ? `(${edu.degree})` : ''}
              </div>
              <div className="text-xs wa-muted">
                {edu.start_year}年{edu.start_month}月 〜 {edu.end_year ? `${edu.end_year}年${edu.end_month}月` : '現在'}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => edu.id && onDelete(edu.id)}
                className="w-auto min-h-[32px] h-auto border-akane/25 px-2 py-1 text-xs wa-danger"
              >
                削除
              </Button>
            </div>
          </div>
        ))}
      </div>

      <hr className="my-6" />

      {/* 新規追加フォーム */}
      <div className="bg-kinari p-4 rounded-md mb-6 border border-[var(--border)]">
        <h3 className="font-bold text-sm text-ai mb-1">次に、学歴を1件追加しましょう</h3>
        <p className="text-xs wa-muted mb-4">
          入力は学校名と在籍期間が中心でOKです。詳細は任意です。<br />
          ※最終学歴が〜高卒までは中学から、専門卒〜院卒は高校から記入<br />
          ※中途退学の場合は中途退学した学校まで記入
        </p>
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold wa-muted mb-1">学校名</label>
              <input {...register('school_name', { required: true })} className="w-full p-2 border rounded text-sm" placeholder="〇〇大学" />
              {errors.school_name && <span className="wa-danger text-xs">必須です</span>}
            </div>
            <div>
              <label className="block text-xs font-bold wa-muted mb-1">学部・学科</label>
              <input {...register('department')} className="w-full p-2 border rounded text-sm" placeholder="経済学部" />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold wa-muted mb-1">入学</label>
              <div className="flex gap-1">
                <input type="number" {...register('start_year', { valueAsNumber: true })} className="w-16 p-2 border rounded text-sm" />
                <span className="self-center text-xs">年</span>
                <input type="number" {...register('start_month', { valueAsNumber: true })} className="w-12 p-2 border rounded text-sm" />
                <span className="self-center text-xs">月</span>
              </div>
            </div>
            <span className="mb-3">〜</span>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold wa-muted mb-1">卒業</label>
              <div className="flex gap-1">
                <input type="number" {...register('end_year', { valueAsNumber: true })} className="w-16 p-2 border rounded text-sm" />
                <span className="self-center text-xs">年</span>
                <input type="number" {...register('end_month', { valueAsNumber: true })} className="w-12 p-2 border rounded text-sm" />
                <span className="self-center text-xs">月</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="primary">学歴を追加</Button>
          </div>
          {addSuccessMessage && (
            <p role="status" className="text-xs text-akane">{addSuccessMessage}</p>
          )}
        </form>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>戻る</Button>
        <Button onClick={onNext} disabled={educations.length === 0}>次へ進む</Button>
      </div>
    </div>
  );
}
