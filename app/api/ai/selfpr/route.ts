import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/ai/gemini';
import { normalizeGeneratedText } from '@/lib/ai/output';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prSummary = typeof body.pr_summary === 'string' ? body.pr_summary.trim() : '';
    const episode =
      typeof body.episode === 'string'
        ? body.episode.trim()
        : typeof body.experience === 'string'
          ? body.experience.trim()
          : '';
    const policy = typeof body.policy === 'string' ? body.policy.trim() : '';
    const occupation = typeof body.occupation === 'string' ? body.occupation.trim() : '';
    const legacyStrengths = Array.isArray(body.strengths)
      ? body.strengths.filter((item: unknown) => typeof item === 'string').join(' / ')
      : typeof body.strengths === 'string'
        ? body.strengths
        : '';
    const legacyKeywords = typeof body.keywords === 'string' ? body.keywords.trim() : '';

    const finalPrSummary = prSummary || legacyStrengths.trim();
    const finalPolicy = policy || legacyKeywords;

    console.info('AI selfpr request meta', {
      prSummaryLength: finalPrSummary.length,
      episodeLength: episode.length,
      policyLength: finalPolicy.length,
      occupationLength: occupation.length,
    });

    if (!episode || episode.length < 20) {
      return NextResponse.json({
        result:
          '【エラー】エピソードが不足しています。Step 1で「具体的な出来事・行動・結果」がわかる内容をもう少し詳しく入力してください。',
      });
    }

    if (!finalPrSummary && !finalPolicy && !occupation) {
      return NextResponse.json({
        result:
          '【エラー】自己PRの方向性が不足しています。Step 1の「強み」「仕事で大切にしていること」「希望職種」のいずれかを入力してください。',
      });
    }

    const prompt = `
あなたは履歴書作成支援の専門家です。以下の入力だけを使って自己PRを作成してください。
入力にない事実・数字・役職名・受賞歴・資格・成果指標を決して追加しないでください。
抽象的な賛辞は避け、具体的な行動と再現性を重視してください。
文体は日本語のビジネス文（です・ます調）で統一してください。

【構成ルール】
1. 強み
2. 根拠となる具体的エピソード（行動・工夫）
3. 仕事で大切にする価値観と希望職種との接続
4. 入社後にどう貢献するか
※ 上記4要素を自然な1つの本文として400〜600文字でまとめること。
※ 見出し・箇条書き・前置き・後書きは禁止。

【入力情報】
■強み要約:
${finalPrSummary || '未入力'}

■具体エピソード:
${episode}

■大切にしている価値観:
${finalPolicy || '未入力'}

■希望職種:
${occupation || '未入力'}

【出力】
自己PR本文のみを出力してください。ラベル（例: 自己PR:）は付けないでください。
`;

    const generatedText = await generateContent(prompt);
    const result = normalizeGeneratedText(generatedText);
    return NextResponse.json({ result });

  } catch (error: unknown) {
    console.error('SelfPR AI Error:', error);
    const message = error instanceof Error ? error.message : 'AI生成に失敗しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
