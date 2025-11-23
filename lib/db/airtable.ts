import Airtable from 'airtable';

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  throw new Error('Airtable API Key or Base ID is missing in environment variables');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

export const db = {
  users: base('Users'),
  resumes: base('Resumes'),
  educations: base('Educations'),
  works: base('Works'),
  lookups: base('Lookups'),
};

export async function checkConnection() {
  try {
    const records = await db.lookups.select({ maxRecords: 1 }).firstPage();
    return { success: true, message: 'Connected to Airtable', count: records.length };
  } catch (error: any) {
    console.error('Airtable Connection Error:', error);
    return { success: false, message: error.message };
  }
}
