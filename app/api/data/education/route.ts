import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createEducation, deleteEducation, getResumeEducations } from '@/lib/db/resume';
import { resolveDatabaseConfigMeta } from '@/lib/db/postgres';
import { EducationSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('resumeId');
  if (!resumeId) return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });

  try {
    const educations = await getResumeEducations(resumeId);
    return NextResponse.json({ educations });
  } catch (error: unknown) {
    const correlationId = randomUUID();
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const dbMeta = resolveDatabaseConfigMeta();

    console.error('Education fetch error', {
      correlationId,
      message,
      dbEnv: {
        selectedKey: dbMeta.selectedKey,
        selectedState: dbMeta.selectedState,
        envStateByKey: dbMeta.envStateByKey,
        sqlHttpUrlState: dbMeta.sqlHttpUrlState,
        protocol: dbMeta.protocol,
        hasHostname: dbMeta.hasHostname,
        vercelEnv: dbMeta.vercelEnv,
        nodeEnv: dbMeta.nodeEnv,
      },
    });

    return NextResponse.json(
      { error: 'データ取得に失敗しました。時間をおいて再度お試しください。', correlationId },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = EducationSchema.parse(body);
    const id = await createEducation(validated);

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('Education save error', { message });
    return NextResponse.json({ error: '保存に失敗しました。時間をおいて再度お試しください。' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  await deleteEducation(id);
  return NextResponse.json({ success: true });
}
