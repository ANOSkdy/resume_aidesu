'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResumeSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/form/Input';

type FormData = {
  last_name_kanji: string;
  first_name_kanji: string;
  dob_year: number;
  dob_month: number;
  dob_day: number;
  gender: string;
};

export default function ResumeStep1() {
  const router = useRouter();
  
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      let uid = localStorage.getItem('carrimy_uid');
      if (!uid) {
        uid = 'usr_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('carrimy_uid', uid);
      }
      return uid;
    }
    return 'usr_guest';
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    // @ts-ignore
    resolver: zodResolver(ResumeSchema.omit({ user_id: true })), 
    defaultValues: {
      dob_year: 1990,
      dob_month: 1,
      dob_day: 1,
      gender: '男性'
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // 修正箇所: テンプレートリテラルをやめて、文字列連結に変更
      const payload = {
        ...data,
        user_id: getUserId(),
        title: data.last_name_kanji + 'さんの履歴書' 
      };

      const res = await fetch('/api/data/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '保存に失敗しました');
      }
      
      const json = await res.json();
      console.log('Saved:', json);

      localStorage.setItem('carrimy_resume_id', json.record.resume_id);
      router.push('/resume/2');

    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">基本情報の入力</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="姓 (漢字)" 
            {...register('last_name_kanji')} 
            error={errors.last_name_kanji?.message}
            placeholder="山田"
          />
          <Input 
            label="名 (漢字)" 
            {...register('first_name_kanji')} 
            error={errors.first_name_kanji?.message}
            placeholder="太郎"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
          <div className="flex gap-4">
            <div className="w-24">
              <input type="number" {...register('dob_year', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded" />
              <span className="text-xs text-gray-500">年</span>
            </div>
            <div className="w-20">
              <input type="number" {...register('dob_month', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded" />
              <span className="text-xs text-gray-500">月</span>
            </div>
            <div className="w-20">
              <input type="number" {...register('dob_day', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded" />
              <span className="text-xs text-gray-500">日</span>
            </div>
          </div>
          {errors.dob_year && <p className="text-sm text-red-500 mt-1">正しい日付を入力してください</p>}
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
           <select {...register('gender')} className="w-full px-3 py-2 border rounded bg-white">
             <option value="男性">男性</option>
             <option value="女性">女性</option>
             <option value="その他">その他</option>
           </select>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" isLoading={isSubmitting}>
            保存して次へ進む
          </Button>
        </div>
      </form>
    </div>
  );
}
