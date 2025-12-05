import { NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { JisResumePdfDocument } from '@/components/pdf/JisResumePdfDocument';
import { getDb } from '@/lib/db/airtable';
import { mapAirtableResume } from '@/lib/db/resume';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('resumeId');
  const showProfilePhoto = searchParams.get('showProfilePhoto') === 'true';

  if (!resumeId) {
    return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });
  }

  try {
    const db = getDb();
    const resumes = await db.resumes
      .select({
        filterByFormula: "{resume_id} = '" + resumeId + "'",
        maxRecords: 1,
      })
      .firstPage();

    if (resumes.length === 0) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const resumeRecord = resumes[0];
    const educations = await db.educations.select({ filterByFormula: "{resume_id} = '" + resumeId + "'" }).all();
    const works = await db.works.select({ filterByFormula: "{resume_id} = '" + resumeId + "'" }).all();

    const data = {
      resume: mapAirtableResume(resumeRecord),
      educations: educations.map((r) => ({ id: r.id, ...r.fields })),
      works: works.map((r) => ({ id: r.id, ...r.fields })),
    } as any;

    const buffer = (await pdf(
      <JisResumePdfDocument
        data={data}
        profilePhotoUrl={data.resume?.profilePhotoUrl ?? null}
        showProfilePhoto={showProfilePhoto}
      />
    ).toBuffer()) as any;

    return new NextResponse(buffer, {
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
