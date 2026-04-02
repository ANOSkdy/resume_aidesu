import 'server-only';

type QueryResult<T> = { rows: T[] };
const resolveDatabaseUrl = () => {
  const raw =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!raw) {
    throw new Error('Database connection is not configured');
  }

  const connectionString = raw.trim();
  if (!connectionString) {
    throw new Error('Database connection is empty');
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error('Database connection is malformed');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error('Database connection must use postgres:// or postgresql://');
  }

  if (!parsed.hostname) {
    throw new Error('Database connection hostname is missing');
  }

  return connectionString;
};

const getSqlEndpoint = () => {
  const explicit = process.env.NEON_SQL_HTTP_URL?.trim();
  if (explicit) return explicit;

  const url = new URL(resolveDatabaseUrl());
  return `https://${url.host}/sql`;
};

const buildNeonHeaders = () => ({
  'Content-Type': 'application/json',
  'Neon-Connection-String': resolveDatabaseUrl(),
});

export async function query<T>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  const response = await fetch(getSqlEndpoint(), {
    method: 'POST',
    headers: buildNeonHeaders(),
    body: JSON.stringify({ query: text, params }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Postgres query failed (${response.status}) ${detail}`);
  }

  const payload = (await response.json()) as { rows?: T[]; results?: Array<{ rows?: T[] }> };

  if (Array.isArray(payload.rows)) return { rows: payload.rows };
  if (Array.isArray(payload.results) && payload.results[0]?.rows) {
    return { rows: payload.results[0].rows ?? [] };
  }

  return { rows: [] };
}

type TransactionClient = { query: typeof query };

export async function withTransaction<T>(fn: (client: TransactionClient) => Promise<T>) {
  await query('BEGIN');
  try {
    const result = await fn({ query });
    await query('COMMIT');
    return result;
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}
