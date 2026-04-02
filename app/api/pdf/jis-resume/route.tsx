import { NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { JisResumePdfDocument } from '@/components/pdf/JisResumePdfDocument';
import { getResumeBundle } from '@/lib/db/resume';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('resumeId');
  const showProfilePhoto = searchParams.get('showProfilePhoto') === 'true';

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
      educations: bundle.educations,
      works: bundle.works,
    };

    const buffer = await pdf(
      <JisResumePdfDocument
        data={data}
        profilePhotoUrl={bundle.resume?.profilePhotoUrl ?? null}
        showProfilePhoto={showProfilePhoto}
      />
    ).toBuffer();

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="jis-resume.pdf"',
      },
    });
  } catch (error) {
    console.error('Failed to generate JIS resume PDF', { resumeId, error });
    return new NextResponse('PDF generation failed', { status: 500 });
  }
}
