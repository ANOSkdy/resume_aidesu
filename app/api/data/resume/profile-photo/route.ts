import { NextResponse } from 'next/server';
import { updateResumeFields } from '@/lib/db/resume';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

function getExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  return '';
}

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

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
      return NextResponse.json({ ok: false, error: 'RESUME_ID_REQUIRED' }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'FILE_REQUIRED' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ ok: false, error: 'INVALID_FILE_TYPE' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, error: 'FILE_TOO_LARGE' }, { status: 400 });
    }

    const extension = getExtension(file.type);
    const pathname = `resume-profile-photos/${encodeURIComponent(resumeId)}-${Date.now()}.${
      extension || 'img'
    }`;

    const blobUrl = await uploadToBlob(file, pathname);

    await updateResumeFields(resumeId, {
      profilePhotoUrl: blobUrl,
      profilePhoto: blobUrl,
    });

    return NextResponse.json({ ok: true, profilePhotoUrl: blobUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Profile photo upload error:', { resumeId: resumeIdValue, message });
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
