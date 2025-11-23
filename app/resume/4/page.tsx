'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';

type Work = {
  id?: string;
  company_name: string;
  department?: string;
  position?: string;
  start_year: number;
  start_month: number;
  end_year?: number;
  end_month?: number;
  is_current?: boolean;
  description?: string;
};

export default function ResumeStep4() {
  const router = useRouter();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Work>({
    defaultValues: { 
      start_year: 2015, start_month: 4, 
      end_year: 2020, end_month: 3, 
      is_current: false 
    }
  });

  const isCurrent = watch('is_current');

  useEffect(() => {
    const resumeId = localStorage.getItem('carrimy_resume_id');
    if (!resumeId) {
      router.push('/resume/1');
      return;
    }
    fetch('/api/data/resume?id=' + resumeId)
      .then(res => res.json())
      .then(data => {
        if (data.works) setWorks(data.works);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const onAdd = async (data: Work) => {
    const resumeId = localStorage.getItem('carrimy_resume_id');
    if(!resumeId) return;

    try {
      const payload = { ...data, resume_id: resumeId };
      const res = await fetch('/api/data/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('追加失敗');
      
      const saved = await res.json();
      setWorks([...works, { ...data, id: saved.id }]);
      reset();

    } catch (error) {
      alert('追加に失敗しました');
    }
  };

  const onDelete = async (id: string) => {
    if(!confirm('削除しますか？')) return;
    try {
      await fetch('/api/data/work?id=' + id, { method: 'DELETE' });
      setWorks(works.filter(w => w.id !== id));
    } catch (error) {
      alert('削除失敗');
    }
  };

  const onNext = () => {
    router.push('/resume/5');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">職歴の入力</h2>
      
      {/* 登録済みリスト */}
      <div className="mb-8 space-y-4">
        {works.length === 0 && <p className="text-gray-500">職歴はまだ登録されていません。</p>}
        
        {works.map((work) => (
          <div key={work.id} className="p-4 border rounded bg-gray-50 relative">
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => work.id && onDelete(work.id)} 
                className="absolute top-4 right-4 text-red-600 border-red-200"
              >
              削除
            </Button>
            <div className="font-bold text-lg mb-1">{work.company_name}</div>
            <div className="text-sm text-gray-600 mb-2">
              {work.department} / {work.position}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {work.start_year}年{work.start_month}月 〜 {work.is_current ? '現在' : `${work.end_year}年${work.end_month}月`}
            </div>
            {work.description && (
              <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-100 whitespace-pre-wrap">
                {work.description}
              </p>
            )}
          </div>
        ))}
      </div>

      <hr className="my-6" />

      {/* 新規追加フォーム */}
      <div className="bg-blue-50 p-5 rounded-md mb-6">
        <h3 className="font-bold text-sm mb-4 text-blue-800">職歴を追加する</h3>
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">企業名</label>
              <input {...register('company_name', { required: true })} className="w-full p-2 border rounded text-sm" placeholder="株式会社〇〇" />
              {errors.company_name && <span className="text-red-500 text-xs">必須です</span>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">部署名</label>
              <input {...register('department')} className="w-full p-2 border rounded text-sm" placeholder="営業部" />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-600 mb-1">役職</label>
             <input {...register('position')} className="w-full p-2 border rounded text-sm" placeholder="メンバー" />
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">入社</label>
              <div className="flex gap-1">
                <input type="number" {...register('start_year', { valueAsNumber: true })} className="w-16 p-2 border rounded text-sm" />
                <span className="self-center text-xs">年</span>
                <input type="number" {...register('start_month', { valueAsNumber: true })} className="w-12 p-2 border rounded text-sm" />
                <span className="self-center text-xs">月</span>
              </div>
            </div>
            <span className="mb-3">〜</span>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">退社</label>
              <div className="flex gap-1 items-center">
                 {!isCurrent ? (
                   <>
                    <input type="number" {...register('end_year', { valueAsNumber: true })} className="w-16 p-2 border rounded text-sm" />
                    <span className="self-center text-xs">年</span>
                    <input type="number" {...register('end_month', { valueAsNumber: true })} className="w-12 p-2 border rounded text-sm" />
                    <span className="self-center text-xs">月</span>
                   </>
                 ) : (
                   <span className="text-sm font-bold text-green-600 px-2">現在在籍中</span>
                 )}
              </div>
            </div>
            <div className="mb-2">
              <label className="flex items-center text-xs cursor-pointer">
                <input type="checkbox" {...register('is_current')} className="mr-1" />
                現在在籍中
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">業務内容詳細 (AI自己PR生成に使われます)</label>
            <textarea {...register('description')} className="w-full p-2 border rounded text-sm h-24" placeholder="法人営業を担当。新規開拓を中心に..." />
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="primary">職歴を追加</Button>
          </div>
        </form>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>戻る</Button>
        <Button onClick={onNext} disabled={works.length === 0}>次へ進む</Button>
      </div>
    </div>
  );
}
