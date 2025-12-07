import { NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { JobHistoryDocument } from '@/components/pdf/JobHistoryDocument';
import { getDb } from '@/lib/db/airtable';
import { mapAirtableResume } from '@/lib/db/resume';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('resumeId');

  if (!resumeId) {
    return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });
  }

  try {
    const db = getDb();

    // 履歴書本体を1件取得
    const resumes = await db.resumes
      .select({
        filterByFormula: `{resume_id} = '${resumeId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (resumes.length === 0) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const resumeRecord = resumes[0];

    // 職歴一覧を取得
    const works = await db.works
      .select({
        filterByFormula: `{resume_id} = '${resumeId}'`,
      })
      .all();

    const data = {
      resume: mapAirtableResume(resumeRecord),
      works: works.map((record) => ({
        id: record.id,
        ...record.fields,
      })),
    } as any;

    const buffer = (await pdf(<JobHistoryDocument data={data} />).toBuffer()) as any;

    return new NextResponse(buffer, {
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
