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

export function mapAirtableResume(record: Airtable.Record<Airtable.FieldSet>): Resume {
  const fields = record.fields as unknown as Resume & {
    profilePhoto?: AirtableAttachment[];
  };

  const urlFromField =
    typeof fields.profilePhotoUrl === 'string' ? fields.profilePhotoUrl : undefined;
  const attachments = Array.isArray(fields.profilePhoto)
    ? fields.profilePhoto
    : [];
  const profilePhotoUrl = urlFromField ?? attachments[0]?.url ?? null;

  return {
    id: record.id,
    ...fields,
    profilePhotoUrl,
  };
}

export async function updateResumeFields(
  recordId: string,
  fields: ResumeUpdateFields
): Promise<Resume> {
  const db = getDb();
  const sanitizedFields = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );

  const updatedRecords = (await db.resumes.update(
    [
      {
        id: recordId,
        fields: sanitizedFields,
      },
    ],
    { typecast: true }
  )) as Airtable.Records<Airtable.FieldSet>;

  const record = Array.isArray(updatedRecords)
    ? updatedRecords[0]
    : (updatedRecords as Airtable.Record<Airtable.FieldSet>);

  return mapAirtableResume(record);
}
