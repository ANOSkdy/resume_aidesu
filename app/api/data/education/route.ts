import { NextResponse } from 'next/server';
import { createEducation, deleteEducation } from '@/lib/db/resume';
import { EducationSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = EducationSchema.parse(body);
    const id = await createEducation(validated);

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  await deleteEducation(id);
  return NextResponse.json({ success: true });
}
