import 'server-only';

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.4,
  topP: 0.9,
  maxOutputTokens: 1024,
} as const;

let geminiModel: GenerativeModel | null = null;

type EnvValueState = 'missing' | 'empty' | 'set';

const readEnvState = (value: string | undefined): EnvValueState => {
  if (value === undefined) return 'missing';
  if (!value.trim()) return 'empty';
  return 'set';
};

const resolveGeminiApiKey = () => {
  const state = readEnvState(process.env.GEMINI_API_KEY);

  if (state !== 'set') {
    throw new Error(`GEMINI_API_KEY is not configured (state=${state})`);
  }

  return process.env.GEMINI_API_KEY!.trim();
};

const resolveGeminiModelName = () => {
  const envModel = process.env.GEMINI_MODEL?.trim();
  return envModel || DEFAULT_GEMINI_MODEL;
};

function getGeminiModel() {
  const apiKey = resolveGeminiApiKey();

  if (!geminiModel) {
    const model = resolveGeminiModelName();
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model, generationConfig: DEFAULT_GENERATION_CONFIG });

    console.info('Gemini model initialized', {
      model,
      source: process.env.GEMINI_MODEL?.trim() ? 'GEMINI_MODEL' : 'default',
    });
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
    console.error('Gemini API Error:', {
      message: error instanceof Error ? error.message : 'unknown error',
    });
    throw error;
  }
}
