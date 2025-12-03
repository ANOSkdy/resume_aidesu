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
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

async function updateAirtableProfilePhoto(resumeId: string, url: string) {
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
          profilePhotoUrl: url,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable update failed (${response.status}): ${errorText}`);
  }
}

async function uploadToBlob(file: File, pathname: string) {
  if (!blobToken) {
    throw new Error('Blob token is missing');
  }

  const response = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${blobToken}`,
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Blob upload failed (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as { url: string };
  return result.url;
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
    const pathname = `resume-profile-photos/${encodeURIComponent(resumeId)}-${Date.now()}.${
      extension || 'img'
    }`;

    const blobUrl = await uploadToBlob(file, pathname);

    await updateAirtableProfilePhoto(resumeId, blobUrl);

    return NextResponse.json({ ok: true, profilePhotoUrl: blobUrl });
  } catch (error) {
    console.error('Profile photo upload error:', { resumeId: resumeIdValue, error });
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
