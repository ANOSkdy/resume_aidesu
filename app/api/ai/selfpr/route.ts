import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/ai/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { strengths, experience, keywords } = body;

    // ★デバッグ用ログ: 何が届いているか確認
    console.log("--- AI SelfPR Request ---");
    console.log("Strengths:", strengths);
    console.log("Experience:", experience);
    console.log("Keywords:", keywords);

    // データが空の場合のガード
    if (!experience || experience.trim() === "") {
      return NextResponse.json({ result: "【エラー】エピソードが入力されていません。前の画面に戻って入力を確認してください。" });
    }

    const prompt = `
あなたはプロのキャリアコンサルタントです。
求職者が入力した以下の「強み」と「経験」を元に、
企業の採用担当者に響く、魅力的で説得力のある自己PR文を作成してください。

【制約事項】
- 文字数は400文字〜600文字程度
- 具体的なエピソードを交えて論理的に構成する
- 丁寧語（です・ます調）を使用する
- 入力された情報が少ない場合は、適宜補完せず、入力内容に忠実に作成する

【入力情報】
■アピールしたい強み:
${Array.isArray(strengths) ? strengths.join(', ') : strengths}

■キーワード/価値観:
${keywords || '特になし'}

■これまでの経験詳細:
${experience}

【出力】
自己PR文のみを出力してください。挨拶や装飾は不要です。
`;

    const generatedText = await generateContent(prompt);
    return NextResponse.json({ result: generatedText });

  } catch (error: any) {
    console.error('SelfPR AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
