const LABEL_PREFIX_PATTERN = /^(自己PR|自己ＰＲ|職務要約|活かせる経験(?:・知識)?|経験(?:・知識)?|要約)\s*[:：]\s*/i;

function cleanLine(line: string) {
  return line.replace(/\s+/g, ' ').trim();
}

export function normalizeGeneratedText(
  text: string,
  options?: { removeLabel?: boolean },
) {
  let normalized = (text || '').replace(/\r\n/g, '\n').trim();

  if (options?.removeLabel !== false) {
    normalized = normalized.replace(LABEL_PREFIX_PATTERN, '').trim();
  }

  normalized = normalized
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized;
}

export function normalizeBulletText(text: string) {
  const normalized = normalizeGeneratedText(text);
  if (!normalized) return normalized;

  const rawLines = normalized
    .split('\n')
    .map(cleanLine)
    .filter(Boolean);

  const bulletLines = rawLines
    .map((line) => line.replace(/^[-・●◦▪︎□■]+\s*/, '').trim())
    .filter(Boolean);

  if (bulletLines.length >= 3) {
    return bulletLines.slice(0, 5).map((line) => `- ${line}`).join('\n');
  }

  const sentenceLines = normalized
    .split(/。|\n/)
    .map(cleanLine)
    .filter((line) => line.length >= 8)
    .slice(0, 5);

  return sentenceLines.map((line) => `- ${line}`).join('\n');
}
