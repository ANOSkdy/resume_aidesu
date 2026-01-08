import Link from 'next/link';
import { headers } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';
import { listResumes } from '@/lib/db/resume';

type SearchParams = {
  q?: string | string[];
  pageSize?: string | string[];
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

const getAccessError = () => {
  const token = process.env.CRM_ACCESS_TOKEN;
  if (!token) return null;
  const provided = headers().get('x-crm-token');
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
  const accessError = getAccessError();
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const q = normalizeParam(resolvedSearchParams?.q)?.trim() ?? '';
  const pageSize = parsePageSize(normalizeParam(resolvedSearchParams?.pageSize));
  const cursorStackParam = normalizeParam(resolvedSearchParams?.cursorStack) ?? '';
  const cursorStack = cursorStackParam.split(',').filter(Boolean);
  const cursor = cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : null;

  const baseQuery = buildQueryString({
    q: q || undefined,
    pageSize: String(pageSize),
    cursorStack: cursorStackParam || undefined,
  });
  const returnTo = baseQuery ? `/crm${baseQuery}` : '/crm';

  if (accessError) {
    return (
      <AppShell title="CRM / 応募者一覧">
        <div className="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-600 shadow-sm">
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
  } catch (error: any) {
    return (
      <AppShell title="CRM / 応募者一覧">
        <div className="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-600 shadow-sm">
          データ取得中にエラーが発生しました。{error?.message ?? ''}
        </div>
      </AppShell>
    );
  }

  const nextStack = nextCursor ? [...cursorStack, nextCursor] : null;
  const prevStack = cursorStack.length > 0 ? cursorStack.slice(0, -1) : null;

  return (
    <AppShell title="CRM / 応募者一覧">
      <div className="space-y-4">
        <form className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" method="get">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">検索</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="氏名・メールで検索"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input type="hidden" name="pageSize" value={pageSize} />
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                検索
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
              該当する応募者が見つかりませんでした。
            </div>
          ) : (
            data.map((item) => (
              <Link
                key={item.id}
                href={`/crm/${item.id}?from=${encodeURIComponent(returnTo)}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900">{item.nameKanji}</p>
                    {item.title ? (
                      <p className="text-sm text-gray-600">{item.title}</p>
                    ) : null}
                    <div className="text-xs text-gray-500">
                      {item.contactEmail ? <span>{item.contactEmail}</span> : null}
                      {item.contactPhone ? <span> ・ {item.contactPhone}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {item.currentStatus ? (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                        {item.currentStatus}
                      </span>
                    ) : null}
                    {item.desiredRoles?.slice(0, 2).map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-gray-100 px-2 py-1 text-gray-700"
                      >
                        {role}
                      </span>
                    ))}
                    {item.updatedAt ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-500">
                        更新: {item.updatedAt}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="flex items-center justify-between">
          {prevStack ? (
            <Link
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
              href={buildQueryString({
                q: q || undefined,
                pageSize: String(pageSize),
                cursorStack: prevStack.length ? prevStack.join(',') : undefined,
              })}
            >
              ← 前へ
            </Link>
          ) : (
            <span className="text-sm text-gray-400">← 前へ</span>
          )}
          {nextStack ? (
            <Link
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
              href={buildQueryString({
                q: q || undefined,
                pageSize: String(pageSize),
                cursorStack: nextStack.join(','),
              })}
            >
              次へ →
            </Link>
          ) : (
            <span className="text-sm text-gray-400">次へ →</span>
          )}
        </div>
      </div>
    </AppShell>
  );
}
