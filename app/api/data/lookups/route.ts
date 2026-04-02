import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { rows } = await query<{
      id: string;
      category: string;
      name: string;
      display_order: number;
    }>(
      `select li.id, lc.code as category, li.label as name, li.display_order
       from lookup_items li
       join lookup_categories lc on lc.id = li.category_id
       where li.is_active = true
       order by li.display_order asc, li.label asc`
    );

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        category: row.category,
        name: row.name,
      }))
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
