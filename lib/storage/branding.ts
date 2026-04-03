export const BRAND_STORAGE_KEYS = {
  uid: {
    current: 'carrime_uid',
    legacy: ['aidesu_uid', 'carrimy_uid'],
  },
  resumeId: {
    current: 'carrime_resume_id',
    legacy: ['aidesu_resume_id', 'carrimy_resume_id'],
  },
  aiInputs: {
    current: 'carrime_ai_inputs',
    legacy: ['aidesu_ai_inputs', 'carrimy_ai_inputs'],
  },
} as const;

export function getStorageItemWithLegacyFallback(
  currentKey: string,
  legacyKeys?: string | readonly string[],
): string | null {
  const currentValue = localStorage.getItem(currentKey);
  if (currentValue !== null) {
    return currentValue;
  }

  if (!legacyKeys) {
    return null;
  }

  const keys = Array.isArray(legacyKeys) ? legacyKeys : [legacyKeys];
  for (const key of keys) {
    const legacyValue = localStorage.getItem(key);
    if (legacyValue !== null) {
      localStorage.setItem(currentKey, legacyValue);
      return legacyValue;
    }
  }

  return null;
}
