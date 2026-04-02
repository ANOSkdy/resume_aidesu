import { NextResponse } from 'next/server';
import { createWork, deleteWork } from '@/lib/db/resume';
import { WorkSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sanitizedBody = body?.is_current
      ? { ...body, end_year: undefined, end_month: undefined }
      : body;

    const validated = WorkSchema.parse(sanitizedBody);
    const id = await createWork(validated);

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

  await deleteWork(id);
  return NextResponse.json({ success: true });
}
