import Link from 'next/link';
import { headers } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';
import { listResumes } from '@/lib/db/resume';

type SearchParams = {
  q?: string | string[];
  pageSize?: string | string[];
  cursor?: string | string[];
  cursorStack?: string | string[];
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const normalizeParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const parsePageSize = (value?: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE;
  if (parsed < 1) return 1;
  if (parsed > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
  return Math.floor(parsed);
};

const buildQueryString = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const getAccessError = async () => {
  const token = process.env.CRM_ACCESS_TOKEN;
  if (!token) return null;
  const provided = (await headers()).get('x-crm-token');
  if (!provided || provided !== token) {
    return 'このページにアクセスするための認証トークンが不足しています。';
  }
  return null;
};

export default async function CrmPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const accessError = await getAccessError();
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const q = normalizeParam(resolvedSearchParams?.q)?.trim() ?? '';
  const pageSize = parsePageSize(normalizeParam(resolvedSearchParams?.pageSize));
  const cursorStackParam = normalizeParam(resolvedSearchParams?.cursorStack) ?? '';
  const cursorStack = cursorStackParam.split(',').filter(Boolean);
  const cursor = normalizeParam(resolvedSearchParams?.cursor) ?? null;

  const returnQuery = buildQueryString({
    q: q || undefined,
    pageSize: String(pageSize),
    cursor: cursor || undefined,
  });
  const returnTo = returnQuery ? `/crm${returnQuery}` : '/crm';

  if (accessError) {
    return (
      <AppShell title="CRM / 応募者一覧">
        <div className="wa-surface border-akane/45 bg-[color-mix(in_oklab,var(--surface)_92%,white)] p-4 text-sm text-akane">
          {accessError}
        </div>
      </AppShell>
    );
  }

  let data = [];
  let nextCursor: string | null = null;
  try {
    const result = await listResumes({
      pageSize,
      cursor,
      q: q || undefined,
      sort: 'updated_at',
    });
    data = result.data;
    nextCursor = result.nextCursor;
  } catch (error: unknown) {
    return (
      <AppShell title="CRM / 応募者一覧">
        <div className="wa-surface border-akane/45 bg-[color-mix(in_oklab,var(--surface)_92%,white)] p-4 text-sm text-akane">
          データ取得中にエラーが発生しました。{error instanceof Error ? error.message : ''}
        </div>
      </AppShell>
    );
  }

  const nextStack = nextCursor ? (cursor ? [...cursorStack, cursor] : cursorStack) : null;
  const prevCursor = cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : null;
  const prevStack = cursorStack.length > 0 ? cursorStack.slice(0, -1) : null;
  const hasPrev = Boolean(cursor);

  return (
    <AppShell title="CRM / 応募者一覧">
      <div className="space-y-4 py-4">
        <form className="wa-surface wa-accent-diagonal wa-form p-4" method="get">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-sumi">検索</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="氏名・メールで検索"
                className="wa-motion-ui flex-1 text-sm"
              />
              <input type="hidden" name="pageSize" value={pageSize} />
              <button
                type="submit"
                className="wa-motion-ui rounded-md border border-ai/60 bg-ai px-4 py-2 text-sm font-semibold text-kinari shadow-sm hover:bg-[color-mix(in_oklab,var(--ai-blue)_85%,black)] focus-visible:wa-focus"
              >
                検索
              </button>
            </div>
          </div>
        </form>

        <div className="wa-surface overflow-hidden">
          {data.length === 0 ? (
            <div className="wa-panel m-3 p-4 text-sm text-[color-mix(in_oklab,var(--foreground)_72%,var(--nezumi-gray))]">
              該当する応募者が見つかりませんでした。
            </div>
          ) : (
            <>
              <div className="divide-y divide-[color-mix(in_oklab,var(--border)_88%,white)] md:hidden">
                {data.map((item) => {
                  const href = { pathname: `/crm/${item.resume_id}`, query: { from: returnTo } };
                  return (
                    <Link
                      key={item.resume_id}
                      href={href}
                      className="wa-motion-ui block space-y-2 p-4 text-sm hover:bg-[color-mix(in_oklab,var(--ai-blue)_12%,white)] focus-visible:wa-focus"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[color-mix(in_oklab,var(--foreground)_48%,var(--nezumi-gray))]">ID</span>
                        <span className="text-xs font-semibold text-ai">{item.resume_id}</span>
                      </div>
                      <div className="grid gap-2 text-sm text-[color-mix(in_oklab,var(--foreground)_86%,var(--nezumi-gray))]">
                        <div>
                          <p className="text-xs font-semibold text-[color-mix(in_oklab,var(--foreground)_48%,var(--nezumi-gray))]">氏名</p>
                          <p className="text-sumi">{item.nameKanji}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[color-mix(in_oklab,var(--foreground)_48%,var(--nezumi-gray))]">フリガナ</p>
                          <p>{item.furigana || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[color-mix(in_oklab,var(--foreground)_48%,var(--nezumi-gray))]">メール</p>
                          <p>{item.contactEmail ?? ''}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[color-mix(in_oklab,var(--foreground)_48%,var(--nezumi-gray))]">電話</p>
                          <p>{item.contactPhone ?? ''}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[color-mix(in_oklab,var(--foreground)_48%,var(--nezumi-gray))]">現在</p>
                          <p>{item.currentStatus ?? ''}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[color-mix(in_oklab,var(--foreground)_48%,var(--nezumi-gray))]">住所</p>
                          <p className="wa-muted">{item.addressCity ?? ''}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-[color-mix(in_oklab,var(--border)_88%,white)] text-sm">
                  <thead className="bg-[color-mix(in_oklab,var(--surface-muted)_84%,white)] text-left text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--foreground)_52%,var(--nezumi-gray))]">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">氏名</th>
                      <th className="px-4 py-3">フリガナ</th>
                      <th className="px-4 py-3">メール</th>
                      <th className="px-4 py-3">電話</th>
                      <th className="px-4 py-3">現在</th>
                      <th className="px-4 py-3">住所</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color-mix(in_oklab,var(--border)_88%,white)]">
                    {data.map((item) => {
                      const href = { pathname: `/crm/${item.resume_id}`, query: { from: returnTo } };
                      return (
                        <tr key={item.resume_id} className="wa-motion-ui hover:bg-[color-mix(in_oklab,var(--ai-blue)_10%,white)]">
                          <td className="p-0 text-xs font-semibold text-[color-mix(in_oklab,var(--foreground)_74%,var(--nezumi-gray))]">
                            <Link href={href} className="block px-4 py-3 text-ai hover:text-[color-mix(in_oklab,var(--ai-blue)_80%,black)] focus-visible:wa-focus">
                              {item.resume_id}
                            </Link>
                          </td>
                          <td className="p-0 text-sumi">
                            <Link href={href} className="block px-4 py-3 focus-visible:wa-focus">
                              {item.nameKanji}
                            </Link>
                          </td>
                          <td className="p-0 text-[color-mix(in_oklab,var(--foreground)_78%,var(--nezumi-gray))]">
                            <Link href={href} className="block px-4 py-3 focus-visible:wa-focus">
                              {item.furigana || '-'}
                            </Link>
                          </td>
                          <td className="p-0 text-[color-mix(in_oklab,var(--foreground)_78%,var(--nezumi-gray))]">
                            <Link href={href} className="block px-4 py-3 focus-visible:wa-focus">
                              {item.contactEmail ?? ''}
                            </Link>
                          </td>
                          <td className="p-0 text-[color-mix(in_oklab,var(--foreground)_78%,var(--nezumi-gray))]">
                            <Link href={href} className="block px-4 py-3 focus-visible:wa-focus">
                              {item.contactPhone ?? ''}
                            </Link>
                          </td>
                          <td className="p-0 text-[color-mix(in_oklab,var(--foreground)_78%,var(--nezumi-gray))]">
                            <Link href={href} className="block px-4 py-3 focus-visible:wa-focus">
                              {item.currentStatus ?? ''}
                            </Link>
                          </td>
                          <td className="p-0 text-[color-mix(in_oklab,var(--foreground)_56%,var(--nezumi-gray))]">
                            <Link href={href} className="block px-4 py-3 focus-visible:wa-focus">
                              {item.addressCity ?? ''}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          {hasPrev ? (
            <Link
              className="wa-motion-ui text-sm font-medium text-ai hover:text-[color-mix(in_oklab,var(--ai-blue)_80%,black)] focus-visible:wa-focus"
              href={buildQueryString({
                q: q || undefined,
                pageSize: String(pageSize),
                cursor: prevCursor || undefined,
                cursorStack: prevStack?.length ? prevStack.join(',') : undefined,
              })}
            >
              ← 前へ
            </Link>
          ) : (
            <span className="text-sm text-nezumi/70">← 前へ</span>
          )}
          {nextStack ? (
            <Link
              className="wa-motion-ui text-sm font-medium text-ai hover:text-[color-mix(in_oklab,var(--ai-blue)_80%,black)] focus-visible:wa-focus"
              href={buildQueryString({
                q: q || undefined,
                pageSize: String(pageSize),
                cursor: nextCursor ?? undefined,
                cursorStack: nextStack.join(','),
              })}
            >
              次へ →
            </Link>
          ) : (
            <span className="text-sm text-nezumi/70">次へ →</span>
          )}
        </div>
      </div>
    </AppShell>
  );
}
