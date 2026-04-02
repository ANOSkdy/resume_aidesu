import 'server-only';

type QueryResult<T> = { rows: T[] };

const getConnectionString = () => {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL or NEON_DATABASE_URL is required');
  }

  return connectionString;
};

const getEndpoint = () => {
  const explicit = process.env.NEON_SQL_HTTP_URL;
  if (explicit) return explicit;

  const url = new URL(getConnectionString());
  return `https://${url.host}/sql`;
};

const getBasicAuth = () => {
  const url = new URL(getConnectionString());
  const username = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
};

export async function query<T>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getBasicAuth(),
    },
    body: JSON.stringify({ query: text, params }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Postgres query failed (${response.status}) ${detail}`);
  }

  const payload = (await response.json()) as { rows?: T[]; results?: Array<{ rows?: T[] }> };

  if (Array.isArray(payload.rows)) {
    return { rows: payload.rows };
  }

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
