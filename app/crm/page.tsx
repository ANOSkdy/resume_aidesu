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

  const baseQuery = buildQueryString({
    q: q || undefined,
    pageSize: String(pageSize),
    cursor: cursor || undefined,
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

  const nextStack = nextCursor ? (cursor ? [...cursorStack, cursor] : cursorStack) : null;
  const prevCursor = cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : null;
  const prevStack = cursorStack.length > 0 ? cursorStack.slice(0, -1) : null;
  const hasPrev = Boolean(cursor);

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

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          {data.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">該当する応募者が見つかりませんでした。</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                {data.map((item) => (
                  <tr key={item.resume_id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      <Link
                        href={{ pathname: `/crm/${item.resume_id}`, query: { from: returnTo } }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {item.resume_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{item.nameKanji}</td>
                    <td className="px-4 py-3 text-gray-700">{item.furigana || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{item.contactEmail ?? ''}</td>
                    <td className="px-4 py-3 text-gray-700">{item.contactPhone ?? ''}</td>
                    <td className="px-4 py-3 text-gray-700">{item.currentStatus ?? ''}</td>
                    <td className="px-4 py-3 text-gray-500">{item.addressCity ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between">
          {hasPrev ? (
            <Link
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
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
            <span className="text-sm text-gray-400">← 前へ</span>
          )}
          {nextStack ? (
            <Link
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
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
            <span className="text-sm text-gray-400">次へ →</span>
          )}
        </div>
      </div>
    </AppShell>
  );
}
