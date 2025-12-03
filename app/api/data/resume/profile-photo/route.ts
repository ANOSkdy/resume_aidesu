import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/airtable';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

function getExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  return '';
}

async function uploadToBlob(
  pathname: string,
  fileArrayBuffer: ArrayBuffer,
  contentType: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  }

  const response = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: 'PUT',
    headers: {
      'content-type': contentType,
      'x-vercel-blob-token': token,
    },
    body: new Blob([fileArrayBuffer], { type: contentType }),
  });

  if (!response.ok) {
    throw new Error(`Blob upload failed with status ${response.status}`);
  }

  const data = (await response.json()) as { url?: string };

  if (!data?.url) {
    throw new Error('Blob upload response missing url');
  }

  return data.url;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const resumeId = formData.get('resumeId');

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
    const safeFilename = file.name || `profile-photo.${extension || 'img'}`;
    const pathname = `resumes/${encodeURIComponent(resumeId)}-${randomUUID()}.${
      extension || 'img'
    }`;

    const fileArrayBuffer = await file.arrayBuffer();
    const blobUrl = await uploadToBlob(pathname, fileArrayBuffer, file.type);

    const db = getDb();
    await db.resumes.update(
      resumeId,
      {
        profilePhoto: [
          {
            url: blobUrl,
            filename: safeFilename,
            type: file.type,
            size: file.size,
          },
        ],
      } as any,
      { typecast: true }
    );

    return NextResponse.json({ ok: true, profilePhotoUrl: blobUrl });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
