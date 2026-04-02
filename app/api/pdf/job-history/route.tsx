import { NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { JobHistoryDocument } from '@/components/pdf/JobHistoryDocument';
import { getResumeBundle } from '@/lib/db/resume';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('resumeId');

  if (!resumeId) {
    return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });
  }

  try {
    const bundle = await getResumeBundle(resumeId);

    if (!bundle) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const data = {
      resume: bundle.resume,
      works: bundle.works,
    };

    const buffer = await pdf(<JobHistoryDocument data={data} />).toBuffer();

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="job-history.pdf"',
      },
    });
  } catch (error) {
    console.error('Failed to generate job history PDF', { resumeId, error });
    return new NextResponse('PDF generation failed', { status: 500 });
  }
}
