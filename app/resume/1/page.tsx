'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResumeSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/form/Input';

const formSchema = ResumeSchema.omit({ user_id: true });

type FormData = z.infer<typeof formSchema>;

const defaultValues: Partial<FormData> = {
  dob_year: 1990,
  dob_month: 1,
  dob_day: 1,
  gender: '男性',
  last_name_kana: '',
  first_name_kana: '',
  postal_code: '',
  address_prefecture: '',
  address_city: '',
  address_line1: '',
  address_line2: '',
  phone_number: '',
  contactAddress: '',
  contactPhone: '',
  contactEmail: '',
  dependents_count: '',
  has_spouse: false,
  spouse_is_dependent: false,
  email: '',
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

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const hasSpouse = watch('has_spouse');
  const [useSeparateContact, setUseSeparateContact] = useState(false);

  useEffect(() => {
    const resumeId = localStorage.getItem('carrimy_resume_id');
    if (!resumeId) return;

    const loadResume = async () => {
      try {
        const res = await fetch('/api/data/resume?id=' + resumeId);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.resume) return;

        const resume = data.resume;
        reset({
          ...defaultValues,
          resume_id: resume.resume_id,
          last_name_kanji: resume.last_name_kanji ?? '',
          first_name_kanji: resume.first_name_kanji ?? '',
          last_name_kana: resume.last_name_kana ?? '',
          first_name_kana: resume.first_name_kana ?? '',
          dob_year: resume.dob_year ?? defaultValues.dob_year ?? 1990,
          dob_month: resume.dob_month ?? defaultValues.dob_month ?? 1,
          dob_day: resume.dob_day ?? defaultValues.dob_day ?? 1,
          gender: resume.gender ?? defaultValues.gender ?? '男性',
          postal_code: resume.postal_code ?? '',
          address_prefecture: resume.address_prefecture ?? '',
          address_city: resume.address_city ?? '',
          address_line1: resume.address_line1 ?? '',
          address_line2: resume.address_line2 ?? '',
          phone_number: resume.phone_number ?? '',
          dependents_count: resume.dependents_count ?? '',
          has_spouse: resume.has_spouse ?? false,
          spouse_is_dependent: resume.spouse_is_dependent ?? false,
          email: resume.email ?? '',
          contactAddress: resume.contactAddress ?? '',
          contactPhone: resume.contactPhone ?? '',
          contactEmail: resume.contactEmail ?? '',
        });

        const hasSeparateContact =
          !!resume.contactAddress?.trim() ||
          !!resume.contactPhone?.trim() ||
          !!resume.contactEmail?.trim();
        setUseSeparateContact(hasSeparateContact);
      } catch (error) {
        console.error('Failed to load resume', error);
      }
    };

    loadResume();
  }, [reset]);

  const handleSeparateContactChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setUseSeparateContact(enabled);

    if (!enabled) {
      setValue('contactAddress', '');
      setValue('contactPhone', '');
      setValue('contactEmail', '');
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const payload = {
        ...data,
        user_id: getUserId(),
        title: `${data.last_name_kanji}さんの履歴書`,
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="姓 (カナ)"
            {...register('last_name_kana')}
            error={errors.last_name_kana?.message}
            placeholder="ヤマダ"
          />
          <Input
            label="名 (カナ)"
            {...register('first_name_kana')}
            error={errors.first_name_kana?.message}
            placeholder="タロウ"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">生年月日</label>
          <div className="flex flex-wrap gap-3">
            <div className="w-28 flex-1 min-w-[5rem] max-w-[7rem]">
              <input
                type="number"
                {...register('dob_year', { valueAsNumber: true })}
                className="w-full rounded border px-3 py-2"
              />
              <span className="text-xs text-gray-500">年</span>
            </div>
            <div className="w-24 flex-1 min-w-[4.5rem] max-w-[6rem]">
              <input
                type="number"
                {...register('dob_month', { valueAsNumber: true })}
                className="w-full rounded border px-3 py-2"
              />
              <span className="text-xs text-gray-500">月</span>
            </div>
            <div className="w-24 flex-1 min-w-[4.5rem] max-w-[6rem]">
              <input
                type="number"
                {...register('dob_day', { valueAsNumber: true })}
                className="w-full rounded border px-3 py-2"
              />
              <span className="text-xs text-gray-500">日</span>
            </div>
          </div>
          {errors.dob_year && <p className="mt-1 text-sm text-red-500">正しい日付を入力してください</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
          <select {...register('gender')} className="w-full px-3 py-2 border rounded bg-white">
            <option value="男性">男性</option>
            <option value="女性">女性</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="郵便番号"
            {...register('postal_code')}
            error={errors.postal_code?.message}
            placeholder="0600001"
          />
          <Input
            label="都道府県"
            {...register('address_prefecture')}
            error={errors.address_prefecture?.message}
            placeholder="北海道"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="市区町村"
            {...register('address_city')}
            error={errors.address_city?.message}
            placeholder="札幌市中央区"
          />
          <Input
            label="番地・建物名"
            {...register('address_line1')}
            error={errors.address_line1?.message}
            placeholder="北1条西3丁目 ○○ビル 5F"
          />
        </div>

        <Input
          label="建物名・部屋番号など（任意）"
          {...register('address_line2')}
          error={errors.address_line2?.message}
          placeholder="101号室"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="メールアドレス"
            {...register('email')}
            error={errors.email?.message}
            placeholder="example@mail.com"
            type="email"
          />
          <Input
            label="電話番号"
            {...register('phone_number')}
            error={errors.phone_number?.message}
            placeholder="09012345678"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="use_separate_contact"
              checked={useSeparateContact}
              onChange={handleSeparateContactChange}
            />
            <label htmlFor="use_separate_contact" className="text-sm font-medium text-gray-700">
              現住所と異なる連絡先を登録する
            </label>
          </div>

          {useSeparateContact && (
            <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">連絡先住所</label>
                <textarea
                  {...register('contactAddress')}
                  className="w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                {errors.contactAddress?.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactAddress.message}</p>
                )}
              </div>

              <Input
                label="連絡先電話番号"
                {...register('contactPhone')}
                error={errors.contactPhone?.message}
                placeholder="0312345678"
              />

              <Input
                label="連絡先メールアドレス"
                {...register('contactEmail')}
                error={errors.contactEmail?.message}
                placeholder="contact@example.com"
                type="email"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">扶養家族数（配偶者を除く）</label>
          <select {...register('dependents_count')} className="w-full px-3 py-2 border rounded bg-white">
            <option value="">選択してください</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5+">5+</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">家族・扶養</label>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="has_spouse" {...register('has_spouse')} />
            <label htmlFor="has_spouse" className="text-sm">
              配偶者の有無
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="spouse_is_dependent"
              {...register('spouse_is_dependent')}
              disabled={!hasSpouse}
            />
            <label
              htmlFor="spouse_is_dependent"
              className={`text-sm ${!hasSpouse ? 'text-gray-400' : ''}`}
            >
              配偶者を扶養に入れている
            </label>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" isLoading={isSubmitting}>
            保存して次へ進む
          </Button>
        </div>
      </form>
    </div>
  );
}
