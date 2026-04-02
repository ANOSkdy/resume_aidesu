import { randomUUID } from 'crypto';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db/postgres';
import { ResumeSchema } from '@/lib/validation/schemas';

type BaseResume = z.infer<typeof ResumeSchema>;

export type Resume = BaseResume & {
  id?: string;
  createdTime?: string;
  profilePhoto?: string;
  profilePhotoUrl?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ResumeUpdateFields = Partial<Omit<Resume, 'id' | 'createdTime'>>;

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const toNullableUuid = (value: unknown) => {
  if (typeof value !== 'string') return null;
  return isUuid(value) ? value : null;
};

const mapDbResume = (row: Record<string, unknown>): Resume => {
  const baseResume = ResumeSchema.parse({
    user_id: typeof row.user_id === 'string' ? row.user_id : '00000000-0000-0000-0000-000000000000',
    resume_id: row.resume_id,
    title: row.title,
    last_name_kanji: row.last_name_kanji,
    first_name_kanji: row.first_name_kanji,
    last_name_kana: row.last_name_kana,
    first_name_kana: row.first_name_kana,
    dob_year: row.dob_year,
    dob_month: row.dob_month,
    dob_day: row.dob_day,
    gender: row.gender,
    email: row.email,
    postal_code: row.postal_code,
    address_prefecture: row.address_prefecture,
    address_city: row.address_city,
    address_line1: row.address_line1,
    address_line2: row.address_line2,
    phone_number: row.phone_number,
    contactAddress: row.contact_address,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    dependents_count: row.dependents_count,
    has_spouse: row.has_spouse,
    spouse_is_dependent: row.spouse_is_dependent,
    job_change_count: row.job_change_count,
    current_status: row.current_status,
    desired_joining_date: row.desired_joining_date,
    transferable_skills: row.transferable_skills,
    self_pr: row.self_pr,
    summary: row.summary,
  });

  return {
    id: typeof row.id === 'string' ? row.id : undefined,
    ...baseResume,
    user_id: typeof row.user_id === 'string' ? row.user_id : baseResume.user_id,
    profilePhotoUrl: typeof row.profile_photo_url === 'string' ? row.profile_photo_url : null,
    profilePhoto: typeof row.profile_photo_url === 'string' ? row.profile_photo_url : undefined,
    createdTime: typeof row.created_at === 'string' ? row.created_at : undefined,
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : undefined,
  };
};

export function mapAirtableResume(record: Record<string, unknown>): Resume {
  return mapDbResume(record);
}

export function mapResumeToAirtableFields(fields: ResumeUpdateFields): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === 'contactAddress') mapped.contact_address = value;
    else if (key === 'contactPhone') mapped.contact_phone = value;
    else if (key === 'contactEmail') mapped.contact_email = value;
    else if (key === 'profilePhotoUrl') mapped.profile_photo_url = value;
    else if (key === 'profilePhoto') {
      if (typeof value === 'string') mapped.profile_photo_url = value;
    } else {
      mapped[key] = value;
    }
  });

  return mapped;
}

const replaceDesiredConditions = async (
  client: { query: typeof query },
  resumePk: string,
  payload: ResumeUpdateFields
) => {
  const desiredConditionMap: Array<[keyof ResumeUpdateFields, string]> = [
    ['desired_occupations', 'occupation'],
    ['desired_industries', 'industry'],
    ['desired_locations', 'location'],
    ['licenses_qualifications', 'license'],
  ];

  const hasDesiredUpdate = desiredConditionMap.some(([key]) => Array.isArray(payload[key]));
  if (!hasDesiredUpdate) return;

  await client.query('delete from resume_desired_conditions where resume_pk = $1', [resumePk]);

  for (const [key, type] of desiredConditionMap) {
    const values = payload[key];
    if (!Array.isArray(values)) continue;

    for (let i = 0; i < values.length; i += 1) {
      const label = values[i];
      if (typeof label !== 'string' || !label.trim()) continue;

      await client.query(
        `insert into resume_desired_conditions (resume_pk, condition_type, label, sort_order)
         values ($1, $2, $3, $4)`,
        [resumePk, type, label.trim(), i]
      );
    }
  }
};

