import type Airtable from 'airtable';
import { z } from 'zod';
import { getDb } from '@/lib/db/airtable';
import { ResumeSchema } from '@/lib/validation/schemas';

type BaseResume = z.infer<typeof ResumeSchema>;

export type AirtableAttachment = {
  url: string;
  filename?: string;
  [key: string]: unknown;
};

export type Resume = BaseResume & {
  id?: string;
  createdTime?: string;
  profilePhoto?: AirtableAttachment[] | string;
  profilePhotoUrl?: string | null;
};

type ResumeUpdateFields = Partial<Omit<Resume, 'id' | 'createdTime'>>;

const airtableContactFieldMap: Record<string, string> = {
  contactAddress: 'contact_address',
  contactPhone: 'contact_phone',
  contactEmail: 'contact_email',
};

const extractId = (value: unknown): string | undefined => {
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' ? id : undefined;
  }
  return undefined;
};

const normalizeSingleTextField = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === 'string') return first;

    const firstId = extractId(first);
    if (firstId) return firstId;
  }

  return extractId(value);
};

const extractProfilePhotoUrlFromString = (value?: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  try {
    const parsed = JSON.parse(trimmedValue);

    if (typeof parsed === 'string' && /^https?:\/\//.test(parsed)) {
      return parsed;
    }

    if (parsed && typeof parsed === 'object') {
      if (!Array.isArray(parsed) && 'url' in parsed && typeof parsed.url === 'string') {
        return parsed.url;
      }

      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed[0] &&
        typeof parsed[0] === 'object' &&
        'url' in parsed[0] &&
        typeof (parsed[0] as { url?: unknown }).url === 'string'
      ) {
        return (parsed[0] as { url: string }).url;
      }
    }
  } catch (error) {
    // JSON.parse が失敗しても無視する
  }

  if (/^https?:\/\//.test(trimmedValue)) {
    return trimmedValue;
  }

  return null;
};

export function mapAirtableResume(record: Airtable.Record<Airtable.FieldSet>): Resume {
  const fields = record.fields as Airtable.FieldSet & {
    profilePhoto?: AirtableAttachment[] | string | null;
    profilePhotoUrl?: string;
    contact_address?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    user_id?: string | string[] | { id?: string }[];
    resume_id?: string | string[] | { id?: string }[];
    title?: string | string[] | { id?: string }[];
  };

  const {
    contact_address: contactAddress,
    contact_phone: contactPhone,
    contact_email: contactEmail,
    ...restFields
  } = fields;

  // プロフィール写真 URL を Attachments または URL フィールドから解決
  const urlFromField =
    typeof restFields.profilePhotoUrl === 'string' ? restFields.profilePhotoUrl : undefined;
  const attachments = Array.isArray(restFields.profilePhoto) ? restFields.profilePhoto : [];
  const profilePhotoString =
    !attachments.length && typeof restFields.profilePhoto === 'string'
      ? restFields.profilePhoto
      : undefined;
  const profilePhotoUrl = attachments.length
    ? urlFromField ?? attachments[0]?.url ?? null
    : urlFromField ?? extractProfilePhotoUrlFromString(profilePhotoString) ?? null;

  const baseResume = ResumeSchema.parse({
    ...restFields,
    user_id: normalizeSingleTextField(restFields.user_id),
    resume_id: normalizeSingleTextField(restFields.resume_id) ?? restFields.resume_id,
    title: normalizeSingleTextField(restFields.title) ?? restFields.title,
    contactAddress: contactAddress ?? undefined,
    contactPhone: contactPhone ?? undefined,
    contactEmail: contactEmail ?? undefined,
  });

  return {
    id: record.id,
    ...baseResume,
    profilePhoto: attachments.length ? attachments : profilePhotoString,
    profilePhotoUrl,
  };
}

export function mapResumeToAirtableFields(fields: ResumeUpdateFields): Partial<Airtable.FieldSet> {
  const mappedEntries = Object.entries(fields).map(([key, value]) => {
    const airtableKey = airtableContactFieldMap[key] ?? key;
    return [airtableKey, value];
  });

  return Object.fromEntries(
    mappedEntries.filter(([, value]) => value !== undefined && value !== null)
  ) as Partial<Airtable.FieldSet>;
}

export async function updateResumeFields(
  recordId: string,
  fields: ResumeUpdateFields
): Promise<Resume> {
  const db = getDb();
  const sanitizedFields = mapResumeToAirtableFields(fields);

  const updatedRecord = await db.resumes.update(recordId, sanitizedFields, {
    typecast: true,
  });

  return mapAirtableResume(updatedRecord);
}

