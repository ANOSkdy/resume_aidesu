import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/airtable';

export async function GET() {
  try {
    const db = getDb();
    // Lookupsテーブルから全件取得して、カテゴリごとに整理
    const records = await db.lookups.select({
      sort: [{ field: 'display_order', direction: 'asc' }]
    }).all();

    const data = records.map((rec) => ({
      id: rec.id,
      category: rec.fields.category,
      name: rec.fields.name,
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