const loadDesiredConditions = async (resumePk: string) => {
  const { rows } = await query<{
    condition_type: string;
    label: string;
    sort_order: number;
  }>(
    `select condition_type, label, sort_order
     from resume_desired_conditions
     where resume_pk = $1
     order by condition_type asc, sort_order asc`,
    [resumePk]
  );

  const grouped = {
    desired_occupations: [] as string[],
    desired_industries: [] as string[],
    desired_locations: [] as string[],
    licenses_qualifications: [] as string[],
  };

  rows.forEach((row) => {
    if (row.condition_type === 'occupation') grouped.desired_occupations.push(row.label);
    if (row.condition_type === 'industry') grouped.desired_industries.push(row.label);
    if (row.condition_type === 'location') grouped.desired_locations.push(row.label);
    if (row.condition_type === 'license') grouped.licenses_qualifications.push(row.label);
  });

  return grouped;
};

export async function saveResumeDraft(payload: z.infer<typeof ResumeSchema>) {
  const values = mapResumeToAirtableFields(payload);
  const resumeId = typeof payload.resume_id === 'string' && payload.resume_id.trim()
    ? payload.resume_id.trim()
    : `res_${Date.now()}`;

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query<Record<string, unknown>>(
      `insert into resume_drafts (
        resume_id, user_id, title, status,
        last_name_kanji, first_name_kanji, last_name_kana, first_name_kana,
        dob_year, dob_month, dob_day, gender, email, phone_number,
        postal_code, address_prefecture, address_city, address_line1, address_line2,
        contact_address, contact_phone, contact_email,
        dependents_count, has_spouse, spouse_is_dependent,
        job_change_count, current_status, desired_joining_date,
        transferable_skills, self_pr, summary, profile_photo_url, updated_at
      ) values (
        $1, $2, $3, coalesce($4, 'draft'),
        $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22,
        $23, $24, $25,
        $26, $27, $28,
        $29, $30, $31, $32, now()
      )
      on conflict (resume_id)
      do update set
        user_id = excluded.user_id,
        title = excluded.title,
        last_name_kanji = excluded.last_name_kanji,
        first_name_kanji = excluded.first_name_kanji,
        last_name_kana = excluded.last_name_kana,
        first_name_kana = excluded.first_name_kana,
        dob_year = excluded.dob_year,
        dob_month = excluded.dob_month,
        dob_day = excluded.dob_day,
        gender = excluded.gender,
        email = excluded.email,
        phone_number = excluded.phone_number,
        postal_code = excluded.postal_code,
        address_prefecture = excluded.address_prefecture,
        address_city = excluded.address_city,
        address_line1 = excluded.address_line1,
        address_line2 = excluded.address_line2,
        contact_address = excluded.contact_address,
        contact_phone = excluded.contact_phone,
        contact_email = excluded.contact_email,
        dependents_count = excluded.dependents_count,
        has_spouse = excluded.has_spouse,
        spouse_is_dependent = excluded.spouse_is_dependent,
        job_change_count = excluded.job_change_count,
        current_status = excluded.current_status,
        desired_joining_date = excluded.desired_joining_date,
        transferable_skills = excluded.transferable_skills,
        self_pr = excluded.self_pr,
        summary = excluded.summary,
        profile_photo_url = coalesce(excluded.profile_photo_url, resume_drafts.profile_photo_url),
        updated_at = now()
      returning *`,
      [
        resumeId,
        toNullableUuid(values.user_id),
        values.title ?? null,
        values.status ?? null,
        values.last_name_kanji,
        values.first_name_kanji,
        values.last_name_kana ?? null,
        values.first_name_kana ?? null,
        values.dob_year ?? null,
        values.dob_month ?? null,
        values.dob_day ?? null,
        values.gender ?? null,
        values.email ?? null,
        values.phone_number ?? null,
        values.postal_code ?? null,
        values.address_prefecture ?? null,
        values.address_city ?? null,
        values.address_line1 ?? null,
        values.address_line2 ?? null,
        values.contact_address ?? null,
        values.contact_phone ?? null,
        values.contact_email ?? null,
        values.dependents_count ?? null,
        values.has_spouse ?? null,
        values.spouse_is_dependent ?? null,
        values.job_change_count ?? null,
        values.current_status ?? null,
        values.desired_joining_date ?? null,
        values.transferable_skills ?? null,
        values.self_pr ?? null,
        values.summary ?? null,
        values.profile_photo_url ?? null,
      ]
    );

    const row = rows[0];
    if (!row || typeof row.id !== 'string') {
      throw new Error('Failed to save resume');
    }

    await replaceDesiredConditions(client, row.id, payload);

    return row;
  });

  const desired = await loadDesiredConditions(String(result.id));
  return mapDbResume({ ...result, ...desired });
}

