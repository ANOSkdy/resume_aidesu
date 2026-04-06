import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/ai/gemini';
import { normalizeBulletText } from '@/lib/ai/output';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const experienceText =
      typeof body.experience_text === 'string' ? body.experience_text.trim() : '';

    console.info('AI experience request meta', {
      experienceTextLength: experienceText.length,
    });

    if (!experienceText || experienceText.length < 30) {
      return NextResponse.json({
        result:
          '【エラー】活かせる経験・知識を生成するための職務内容が不足しています。Step 4で職種・業務内容をもう少し具体的に入力してください。',
      });
    }

    const prompt = `
あなたは履歴書作成支援の専門家です。以下の職歴情報のみを使って、
応募先で再現可能な「活かせる経験・知識」を作成してください。
入力にない事実・数字・役職名・受賞歴・資格を追加してはいけません。
抽象的な評価語は避け、実務で使える行動・知識・進め方を明確にしてください。

【職務経歴データ】
${experienceText}

【出力形式】
- 3〜5項目
- 各行は「- 」で始める
- 1項目あたり40〜70文字程度
- 日本語ビジネス文で簡潔に記述
- タイトルや前置きは禁止
`;

    const generatedText = await generateContent(prompt);
    const result = normalizeBulletText(generatedText);
    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error('Experience Knowledge AI Error:', error);
    const message = error instanceof Error ? error.message : 'AI生成に失敗しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
