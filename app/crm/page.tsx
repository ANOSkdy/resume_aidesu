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
        <div className="wa-surface border-akane p-4 text-sm text-akane">
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
        <div className="wa-surface border-akane p-4 text-sm text-akane">
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
      <div className="space-y-4">
        <form className="wa-surface p-4" method="get">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-sumi">検索</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="氏名・メールで検索"
                className="flex-1 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-sumi shadow-sm focus-visible:wa-focus"
              />
              <input type="hidden" name="pageSize" value={pageSize} />
              <button
                type="submit"
                className="rounded-md border border-ai bg-ai px-4 py-2 text-sm font-semibold text-kinari shadow-sm transition-colors hover:bg-ai/90 focus-visible:wa-focus"
              >
                検索
              </button>
            </div>
          </div>
        </form>

        <div className="wa-surface overflow-hidden">
          {data.length === 0 ? (
            <div className="p-4 text-sm text-nezumi">該当する応募者が見つかりませんでした。</div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 md:hidden">
                {data.map((item) => {
                  const href = { pathname: `/crm/${item.resume_id}`, query: { from: returnTo } };
                  return (
                    <Link
                      key={item.resume_id}
                      href={href}
                      className="block space-y-2 p-4 text-sm transition hover:bg-ai/10"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">ID</span>
                        <span className="text-xs font-semibold text-ai">{item.resume_id}</span>
                      </div>
                      <div className="grid gap-2 text-sm text-gray-800">
                        <div>
                          <p className="text-xs font-semibold text-gray-500">氏名</p>
                          <p className="text-gray-900">{item.nameKanji}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500">フリガナ</p>
                          <p className="text-gray-700">{item.furigana || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500">メール</p>
                          <p className="text-gray-700">{item.contactEmail ?? ''}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500">電話</p>
                          <p className="text-gray-700">{item.contactPhone ?? ''}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500">現在</p>
                          <p className="text-gray-700">{item.currentStatus ?? ''}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500">住所</p>
                          <p className="text-gray-500">{item.addressCity ?? ''}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-kinari/70 text-left text-xs font-semibold uppercase tracking-wide text-nezumi">
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
                  <tbody className="divide-y divide-gray-200">
                    {data.map((item) => {
                      const href = { pathname: `/crm/${item.resume_id}`, query: { from: returnTo } };
                      return (
                        <tr key={item.resume_id} className="hover:bg-ai/10">
                          <td className="p-0 text-xs font-semibold text-gray-700">
                            <Link href={href} className="block px-4 py-3 text-blue-600 hover:text-blue-700">
                              {item.resume_id}
                            </Link>
                          </td>
                          <td className="p-0 text-gray-900">
                            <Link href={href} className="block px-4 py-3">
                              {item.nameKanji}
                            </Link>
                          </td>
                          <td className="p-0 text-gray-700">
                            <Link href={href} className="block px-4 py-3">
                              {item.furigana || '-'}
                            </Link>
                          </td>
                          <td className="p-0 text-gray-700">
                            <Link href={href} className="block px-4 py-3">
                              {item.contactEmail ?? ''}
                            </Link>
                          </td>
                          <td className="p-0 text-gray-700">
                            <Link href={href} className="block px-4 py-3">
                              {item.contactPhone ?? ''}
                            </Link>
                          </td>
                          <td className="p-0 text-gray-700">
                            <Link href={href} className="block px-4 py-3">
                              {item.currentStatus ?? ''}
                            </Link>
                          </td>
                          <td className="p-0 text-gray-500">
                            <Link href={href} className="block px-4 py-3">
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
              className="text-sm font-medium text-ai hover:text-ai/85"
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
              className="text-sm font-medium text-ai hover:text-ai/85"
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