export async function updateResumeFields(resumeIdentifier: string, fields: ResumeUpdateFields): Promise<Resume> {
  const values = mapResumeToAirtableFields(fields);
  const profileUrl =
    typeof values.profile_photo_url === 'string'
      ? values.profile_photo_url
      : Array.isArray(fields.profilePhoto)
        ? ((fields.profilePhoto[0] as { url?: string } | undefined)?.url ?? null)
        : null;

  const where = isUuid(resumeIdentifier) ? 'id = $1' : 'resume_id = $1';

  const { rows } = await query<Record<string, unknown>>(
    `update resume_drafts
     set profile_photo_url = coalesce($2, profile_photo_url),
         updated_at = now()
     where ${where}
     returning *`,
    [resumeIdentifier, profileUrl]
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Resume not found for profile photo update');
  }

  const desired = await loadDesiredConditions(String(row.id));
  return mapDbResume({ ...row, ...desired });
}

export type ResumeListItem = {
  resume_id: string;
  nameKanji: string;
  furigana: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  currentStatus?: string | null;
  addressCity?: string | null;
};

type ResumeListParams = {
  pageSize: number;
  cursor?: string | null;
  q?: string | null;
  sort?: 'updated_at' | 'created_at';
};

export type ResumeBundle = {
  resume: Resume;
  educations: Array<{ id: string; [key: string]: unknown }>;
  works: Array<{ id: string; [key: string]: unknown }>;
};

export async function listResumes({
  pageSize,
  cursor,
  q,
  sort = 'updated_at',
}: ResumeListParams): Promise<{
  data: ResumeListItem[];
  nextCursor: string | null;
  pageSize: number;
}> {
  const safePageSize = Math.min(Math.max(pageSize, 1), 100);
  const offset = Number(cursor ?? '0');
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? Math.floor(offset) : 0;
  const sortField = sort === 'created_at' ? 'created_at' : 'updated_at';

  const params: unknown[] = [safePageSize + 1, safeOffset];
  const whereSql = q?.trim()
    ? `where concat_ws(' ',
      coalesce(last_name_kanji, ''),
      coalesce(first_name_kanji, ''),
      coalesce(contact_email, ''),
      coalesce(email, ''),
      coalesce(contact_phone, ''),
      coalesce(phone_number, '')
    ) ilike $3`
    : '';

  if (q?.trim()) params.push(`%${q.trim()}%`);

  const { rows } = await query<Record<string, unknown>>(
    `select * from resume_drafts
     ${whereSql}
     order by ${sortField} desc nulls last, resume_id asc
     limit $1 offset $2`,
    params
  );

  const hasNext = rows.length > safePageSize;
  const slice = hasNext ? rows.slice(0, safePageSize) : rows;

  return {
    data: slice.map((row) => {
      const resume = mapDbResume(row);
      return {
        resume_id: resume.resume_id || String(row.resume_id || ''),
        nameKanji: [resume.last_name_kanji, resume.first_name_kanji].filter(Boolean).join(' ').trim(),
        furigana: [resume.last_name_kana, resume.first_name_kana].filter(Boolean).join(' ').trim(),
        contactEmail: resume.contactEmail ?? resume.email ?? null,
        contactPhone: resume.contactPhone ?? resume.phone_number ?? null,
        currentStatus: resume.current_status ?? null,
        addressCity: resume.address_city ?? null,
      };
    }),
    nextCursor: hasNext ? String(safeOffset + safePageSize) : null,
    pageSize: safePageSize,
  };
}

