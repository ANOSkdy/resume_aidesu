'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';

type FormData = {
  job_change_count: number;
  current_status: string;
  desired_joining_date: string;
};

export default function ResumeStep2() {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      job_change_count: 0,
      current_status: '在職中',
      desired_joining_date: 'すぐにでも'
    }
  });

  // TODO: 既存データがあればロードする処理を入れると親切

  const onSubmit = async (data: FormData) => {
    const resumeId = localStorage.getItem('carrimy_resume_id');
    if (!resumeId) {
      alert('履歴書IDが見つかりません。Step 1からやり直してください。');
      router.push('/resume/1');
      return;
    }

    try {
      // バリデーションを通すための必須項目ダミー + 更新データ
      // ※本来はPATCHメソッドで部分更新すべきですが、Phase 4の実装がUpsertなので
      // 既存データを取得してマージするか、必須チェックを緩める対応が必要です。
      // 今回は「必須フィールド(user_id等)を含めた更新」として送信します。
      
      const userId = localStorage.getItem('carrimy_uid') || 'guest';

      // Step 1の必須項目がバリデーションで弾かれないよう、API側が部分更新に対応しているか、
      // もしくはここで全データを送る必要があります。
      // 今回の Phase 4 API実装は "ResumeSchema.parse(body)" をしているので、
      // Step 1の必須項目(names)がないとエラーになります。
      
      // ★暫定対応: 一旦Step 1に戻らなくて済むよう、APIに送るデータにダミーを含めるか、
      // API側のバリデーションを「Partial」にする修正が理想です。
      // ここでは「APIから現在のデータを取得 → マージして保存」の流れを実装します。

      // 1. 現在のデータを取得
      const getRes = await fetch('/api/data/resume?id=' + resumeId);
      const currentData = await getRes.json();
      if (!currentData.resume) throw new Error('データ取得失敗');

      // 2. マージして送信
      const payload = {
        ...currentData.resume, // 既存データ(Step1の内容)
        user_id: userId,       // user_id再設定
        ...data,               // 今回の入力データ
      };
      
      // Airtableから来る不要なフィールドを除去 (id, createdTimeなど)
      delete payload.id;
      delete payload.createdTime;
      delete payload.fields; 

      const res = await fetch('/api/data/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '保存失敗');
      }

      router.push('/resume/3');

    } catch (error: any) {
      console.error(error);
      alert('保存に失敗しました: ' + error.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">現在の状況</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 転職回数 */}
        <div>
          <label className="block text-sm font-medium mb-2">これまでの転職回数</label>
          <input 
            type="number" 
            {...register('job_change_count', { valueAsNumber: true })}
            className="w-24 px-3 py-2 border rounded"
            min={0}
          /> 回
        </div>

        {/* 就業状況 */}
        <div>
          <label className="block text-sm font-medium mb-2">現在の就業状況</label>
          <select {...register('current_status')} className="w-full px-3 py-2 border rounded">
            <option value="在職中">在職中 (現職で働いている)</option>
            <option value="離職中">離職中 (仕事はしていない)</option>
            <option value="学生">学生</option>
          </select>
        </div>

        {/* 入社希望時期 */}
        <div>
          <label className="block text-sm font-medium mb-2">入社希望時期</label>
          <select {...register('desired_joining_date')} className="w-full px-3 py-2 border rounded">
            <option value="すぐにでも">すぐにでも</option>
            <option value="3ヶ月以内">3ヶ月以内</option>
            <option value="半年以内">半年以内</option>
            <option value="未定">未定</option>
          </select>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>戻る</Button>
          <Button type="submit">保存して次へ進む</Button>
        </div>
      </form>
    </div>
  );
}
