const normalizeResumeId = (raw) => {
  const rawString = typeof raw === 'string' ? raw : undefined;
  if (!rawString) {
    return { raw: rawString, normalized: undefined };
  }

  let decoded = rawString;
  try {
    decoded = decodeURIComponent(rawString);
  } catch {
    decoded = rawString;
  }

  const normalized = decoded.split('?')[0]?.trim();
  return { raw: rawString, normalized: normalized || undefined };
};

const NUMERIC_RESUME_ID_PATTERN = /^res_[0-9]{10,}$/;
const UUID_RESUME_ID_PATTERN =
  /^res_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidResumeId =
  (value) =>
    typeof value === 'string' &&
    (NUMERIC_RESUME_ID_PATTERN.test(value) || UUID_RESUME_ID_PATTERN.test(value));

const normalizeReturnTo = (value) => {
  const raw = typeof value === 'string' ? value : '';
  if (!raw) return '/crm';

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  const trimmed = decoded.trim();
  if (!trimmed) return '/crm';
  if (trimmed.startsWith('/crm')) return trimmed;
  return '/crm';
};

module.exports = {
  normalizeResumeId,
  isValidResumeId,
  normalizeReturnTo,
};