const getResumeRowByIdentifier = async (resumeId: string) => {
  const where = isUuid(resumeId) ? 'id = $1 or resume_id = $1' : 'resume_id = $1';
  const { rows } = await query<Record<string, unknown>>(
    `select * from resume_drafts where ${where} limit 1`,
    [resumeId]
  );
  return rows[0] ?? null;
};

export async function getResumeBundle(resumeId: string): Promise<ResumeBundle | null> {
  if (typeof resumeId !== 'string' || !resumeId.trim()) return null;

  const trimmedResumeId = resumeId.trim();
  const correlationId = randomUUID();

  const resumeRow = await getResumeRowByIdentifier(trimmedResumeId);
  if (!resumeRow || typeof resumeRow.id !== 'string') {
    console.warn('Resume not found', { correlationId, resumeId: trimmedResumeId });
    return null;
  }

  const [desired, educationsRes, worksRes] = await Promise.all([
    loadDesiredConditions(resumeRow.id),
    query<Record<string, unknown>>(
      `select id, school_name, department, degree, start_year, start_month, end_year, end_month, is_current
       from resume_educations
       where resume_pk = $1
       order by sort_order asc, start_year asc nulls last, start_month asc nulls last`,
      [resumeRow.id]
    ),
    query<Record<string, unknown>>(
      `select id, company_name, department, position, start_year, start_month, end_year, end_month, is_current, description
       from resume_works
       where resume_pk = $1
       order by sort_order asc, start_year asc nulls last, start_month asc nulls last`,
      [resumeRow.id]
    ),
  ]);

  return {
    resume: mapDbResume({ ...resumeRow, ...desired }),
    educations: educationsRes.rows
      .filter((row) => typeof row.id === 'string')
      .map((row) => ({ ...row, id: row.id as string })),
    works: worksRes.rows
      .filter((row) => typeof row.id === 'string')
      .map((row) => ({ ...row, id: row.id as string })),
  };
}

export async function createEducation(data: {
  resume_id: string;
  school_name: string;
  department?: string;
  degree?: string;
  start_year?: number;
  start_month?: number;
  end_year?: number;
  end_month?: number;
  is_current?: boolean;
}) {
  const resumeRow = await getResumeRowByIdentifier(data.resume_id);
  if (!resumeRow || typeof resumeRow.id !== 'string') {
    throw new Error('Resume not found');
  }

  const { rows } = await query<{ id: string }>(
    `insert into resume_educations (
      resume_pk, school_name, department, degree,
      start_year, start_month, end_year, end_month, is_current
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    returning id`,
    [
      resumeRow.id,
      data.school_name,
      data.department ?? null,
      data.degree ?? null,
      data.start_year ?? null,
      data.start_month ?? null,
      data.end_year ?? null,
      data.end_month ?? null,
      data.is_current ?? false,
    ]
  );

  return rows[0]?.id;
}

export async function deleteEducation(id: string) {
  await query('delete from resume_educations where id = $1', [id]);
}

export async function createWork(data: {
  resume_id: string;
  company_name: string;
  department?: string;
  position?: string;
  start_year?: number;
  start_month?: number;
  end_year?: number;
  end_month?: number;
  is_current?: boolean;
  description?: string;
}) {
  const resumeRow = await getResumeRowByIdentifier(data.resume_id);
  if (!resumeRow || typeof resumeRow.id !== 'string') {
    throw new Error('Resume not found');
  }

  const { rows } = await query<{ id: string }>(
    `insert into resume_works (
      resume_pk, company_name, department, position,
      start_year, start_month, end_year, end_month, is_current, description
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    returning id`,
    [
      resumeRow.id,
      data.company_name,
      data.department ?? null,
      data.position ?? null,
      data.start_year ?? null,
      data.start_month ?? null,
      data.end_year ?? null,
      data.end_month ?? null,
      data.is_current ?? false,
      data.description ?? null,
    ]
  );

  return rows[0]?.id;
}

export async function deleteWork(id: string) {
  await query('delete from resume_works where id = $1', [id]);
}
