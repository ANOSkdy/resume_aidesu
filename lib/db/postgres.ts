import 'server-only';

type QueryResult<T> = { rows: T[] };

type DatabaseEnvKey = 'DATABASE_URL_UNPOOLED' | 'DATABASE_URL' | 'NEON_DATABASE_URL';
type EnvValueState = 'missing' | 'empty' | 'set';

const DATABASE_ENV_KEYS: DatabaseEnvKey[] = ['DATABASE_URL_UNPOOLED', 'DATABASE_URL', 'NEON_DATABASE_URL'];

type DatabaseConfigMeta = {
  selectedKey: DatabaseEnvKey | null;
  selectedState: EnvValueState;
  envStateByKey: Record<DatabaseEnvKey, EnvValueState>;
  sqlHttpUrlState: EnvValueState;
  protocol: string | null;
  hasHostname: boolean;
  vercelEnv: string;
  nodeEnv: string;
};

const readEnvState = (value: string | undefined): EnvValueState => {
  if (value === undefined) return 'missing';
  if (!value.trim()) return 'empty';
  return 'set';
};

export const resolveDatabaseConfigMeta = (): DatabaseConfigMeta => {
  const envStateByKey = DATABASE_ENV_KEYS.reduce(
    (acc, key) => {
      acc[key] = readEnvState(process.env[key]);
      return acc;
    },
    {} as Record<DatabaseEnvKey, EnvValueState>
  );

  const selectedKey = DATABASE_ENV_KEYS.find((key) => envStateByKey[key] === 'set') ?? null;
  const selectedRaw = selectedKey ? process.env[selectedKey] : undefined;
  const selectedState = selectedKey ? envStateByKey[selectedKey] : 'missing';

  let protocol: string | null = null;
  let hasHostname = false;

  if (selectedRaw?.trim()) {
    try {
      const parsed = new URL(selectedRaw.trim());
      protocol = parsed.protocol;
      hasHostname = Boolean(parsed.hostname);
    } catch {
      protocol = 'malformed';
    }
  }

  return {
    selectedKey,
    selectedState,
    envStateByKey,
    sqlHttpUrlState: readEnvState(process.env.NEON_SQL_HTTP_URL),
    protocol,
    hasHostname,
    vercelEnv: process.env.VERCEL_ENV ?? 'local',
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
  };
};

const resolveDatabaseUrl = () => {
  const meta = resolveDatabaseConfigMeta();

  if (!meta.selectedKey) {
    throw new Error(
      `Database connection is not configured (keys: ${DATABASE_ENV_KEYS.join(', ')}, states=${JSON.stringify(meta.envStateByKey)})`
    );
  }

  const raw = process.env[meta.selectedKey];
  if (!raw) {
    throw new Error(`Database connection resolved to ${meta.selectedKey} but value is missing`);
  }

  const connectionString = raw.trim();
  if (!connectionString) {
    throw new Error(`Database connection resolved to ${meta.selectedKey} but value is empty`);
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error(`Database connection in ${meta.selectedKey} is malformed`);
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error(
      `Database connection in ${meta.selectedKey} must use postgres:// or postgresql:// (received ${parsed.protocol})`
    );
  }

  if (!parsed.hostname) {
    throw new Error(`Database connection in ${meta.selectedKey} is missing hostname`);
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
