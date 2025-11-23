import { NextResponse } from 'next/server';
import { db } from '@/lib/db/airtable';
import { WorkSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = WorkSchema.parse(body);

    // ★修正: resume_id (Link) に文字列を入れるため typecast: true
    const record = await db.works.create([{ fields: validated }], { typecast: true });
    
    return NextResponse.json({ success: true, id: record[0].id });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if(!id) return NextResponse.json({error:'Missing ID'},{status:400});

  await db.works.destroy([id]);
  return NextResponse.json({ success: true });
}
