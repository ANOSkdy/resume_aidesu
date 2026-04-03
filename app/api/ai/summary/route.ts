import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/ai/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { career_text } = body;

    // ★デバッグ用ログ: AIに渡すテキストの中身をサーバーコンソールに表示
    console.log("--- AI Summary Request ---");
    console.log("Career Text received:", career_text);

    if (!career_text || career_text.trim().length < 5) {
      console.warn("Warning: Career text is too short or empty.");
      return NextResponse.json({ result: "【エラー】職歴データが正しく読み取れませんでした。入力データの形式または職歴内容を確認してください。" });
    }

    const prompt = `
以下の職務経歴情報を、履歴書の冒頭に記載する「職務要約」としてまとめてください。

【制約事項】
- 文字数は200文字〜300文字程度
- どのような業界・職種で、どのような実績を上げたかを簡潔にまとめる
- 客観的かつプロフェッショナルな文体（「だ・である」調または「です・ます」調で統一）

【職務経歴データ】
${career_text}

【出力】
職務要約のテキストのみを出力してください。
`;

    const generatedText = await generateContent(prompt);
    return NextResponse.json({ result: generatedText });

  } catch (error: any) {
    console.error('Summary AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
