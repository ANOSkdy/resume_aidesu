import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/ai/gemini';
import { normalizeGeneratedText } from '@/lib/ai/output';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const careerText = typeof body.career_text === 'string' ? body.career_text.trim() : '';

    console.info('AI summary request meta', {
      careerTextLength: careerText.length,
    });

    if (!careerText || careerText.length < 30) {
      return NextResponse.json({
        result:
          '【エラー】職歴データが不足しています。会社名・期間・業務内容がわかるようにStep 4の職歴を入力してください。',
      });
    }

    const prompt = `
あなたは履歴書作成支援の専門家です。以下の職歴情報のみを使って職務要約を作成してください。
入力にない事実・数字・役職名・受賞歴・資格を追加してはいけません。
抽象語より具体的な業務・役割・対応範囲を優先し、日本語のビジネス文（です・ます調）で統一してください。

【作成条件】
- 3文ちょうどで作成する
- 1文目: 役割・職種・担当領域
- 2文目: 実務での対応内容・強み
- 3文目: 活かせる価値・今後の貢献
- 全体で200〜300文字程度
- 見出し・箇条書き・ラベルは禁止

【職務経歴データ】
${careerText}

【出力】
職務要約本文のみを出力してください。ラベル（例: 職務要約:）は付けないでください。
`;

    const generatedText = await generateContent(prompt);
    const result = normalizeGeneratedText(generatedText);
    return NextResponse.json({ result });

  } catch (error: unknown) {
    console.error('Summary AI Error:', error);
    const message = error instanceof Error ? error.message : 'AI生成に失敗しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
