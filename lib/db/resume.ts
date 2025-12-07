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
  profilePhoto?: AirtableAttachment[];
  profilePhotoUrl?: string | null;
};

type ResumeUpdateFields = Partial<Omit<Resume, 'id' | 'createdTime'>>;

const airtableContactFieldMap: Record<string, string> = {
  contactAddress: 'contact_address',
  contactPhone: 'contact_phone',
  contactEmail: 'contact_email',
};

export function mapAirtableResume(record: Airtable.Record<Airtable.FieldSet>): Resume {
  const fields = record.fields as Airtable.FieldSet & {
    profilePhoto?: AirtableAttachment[];
    profilePhotoUrl?: string;
    contact_address?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
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
  const profilePhotoUrl = urlFromField ?? attachments[0]?.url ?? null;

  return {
    id: record.id,
    ...(restFields as Resume),
    contactAddress: contactAddress ?? undefined,
    contactPhone: contactPhone ?? undefined,
    contactEmail: contactEmail ?? undefined,
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
