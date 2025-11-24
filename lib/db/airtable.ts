import Airtable from 'airtable';

let base: Airtable.Base | null = null;

function getBase() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    throw new Error('Airtable API Key or Base ID is missing in environment variables');
  }

  if (!base) {
    base = new Airtable({ apiKey }).base(baseId);
  }

  return base;
}

export function getDb() {
  const airtable = getBase();

  return {
    users: airtable('Users'),
    resumes: airtable('Resumes'),
    educations: airtable('Educations'),
    works: airtable('Works'),
    lookups: airtable('Lookups'),
  };
}

export async function checkConnection() {
  try {
    const db = getDb();
    const records = await db.lookups.select({ maxRecords: 1 }).firstPage();
    return { success: true, message: 'Connected to Airtable', count: records.length };
  } catch (error: any) {
    console.error('Airtable Connection Error:', error);
    return { success: false, message: error.message };
  }
}
