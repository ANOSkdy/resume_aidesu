import { put } from '@vercel/blob';
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

function toSafePathSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 80) || 'resume';
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
      console.warn('Profile photo validation failed: missing resumeId');
      return NextResponse.json({ ok: false, error: 'RESUME_ID_REQUIRED' }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      console.warn('Profile photo validation failed: missing file', { resumeId });
      return NextResponse.json({ ok: false, error: 'FILE_REQUIRED' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.warn('Profile photo validation failed: invalid mime type', {
        resumeId,
        mimeType: file.type,
      });
      return NextResponse.json({ ok: false, error: 'INVALID_FILE_TYPE' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      console.warn('Profile photo validation failed: file too large', {
        resumeId,
        fileSize: file.size,
        maxFileSize: MAX_FILE_SIZE,
      });
      return NextResponse.json({ ok: false, error: 'FILE_TOO_LARGE' }, { status: 400 });
    }

    const extension = getExtension(file.type) || 'img';
    const safeResumeId = toSafePathSegment(resumeId);
    const pathname = `resume-profile-photos/${safeResumeId}-${Date.now()}.${extension}`;

    let blobUrl: string;
    try {
      const blob = await put(pathname, file, {
        access: 'public',
        contentType: file.type,
        addRandomSuffix: false,
      });
      blobUrl = blob.url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Profile photo blob upload failed', {
        resumeId,
        pathname,
        mimeType: file.type,
        fileSize: file.size,
        message,
      });
      return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
    }

    try {
      await updateResumeFields(resumeId, {
        profilePhotoUrl: blobUrl,
        profilePhoto: blobUrl,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Profile photo DB update failed', { resumeId, blobUrl, message });
      return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, profilePhotoUrl: blobUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Profile photo upload route failed unexpectedly', {
      resumeId: resumeIdValue,
      message,
    });
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
