import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/airtable';
import { mapAirtableResume, mapResumeToAirtableFields } from '@/lib/db/resume';
import { ResumeSchema } from '@/lib/validation/schemas';

// GET処理
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('id');

  if (!resumeId) return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });

  try {
    const db = getDb();
    const resumes = await db.resumes.select({
      filterByFormula: "{resume_id} = '" + resumeId + "'",
      maxRecords: 1
    }).firstPage();

    if (resumes.length === 0) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    
    const resumeRecord = resumes[0];
    const educations = await db.educations.select({ filterByFormula: "{resume_id} = '" + resumeId + "'" }).all();
    const works = await db.works.select({ filterByFormula: "{resume_id} = '" + resumeId + "'" }).all();

    return NextResponse.json({
      resume: mapAirtableResume(resumeRecord),
      educations: educations.map(r => ({ id: r.id, ...r.fields })),
      works: works.map(r => ({ id: r.id, ...r.fields }))
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST処理 (新規作成と更新の分岐ロジック修正)
export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    
    // バリデーション
    const validatedData = ResumeSchema.parse(body);
    const { user_id, ...fields } = validatedData;
    
    // リクエストにある resume_id を確認
    let targetResumeId = fields.resume_id || body.resume_id;

    let record;

    // ■ ケース1: 新規作成 (resume_id がない場合 = Step 1)
    if (!targetResumeId) {
      targetResumeId = "res_" + Date.now(); // ここでIDを発行
      console.log(`Creating NEW record: ${targetResumeId}`);
      
      const airtableFields = mapResumeToAirtableFields({
        resume_id: targetResumeId,
        user_id: user_id,
        ...fields,
      });

      record = await db.resumes.create(
        [
          {
            fields: airtableFields,
          }
        ],
        { typecast: true }
      );

    } else {
      // ■ ケース2: 更新または指定IDでの作成 (Step 2以降)
      
      // まず既存レコードを探す
      const existingRecords = await db.resumes.select({
        filterByFormula: "{resume_id} = '" + targetResumeId + "'",
        maxRecords: 1
      }).firstPage();

      if (existingRecords.length > 0) {
        // [A] 更新 (レコードが見つかった)
        const existingRecordId = existingRecords[0].id;
        console.log(`Updating existing record: ${existingRecordId}`);
        
        const updateData = mapResumeToAirtableFields({ ...fields, user_id: user_id });

        record = await db.resumes.update(
          [
            {
              id: existingRecordId,
              fields: updateData,
            }
          ],
          { typecast: true }
        );

      } else {
        // [B] 指定IDで新規作成 (レコードが見つからなかった)
        console.log(`Creating NEW record with specified ID: ${targetResumeId}`);
        
        const airtableFields = mapResumeToAirtableFields({
          resume_id: targetResumeId,
          user_id: user_id,
          ...fields,
        });

        record = await db.resumes.create(
          [
            {
              fields: airtableFields,
            }
          ],
          { typecast: true }
        );
      }
    }

    const savedRecord = record[0];
    const mapped = mapAirtableResume(savedRecord);

    return NextResponse.json({ success: true, record: mapped });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
