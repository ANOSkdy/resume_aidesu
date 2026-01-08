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

const isValidResumeId = (value) =>
  typeof value === 'string' && /^res_[0-9]{10,}$/.test(value);

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
