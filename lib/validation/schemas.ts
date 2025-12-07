import { z } from 'zod';

// 基本情報 + ステップ2以降 + AI生成テキスト
const optionalString = (max: number) =>
  z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().max(max).optional().nullable()
  );

const optionalEmail = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().email().max(254).optional().nullable()
);

export const ResumeSchema = z.object({
  // 必須系
  user_id: z.string().min(1, "User ID is required"),
  resume_id: z.string().optional(), // 更新時に必要
  title: z.string().optional(),
  
  // Step 1
  last_name_kanji: z.string().min(1, "姓を入力してください"),
  first_name_kanji: z.string().min(1, "名を入力してください"),
  last_name_kana: z.string().optional(),
  first_name_kana: z.string().optional(),
  dob_year: z.number().min(1900).max(new Date().getFullYear()),
  dob_month: z.number().min(1).max(12),
  dob_day: z.number().min(1).max(31),
  gender: z.string().optional(),
  email: z.string().optional(),
  postal_code: z.string().optional(),
  address_prefecture: z.string().optional(),
  address_city: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  phone_number: z.string().optional(),
  contactAddress: optionalString(200),
  contactPhone: optionalString(50),
  contactEmail: optionalEmail,
  dependents_count: z.string().optional(),
  has_spouse: z.boolean().optional(),
  spouse_is_dependent: z.boolean().optional(),

  // Step 2: 状況
  job_change_count: z.number().optional(),
  current_status: z.string().optional(),
  desired_joining_date: z.string().optional(),

  // Step 5: 希望条件
  desired_occupations: z.array(z.string()).optional(),
  desired_industries: z.array(z.string()).optional(),
  desired_locations: z.array(z.string()).optional(),
  licenses_qualifications: z.array(z.string()).optional(),

  // Step 3+ : AI生成の活かせる経験・知識
  transferable_skills: z.string().optional(),

  // ★追加: AI生成テキスト (ここがないと保存時に消されてしまう)
  self_pr: z.string().optional(),
  summary: z.string().optional(),
});

// 学歴
export const EducationSchema = z.object({
  resume_id: z.string().min(1),
  school_name: z.string().min(1, "学校名を入力してください"),
  department: z.string().optional(),
  degree: z.string().optional(),
  start_year: z.number().min(1900),
  start_month: z.number().min(1).max(12),
  end_year: z.number().optional(),
  end_month: z.number().optional(),
  is_current: z.boolean().optional(),
});

// 職歴
export const WorkSchema = z.object({
  resume_id: z.string().min(1),
  company_name: z.string().min(1, "企業名を入力してください"),
  department: z.string().optional(),
  position: z.string().optional(),
  start_year: z.number().min(1900),
  start_month: z.number().min(1).max(12),
  end_year: z.number().optional(),
  end_month: z.number().optional(),
  is_current: z.boolean().optional(),
  description: z.string().optional(),
});
