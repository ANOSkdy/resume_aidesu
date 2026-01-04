import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

let geminiModel: GenerativeModel | null = null;

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables');
  }

  if (!geminiModel) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // 指定されたモデル 'gemini-3-flash-preview' を使用
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  }

  return geminiModel;
}

export async function generateContent(prompt: string) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
