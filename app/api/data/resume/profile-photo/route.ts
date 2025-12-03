import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

function getExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  return '';
}

const airtableBaseId = process.env.AIRTABLE_BASE_ID;
const airtableApiKey = process.env.AIRTABLE_API_KEY;

function sanitizeFilename(name: string, ext: string) {
  const fallback = `profile-photo.${ext || 'img'}`;
  if (!name) return fallback;
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (ext && !cleaned.endsWith(`.${ext}`)) {
    return `${cleaned}.${ext}`;
  }
  return cleaned;
}

async function updateAirtableProfilePhoto(resumeId: string, url: string, filename: string) {
  if (!airtableBaseId || !airtableApiKey) {
    throw new Error('Airtable credentials are missing');
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${encodeURIComponent(airtableBaseId)}/Resumes/${encodeURIComponent(resumeId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          profilePhoto: [
            {
              url,
              filename,
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable update failed (${response.status}): ${errorText}`);
  }
}

export async function POST(request: Request) {
  let resumeIdValue: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const resumeId = formData.get('resumeId');

    if (typeof resumeId === 'string') {
      resumeIdValue = resumeId;
    }

    if (!resumeId || typeof resumeId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'RESUME_ID_REQUIRED' },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'FILE_REQUIRED' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    const extension = getExtension(file.type);
    const safeFilename = sanitizeFilename(file.name || '', extension);
    const pathname = `resume-profile-photos/${encodeURIComponent(resumeId)}-${Date.now()}.${
      extension || 'img'
    }`;

    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
    });

    await updateAirtableProfilePhoto(resumeId, blob.url, safeFilename);

    return NextResponse.json({ ok: true, profilePhotoUrl: blob.url });
  } catch (error) {
    console.error('Profile photo upload error:', { resumeId: resumeIdValue, error });
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
