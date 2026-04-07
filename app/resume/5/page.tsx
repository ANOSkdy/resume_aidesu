'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { TagSelector } from '@/components/ui/TagSelector';
import { ensureResumeId, saveResumePatchInBackground } from '@/lib/storage/resume-save';

type FormData = {
  job_change_count: number;
  current_status: string;
  desired_joining_date: string;
  desired_occupations: string[];
  desired_industries: string[];
  desired_locations: string[];
  licenses_qualifications: string[];
};

export default function ResumeStep5() {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      job_change_count: 0,
      current_status: '在職中',
      desired_joining_date: 'すぐにでも',
      desired_occupations: [],
      desired_industries: [],
      desired_locations: [],
      licenses_qualifications: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    const resumeId = ensureResumeId();
    if (!resumeId) return;

    saveResumePatchInBackground({
      resume_id: resumeId,
      ...data,
      step5_complete: true,
    });

    router.push('/cv/1');
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">現在の状況・希望条件</h2>
      <p className="text-sm text-gray-500 mb-6">先に現在の状況を入力し、そのあと希望条件を選択してください。</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-base font-bold text-gray-800">現在の状況</h3>
          <div>
            <label className="block text-sm font-medium mb-2">これまでの転職回数</label>
            <input
              type="number"
              {...register('job_change_count', { valueAsNumber: true })}
              className="w-24 px-3 py-2 border rounded"
              min={0}
            />{' '}
            回
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">現在の就業状況</label>
            <select {...register('current_status')} className="w-full px-3 py-2 border rounded bg-white">
              <option value="在職中">在職中 (現職で働いている)</option>
              <option value="離職中">離職中 (仕事はしていない)</option>
              <option value="学生">学生</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">入社希望時期</label>
            <select {...register('desired_joining_date')} className="w-full px-3 py-2 border rounded bg-white">
              <option value="すぐにでも">すぐにでも</option>
              <option value="3ヶ月以内">3ヶ月以内</option>
              <option value="半年以内">半年以内</option>
              <option value="未定">未定</option>
            </select>
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-800">希望条件</h3>
            <p className="text-xs text-gray-500 mt-1">希望職種・勤務地を優先して入力してください（各項目 最大3つ）。</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">希望職種（優先）</label>
            <div className="bg-gray-50 p-4 rounded border">
              <Controller
                name="desired_occupations"
                control={control}
                render={({ field }) => (
                  <TagSelector category="occupation" selected={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">希望勤務地（優先）</label>
            <div className="bg-gray-50 p-4 rounded border">
              <Controller
                name="desired_locations"
                control={control}
                render={({ field }) => <TagSelector category="location" selected={field.value} onChange={field.onChange} />}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">希望業界（任意）</label>
            <div className="bg-gray-50 p-4 rounded border">
              <Controller
                name="desired_industries"
                control={control}
                render={({ field }) => <TagSelector category="industry" selected={field.value} onChange={field.onChange} />}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">資格・免許（任意）</label>
            <div className="bg-gray-50 p-4 rounded border">
              <Controller
                name="licenses_qualifications"
                control={control}
                render={({ field }) => <TagSelector category="license" selected={field.value} onChange={field.onChange} />}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            戻る
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            入力を完了してCV作成へ
          </Button>
        </div>
      </form>
    </div>
  );
}