export type ResumeListItem = {
  id: string;
  rid?: string;
  nameKanji: string;
  title?: string;
  contactEmail?: string;
  contactPhone?: string;
  currentStatus?: string;
  desiredRoles?: string[];
  desiredLocations?: string[];
  updatedAt?: string;
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

const escapeFormulaValue = (value: unknown) =>
  typeof value === 'string' ? value.replace(/'/g, "\\'") : '';

const buildSearchFormula = (query: string) => {
  const normalized = query.trim();
  if (!normalized) return undefined;
  const escaped = escapeFormulaValue(normalized.toLowerCase());
  const conditions = [
    `FIND(LOWER('${escaped}'), LOWER({last_name_kanji}))`,
    `FIND(LOWER('${escaped}'), LOWER({first_name_kanji}))`,
    `FIND(LOWER('${escaped}'), LOWER({contact_email}))`,
    `FIND(LOWER('${escaped}'), LOWER({email}))`,
    `FIND(LOWER('${escaped}'), LOWER({contact_phone}))`,
    `FIND(LOWER('${escaped}'), LOWER({phone_number}))`,
  ];

  return `OR(${conditions.join(',')})`;
};

const isInvalidFieldError = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('message' in error)) return false;
  const message = String((error as { message?: string }).message ?? '');
  return message.includes('INVALID_FIELD_NAME') || message.includes('Unknown field name');
};

const listRecordsWithOffset = async (
  params: Omit<ResumeListParams, 'sort'> & { sortField?: string }
) => {
  const db = getDb();
  const table = db.resumes as unknown as {
    _listRecords: (
      pageSize: number,
      offset: string | null,
      options: Record<string, unknown>,
      done: (
        err: Error | null,
        records?: Airtable.Record<Airtable.FieldSet>[],
        offset?: string
      ) => void
    ) => void;
  };

  const fields = [
    'user_id',
    'resume_id',
    'last_name_kanji',
    'first_name_kanji',
    'dob_year',
    'dob_month',
    'dob_day',
    'title',
    'contact_address',
    'contact_phone',
    'contact_email',
    'email',
    'phone_number',
    'current_status',
    'desired_occupations',
    'desired_locations',
    'profilePhoto',
    'updated_at',
    'created_at',
  ];

  const options: Record<string, unknown> = {
    fields,
  };

  if (params.q) {
    const formula = buildSearchFormula(params.q);
    if (formula) options.filterByFormula = formula;
  }

  if (params.sortField) {
    options.sort = [{ field: params.sortField, direction: 'desc' }];
  }

  return new Promise<{ records: Airtable.Record<Airtable.FieldSet>[]; offset?: string }>(
    (resolve, reject) => {
      table._listRecords(
        params.pageSize,
        params.cursor ?? null,
        options,
        (err, records, offset) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ records: records ?? [], offset });
        }
      );
    }
  );
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
  const sortField = sort === 'created_at' ? 'created_at' : 'updated_at';
  let result: { records: Airtable.Record<Airtable.FieldSet>[]; offset?: string };

  try {
    result = await listRecordsWithOffset({ pageSize, cursor, q, sortField });
  } catch (error) {
    if (sortField === 'updated_at' && isInvalidFieldError(error)) {
      result = await listRecordsWithOffset({ pageSize, cursor, q, sortField: 'created_at' });
    } else {
      throw error;
    }
  }

  const data = result.records.map((record) => {
    const resume = mapAirtableResume(record);
    const nameKanji = [resume.last_name_kanji, resume.first_name_kanji].filter(Boolean).join(' ');
    const fields = record.fields as Airtable.FieldSet & {
      updated_at?: string;
      updatedAt?: string;
      created_at?: string;
    };
    const updatedAt =
      fields.updated_at ??
      fields.updatedAt ??
      fields.created_at ??
      resume.createdTime ??
      (record as { createdTime?: string }).createdTime;

    return {
      id: resume.resume_id ?? record.id,
      rid: record.id,
      nameKanji: nameKanji || '未入力',
      title: resume.title,
      contactEmail: resume.contactEmail ?? resume.email,
      contactPhone: resume.contactPhone ?? resume.phone_number,
      currentStatus: resume.current_status,
      desiredRoles: resume.desired_occupations,
      desiredLocations: resume.desired_locations,
      updatedAt,
    };
  });

  return {
    data,
    nextCursor: result.offset ?? null,
    pageSize,
  };
}

export async function getResumeBundle(resumeId: string): Promise<ResumeBundle | null> {
  const db = getDb();
  const escaped = escapeFormulaValue(resumeId);
  const resumes = await db.resumes
    .select({
      filterByFormula: "{resume_id} = '" + escaped + "'",
      maxRecords: 1,
    })
    .firstPage();

  if (resumes.length === 0) return null;

  const resumeRecord = resumes[0];
  const [educations, works] = await Promise.all([
    db.educations.select({ filterByFormula: "{resume_id} = '" + escaped + "'" }).all(),
    db.works.select({ filterByFormula: "{resume_id} = '" + escaped + "'" }).all(),
  ]);

  return {
    resume: mapAirtableResume(resumeRecord),
    educations: educations.map((record) => ({ id: record.id, ...record.fields })),
    works: works.map((record) => ({ id: record.id, ...record.fields })),
  };
}
