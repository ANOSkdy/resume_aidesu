import type Airtable from 'airtable';
import { z } from 'zod';
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

export function mapAirtableResume(record: Airtable.Record<Airtable.FieldSet>): Resume {
  const fields = record.fields as Resume & {
    profilePhoto?: AirtableAttachment[];
  };

  const attachments = Array.isArray(fields.profilePhoto)
    ? fields.profilePhoto
    : [];
  const profilePhotoUrl = attachments[0]?.url ?? null;

  return {
    id: record.id,
    ...fields,
    profilePhotoUrl,
  };
}
