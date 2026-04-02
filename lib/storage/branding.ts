export const BRAND_STORAGE_KEYS = {
  uid: {
    current: 'aidesu_uid',
    legacy: 'carrimy_uid',
  },
  resumeId: {
    current: 'aidesu_resume_id',
    legacy: 'carrimy_resume_id',
  },
  aiInputs: {
    current: 'aidesu_ai_inputs',
    legacy: 'carrimy_ai_inputs',
  },
} as const;

export function getStorageItemWithLegacyFallback(currentKey: string, legacyKey?: string): string | null {
  const currentValue = localStorage.getItem(currentKey);
  if (currentValue !== null) {
    return currentValue;
  }

  if (!legacyKey) {
    return null;
  }

  const legacyValue = localStorage.getItem(legacyKey);
  if (legacyValue !== null) {
    localStorage.setItem(currentKey, legacyValue);
  }

  return legacyValue;
}
