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
