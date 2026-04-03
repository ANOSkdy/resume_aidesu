import 'server-only';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export async function createStep5NotificationRecord(resumeId: string): Promise<void> {
  const apiKey = getRequiredEnv('AIRTABLE_API_KEY');
  const baseId = getRequiredEnv('AIRTABLE_BASE_ID');
  const tableName = getRequiredEnv('AIRTABLE_NOTIFICATION_TABLE');
  const resumeIdField = getRequiredEnv('AIRTABLE_NOTIFICATION_FIELD_RESUME_ID');

  const response = await fetch(
    `${AIRTABLE_API_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              [resumeIdField]: resumeId,
            },
          },
        ],
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Airtable notification failed (${response.status}): ${responseText.slice(0, 300)}`);
  }
}
