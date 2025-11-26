import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/ai/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { experience_text } = body;

    console.log('--- AI Experience Knowledge Request ---');
    console.log('Experience Text received:', experience_text);

    if (!experience_text || experience_text.trim().length < 5) {
      return NextResponse.json({
        result: '【エラー】活かせる経験・知識を生成するための職務内容が不足しています。Step 4の入力を確認してください。',
      });
    }

    const prompt = `
あなたはキャリアコンサルタントです。以下の職務経歴（cv/4で入力された内容）を元に、
応募先で活かせる経験・知識を3〜5項目の箇条書きでまとめてください。

【職務経歴データ】
${experience_text}

【出力形式】
- 箇条書きで具体的かつ簡潔に
- 200〜300文字程度
- 過度に抽象化せず、実務で再現可能なスキル・知見に言及
`;

    const generatedText = await generateContent(prompt);
    return NextResponse.json({ result: generatedText });
  } catch (error: any) {
    console.error('Experience Knowledge AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
