import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getResumeBundle, saveResumeDraft } from '@/lib/db/resume';
import { ResumeSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('id');

  if (!resumeId) return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });

  try {
    const bundle = await getResumeBundle(resumeId);

    if (!bundle) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

    return NextResponse.json(bundle);
  } catch (error: unknown) {
    const correlationId = randomUUID();
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('Resume bundle fetch error', { correlationId, message });
    return NextResponse.json({ error: message, correlationId }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ResumeSchema.parse(body);
    const saved = await saveResumeDraft(parsed);

    return NextResponse.json({ success: true, record: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
